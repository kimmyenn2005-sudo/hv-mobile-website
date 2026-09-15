import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderBlogIndex, renderPost } from "./render.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");
const POSTS = join(ROOT, "content", "posts");
const SITE_URL = String(process.env.SITE_URL || "https://hvmobile.netlify.app").replace(/\/+$/, "");
const CMS_REPO = String(process.env.CMS_REPO || "kimmyenn2005-sudo/hv-mobile-website").trim();

if (OUT !== join(ROOT, "dist")) throw new Error("Đường dẫn thư mục xuất bản không hợp lệ.");
await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const staticEntries = [
  "index.html", "iphone", "phu-kien", "bao-hanh", "tra-gop", "thu-cu", "sua-chua", "lien-he", "gioi-thieu",
  "assets", "favicon.ico", "favicon.png", "hv-mobile-google-192.png", "google1e0b702130489067.html", "robots.txt", "_redirects",
  "SEO-TU-KHOA-DA-CHEN.txt", "HUONG-DAN.txt", "admin/index.html"
];

for (const entry of staticEntries) {
  const source = join(ROOT, entry);
  const destination = join(OUT, entry);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true, force: true });
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Không tìm thấy vị trí cập nhật ${label}.`);
  return source.replace(pattern, replacement);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(join(ROOT, relativePath), "utf8"));
}


function formattedUpdatedDate(value) {
  const parts = String(value || "").slice(0, 10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value || "");
}
function addUpdatedBadge(html, value, marker) {
  const badge = `<div class="hv-managed-update" style="margin:10px 0 16px;text-align:center;font:700 13px/1.4 Arial,Helvetica,sans-serif;color:#8a7a4a">Cập nhật gần nhất: ${formattedUpdatedDate(value)}</div>`;
  return html.includes(marker) ? html.replace(marker, marker + badge) : html;
}

async function rewriteOutput(relativePath, update) {
  const target = join(OUT, relativePath);
  const source = await readFile(target, "utf8");
  await writeFile(target, update(source), "utf8");
}

const iphonePrices = await readJson("content/prices/iphone.json");
const managedIphones = iphonePrices.models
  .filter(phone => phone.visible !== false)
  .map(phone => ({
    name: phone.name,
    slug: phone.slug,
    search: phone.search,
    in_stock: phone.in_stock !== false,
    note: String(phone.note || ""),
    colors: Array.isArray(phone.colors) ? phone.colors : [],
    rows: phone.rows.map(row => [row.storage, row.price_95, row.price_99, row.price_like_new])
  }));
await rewriteOutput("iphone/index.html", source => {
  let html = replaceRequired(
    source,
    /const hvPhones = \[[\s\S]*?\];\s*\nconst HV_SPECS/,
    `const hvPhones = ${JSON.stringify(managedIphones)};\nconst HV_IPHONE_UPDATED = ${JSON.stringify(iphonePrices.updated_at || "")};\nconst HV_SPECS`,
    "bảng giá iPhone"
  );
  html = html.replace(
    /<\/script><style>\s*\.hv-detail-overlay\{position:relative[\s\S]*?<\/script><\/main>/,
    "</script>"
  );
  html = html.replace('Cập nhật gần nhất: --/--/----', `Cập nhật gần nhất: ${formattedUpdatedDate(iphonePrices.updated_at)}`);
  html = html.replace(
    /renderHVPhones\(hvPhones\);const search=/,
    `(() => {
      const formatDate = value => { const p=String(value||'').slice(0,10).split('-'); return p.length===3 ? p.reverse().join('/') : value; };
      const updated=document.getElementById('hvIphoneUpdated'); if(updated) updated.textContent='Cập nhật gần nhất: '+formatDate(HV_IPHONE_UPDATED);
      const originalRender=renderHVPhones;
      renderHVPhones=function(list){
        originalRender(list);
        document.querySelectorAll('.hv-phone-card').forEach((card,index)=>{
          const phone=list[index]; if(!phone)return;
          if(phone.in_stock===false){card.classList.add('hv-out-stock'); const title=card.querySelector('.hv-phone-title'); if(title) title.insertAdjacentHTML('beforeend','<span class="hv-stock-label out">TẠM HẾT HÀNG</span>');}
          else { const title=card.querySelector('.hv-phone-title'); if(title) title.insertAdjacentHTML('beforeend','<span class="hv-stock-label">CÒN HÀNG</span>'); }
        });
      };
      const originalOpen=openHVDetail;
      openHVDetail=function(name){
        originalOpen(name);
        const phone=hvPhones.find(p=>p.name===name); if(!phone)return;
        const lead=document.getElementById('hvDetailLead');
        if(lead && phone.note) lead.textContent += ' '+phone.note;
        const spec=HV_SPECS[name];
        if(spec && Array.isArray(phone.colors) && phone.colors.length) renderColorChoices(phone,{...spec,colors:phone.colors.map(c=>({name:c.name,hex:c.hex||'#d9d9d9'}))});
        const live=document.getElementById('hvLivePrice'); if(live && phone.in_stock===false) live.textContent='Tạm hết hàng';
      };
    })();
    renderHVPhones(hvPhones);const search=`
  );
  return html;
});

const tradeinPrices = await readJson("content/prices/tradein.json");
const managedTradeins = tradeinPrices.models
  .filter(phone => phone.visible !== false)
  .map(phone => ({ name: phone.name, search: phone.search, rows: phone.rows.map(row => [row.storage, row.price]) }));
await rewriteOutput("thu-cu/index.html", source => {
  let html = replaceRequired(
    source,
    /const hvTradeinPhones = \[[\s\S]*?\];\s*\n\s*const grid/,
    `const hvTradeinPhones = ${JSON.stringify(managedTradeins)};\n\nconst grid`,
    "bảng giá thu cũ"
  );
  html = addUpdatedBadge(html, tradeinPrices.updated_at, "<h1>BẢNG GIÁ THU CŨ IPHONE</h1>");
  return html;
});

const accessoryPrices = await readJson("content/prices/accessories.json");
await rewriteOutput("phu-kien/index.html", source => {
  const productMatch = source.match(/const PRODUCTS = (\[[\s\S]*?\]);\s*\nlet currentFilter/);
  if (!productMatch) throw new Error("Không tìm thấy vị trí cập nhật bảng giá phụ kiện.");
  const managedById = new Map(accessoryPrices.products.map(product => [product.id, product]));
  const products = JSON.parse(productMatch[1])
    .filter(product => managedById.get(product.id)?.visible !== false)
    .map(product => {
      const managed = managedById.get(product.id);
      return managed ? { ...product, price: managed.price, status2: managed.status } : product;
    });
  let html = source.replace(productMatch[0], `const PRODUCTS = ${JSON.stringify(products)};\nlet currentFilter`);
  html = addUpdatedBadge(html, accessoryPrices.updated_at, "<h2 id=\"products\">Danh mục và giá bán</h2>");
  return html;
});

const repairPrices = await readJson("content/prices/repairs.json");
const repairRows = repairPrices.services
  .filter(service => service.visible !== false)
  .map(service => `<tr data-model="${escapeHtml(service.search)}">\n<td>${escapeHtml(service.model)}</td><td>${escapeHtml(service.battery)}</td><td>${escapeHtml(service.screen)}</td><td>${escapeHtml(service.face_id)}</td><td>${escapeHtml(service.back)}</td><td>${escapeHtml(service.frame)}</td>\n</tr>`)
  .join("\n");
await rewriteOutput("sua-chua/index.html", source => {
  let html = replaceRequired(
    source,
    /<tbody id="priceBody">[\s\S]*?<\/tbody>/,
    `<tbody id="priceBody">${repairRows}</tbody>`,
    "bảng giá sửa chữa"
  );
  const repairHeading = '<h2>Giá tham khảo theo từng dòng máy</h2>';
  html = addUpdatedBadge(html, repairPrices.updated_at, repairHeading);
  return html;
});

function unquote(value) {
  const text = String(value).trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    try { return JSON.parse(text); } catch { return text.slice(1, -1); }
  }
  if (text.startsWith("'") && text.endsWith("'")) return text.slice(1, -1).replaceAll("''", "'");
  if (text === "true") return true;
  if (text === "false") return false;
  return text;
}

function parsePost(source, filename) {
  const normalized = source.replace(/\r\n?/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: thiếu phần thông tin đầu bài.`);
  const data = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (field) data[field[1]] = unquote(field[2]);
  }
  const slug = filename.replace(extname(filename), "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!data.title || !data.description || !data.date) throw new Error(`${filename}: cần có title, description và date.`);
  return { title: String(data.title), description: String(data.description), date: String(data.date).slice(0, 10), image: String(data.image || ""), category: String(data.category || "Tin HV Mobile"), author: String(data.author || "HV Mobile"), draft: data.draft === true, slug, body: match[2].trim() };
}

