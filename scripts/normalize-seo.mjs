import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const excluded = new Set([
  path.join(dist, "admin", "index.html"),
  path.join(dist, "widget", "index.html"),
  path.join(dist, "articles", "TEMPLATE.html"),
  path.join(dist, "6945495547fa028fc4352e5841bb5e5065415410.html"),
]);

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith(".html") ? [file] : [];
  });
}

function attr(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || "";
}

for (const file of htmlFiles(dist)) {
  if (excluded.has(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const title = attr(html, /<title>([\s\S]*?)<\/title>/i).replace(/<[^>]+>/g, "");
  const description = attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)
    || (file.endsWith("terms.html") ? "Read GoldAlert's educational-use terms, market-data limitations, external-link policy and governing-law notice." : "");
  const canonical = attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i);
  if (!title || !description || !canonical) {
    throw new Error(`Missing required SEO source field in ${path.relative(dist, file)}`);
  }

  if (!/<meta[^>]+name=["']description["']/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, match => `${match}<meta name="description" content="${description}">`);
  }
  if (!/<meta[^>]+name=["']robots["']/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, match => `${match}<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">`);
  }
  if (!/property=["']og:title["']/i.test(html)) {
    const social = `<meta property="og:type" content="website"><meta property="og:title" content="${title.replaceAll('"', '&quot;')}"><meta property="og:description" content="${description.replaceAll('"', '&quot;')}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://goldalert.org/icons/og-image.png"><meta name="twitter:card" content="summary_large_image">`;
    html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, match => `${match}${social}`);
  }
  if (file !== path.join(dist, "index.html") && !/site-observability\.js/i.test(html)) {
    const rel = path.relative(path.dirname(file), path.join(dist, "site-observability.js")).split(path.sep).join("/");
    html = html.replace(/<\/head>/i, `<script defer src="${rel}"></script></head>`);
  }
  fs.writeFileSync(file, html);
}

const urls = [];
for (const file of htmlFiles(dist)) {
  if (excluded.has(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) continue;
  const canonical = attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i);
  if (canonical) urls.push(canonical);
}
urls.sort((a, b) => a === "https://goldalert.org/" ? -1 : b === "https://goldalert.org/" ? 1 : a.localeCompare(b));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].map(url => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
console.log(`Normalized ${urls.length} indexable pages and regenerated sitemap.xml.`);
