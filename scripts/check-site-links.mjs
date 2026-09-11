import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const dist=path.join(projectRoot,"dist");

function walk(directory){
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(directory,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

function fileForUrl(urlPath){
  const clean=urlPath.split("#")[0].split("?")[0];
  if(!clean||clean==="/") return path.join(dist,"index.html");
  const relative=clean.replace(/^\//,"");
  return clean.endsWith("/")
    ?path.join(dist,relative,"index.html")
    :path.join(dist,relative);
}

const missing=[];
const htmlFiles=walk(dist).filter(file=>file.endsWith(".html"));

for(const file of htmlFiles){
  const html=fs.readFileSync(file,"utf8");
  const pagePath="/"+path.relative(dist,file).split(path.sep).join("/");

  for(const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)){
    const reference=match[1];
    if(/^(?:https?:|mailto:|tel:|javascript:|data:)/.test(reference)||reference.includes("${")) continue;
    const resolved=new URL(reference,`https://goldalert.org${pagePath}`).pathname;
    const target=fileForUrl(resolved);
    if(!fs.existsSync(target)) missing.push({source:pagePath,reference,target});
  }
}

const marketTools=fs.readFileSync(path.join(dist,"market-tools.js"),"utf8");
for(const match of marketTools.matchAll(/path:["'](\/[^"']+)["']/g)){
  const reference=match[1];
  const target=fileForUrl(reference);
  if(!fs.existsSync(target)) missing.push({source:"/market-tools.js",reference,target});
}

const articleIndex=JSON.parse(fs.readFileSync(path.join(dist,"articles","articles.json"),"utf8"));
for(const article of articleIndex){
  if(!article.url) continue;
  const reference=new URL(article.url,"https://goldalert.org/articles.html").pathname;
  const target=fileForUrl(reference);
  if(!fs.existsSync(target)) missing.push({source:"/articles/articles.json",reference,target});
}

const sitemap=fs.readFileSync(path.join(dist,"sitemap.xml"),"utf8");
for(const match of sitemap.matchAll(/<loc>https:\/\/goldalert\.org([^<]*)<\/loc>/g)){
  const reference=match[1]||"/";
  const target=fileForUrl(reference);
  if(!fs.existsSync(target)) missing.push({source:"/sitemap.xml",reference,target});
}

const unique=[...new Map(missing.map(item=>[
  `${item.source}|${item.reference}|${item.target}`,
  item
])).values()];

if(unique.length){
  for(const item of unique){
    console.error(
      `Missing target: ${item.source} -> ${item.reference} (${path.relative(projectRoot,item.target)})`
    );
  }
  process.exit(1);
}

console.log(
  `Site link check passed: ${htmlFiles.length} HTML files, market-tool paths, article URLs and sitemap targets.`
);
