import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PRICE_DIR = join(ROOT, "content", "prices");

function capture(source, pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error(`Không đọc được ${label} từ website hiện tại.`);
  return match[1];
}

function evaluateArray(source, label) {
  return vm.runInNewContext(`(${source})`, Object.create(null), { timeout: 1000, filename: label });
}

function decodeHtml(value) {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ")
    .trim();
}

const iphoneHtml = await readFile(join(ROOT, "iphone", "index.html"), "utf8");
const iphoneList = JSON.parse(capture(iphoneHtml, /const hvPhones = (\[[\s\S]*?\]);\s*\nconst HV_SPECS/, "bảng giá iPhone"));
const iphoneData = {
  updated_at: "2026-09-15",
  models: iphoneList.map(phone => ({
    name: phone.name,
    slug: phone.slug,
    search: phone.search,
    visible: true,
    rows: phone.rows.map(([storage, price_95, price_99, price_like_new]) => ({ storage, price_95, price_99, price_like_new }))
  }))
};

const tradeinHtml = await readFile(join(ROOT, "thu-cu", "index.html"), "utf8");
const tradeinList = evaluateArray(capture(tradeinHtml, /const hvTradeinPhones = (\[[\s\S]*?\]);\s*\n\s*const grid/, "bảng giá thu cũ"), "thu-cu/index.html");
const tradeinData = {
  updated_at: "2026-09-15",
  models: tradeinList.map(phone => ({
    name: phone.name,
    search: phone.search,
    visible: true,
    rows: phone.rows.map(([storage, price]) => ({ storage, price }))
  }))
};

const accessoryHtml = await readFile(join(ROOT, "phu-kien", "index.html"), "utf8");
const accessoryList = JSON.parse(capture(accessoryHtml, /const PRODUCTS = (\[[\s\S]*?\]);\s*\nlet currentFilter/, "bảng giá phụ kiện"));
const accessoryData = {
  updated_at: "2026-09-15",
  products: accessoryList.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    status: product.status2,
    visible: true
  }))
};

const repairHtml = await readFile(join(ROOT, "sua-chua", "index.html"), "utf8");
const repairBody = capture(repairHtml, /<tbody id="priceBody">([\s\S]*?)<\/tbody>/, "bảng giá sửa chữa");
const repairRows = [...repairBody.matchAll(/<tr data-model="([^"]*)">([\s\S]*?)<\/tr>/g)].map(match => {
  const cells = [...match[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(cell => decodeHtml(cell[1]));
  if (cells.length !== 6) throw new Error(`Dòng sửa chữa ${match[1]} không đủ 6 cột.`);
  return { search: match[1], model: cells[0], battery: cells[1], screen: cells[2], face_id: cells[3], back: cells[4], frame: cells[5], visible: true };
});
const repairData = { updated_at: "2026-09-15", services: repairRows };

await mkdir(PRICE_DIR, { recursive: true });
for (const [filename, data] of [
  ["iphone.json", iphoneData],
  ["tradein.json", tradeinData],
  ["accessories.json", accessoryData],
  ["repairs.json", repairData]
]) {
  await writeFile(join(PRICE_DIR, filename), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

console.log(`Đã lấy nguyên giá hiện tại: ${iphoneData.models.length} dòng iPhone, ${tradeinData.models.length} dòng thu cũ, ${accessoryData.products.length} phụ kiện, ${repairData.services.length} dòng sửa chữa.`);
