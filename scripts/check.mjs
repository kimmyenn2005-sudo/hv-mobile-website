import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist");
const required = ["index.html", "iphone/index.html", "phu-kien/index.html", "bao-hanh/index.html", "tra-gop/index.html", "thu-cu/index.html", "sua-chua/index.html", "lien-he/index.html", "bai-viet/index.html", "admin/index.html", "admin/config.yml", "sitemap.xml"];
for (const file of required) await access(join(out, file));
const sitemap = await readFile(join(out, "sitemap.xml"), "utf8");
if (!sitemap.includes("/bai-viet/")) throw new Error("Sitemap chưa có mục bài viết.");
const pages = (await readdir(out, { recursive: true })).filter(name => name.endsWith("index.html"));
for (const page of pages) {
  const html = await readFile(join(out, page), "utf8");
  if (!html.includes("hv-mobile-google-192.png") && !page.startsWith("admin") && page !== "gioi-thieu/index.html") throw new Error(`${page}: thiếu favicon Google mới.`);
}
console.log(`Kiểm tra đạt: ${required.length} tệp bắt buộc và ${pages.length} trang HTML.`);
