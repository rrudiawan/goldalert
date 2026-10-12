#!/usr/bin/env node
/**
 * submit-indexnow.mjs
 * Submits all URLs from sitemap.xml to IndexNow (Bing, Yandex, etc.)
 * Run after deploy or manually: node scripts/submit-indexnow.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEXNOW_KEY = "02dbf2a99709a8dce608f5b194c7d42e";
const HOST = "goldalert.org";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

// Parse URLs from sitemap.xml
const sitemapPath = resolve(__dirname, "../dist/sitemap.xml");
const sitemapXml = readFileSync(sitemapPath, "utf-8");
const urlMatches = sitemapXml.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g);
const urls = [...urlMatches].map((m) => m[1]);

console.log(`Found ${urls.length} URLs in sitemap.xml`);
console.log("Submitting to IndexNow...\n");

const payload = {
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
};

const endpoints = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

for (const endpoint of endpoints) {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      console.log(`✅ ${endpoint} → ${res.status} ${res.statusText}`);
    } else {
      const body = await res.text().catch(() => "");
      console.warn(`⚠️  ${endpoint} → ${res.status} ${res.statusText} ${body}`);
    }
  } catch (err) {
    console.error(`❌ ${endpoint} → ${err.message}`);
  }
}

console.log(`\nDone. ${urls.length} URLs submitted.`);
console.log("URLs submitted:");
urls.forEach((u) => console.log(" ", u));
