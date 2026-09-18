import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { QUANG_NGAI_ADDRESS, QUANG_NGAI_MAP_HTML, QUANG_NGAI_MAP_URL, QUANG_NGAI_PLACE_ID } from "./toa-do.mjs";

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

const badPin = /google\.com\/maps[^"']*(?:query|destination)=(?:43\+|L%C3%AA|Lê\+|15\.11)/i;
for (const page of pages) {
  const html = await readFile(join(out, page), "utf8");
  if (html.includes("HỆ THỐNG HV MOBILE")) {
    if (!html.includes(QUANG_NGAI_ADDRESS)) throw new Error(`${page}: footer Quảng Ngãi sai địa chỉ.`);
    if (!html.includes(QUANG_NGAI_MAP_HTML)) throw new Error(`${page}: link Google Maps Quảng Ngãi chưa trỏ tới địa điểm đã ghim.`);
    if (badPin.test(html)) throw new Error(`${page}: còn link tìm theo chữ hoặc theo toạ độ, Google có thể nhảy sang Đức Phổ.`);
    // Mọi liên kết bản đồ không phải Đà Nẵng đều phải mang Place ID của cửa hàng.
    for (const link of html.match(/https:\/\/www\.google\.com\/maps[^"']+/g) || []) {
      const isDaNang = /Tr%E1%BA%A7n\+Cao|Tran\+Cao|Trần\+Cao|Da\+Nang|%C4%90%C3%A0\+N%E1%BA%B5ng|649/.test(link);
      if (isDaNang) continue;
      if (!link.includes(QUANG_NGAI_PLACE_ID)) throw new Error(`${page}: còn link bản đồ chưa khoá Place ID -> ${link}`);
    }
  }
  if (/Mộ Đức|Đức Phổ/i.test(html)) throw new Error(`${page}: còn địa chỉ Quảng Ngãi cũ/sai.`);
}
// Khong duoc con dia chi Netlify cu trong ban xuat ban.
for (const page of pages) {
  const html = await readFile(join(out, page), "utf8");
  if (html.includes("hvmobile.netlify.app")) throw new Error(`${page}: còn trỏ về tên miền Netlify cũ.`);
}
const robots = await readFile(join(out, "robots.txt"), "utf8");
if (robots.includes("hvmobile.netlify.app")) throw new Error("robots.txt còn trỏ sitemap về Netlify cũ.");
const sitemapXml = await readFile(join(out, "sitemap.xml"), "utf8");
if (sitemapXml.includes("hvmobile.netlify.app")) throw new Error("sitemap.xml còn trỏ về Netlify cũ.");

const mapCheck = await readFile(join(out, "map-check.txt"), "utf8");
if (!mapCheck.includes(QUANG_NGAI_PLACE_ID)) throw new Error("map-check.txt chưa ghi đúng Place ID.");

// Footer phải hiển thị giống nhau trên mọi trang: chặn trang tự đặt .footer-inner thành grid.
const shellCss = await readFile(join(out, "assets", "hv-shell.css"), "utf8");
if (!shellCss.includes(".site-footer .footer-inner{display:block!important")) {
  throw new Error("Thiếu bản vá bố cục footer dùng chung (trang Phụ kiện sẽ bị vỡ).");
}

// Trang chủ: tiêu đề hiển thị và tiêu đề chia sẻ phải khớp nhau.
const HOME_TITLE = "HV Mobile | iPhone cũ giá rẻ Quảng Ngãi";
const home = await readFile(join(out, "index.html"), "utf8");
if (!home.includes(`<title>${HOME_TITLE}</title>`)) throw new Error("Title trang chủ chưa đúng.");
if (!home.includes(`content="${HOME_TITLE}" property="og:title"`)) throw new Error("og:title trang chủ chưa đúng.");
const adminConfig = await readFile(join(out, "admin/config.yml"), "utf8");
for (const field of ["image", "images", "year", "display", "chip", "camera", "body", "port", "protection", "highlight", "colors", "rows"]) {
  if (!adminConfig.includes(`name: "${field}"`)) throw new Error(`CMS iPhone thiếu trường chi tiết: ${field}`);
}
if (!/name: "models"[\s\S]*?allow_add: true/.test(adminConfig)) throw new Error("CMS iPhone chưa bật quyền thêm sản phẩm mới.");
if (!adminConfig.includes('label_singular: "Sản phẩm iPhone mới"')) throw new Error("CMS iPhone thiếu nhãn nút thêm sản phẩm.");
const adminHtml = await readFile(join(out, "admin/index.html"), "utf8");
if (!adminHtml.includes("hvCmsNavFixed")) throw new Error("CMS chưa có bản sửa thanh Nội dung / Tập tin che form.");

console.log(`Kiểm tra đạt: ${required.length} tệp bắt buộc và ${pages.length} trang HTML.`);
console.log(`Ghim Quảng Ngãi đã khoá: ${QUANG_NGAI_MAP_URL}`);
