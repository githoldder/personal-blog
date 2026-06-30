#!/usr/bin/env node

/**
 * build-feeds.js
 * 本地静态生成 RSS 2.0 (rss.xml) 与 Atom 1.0 (atom.xml) 订阅源
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const PUBLIC_DIR = join(ROOT, 'public');

const RSS_OUTPUT = join(PUBLIC_DIR, 'rss.xml');
const ATOM_OUTPUT = join(PUBLIC_DIR, 'atom.xml');

// 时区稳定日期解析 (默认东八区)
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), 8, 0, 0);
  }
  return new Date(dateStr);
}

// 格式化为 RFC 822 日期串
function toRFC822(date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${dayName}, ${day} ${monthName} ${year} ${hours}:${minutes}:${seconds} +0800`;
}

// 格式化为 ISO 8601 (RFC 3339) 日期串
function toISO8601(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
}

// XML 安全实体转义
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function main() {
  console.log('[build-feeds] Starting RSS and Atom feeds generation...');

  // 1. 读取简历元数据自适应主域与作者
  let siteUrl = 'https://caolei.net';
  let authorName = '曹磊';
  let siteDescription = '个人知识资产操作系统 - 聚合笔记、简历、项目与演示文稿';

  const resumePath = join(PUBLIC_DIR, 'assets/resume.json');
  if (existsSync(resumePath)) {
    try {
      const resume = JSON.parse(readFileSync(resumePath, 'utf-8'));
      if (resume?.basics) {
        if (resume.basics.url) siteUrl = resume.basics.url.replace(/\/$/, '');
        if (resume.basics.name) authorName = resume.basics.name;
        if (resume.basics.summary) siteDescription = resume.basics.summary;
      }
    } catch (e) {
      console.warn(`[build-feeds] Failed to parse resume.json for feeds: ${e.message}`);
    }
  }

  const siteTitle = `${authorName}的个人知识资产操作系统`;
  const items = [];

  // 2. 扫描并解析 Notes
  const notesDir = join(CONTENT_DIR, 'notes');
  if (existsSync(notesDir)) {
    const files = readdirSync(notesDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = join(notesDir, file);
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
        let frontmatter = {};
        let body = raw;

        if (match) {
          frontmatter = YAML.parse(match[1]) || {};
          body = raw.slice(match[0].length);
        }

        const slug = frontmatter.slug || basename(file, '.md');
        const date = parseLocalDate(frontmatter.date);
        
        items.push({
          title: frontmatter.title || slug,
          link: `${siteUrl}/notes#${slug}`,
          date,
          description: frontmatter.summary || (body.slice(0, 200).replace(/[#*`~_\-[\]()]/g, '').trim() + '...')
        });
      } catch (err) {
        console.warn(`[build-feeds] Failed to parse note ${file}: ${err.message}`);
      }
    }
  }

  // 3. 扫描并解析 Projects
  const projectsDir = join(CONTENT_DIR, 'projects');
  if (existsSync(projectsDir)) {
    const files = readdirSync(projectsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const filePath = join(projectsDir, file);
      try {
        const raw = readFileSync(filePath, 'utf-8');
        const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
        let frontmatter = {};
        let body = raw;

        if (match) {
          frontmatter = YAML.parse(match[1]) || {};
          body = raw.slice(match[0].length);
        }

        const slug = frontmatter.slug || basename(file, '.md');
        const date = parseLocalDate(frontmatter.date);

        items.push({
          title: frontmatter.title || slug,
          link: `${siteUrl}/projects#${slug}`,
          date,
          description: frontmatter.description || (body.slice(0, 200).replace(/[#*`~_\-[\]()]/g, '').trim() + '...')
        });
      } catch (err) {
        console.warn(`[build-feeds] Failed to parse project ${file}: ${err.message}`);
      }
    }
  }

  // 4. 按日期排序 (最新排在最前)
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  // 5. 拼装并输出 RSS 2.0
  const rssXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteDescription)}</description>
    <lastBuildDate>${toRFC822(new Date())}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />
    ${items.map(item => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.link)}</guid>
      <pubDate>${toRFC822(item.date)}</pubDate>
      <description><![CDATA[${item.description}]]></description>
    </item>`).join('').trim()}
  </channel>
</rss>`;

  // 6. 拼装并输出 Atom 1.0
  const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(siteTitle)}</title>
  <subtitle>${escapeXml(siteDescription)}</subtitle>
  <link href="${escapeXml(siteUrl)}/atom.xml" rel="self" />
  <link href="${escapeXml(siteUrl)}" />
  <updated>${toISO8601(new Date())}</updated>
  <id>${escapeXml(siteUrl)}/</id>
  <author>
    <name>${escapeXml(authorName)}</name>
  </author>
  ${items.map(item => `
  <entry>
    <title>${escapeXml(item.title)}</title>
    <link href="${escapeXml(item.link)}" />
    <id>${escapeXml(item.link)}</id>
    <published>${toISO8601(item.date)}</published>
    <updated>${toISO8601(item.date)}</updated>
    <summary type="html"><![CDATA[${item.description}]]></summary>
  </entry>`).join('').trim()}
</feed>`;

  writeFileSync(RSS_OUTPUT, rssXml, 'utf-8');
  writeFileSync(ATOM_OUTPUT, atomXml, 'utf-8');

  console.log(`[build-feeds] Success. Feeds written to:
  - RSS 2.0: public/rss.xml
  - Atom 1.0: public/atom.xml
  Total feed items: ${items.length}`);
}

main();
