# SEO/GEO Roadmap — Tracked Recommendations

This file consolidates SEO/GEO recommendations gathered from multiple advisory sessions (Claude + GLM-5.3-Flash cross-review, September 2026) so nothing gets lost between sessions. Status is tracked per item. Update this file directly when an item's status changes.

Legend: ✅ Done · 🔧 Adjusted (done differently than originally suggested, with reason) · ⏳ Queued · ⚠️ Needs owner action · ❌ Rejected (with reason)

## Technical SEO
- ✅ Sitemap submitted to Search Console (Status: Success)
- ✅ robots.txt allows all crawlers, references sitemap
- ✅ HTTPS enforced
- ✅ Site verified in Search Console, homepage confirmed indexed
- ⚠️ Google Analytics 4 — not installed yet. Owner needs to create a GA4 property at analytics.google.com and send the Measurement ID (G-XXXXXXXXXX); code hook already exists in index.html (`GA_MEASUREMENT_ID` constant), gated behind the cookie-consent banner.
- ⚠️ PageSpeed Insights score — not yet measured. Owner should check pagespeed.web.dev/analysis?url=https://goldalert.org and report the mobile score; TradingView widgets are the likely main weight, several are already lazy-loaded (news, market overview).
- ⚠️ Mobile-friendly test — not yet run against the live site (design is mobile-first, low risk, but unverified by an actual tool).
- ⚠️ HTTP→HTTPS and www→apex redirect — GitHub Pages handles HTTPS enforcement and the CNAME is set to the apex domain; exact www redirect behavior has not been independently verified against the live site.

## E-E-A-T / Trust (YMYL content)
- ✅ About page exists, now names data sources explicitly (TradingView, Yahoo Finance, CoinGecko)
- ✅ Methodology page names data sources explicitly (updated same session)
- ✅ Disclaimer present on multiple pages
- ✅ Contact page has real publisher identity (GoldAlert, onlineadmin00@gmail.com)
- ✅ Terms of Use has real governing-law jurisdiction (Indonesia) and real contact
- ⏳ Author/credential profile for articles — currently attributed to "GoldAlert" (Organization) rather than a named individual with credentials. Revisit if a named author byline becomes desirable for additional trust signal.

## Content
- ✅ 8 articles live, each with Article JSON-LD schema, rewritten in a natural human voice (Sept 2026 pass)
- ✅ FAQPage schema matching a visible FAQ section on the homepage
- ⏳ 7–12 more articles needed to reach the 15–20 target from the original content plan
- ⏳ "How to set a gold price alert" article — queued; write the honest version (browser/email/Telegram on the website), not an "on iPhone" framing, since GoldAlert is a website, not a native app
- ⏳ "Is gold a good investment?" article — queued; must be written as a balanced pro/con overview, not a yes/no conclusion, to stay out of investment-advice territory
- ❌ "Gold price January 2024 history" style monthly pages — rejected for now; would need new historical-data infrastructure the static site doesn't have. Revisit as a separate project if there's appetite for it.
- ❌ Programmatic SEO at scale (hundreds of auto-generated /gold-price-alert/$X-usd style pages) — rejected as originally proposed. Real risk: Google's Helpful Content system penalizes thin, auto-generated pages, and a brand-new domain has the least trust margin to absorb that risk. If revisited, do it small (5–10 pages) with genuinely unique content per page, not a template with numbers swapped in.
- ⚠️ Any cited external statistic (e.g. World Gold Council central bank buying figures) must be verified via a real search before publishing — never take a number from an advisory chat at face value without checking the primary source and its date.

## GEO (AI answer engines)
- ✅ llms.txt / llms-full.txt present, rebranded and listing all articles
- ✅ Direct-answer opening ("lede") paragraph pattern used in every article
- ✅ FAQPage schema
- ⏳ Data tables with clear dates inside articles — not yet added to any article; a real opportunity once genuine data is sourced
- ⏳ Sourced statistics with dates inside articles — none yet; needs real research per claim, not fabrication

## Backlinks / distribution (do NOT buy links, spam comments, or use PBNs — real risk of penalty for a new domain)
- ⏳ Share on Reddit (r/Gold, r/PreciousMetals, r/investing) — only when genuinely useful to the conversation, not as spam
- ⏳ Submit to Product Hunt and AlternativeTo
- ⏳ Digital PR angle once enough historical data exists — e.g. "gold price spikes and how a streak rule would have flagged them." Currently blocked: the live data pipeline only retains ~2 years of history (Yahoo Finance `range=2y`), not the 10 years such a piece would need. Extending the retained history window is a prerequisite before this angle can be pursued honestly.

## Monetization (tracked separately in README.md Section 4 — not duplicated here)
See README.md for the full AdSense and affiliate-program checklist.

---
Last updated: September 2026, during a cross-review against recommendations from GLM-5.3-Flash.
