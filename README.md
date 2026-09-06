# GoldAlert (goldalert.org)

Static, GitHub Pages-ready market dashboard for spot metals, gold-mining shares, ETFs and gold-backed cryptoassets. Everything below assumes the final domain is **goldalert.org** — every file in this package already has that domain hardcoded (canonical tags, sitemap, CNAME, Open Graph, JSON-LD).

## 1. Publish on GitHub Pages

1. Create a **public** GitHub repository and upload this entire project as-is, preserving the `.github`, `dist` and `scripts` folders and the `CNAME` file inside `dist`.
2. Repo → **Settings → Pages** → Source: **GitHub Actions**.
3. Repo → **Settings → Pages** → Custom domain: enter `goldalert.org` (the `dist/CNAME` file already contains this, so GitHub should pick it up automatically once Pages is enabled).
4. At your domain registrar, point DNS for `goldalert.org` to GitHub Pages: an `A` record for the apex domain to each of `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, plus (if you also want `www.goldalert.org` to work) a `CNAME` record for `www` → `<your-github-username>.github.io`. Check GitHub's current custom-domain docs for any changes to these IPs before you set this up.
5. Actions tab → run **Deploy GitHub Pages** once manually. After that it deploys automatically on every push to `main` that touches `dist/`.
6. Once DNS has propagated (can take up to ~24h), tick **Enforce HTTPS** in Settings → Pages.

## 2. Automatic daily data + Telegram alerts (GitHub Actions)

Two workflows live in `.github/workflows/`:

- **`update-signals.yml`** — runs on weekdays at 23:20 UTC (and on demand), executes `scripts/update-signals.mjs`, which fetches fresh daily history for all 11 tracked assets directly from Stooq/CoinGecko (server-side, so no CORS proxy needed), computes each asset's tier (HOLD / 50% BUY / 100% BUY), writes `dist/data/market-history.json` and `dist/data/signals.json`, and commits them back to the repo. The website's `scheduledHistory()` function reads `market-history.json` first and only falls back to live browser-side fetches (via the public CORS proxy) if that file doesn't exist yet or an asset is missing from it.
- **`deploy-pages.yml`** — publishes `dist/` to GitHub Pages whenever it changes (including when the workflow above commits new data).

**To enable Telegram alerts** (optional):
1. Create a bot via [@BotFather](https://t.me/BotFather) and a Telegram channel (public or private).
2. Add the bot to the channel as an **administrator**.
3. Repo → **Settings → Secrets and variables → Actions** → New repository secret, twice:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. Actions tab → run **Update market signals** manually once to confirm it works, then let the schedule take over.

An alert is sent only when an asset's tier **increases** (e.g. HOLD → 50% BUY, or 50% BUY → 100% BUY) compared to the previous run — not on every scheduled run — so the channel won't get spammed.

**Never** put the bot token in HTML, client-side JavaScript, or anywhere a visitor's browser can read it. It only ever lives in GitHub Secrets and the Actions runner's environment.

## 3. Adding a new article (no code changes needed on the homepage)

1. Copy `dist/articles/TEMPLATE.html`, rename it (e.g. `dist/articles/why-gold-silver-ratio-matters.html`), and fill in the bracketed placeholders.
2. Add one new entry to `dist/articles/articles.json`:
   ```json
   {
     "slug": "why-gold-silver-ratio-matters",
     "title": "Why the Gold/Silver Ratio Matters",
     "category": "Guide",
     "excerpt": "One or two sentences that make someone want to click.",
     "date": "2026-10-01",
     "url": "articles/why-gold-silver-ratio-matters.html"
   }
   ```
3. That's it — `dist/articles.html` (the full articles index, linked from the homepage nav and footer) fetches `articles.json` at load time and lists every entry automatically, newest first.
4. Optional: add the new article's URL to `dist/sitemap.xml` so search engines discover it faster, and — only if you want it in the 3-card homepage teaser too — edit the relevant card in `dist/index.html` (search for `id="articles"`) plus the matching `art1`/`art2`/`art3` keys in the `I18N` object. The homepage teaser is intentionally static (no JavaScript needed to render it), while `articles.html` is always complete and current.

If you eventually want this fully automated (e.g. auto-generating `articles.json` from a `frontmatter` field in each file, or auto-publishing from a CMS), that's a reasonable next step but adds real infrastructure — the JSON-manifest approach above is the simplest version that still keeps "add an article" to two small edits.

## 4. Before commercial launch

- [ ] Buy/confirm the domain and complete DNS setup (Section 1).
- [ ] Add the publisher's legal name and a business email to `about.html`, `contact.html`, `privacy.html` and `terms.html` (search each file for "Add your" / "Add a public" / "Add the publisher's").
- [ ] Have `terms.html` reviewed for your actual governing law/jurisdiction.
- [ ] Replace the three standard dealer links in the homepage's "Where to Buy" section with your approved affiliate links, **after** each program accepts you (JM Bullion, Money Metals Exchange, Silver Gold Bull).
- [ ] Apply to an ad network once you have enough original content and traffic; add its exact authorized-seller line to `dist/ads.txt` (currently empty on purpose — do not fabricate a line).
- [ ] Add a consent-management banner appropriate to your target countries before loading any personalized-advertising or analytics script. `index.html` already includes a cookie-consent banner that only loads Google Analytics after explicit consent, and only if you set `GA_MEASUREMENT_ID` in the script — it's empty by default.
- [ ] Verify the live site in Google Search Console and submit `sitemap.xml`. Replace the `google-site-verification` meta tag placeholder in `index.html`'s `<head>` with your real code (or delete it if you verify via DNS TXT instead).
- [ ] Create a real 1200×630 `og-image.png` (referenced in Open Graph tags) — none is bundled yet.

## 5. What was intentionally left out (needs your account or a decision)

- **Personal/automatic email alerts** — GitHub Pages has no backend or database to manage subscriber emails, consent and unsubscribe. This needs a separate email provider if you want it.
- **True push notifications when the browser is fully closed** — the current browser notifications only fire while the tab is open. Real "closed-browser" push needs a push service + subscription storage + backend, which is a materially bigger build than a static site.
- **Telegram bot/channel activation** — the automation is built and ready (Section 2); actually creating the bot/channel and adding the two secrets is a decision + a few clicks only you can make.
- **AdSense or any ad-network code** — not inserted anywhere, because no publisher ID exists yet. The four ad-slot placeholders in `index.html` are positioned and sized correctly for when you have one.
- **Affiliate links** — still point to each dealer's plain homepage until each program approves your application.
- **Publisher identity, canonical URL, business email** — canonical URLs are now filled in with `goldalert.org` throughout; publisher legal name and business email are still placeholders only you can fill in responsibly.
- **Formal two-source price verification** — TradingView drives the visual charts; Stooq/CoinGecko drive the daily signal calculation. There's no automated process comparing every close against a second independent vendor and holding back publication on a mismatch. Worth adding if this becomes a paid/decision-critical product.
- **Legal review for target countries** — the policy pages are a solid operational template, not a substitute for a lawyer familiar with your target markets.
- **Full multi-language SEO** (separate URLs per language, `hreflang` tags) — the 6-language in-page switcher works fully client-side; search engines will still generally only index the English version of each page. Worth revisiting once traffic justifies translated content pages.

## 6. Advertising placements

The homepage contains four responsive ad-slot placeholders, including two between the chart sections. Replace only the inner placeholder content once an approved ad network supplies its code — keep the reserved container height so the layout doesn't shift when real ads load. At launch, consider activating no more than two placements at once and compare viewability against bounce rate before enabling every slot.

## 7. Package contents

```
dist/                     — the site itself; this is what gets published to GitHub Pages
  index.html              — the simulator (charts, signal board, ratios, comparison, watchlist, notifications, FAQ)
  about.html, contact.html, privacy.html, terms.html, methodology.html
  articles.html           — auto-generated article index (reads articles/articles.json)
  articles/               — individual article pages + articles.json + TEMPLATE.html
  icons/                  — logo.svg (source) and all PWA/favicon sizes derived from it
  data/                   — populated by the update-signals workflow; empty until first run
  manifest.webmanifest, sw.js — PWA install support and offline app-shell caching
  robots.txt, sitemap.xml, llms.txt, ads.txt, CNAME
.github/workflows/        — update-signals.yml (data + Telegram) and deploy-pages.yml (publish)
scripts/update-signals.mjs — the Node script the update-signals workflow runs
IMPLEMENTATION_REPORT.md  — running changelog across revisions
```
