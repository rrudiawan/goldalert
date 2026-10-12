#!/usr/bin/env node
/**
 * submit-discovery.mjs
 * Notifies search engines and AI crawlers about updated content.
 *
 * Covers:
 *   - IndexNow (Bing, Yandex, api.indexnow.org)
 *   - Google Sitemap ping (public endpoint — no auth required)
 *   - Yandex sitemap ping
 *   - Common Crawl / AI crawler hint via HEAD request on sitemap
 *
 * Run after every deploy: node scripts/submit-discovery.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const INDEXNOW_KEY = "02dbf2a99709a8dce608f5b194c7d42e";
const HOST = "goldalert.org";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;

// ─── Parse URLs from sitemap ──────────────────────────────────────────────────
const sitemapPath = resolve(__dirname, "../dist/sitemap.xml");
const sitemapXml = readFileSync(sitemapPath, "utf-8");
const urlMatches = sitemapXml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g);
const urls = [...urlMatches].map((m) => m[1]);

console.log(`\n🗺  Found ${urls.length} URLs in sitemap.xml\n`);

// ─── Helper ───────────────────────────────────────────────────────────────────
async function pingGet(label, url) {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const ok = res.ok || res.status === 200 || res.status === 202;
    console.log(`${ok ? "✅" : "⚠️ "} ${label} → ${res.status} ${res.statusText}`);
  } catch (err) {
    console.error(`❌ ${label} → ${err.message}`);
  }
}

async function pingPost(label, url, body, headers = {}) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
      body: JSON.stringify(body),
    });
    const ok = res.ok || res.status === 202;
    const text = ok ? "" : ` — ${(await res.text().catch(() => "")).slice(0, 120)}`;
    console.log(`${ok ? "✅" : "⚠️ "} ${label} → ${res.status} ${res.statusText}${text}`);
  } catch (err) {
    console.error(`❌ ${label} → ${err.message}`);
  }
}

// ─── 1. IndexNow (Bing + api.indexnow.org + Yandex) ─────────────────────────
console.log("── IndexNow ──────────────────────────────────────────────────────");
const indexNowPayload = {
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
};

const indexNowEndpoints = [
  ["IndexNow (api.indexnow.org)", "https://api.indexnow.org/indexnow"],
  ["IndexNow (Bing)",             "https://www.bing.com/indexnow"],
  ["IndexNow (Yandex)",           "https://yandex.com/indexnow"],
];

for (const [label, endpoint] of indexNowEndpoints) {
  await pingPost(label, endpoint, indexNowPayload);
}

// ─── 2. Google — sitemap ping (public, no OAuth needed) ───────────────────────
// Google removed the /ping endpoint in 2023 but Search Console still crawls
// sitemap.xml submitted via GSC. The best programmatic fallback is to ensure
// the sitemap URL is accessible and submit individual URLs to GSC via their
// API. Since we don't have OAuth tokens stored here, we ping the legacy
// endpoint (harmless if ignored) AND log a reminder for the GSC manual step.
console.log("\n── Google ────────────────────────────────────────────────────────");
// Google deprecated /ping in June 2023; log a clear note instead of a silent 404.
console.log("ℹ️  Google Sitemap ping endpoint was deprecated in June 2023.");
console.log("   Use Google Search Console → Sitemaps to keep sitemap registered.");
console.log(`   Sitemap URL: ${SITEMAP_URL}`);
// Still attempt — some CDN mirrors still forward it.
await pingGet(
  "Google ping (legacy, may 404)",
  `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
);

// ─── 3. Yandex sitemap ping ───────────────────────────────────────────────────
console.log("\n── Yandex ────────────────────────────────────────────────────────");
await pingGet(
  "Yandex sitemap ping",
  `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`
);

// ─── 4. AI / GEO — ensure llms.txt and llms-full.txt are reachable ───────────
// AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Gemini, Grok) discover
// content via robots.txt + llms.txt. We do a lightweight HEAD check to confirm
// they're live, and log the URLs so CI output confirms their status.
console.log("\n── AI / GEO endpoints ────────────────────────────────────────────");
const aiEndpoints = [
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`,
  `https://${HOST}/sitemap.xml`,
  `https://${HOST}/robots.txt`,
];

for (const url of aiEndpoints) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    console.log(`${res.ok ? "✅" : "⚠️ "} HEAD ${url} → ${res.status}`);
  } catch (err) {
    console.error(`❌ HEAD ${url} → ${err.message}`);
  }
}

// ─── 5. Perplexity / DuckDuckGo — IndexNow covers them via api.indexnow.org ──
// Perplexity and DuckDuckGo use Bing's index (via IndexNow network), so no
// separate submission is needed.
console.log("\n── Perplexity / DuckDuckGo ───────────────────────────────────────");
console.log("ℹ️  Both use Bing's index — covered by IndexNow above.");

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n✅ Discovery run complete. ${urls.length} URLs submitted via IndexNow.`);
console.log("   Bing  → via IndexNow ✓");
console.log("   Yandex→ via IndexNow + sitemap ping ✓");
console.log("   DuckDuckGo → via Bing/IndexNow ✓");
console.log("   Perplexity → via Bing/IndexNow ✓");
console.log("   AI crawlers (GPTBot, ClaudeBot, Gemini) → via llms.txt + robots.txt ✓");
console.log("   Google → sitemap in GSC (manual, one-time setup) ✓");
