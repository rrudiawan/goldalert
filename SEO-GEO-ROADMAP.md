# SEO/GEO Roadmap — Tracked Recommendations

## 🔴 PENDING — To do next session, consolidated (updated Sept 2026)

**Needs the owner directly (cannot be done by an AI assistant):**
1. ✅ DONE — Google Analytics 4 installed (G-2JKWMB077G), wired into index.html.
2. ✅ DONE — PageSpeed checked (Mobile: Performance 72, Accessibility 90, Best Practices 77, SEO 100; Desktop: 83/90/77/100). Several findable issues fixed same session (see log below); "Reduce unused JavaScript" and ">4 preconnect" are inherent to embedding TradingView widgets and not further reducible without dropping that feature.
3. ✅ DONE — `www.goldalert.org` confirmed redirecting correctly to the canonical `goldalert.org`.
4. ✅ DONE (submitted, awaiting Google's decision) — Applied to Google AdSense. Verification script placed on all 15 pages, `ads.txt` filled in with the standard `google.com, pub-4893271383583986, DIRECT, f08c47fec0942fa0` line. Site status: "Getting ready" as of Sept 2026 — normal, can take days to weeks for a new domain. No further action needed until Google's dashboard shows a status change.
5. ⏳ IN PROGRESS — Affiliate program applications. Findings: JM Bullion runs on Awin (content-category eligibility confirmed: Precious Metals/Finance are both listed acceptable categories); Money Metals Exchange runs on ShareASale; Silver Gold Bull has a direct application portal at affiliates.silvergoldbull.com (program branded "Profit Trove," also listed on CJ Affiliate/FlexOffers as secondary channels). Owner needs to create accounts on the relevant networks and apply to each merchant individually — this cannot be done by an AI assistant since it requires the owner's own payment/tax details.
6. Reddit distribution — see `scripts/reddit-poster-colab.py`: a semi-automated (manual-trigger, 14-day cooldown guard) posting tool for r/PreciousMetals and r/Gold, meant to run in Google Colab. Requires: creating a Reddit "script" app at reddit.com/prefs/apps for a client_id/client_secret, then running the script manually — it is intentionally NOT a background/unattended scheduler, to avoid Reddit's spam detection. Read each subreddit's self-promotion rules before the first post, and genuinely participate before posting a link.

**Can be done by an AI assistant on request (no credentials needed):**
7. Write 7–12 more articles toward the 15–20 target (currently 8 live). Two specific ones already scoped from a GLM cross-review: an honest "how to set a gold price alert" piece (browser/email/Telegram on the website, not an "on iPhone" framing since this is a website, not a native app) and a balanced "is gold a good investment" piece (pro/con overview, no yes/no conclusion — stays out of investment-advice territory).
8. Add data tables + properly sourced statistics to existing articles — requires real web research per claim first, never fabricated numbers.
9. Submit to Product Hunt and AlternativeTo (needs the owner's own accounts, but content/copy can be drafted by an assistant).

**Deliberately deferred (with reasoning already recorded below — do not redo this research):**
10. Automated monthly historical-price pages (`/gold-price-history/2024` style) — needs new infrastructure the static site doesn't have.
11. Programmatic SEO at scale (hundreds of templated pages) — real risk of a Google Helpful Content penalty on a brand-new domain; if revisited, do it small (5–10 genuinely unique pages), not templated.
12. Extending stored historical data beyond ~2 years (Yahoo Finance `range=2y`) — prerequisite before any "N years of data" PR/content angle can be pursued honestly.

---

## Session log — Sept 2026, PageSpeed/AdSense follow-up session
- Installed GA4 (G-2JKWMB077G).
- Ran PageSpeed Insights; fixed everything confidently actionable from the report: added a missing `<main>` landmark, added `aria-label` to two unlabeled `<select>` elements (language and currency pickers), gave the three identical "Read more" links unique accessible names, and fixed a stale footer brand mention ("Gold Signal Simulator" → "GoldAlert").
- Found and fixed a second, more significant stale-data-source issue: the client-side browser fallback fetch function was still calling Stooq directly (via the CORS proxy) even though the server-side pipeline had already been migrated to Yahoo Finance weeks earlier. Migrated the client-side fallback to Yahoo Finance too (matching symbols: GC=F, SI=F, and plain tickers for the miners/ETFs), for consistency and to avoid ever depending on Stooq again. Also corrected all 16 remaining text mentions of "Stooq" (trust strip, footer, methodology) across all 6 languages to say "Yahoo Finance."
- Applied to Google AdSense: placed the verification/ad script on all 15 pages (homepage, 4 legal pages, methodology, articles index, all 8 articles), then filled in `ads.txt` with the standard Google-format line once the account reached "Getting ready" status.
- Researched and documented the actual affiliate networks behind all three target dealer programs (see item 5 above) — this was previously assumed to be direct sign-up and turned out to require third-party network accounts (Awin, ShareASale) for two of the three.


## Session log — what was completed (Sept 2026, SEO/GEO deep-dive session)
- Fixed a real rebranding bug: the homepage H1 and browser tab title were still rendering the old pre-rebrand name ("Gold Signal Simulator — Multi-Asset") in all 6 languages after JavaScript ran, despite the visible logo/header already saying "GoldAlert." Root cause: a single i18n key was reused for both the H1 and `document.title`. Fixed by splitting into two keys (`title` for the short H1, new `pageTitle` for the SEO-optimized page title) across all 6 languages.
- Homepage `<title>` and meta description rewritten to correct length (title 57 chars incl. "Gold Price Alerts" keyword; description exactly 160 chars) and to stay in sync with the new `pageTitle` i18n key (previously the static tag and the JS-driven title could drift apart).
- Article-level SEO audit: found and fixed one over-length title (71 → 39 chars) and one missing brand suffix, for consistency across all 8 articles.
- Found and fixed a real internal-linking gap: several articles mentioned "companion articles" in prose but never actually hyperlinked them. Added a genuine "Related articles" section (2 relevant cross-links) to the bottom of all 8 articles.
- Data-source transparency (E-E-A-T): About and Methodology pages previously said prices come from generic "third parties" / only named TradingView and CoinGecko, omitting Yahoo Finance even though it's the actual source powering signal calculations. Both pages now name all three sources explicitly.
- Cross-reviewed a second AI assistant's (GLM-5.3-Flash) SEO/GEO audit and roadmap suggestions; evaluated each on its merits rather than accepting them wholesale — see the sections below for which were adopted, adjusted, or rejected and why.
- Built `scripts/reddit-poster-colab.py`, a semi-automated Reddit distribution tool (see pending item 6 above for how to use it).



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
