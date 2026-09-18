// ====================================================================
//  NGUỒN DUY NHẤT cho vị trí cửa hàng HV Mobile Quảng Ngãi.
//  Link bản đồ dùng ĐỊA ĐIỂM ĐÃ GHIM trên Google Maps (Place ID),
//  nên khi khách bấm sẽ mở đúng thẻ "HV Mobile Quảng Ngãi" kèm ảnh,
//  đánh giá, giờ mở cửa — không hiện toạ độ và không thể nhảy sang
//  Đức Phổ hay chi nhánh khác.
//
//  Muốn đổi sang địa điểm khác: thay QUANG_NGAI_PLACE_ID bằng Place ID
//  mới rồi chạy `npm run build`.
// ====================================================================

export const QUANG_NGAI_PLACE_ID = "ChIJkTCz6WBTaDERt37BTiZZTbM";
export const QUANG_NGAI_PLACE_NAME = "HV Mobile Quảng Ngãi";
export const QUANG_NGAI_ADDRESS = "43 Lê Thánh Tôn, phường Cẩm Thành, Quảng Ngãi";

// Toạ độ chính chủ của địa điểm đã ghim (dùng cho schema SEO).
export const QUANG_NGAI_LAT = "15.1141504";
export const QUANG_NGAI_LNG = "108.8097280";

const NAME_QUERY = "HV+Mobile+Qu%E1%BA%A3ng+Ng%C3%A3i";

export const QUANG_NGAI_MAP_URL =
  `https://www.google.com/maps/search/?api=1&query=${NAME_QUERY}&query_place_id=${QUANG_NGAI_PLACE_ID}`;
export const QUANG_NGAI_MAP_HTML = QUANG_NGAI_MAP_URL.replaceAll("&", "&amp;");

export const QUANG_NGAI_DIRECTIONS_URL =
  `https://www.google.com/maps/dir/?api=1&destination=${NAME_QUERY}&destination_place_id=${QUANG_NGAI_PLACE_ID}`;
export const QUANG_NGAI_DIRECTIONS_HTML = QUANG_NGAI_DIRECTIONS_URL.replaceAll("&", "&amp;");

const CANONICAL_BRANCH =
  `<div class="branch"><strong>HV Mobile Quảng Ngãi</strong><span>${QUANG_NGAI_ADDRESS}</span><br/>` +
  `<a class="map-btn" href="${QUANG_NGAI_MAP_HTML}" rel="noopener" target="_blank">MỞ GOOGLE MAPS</a></div>`;

const GEO_BLOCK =
  `      "geo": {\n        "@type": "GeoCoordinates",\n` +
  `        "latitude": ${QUANG_NGAI_LAT},\n        "longitude": ${QUANG_NGAI_LNG}\n      },\n`;

const OLD_GEO_RE =
  /      "geo": \{\n        "@type": "GeoCoordinates",\n        "latitude": [^\n]*\n        "longitude": [^\n]*\n      \},\n/g;

const ADDRESS_BLOCK_RE =
  /(        "streetAddress": "43 Lê Thánh Tôn, phường Cẩm Thành",\n        "addressLocality": "Quảng Ngãi",\n        "addressRegion": "Quảng Ngãi",\n        "addressCountry": "VN"\n      \},\n)/g;

/** Ép mọi liên kết bản đồ của chi nhánh Quảng Ngãi về đúng địa điểm đã ghim. */
export function syncQuangNgaiStore(html) {
  let out = html
    .replace(
      /<div class="branch"><strong>HV Mobile Quảng Ngãi<\/strong><span>[\s\S]*?<\/span><br\/><a class="map-btn" href="[^"]*" rel="noopener" target="_blank">MỞ GOOGLE MAPS<\/a><\/div>/g,
      CANONICAL_BRANCH
    )
    .replace(
      /"hasMap":\s*"https:\/\/www\.google\.com\/maps\/[^"]*(?:15\.113954|15\.1141504|43\+?L|Lê\+Thánh|L%C3%AA|HV\+Mobile)[^"]*"/g,
      `"hasMap": "${QUANG_NGAI_MAP_URL}"`
    )
    .replace(
      /href="https:\/\/www\.google\.com\/maps\/dir\/\?api=1&amp;destination=(?:15\.113954|15\.1141504|43|HV)[^"]*"/g,
      `href="${QUANG_NGAI_DIRECTIONS_HTML}"`
    );

  if (OLD_GEO_RE.test(out)) out = out.replace(OLD_GEO_RE, GEO_BLOCK);
  else out = out.replace(ADDRESS_BLOCK_RE, (m) => m + GEO_BLOCK);
  return out;
}
