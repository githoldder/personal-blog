#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LIBRARY_JSON = join(ROOT, 'public/assets/library.json');
const COVER_DIR = join(ROOT, 'public/assets/book-covers');
const PUBLIC_PREFIX = '/assets/book-covers';
const SHOULD_REFRESH = process.argv.includes('--refresh');
const ISBN_HINTS = {
  'book-软技能-代码之外的生存指南-第2版-约翰-z-森梅兹': '9787115474057',
  'book-算法图解-美-巴尔加瓦-aditya-bhargava-著-袁国忠译-z-library': '9787115447630',
  'book-正则表达式必知必会-ben-forta-z-library': '9787115278348',
  'book-终身成长': '9787210096528',
  'book-深入设计模式-1': '9787115520228',
  'book-金字塔原理大全集-芭芭拉-明托-z-library': '9787544268509',
  'book-金字塔原理笔记': '9787544268509'
};

const cleanupTitle = (value) => String(value || '')
  .replace(/[_]/g, ' ')
  .replace(/\(Z-Library\)|（Z-Library）|\(1\)/gi, '')
  .replace(/【[^】]*】/g, ' ')
  .replace(/\.\.\..*$/g, ' ')
  .replace(/（[^）]*(Z-Library|z-library)[^）]*）/gi, ' ')
  .replace(/\([^)]*(Z-Library|z-library)[^)]*\)/gi, ' ')
  .replace(/（第(\d+)版·全新版）/g, ' 第$1版 ')
  .replace(/[【】]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const safeFileName = (value) => String(value || 'book')
  .toLowerCase()
  .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 96) || 'book';

const pickImage = (volume) => {
  const links = volume?.volumeInfo?.imageLinks || {};
  return links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail || '';
};

const googleBooksUrl = (book) => {
  const title = cleanupTitle(book.title);
  const author = book.author && book.author !== '未知作者' ? `+inauthor:${book.author}` : '';
  const isbn = book.isbn || ISBN_HINTS[book.slug] ? `isbn:${book.isbn || ISBN_HINTS[book.slug]}` : '';
  const query = isbn || `intitle:${title}${author}`;
  return `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`;
};

const openLibraryUrl = (book) => {
  const title = cleanupTitle(book.title);
  const isbn = book.isbn || ISBN_HINTS[book.slug] || '';
  const params = new URLSearchParams({ limit: '5', fields: 'key,title,author_name,cover_i,isbn,edition_key' });
  if (isbn) {
    params.set('isbn', isbn);
  } else {
    params.set('title', title);
  }
  return `https://openlibrary.org/search.json?${params.toString()}`;
};

const fetchJson = async (url) => {
  const response = await fetch(url, { headers: { 'accept': 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
};

const extensionFromContentType = (contentType) => {
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/webp')) return '.webp';
  return '.jpg';
};

const downloadCover = async (url, targetPath) => {
  const normalized = url.replace(/^http:/, 'https:');
  const response = await fetch(normalized);
  if (!response.ok) throw new Error(`HTTP ${response.status} ${normalized}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  writeFileSync(targetPath, bytes);
  return extensionFromContentType(response.headers.get('content-type') || '');
};

const saveCover = async (book, imageUrl) => {
  const baseName = safeFileName(book.slug);
  const tempPath = join(COVER_DIR, `${baseName}.tmp`);
  const ext = await downloadCover(imageUrl, tempPath);
  const filename = `${baseName}${ext}`;
  const targetPath = join(COVER_DIR, filename);
  renameSync(tempPath, targetPath);
  book.coverUrl = `${PUBLIC_PREFIX}/${filename}`;
  return book.coverUrl;
};

const syncFromGoogle = async (book) => {
  const data = await fetchJson(googleBooksUrl(book));
  const candidates = Array.isArray(data.items) ? data.items : [];
  const volume = candidates.find(item => pickImage(item)) || candidates[0];
  const imageUrl = pickImage(volume);
  if (!imageUrl) return null;

  const coverUrl = await saveCover(book, imageUrl.replace('zoom=1', 'zoom=2'));
  book.openLibraryUrl = volume?.volumeInfo?.infoLink || book.openLibraryUrl || '';
  book.author = (volume?.volumeInfo?.authors || [book.author]).filter(Boolean).join(', ') || book.author;
  book.isbn = book.isbn || (volume?.volumeInfo?.industryIdentifiers || [])
    .map(item => item.identifier)
    .find(Boolean) || '';
  return coverUrl;
};

const syncFromOpenLibrary = async (book) => {
  const data = await fetchJson(openLibraryUrl(book));
  const doc = Array.isArray(data.docs) ? data.docs.find(item => item.cover_i) || data.docs[0] : null;
  if (!doc?.cover_i) return null;

  const coverUrl = await saveCover(book, `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`);
  book.openLibraryUrl = doc.key ? `https://openlibrary.org${doc.key}` : book.openLibraryUrl || '';
  book.author = (doc.author_name || [book.author]).filter(Boolean).join(', ') || book.author;
  book.isbn = book.isbn || (doc.isbn || []).find(Boolean) || '';
  book.openLibraryWorkKey = doc.key || book.openLibraryWorkKey || '';
  book.openLibraryEditionKey = (doc.edition_key || []).find(Boolean) || book.openLibraryEditionKey || '';
  return coverUrl;
};

if (!existsSync(LIBRARY_JSON)) {
  console.error('[sync-google-book-covers] public/assets/library.json not found.');
  process.exit(1);
}

mkdirSync(COVER_DIR, { recursive: true });

const library = JSON.parse(readFileSync(LIBRARY_JSON, 'utf-8'));
const books = Array.isArray(library.books) ? library.books : [];
const report = [];

for (const book of books) {
  try {
    if (!SHOULD_REFRESH && book.coverUrl && book.coverUrl.startsWith(PUBLIC_PREFIX)) {
      report.push({ slug: book.slug, status: 'kept', coverUrl: book.coverUrl });
      continue;
    }

    const hintedIsbn = book.isbn || ISBN_HINTS[book.slug] || '';
    if (hintedIsbn) {
      const endpoint = `https://books.google.com/books/content?vid=ISBN${hintedIsbn}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
      await saveCover(book, endpoint);
      book.isbn = hintedIsbn;
      book.openLibraryUrl = book.openLibraryUrl || `https://books.google.com/books?vid=ISBN${hintedIsbn}`;
      report.push({ slug: book.slug, status: 'synced-isbn', coverUrl: book.coverUrl });
      continue;
    }

    const coverUrl = await syncFromGoogle(book).catch(() => null) || await syncFromOpenLibrary(book).catch(() => null);
    report.push(coverUrl
      ? { slug: book.slug, status: 'synced', coverUrl }
      : { slug: book.slug, status: 'missing' });
  } catch (error) {
    report.push({ slug: book.slug, status: 'error', message: error.message });
  }
}

writeFileSync(LIBRARY_JSON, JSON.stringify({ ...library, books }, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
