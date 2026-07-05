#!/usr/bin/env node

/**
 * build-wiki-index.js
 * Builds static Wiki.js-like graph and fuzzy-search assets for published notes.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_CONTENT_DIR = join(ROOT, 'content', 'notes');
const DEFAULT_OUTPUT_DIR = join(ROOT, 'public', 'assets', 'wiki');
const PUBLIC_HANDLE = 'githoldder';

function publicAlias(value) {
  return String(value || '').replace(/曹磊/g, PUBLIC_HANDLE);
}

function stableUnique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/\.md$/i, '')
    .split('/')
    .pop()
    .toLowerCase();
}

function slugifyHeading(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  try {
    return {
      frontmatter: YAML.parse(match[1]) || {},
      body: raw.slice(match[0].length)
    };
  } catch (error) {
    console.warn(`[build-wiki-index] Failed to parse frontmatter: ${error.message}`);
    return { frontmatter: {}, body: raw.slice(match[0].length) };
  }
}

function asStringArray(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
  return [];
}

function extractTitle(frontmatter, body, fallback) {
  if (frontmatter.title) {
    return publicAlias(frontmatter.title).trim();
  }
  const heading = body.match(/^#\s+(.+)$/m);
  return publicAlias(heading?.[1] || fallback).trim();
}

function extractHeadings(body) {
  const headings = [];
  const headingRe = /^(#{1,6})\s+(.+)$/gm;
  for (const match of body.matchAll(headingRe)) {
    const text = publicAlias(match[2].replace(/#+\s*$/, '').trim());
    if (!text) continue;
    headings.push({
      depth: match[1].length,
      text,
      anchor: slugifyHeading(text)
    });
  }
  return headings;
}

function cleanMarkdownText(body) {
  return publicAlias(body)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[\[([^\]|#^]+)[^\]]*\]\]/g, ' ')
    .replace(/\[\[([^\]|#^]+)(?:[|#^][^\]]*)?\]\]/g, '$1')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~|:[\](){}.,!?;'"“”‘’\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function foldText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function tokenize(value) {
  const folded = foldText(value);
  const words = folded.match(/[a-z0-9]+|[\u4e00-\u9fa5]/g) || [];
  const tokens = new Set(words);

  for (let index = 0; index < words.length - 1; index += 1) {
    if (/[\u4e00-\u9fa5]/.test(words[index]) && /[\u4e00-\u9fa5]/.test(words[index + 1])) {
      tokens.add(`${words[index]}${words[index + 1]}`);
    }
  }

  return Array.from(tokens).slice(0, 800);
}

function ngramsForTokens(tokens) {
  const grams = new Set();
  for (const token of tokens) {
    if (token.length <= 1) {
      grams.add(token);
      continue;
    }
    for (let size = 2; size <= Math.min(4, token.length); size += 1) {
      for (let index = 0; index <= token.length - size; index += 1) {
        grams.add(token.slice(index, index + size));
      }
    }
  }
  return Array.from(grams).slice(0, 1200);
}

function wikiTarget(rawTarget) {
  const trimmed = String(rawTarget || '').trim();
  const withoutAlias = trimmed.split('|')[0].trim();
  const withoutBlock = withoutAlias.split('^')[0].trim();
  const withoutHash = withoutBlock.split('#')[0].trim();
  return withoutHash.replace(/\.md$/i, '').trim();
}

function extractWikiLinks(body) {
  const links = [];
  const wikiRe = /(!?)\[\[([^\]]+)]]/g;
  for (const match of body.matchAll(wikiRe)) {
    if (match[1] === '!') continue;
    const target = wikiTarget(match[2]);
    if (target) {
      links.push({ kind: 'wikilink', raw: match[2], target });
    }
  }
  return links;
}

function extractMarkdownLinks(body) {
  const links = [];
  const mdRe = /(?<!!)\[([^\]]+)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of body.matchAll(mdRe)) {
    const label = match[1].trim();
    const href = match[2].trim();
    if (!href || href.startsWith('#') || /^https?:\/\//i.test(href) || href.startsWith('mailto:')) {
      continue;
    }

    let target = '';
    if (href.startsWith('/notes/')) {
      target = href.replace(/^\/notes\//, '').split('/')[0];
    } else if (href.endsWith('.md') || href.includes('.md#')) {
      target = href.split('#')[0].replace(/\.md$/i, '');
    }

    if (target) {
      links.push({ kind: 'markdown', raw: href, label, target });
    }
  }
  return links;
}

function scoreRelated(note, candidate, explicitOut, backlinks) {
  let score = 0;
  const reasons = [];

  if (explicitOut.has(candidate.slug)) {
    score += 8;
    reasons.push('outgoing');
  }
  if (backlinks.has(candidate.slug)) {
    score += 7;
    reasons.push('backlink');
  }

  const noteTags = new Set(note.tags);
  const sharedTags = candidate.tags.filter(tag => noteTags.has(tag));
  if (sharedTags.length > 0) {
    score += sharedTags.length * 3;
    reasons.push(...sharedTags.map(tag => `tag:${tag}`));
  }

  const headingTerms = new Set(note.headings.map(heading => foldText(heading.text)).filter(text => text.length >= 2));
  const headingOverlap = candidate.headings.filter(heading => headingTerms.has(foldText(heading.text))).length;
  if (headingOverlap > 0) {
    score += headingOverlap;
    reasons.push('heading');
  }

  return { score, reasons: stableUnique(reasons) };
}

function readNotes(contentDir) {
  if (!existsSync(contentDir)) return [];

  return readdirSync(contentDir)
    .filter(file => file.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))
    .map(file => {
      const filePath = join(contentDir, file);
      const raw = readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = stripFrontmatter(raw);
      const slug = String(frontmatter.slug || basename(file, '.md')).trim();
      const title = extractTitle(frontmatter, body, slug);
      const tags = asStringArray(frontmatter.tags).map(publicAlias);
      const aliases = asStringArray(frontmatter.aliases || frontmatter.alias).map(publicAlias);
      const headings = extractHeadings(body);
      const bodyText = cleanMarkdownText(body);

      return {
        slug,
        id: `note:${slug}`,
        title,
        url: `/notes/${slug}/`,
        file,
        sourcePath: relative(ROOT, filePath).replace(/\\/g, '/'),
        status: String(frontmatter.status || '').toLowerCase().trim(),
        date: frontmatter.date ? String(frontmatter.date) : '',
        summary: publicAlias(frontmatter.summary || bodyText.slice(0, 180)),
        tags,
        aliases,
        headings,
        body,
        bodyText,
        rawLinks: [...extractWikiLinks(body), ...extractMarkdownLinks(body)]
      };
    })
    .filter(note => note.status === 'published');
}

function buildResolver(notes) {
  const resolver = new Map();
  for (const note of notes) {
    const keys = [
      note.slug,
      note.title,
      basename(note.file, '.md'),
      ...note.aliases
    ];
    for (const key of keys) {
      const normalized = normalizeKey(key);
      if (normalized && !resolver.has(normalized)) {
        resolver.set(normalized, note.slug);
      }
    }
  }
  return resolver;
}

function pairKey(a, b) {
  return [a, b].sort((left, right) => left.localeCompare(right)).join('\u0000');
}

export function buildWikiIndex(options = {}) {
  const contentDir = options.contentDir || DEFAULT_CONTENT_DIR;
  const outputDir = options.outputDir || DEFAULT_OUTPUT_DIR;
  const now = options.now || new Date().toISOString();

  const notes = readNotes(contentDir);
  const bySlug = new Map(notes.map(note => [note.slug, note]));
  const resolver = buildResolver(notes);
  const backlinksBySlug = new Map(notes.map(note => [note.slug, []]));

  for (const note of notes) {
    note.outgoing = [];
    const seenTargets = new Set();
    for (const link of note.rawLinks) {
      const targetSlug = resolver.get(normalizeKey(link.target));
      if (!targetSlug || targetSlug === note.slug || seenTargets.has(`${link.kind}:${targetSlug}`)) {
        continue;
      }
      seenTargets.add(`${link.kind}:${targetSlug}`);
      const target = bySlug.get(targetSlug);
      const resolved = {
        type: link.kind,
        raw: publicAlias(link.raw),
        targetSlug,
        title: target.title,
        url: target.url
      };
      note.outgoing.push(resolved);
      backlinksBySlug.get(targetSlug).push({
        sourceSlug: note.slug,
        title: note.title,
        url: note.url,
        type: link.kind
      });
    }
  }

  const tagPairs = new Map();
  const tagCounts = new Map();
  for (const note of notes) {
    const tags = stableUnique(note.tags).sort((a, b) => a.localeCompare(b));
    for (const tag of tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
    for (let i = 0; i < tags.length; i += 1) {
      for (let j = i + 1; j < tags.length; j += 1) {
        const key = pairKey(tags[i], tags[j]);
        tagPairs.set(key, (tagPairs.get(key) || 0) + 1);
      }
    }
  }

  for (const note of notes) {
    const explicitOut = new Set(note.outgoing.map(link => link.targetSlug));
    const backlinks = new Set((backlinksBySlug.get(note.slug) || []).map(link => link.sourceSlug));
    note.backlinks = (backlinksBySlug.get(note.slug) || []).sort((a, b) => a.title.localeCompare(b.title));
    note.related = notes
      .filter(candidate => candidate.slug !== note.slug)
      .map(candidate => ({
        slug: candidate.slug,
        title: candidate.title,
        url: candidate.url,
        tags: candidate.tags,
        ...scoreRelated(note, candidate, explicitOut, backlinks)
      }))
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
      .slice(0, 8);
    note.hotlinks = note.related.slice(0, 5).map(({ slug, title, url, score, reasons }) => ({
      slug,
      title,
      url,
      score,
      reasons
    }));
  }

  const nodes = notes.map(note => ({
    id: note.id,
    slug: note.slug,
    title: note.title,
    url: note.url,
    tags: note.tags,
    aliases: note.aliases,
    headings: note.headings,
    summary: note.summary,
    sourcePath: note.sourcePath,
    source_path: note.sourcePath,
    outgoing: note.outgoing,
    outgoing_links: note.outgoing,
    backlinks: note.backlinks,
    related: note.related,
    hotlinks: note.hotlinks
  }));

  const edges = [];
  for (const note of notes) {
    for (const link of note.outgoing) {
      edges.push({
        source: note.id,
        target: `note:${link.targetSlug}`,
        type: link.type,
        weight: link.type === 'wikilink' ? 2 : 1
      });
    }
    for (const related of note.related.slice(0, 5)) {
      edges.push({
        source: note.id,
        target: `note:${related.slug}`,
        type: 'related',
        weight: related.score
      });
    }
  }

  const tagCooccurrence = Array.from(tagPairs.entries())
    .map(([key, count]) => {
      const [source, target] = key.split('\u0000');
      return { source, target, count };
    })
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source) || a.target.localeCompare(b.target));

  const graph = {
    schema_version: 1,
    schemaVersion: 1,
    generatedAt: now,
    generated_at: now,
    stats: {
      noteCount: notes.length,
      edgeCount: edges.length,
      tagCount: tagCounts.size
    },
    nodes,
    edges,
    tags: Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)),
    tagCooccurrence
  };

  const search = {
    schema_version: 1,
    schemaVersion: 1,
    generatedAt: now,
    generated_at: now,
    count: notes.length,
    fields: ['title', 'tags', 'aliases', 'headings', 'summary', 'bodyText', 'foldedText', 'tokens', 'ngrams'],
    documents: notes.map(note => {
      const headingText = note.headings.map(heading => heading.text).join(' ');
      const searchableText = [
        note.title,
        note.summary,
        note.tags.join(' '),
        note.aliases.join(' '),
        headingText,
        note.bodyText
      ].join(' ');
      const tokens = tokenize(searchableText);
      return {
        id: note.id,
        slug: note.slug,
        type: 'note',
        title: note.title,
        url: note.url,
        tags: note.tags,
        aliases: note.aliases,
        headings: note.headings.map(heading => heading.text),
        summary: note.summary,
        bodyText: note.bodyText.slice(0, 4000),
        foldedText: foldText(searchableText).slice(0, 8000),
        tokens,
        ngrams: ngramsForTokens(tokens),
        outgoingSlugs: note.outgoing.map(link => link.targetSlug),
        backlinkSlugs: note.backlinks.map(link => link.sourceSlug),
        relatedSlugs: note.related.map(link => link.slug)
      };
    })
  };
  search.records = search.documents;

  if (options.write !== false) {
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, 'graph.json'), `${JSON.stringify(graph, null, 2)}\n`, 'utf-8');
    writeFileSync(join(outputDir, 'search.json'), `${JSON.stringify(search, null, 2)}\n`, 'utf-8');
  }

  return { graph, search };
}

function main() {
  console.log('[build-wiki-index] Building static wiki graph and search indexes...');
  const { graph, search } = buildWikiIndex();
  console.log(
    `[build-wiki-index] Done. Notes: ${graph.stats.noteCount}, graph edges: ${graph.stats.edgeCount}, search documents: ${search.count}`
  );
  console.log('[build-wiki-index] Output written to public/assets/wiki/graph.json and public/assets/wiki/search.json');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
