const origin = process.env.PREVIEW_ORIGIN || "http://127.0.0.1:8080";
const paths = ["/", "/iphone/", "/phu-kien/", "/bao-hanh/", "/tra-gop/", "/thu-cu/", "/sua-chua/", "/lien-he/", "/gioi-thieu/", "/bai-viet/"];

function textOnly(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&copy;/gi, "©").replace(/\s+/g, " ").trim();
}

let footerText = "";
for (const path of paths) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path}: không tải được trang.`);
  const html = await response.text();
  const buttons = html.match(/class="float-zalo"/g) || [];
  if (buttons.length !== 1) throw new Error(`${path}: mã trang phải có đúng một nút Zalo.`);
  if (/(class="(?:float-box|floating|hv-floating-contact|hv-store-floating)")/.test(html)) throw new Error(`${path}: còn nhóm nút nổi cũ.`);
  const footer = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
  if (!footer) throw new Error(`${path}: thiếu footer.`);
  const currentFooterText = textOnly(footer[0]);
  if (!footerText) footerText = currentFooterText;
  if (currentFooterText !== footerText) throw new Error(`${path}: footer chưa đồng bộ nội dung.`);
}

const shell = await (await fetch(`${origin}/assets/hv-shell.js`)).text();
for (const required of ["ZALO TƯ VẤN", "position:fixed!important", "hv-zalo-pulse", "zaloButtons.forEach"]) {
  if (!shell.includes(required)) throw new Error(`Nút Zalo thiếu: ${required}`);
}

const iphone = await (await fetch(`${origin}/iphone/`)).text();
for (const required of ["onclick=\"openHVDetail(", "function openHVDetail(name)", "id=\"hvPhoneDetail\"", "id=\"hvSpecGrid\"", "id=\"hvLivePrice\""]) {
  if (!iphone.includes(required)) throw new Error(`Chi tiết iPhone thiếu: ${required}`);
}
if (iphone.includes("body.hv-showing-detail")) throw new Error("Trang iPhone còn mã cũ làm ẩn sai phần chi tiết.");

console.log(`Kiểm tra giao diện đạt: ${paths.length} trang dùng cùng footer/nút Zalo và trang iPhone có đầy đủ thao tác chi tiết.`);

const blog = await (await fetch(`${origin}/bai-viet/`)).text();
if (!blog.includes('post-card') || !blog.includes('top-iphone-ban-chay-tai-hv-mobile')) throw new Error('BÀI VIẾT chưa có bài đã xuất bản để hiển thị.');