const postFiles = (await readdir(POSTS)).filter(name => name.endsWith(".md")).sort();
const allPosts = [];
for (const filename of postFiles) allPosts.push(parsePost(await readFile(join(POSTS, filename), "utf8"), filename));
const posts = allPosts.filter(post => !post.draft).sort((a, b) => b.date.localeCompare(a.date));

await mkdir(join(OUT, "bai-viet"), { recursive: true });
await writeFile(join(OUT, "bai-viet", "index.html"), renderBlogIndex(posts, SITE_URL), "utf8");
for (const post of posts) {
  const target = join(OUT, "bai-viet", post.slug);
  await mkdir(target, { recursive: true });
  await writeFile(join(target, "index.html"), renderPost(post, SITE_URL), "utf8");
}

/*
 * Bản xem thử trực tiếp bằng file:// trên Windows.
 * Trước đây blog chỉ được sinh vào dist/, khiến người dùng mở
 * bai-viet/index.html ở thư mục gốc gặp ERR_FILE_NOT_FOUND.
 * Giữ bản deploy trong dist/ với URL tuyệt đối, đồng thời sinh thêm
 * bản preview ở thư mục gốc với đường dẫn tương đối để double-click được.
 */
function toLocalPreviewHtml(html, depth = 1) {
  const prefix = "../".repeat(depth);
  return html
    .replaceAll('href="/', `href="${prefix}`)
    .replaceAll('src="/', `src="${prefix}`);
}

