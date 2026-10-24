import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const QUEUE_FILE = path.join(ROOT, "scheduled", "articles", "manifest.json");
const ARTICLE_INDEX = path.join(ROOT, "dist", "articles", "articles.json");
const SITEMAP = path.join(ROOT, "dist", "sitemap.xml");
const HOST = "https://goldalert.org";

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const queue = await readJson(QUEUE_FILE);
const now = new Date();

const next = queue
  .filter((item) => item.status === "pending" && new Date(item.scheduledAt) <= now)
  .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

if (!next) {
  console.log(`No scheduled article is due at ${now.toISOString()}.`);
  process.exit(0);
}

const source = path.join(ROOT, "scheduled", "articles", `${next.slug}.html`);
const destination = path.join(ROOT, "dist", "articles", `${next.slug}.html`);
await copyFile(source, destination);

const articles = await readJson(ARTICLE_INDEX);
if (!articles.some((article) => article.slug === next.slug)) {
  articles.unshift({
    slug: next.slug,
    title: next.title,
    category: next.category,
    excerpt: next.excerpt,
    date: next.date,
    url: `articles/${next.slug}.html`
  });
  await writeFile(ARTICLE_INDEX, `${JSON.stringify(articles, null, 2)}\n`);
}

const articleUrl = `${HOST}/articles/${next.slug}.html`;
let sitemap = await readFile(SITEMAP, "utf8");
if (!sitemap.includes(`<loc>${articleUrl}</loc>`)) {
  const entry = `  <url>\n    <loc>${articleUrl}</loc>\n    <lastmod>${next.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  sitemap = sitemap.replace("</urlset>", `${entry}</urlset>`);
  await writeFile(SITEMAP, sitemap);
}

next.status = "published";
next.publishedAt = now.toISOString();
await writeFile(QUEUE_FILE, `${JSON.stringify(queue, null, 2)}\n`);

console.log(`Published ${next.slug} (${articleUrl}).`);

