import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".xml": "application/xml; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let target = normalize(join(root, pathname));
    if (!target.startsWith(root)) throw new Error("Invalid path");
    const info = await stat(target).catch(() => null);
    if (info?.isDirectory() || pathname.endsWith("/")) target = join(target, "index.html");
    const finalInfo = await stat(target);
    if (!finalInfo.isFile()) throw new Error("Not found");
    response.writeHead(200, { "Content-Type": types[extname(target).toLowerCase()] || "application/octet-stream" });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Không tìm thấy trang.");
  }
}).listen(Number(process.env.PORT || 8080), "127.0.0.1", () => console.log(`Xem thử tại http://127.0.0.1:${process.env.PORT || 8080}`));