const rootBlog = join(ROOT, "bai-viet");
await rm(rootBlog, { recursive: true, force: true });
await mkdir(rootBlog, { recursive: true });
await writeFile(
  join(rootBlog, "index.html"),
  toLocalPreviewHtml(renderBlogIndex(posts, SITE_URL), 1),
  "utf8"
);
for (const post of posts) {
  const target = join(rootBlog, post.slug);
  await mkdir(target, { recursive: true });
  await writeFile(
    join(target, "index.html"),
    toLocalPreviewHtml(renderPost(post, SITE_URL), 2),
    "utf8"
  );
}

const today = new Date().toISOString().slice(0, 10);
const staticUrls = ["/", "/iphone/", "/phu-kien/", "/bao-hanh/", "/tra-gop/", "/thu-cu/", "/sua-chua/", "/lien-he/", "/bai-viet/"];
const sitemapUrls = [
  ...staticUrls.map(path => ({ path, lastmod: today })),
  ...posts.map(post => ({ path: `/bai-viet/${post.slug}/`, lastmod: post.date }))
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map(item => `  <url><loc>${SITE_URL}${item.path}</loc><lastmod>${item.lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`;
await writeFile(join(OUT, "sitemap.xml"), sitemap, "utf8");

const configTemplate = await readFile(join(ROOT, "admin", "config.template.yml"), "utf8");
const adminConfig = configTemplate.replaceAll("__CMS_REPO__", CMS_REPO).replaceAll("__SITE_URL__", SITE_URL);
await writeFile(join(OUT, "admin", "config.yml"), adminConfig, "utf8");
/* Có thêm config.yml ở thư mục gốc để /admin/ không báo thiếu file khi xem bản source. */
await writeFile(join(ROOT, "admin", "config.yml"), adminConfig, "utf8");

const feedItems = posts.slice(0, 20).map(post => `<item><title>${post.title.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</title><link>${SITE_URL}/bai-viet/${post.slug}/</link><guid>${SITE_URL}/bai-viet/${post.slug}/</guid><pubDate>${new Date(`${post.date}T00:00:00+07:00`).toUTCString()}</pubDate><description>${post.description.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</description></item>`).join("");
await writeFile(join(OUT, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>HV Mobile</title><link>${SITE_URL}/bai-viet/</link><description>Bài viết mới từ HV Mobile</description>${feedItems}</channel></rss>`, "utf8");

// Đồng bộ bản BÀI VIẾT đã render về thư mục gốc để người dùng có thể giải nén và mở trực tiếp bằng file://.
await rm(join(ROOT, "bai-viet"), { recursive: true, force: true });
await cp(join(OUT, "bai-viet"), join(ROOT, "bai-viet"), { recursive: true, force: true });

console.log(`Đã tạo website: ${posts.length} bài đang hiển thị, ${allPosts.length - posts.length} bài nháp.`);
if (CMS_REPO.startsWith("CHUA-CAU-HINH/")) console.warn("Chưa đặt CMS_REPO. Trang công khai vẫn hoạt động nhưng /admin/ chưa thể đăng nhập.");
