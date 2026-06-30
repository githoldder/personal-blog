#!/usr/bin/env node

/**
 * build-seo-assets.js
 * 本地静态生成 robots.txt 与 sitemap.xml 
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');

const ROBOTS_OUTPUT = join(PUBLIC_DIR, 'robots.txt');
const SITEMAP_OUTPUT = join(PUBLIC_DIR, 'sitemap.xml');

function main() {
  console.log('[build-seo-assets] Starting robots.txt and sitemap.xml generation...');

  // 1. 读取主域自适应元数据
  let siteUrl = 'https://caolei.net';
  const resumePath = join(PUBLIC_DIR, 'assets/resume.json');
  if (existsSync(resumePath)) {
    try {
      const resume = JSON.parse(readFileSync(resumePath, 'utf-8'));
      if (resume?.basics?.url) {
        siteUrl = resume.basics.url.replace(/\/$/, '');
      }
    } catch (e) {
      console.warn(`[build-seo-assets] Failed to parse resume.json: ${e.message}`);
    }
  }

  // 2. 组装并写入 robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  writeFileSync(ROBOTS_OUTPUT, robotsTxt, 'utf-8');
  console.log(`[build-seo-assets] robots.txt written to ${ROBOTS_OUTPUT}`);

  // 3. 收集全站静态页面路由
  const staticRoutes = [
    '/',
    '/search/',
    '/notes/',
    '/projects/',
    '/decks/',
    '/resume/',
    '/lab/graph/'
  ];

  // 4. 读取已编译的 Decks 幻灯片子页面路由
  const decksManifestPath = join(PUBLIC_DIR, 'assets/decks/manifest.json');
  if (existsSync(decksManifestPath)) {
    try {
      const raw = readFileSync(decksManifestPath, 'utf-8');
      const manifest = JSON.parse(raw);
      const list = manifest.decks || [];
      for (const deck of list) {
        // 只有本地存在编译幻灯片 index.html 时，才将其加入 sitemap 中
        const htmlPhysicalPath = join(PUBLIC_DIR, 'slides', deck.slug, 'index.html');
        if (existsSync(htmlPhysicalPath)) {
          staticRoutes.push(`/slides/${deck.slug}/`);
        }
      }
    } catch (e) {
      console.warn(`[build-seo-assets] Failed to parse decks manifest: ${e.message}`);
    }
  }

  // 5. 拼装 sitemap.xml
  const todayStr = new Date().toISOString().split('T')[0];
  const sitemapXml = `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(route => `
  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : route.startsWith('/slides/') ? '0.5' : '0.8'}</priority>
  </url>`).join('').trim()}
</urlset>`;

  writeFileSync(SITEMAP_OUTPUT, sitemapXml, 'utf-8');
  console.log(`[build-seo-assets] sitemap.xml written to ${SITEMAP_OUTPUT}. Total urls: ${staticRoutes.length}`);
}

main();
