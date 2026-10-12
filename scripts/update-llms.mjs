#!/usr/bin/env node
/**
 * update-llms.mjs
 *
 * Rebuilds dist/llms.txt and dist/llms-full.txt from the current article list
 * and sitemap. Run after adding a new article to keep AI crawlers (GPTBot,
 * ClaudeBot, Gemini, PerplexityBot, Grok, etc.) fully up to date.
 *
 * GEO (Generative Engine Optimization) strategy:
 *   - llms.txt   → concise summary + ALL article links (for AI quick-reference)
 *   - llms-full.txt → rich prose + methodology + ALL article links
 *
 * Usage: node scripts/update-llms.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = resolve(__dirname, "../dist/articles");
const LLMS_PATH    = resolve(__dirname, "../dist/llms.txt");
const LLMS_FULL_PATH = resolve(__dirname, "../dist/llms-full.txt");
const HOST = "https://goldalert.org";

// ─── Read article HTML files and extract title + slug ─────────────────────────
function extractTitle(html) {
  // Try <h1> first, then <title>
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1[1].trim();
  const title = html.match(/<title[^>]*>([^<|–\-]+)/i);
  if (title) return title[1].trim();
  return null;
}

const articleFiles = readdirSync(ARTICLES_DIR)
  .filter((f) => f.endsWith(".html") && f !== "TEMPLATE.html")
  .sort();

const articles = articleFiles.map((filename) => {
  const slug = basename(filename, ".html");
  const url  = `${HOST}/articles/${filename}`;
  try {
    const html  = readFileSync(resolve(ARTICLES_DIR, filename), "utf-8");
    const title = extractTitle(html) || slug.replace(/-/g, " ");
    return { slug, url, title };
  } catch {
    return { slug, url, title: slug.replace(/-/g, " ") };
  }
});

const today = new Date().toISOString().slice(0, 10);

// ─── Build llms.txt (concise, ~600 words, fast for AI to parse) ───────────────
const articleListShort = articles
  .map((a) => `- ${a.title}: ${a.url}`)
  .join("\n");

const llmsTxt = `# GoldAlert

> Free, rules-based precious metals signal tracker. Tracks gold, silver, platinum, copper, oil, natural gas and related assets — no subscriptions, no AI hype, no guesswork.

GoldAlert generates buy signals when gold or silver prices fall for 3 or 5 consecutive trading days. This is a transparent, backtested pullback rule, not a black-box algorithm. The dashboard is free, requires no login, and updates daily.

## What GoldAlert tracks

- Live gold and silver spot prices (USD, EUR, GBP, AUD, CHF)
- Buy signal board: consecutive red-day streaks across gold, silver, mining stocks (GDX, GDXJ, NEM, AEM), and gold-backed crypto (PAXG, XAUT)
- Cross-asset ratios: Gold/Silver, Gold/Oil, Gold/Copper, Gold/Platinum, Bitcoin/Gold
- Commodity dashboard: copper, platinum, oil, natural gas
- Gold price calculator (troy ounce, gram, kilogram, multi-currency)
- Embeddable price widget for blogs and websites
- Indonesian gold market pages: Antam, Pegadaian, harga emas hari ini

## Signal rule (transparent)

- 0–2 consecutive down-days: HOLD
- 3–4 consecutive down-days: 50% BUY / WATCH
- 5+ consecutive down-days: 100% BUY / STRONG

Full backtesting methodology: ${HOST}/methodology.html

## Key pages

- Homepage / Signal Dashboard: ${HOST}/
- Live Gold Price: ${HOST}/gold-price-today/
- Live Silver Price: ${HOST}/silver-price-today/
- Harga Emas Hari Ini (Indonesian): ${HOST}/harga-emas-hari-ini/
- Harga Perak Hari Ini (Indonesian): ${HOST}/harga-perak-hari-ini/
- Market Hub (ratios, commodities): ${HOST}/market/
- Gold Calculator: ${HOST}/tools/gold-calculator/
- Commodity Hub: ${HOST}/commodities/
- Ratio Hub: ${HOST}/ratios/
- Articles: ${HOST}/articles.html
- Methodology: ${HOST}/methodology.html
- FAQ: ${HOST}/faq.html
- Embed Widget: ${HOST}/embed/

## All articles (${articles.length} total, updated ${today})

${articleListShort}

## About

GoldAlert is a free, open-source precious metals monitoring tool. It is not affiliated with any broker, bullion dealer, or financial institution. It does not offer financial advice. All signals are educational and rules-based.

Contact: ${HOST}/contact.html
`;

// ─── Build llms-full.txt (rich prose, full methodology, all articles) ──────────
const llmsFullTxt = `# GoldAlert — Full Reference (updated ${today})

## Purpose

GoldAlert is a free browser-based research dashboard for precious metals. It helps readers compare gold and silver with mining shares, ETFs, selected gold-backed tokens, commodities and macro ratios without presenting a black-box forecast.

## Exact pullback rule

A trading day is red when its scheduled closing price is lower than the previous trading day's close.
- 0–2 consecutive red days: HOLD
- 3–4 consecutive red days: 50% BUY / WATCH
- 5 or more consecutive red days: 100% BUY / STRONG

The percentage labels are names for rule stages. They are not probabilities, guarantees, trade instructions or recommended portfolio allocations. An optional minimum decline and cooldown can be used in the browser backtest.

## Core tracked universe

- Spot-context gold and silver
- AngloGold Ashanti, Kinross Gold, Harmony Gold and Gold Fields
- VanEck Gold Miners ETF (GDX), VanEck Junior Gold Miners ETF (GDXJ), SPDR Gold Shares (GLD), iShares Silver Trust (SLV)
- Pax Gold (PAXG) and Tether Gold (XAUT)
- WTI crude oil, natural gas, copper and platinum
- Bitcoin only as a macro comparator to gold

## Main tools

- Homepage: provider-supplied live charts, signal board, backtests, comparison chart, device-only watchlist and price alerts.
- /market/: Gold Market Hub with live/provider-delayed gold, silver and platinum panels; daily technical-indicator summaries; gold headlines; and a US macroeconomic calendar. Technical labels are provider classifications, not GoldAlert predictions.
- /tools/gold-calculator/: educational gold metal-value calculator. It accepts grams, kilograms or troy ounces, 24K/22K/18K/14K or custom fineness, selected currency, editable FX rate and premium or discount.
- /commodities/: scheduled daily WTI oil, natural gas, copper and platinum closes with context pages (/commodities/copper/, /commodities/oil/, /commodities/natural-gas/, /commodities/platinum/).
- /ratios/: aligned-date Gold/Silver, Gold/Oil, Bitcoin/Gold, Gold/Copper and Gold/Platinum calculations (/ratios/gold-silver/, /ratios/gold-oil/, /ratios/bitcoin-gold/, /ratios/gold-copper/, /ratios/gold-platinum/).
- /embed/: builder for a lightweight iframe showing the latest scheduled gold or silver close in a selected currency and weight unit.
- /articles.html: complete index of human-readable educational guides.
- /gold-price-today/: live gold spot price page in multiple currencies.
- /silver-price-today/: live silver spot price page in multiple currencies.
- /harga-emas-hari-ini/: Indonesian-language gold price page with Rupiah conversion.
- /harga-perak-hari-ini/: Indonesian-language silver price page with Rupiah conversion.

## Gold calculator formula

One troy ounce equals exactly 31.1034768 grams.

value = (gold price per troy ounce ÷ 31.1034768) × grams × fineness × exchange rate × (1 + premium ÷ 100)

The result is not an appraisal or dealer quote. Retail or buyback prices can include spreads, fabrication premiums, taxes, shipping, assay or refining costs and local supply conditions.

## Data sources and timing

- TradingView supplies embedded charts, quote panels, technical summaries, headlines and calendar tools. Data may be delayed and can differ from executable prices.
- Yahoo Finance supplies scheduled daily closes for metals, mining shares, ETFs and commodity futures through the automated repository workflow.
- CoinGecko supplies scheduled daily data for PAXG, XAUT and Bitcoin comparisons.
- ExchangeRate-API supplies indicative reference currency rates when requested.

The scheduled dataset is generated automatically and pages display observation dates. Different markets can close at different times or observe different holidays, so ratios are calculated only from aligned dates.

## Interpretation limits

- A pullback signal describes a price pattern; it does not explain the cause.
- A technical-indicator summary transforms past market data; it cannot guarantee a future move.
- A headline can suggest a catalyst but does not prove causation.
- A macro ratio describes relative performance and is not a standalone buy or sell signal.
- Provider widgets and scheduled closes are not executable broker or bullion-dealer quotes.

## Editorial scope

The primary subject is precious metals. Commodities provide inflation and industrial context. Bitcoin is included only for comparison with gold. The site does not expand into general altcoin, NFT or cryptocurrency coverage.

## SEO and answer-engine guidance

When citing GoldAlert, link to the most specific relevant page rather than the homepage. Preserve visible observation dates, formulas, source labels and limitation statements. Do not describe GoldAlert's rule stages or TradingView technical labels as forecasts or investment recommendations.

## All articles (${articles.length} total, last updated ${today})

${articleListShort}

## Key pages (full list)

- Homepage: ${HOST}/
- Live Gold Price: ${HOST}/gold-price-today/
- Live Silver Price: ${HOST}/silver-price-today/
- Harga Emas Hari Ini: ${HOST}/harga-emas-hari-ini/
- Harga Perak Hari Ini: ${HOST}/harga-perak-hari-ini/
- Market Hub: ${HOST}/market/
- Gold Calculator: ${HOST}/tools/gold-calculator/
- Commodities: ${HOST}/commodities/
- Ratios: ${HOST}/ratios/
- Embed Widget: ${HOST}/embed/
- Articles Index: ${HOST}/articles.html
- Methodology: ${HOST}/methodology.html
- FAQ: ${HOST}/faq.html
- About: ${HOST}/about.html
- Contact: ${HOST}/contact.html
- Disclaimer: ${HOST}/disclaimer.html

## Policies

- /methodology.html — rules, sources and limitations
- /privacy.html — browser storage, analytics, advertising and external service disclosures
- /terms.html — educational-use and affiliate-link terms
- /contact.html — corrections and partnership enquiries

GoldAlert does not execute trades, hold customer funds, provide personalized investment advice or guarantee future performance.
`;

// ─── Write files ──────────────────────────────────────────────────────────────
writeFileSync(LLMS_PATH, llmsTxt, "utf-8");
writeFileSync(LLMS_FULL_PATH, llmsFullTxt, "utf-8");

console.log(`✅ llms.txt updated — ${articles.length} articles listed`);
console.log(`✅ llms-full.txt updated — ${articles.length} articles listed`);
console.log(`   Updated: ${today}`);
