// 预览用静态服务器（无依赖，Node 18+）。站点本身不需要构建。
// 支持: npm run dev -- --port 7100 --host 127.0.0.1 （或 PORT / HOST 环境变量）
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));

const args = process.argv.slice(2);
function arg(name, short) {
  const i = args.findIndex((a) => a === `--${name}` || (short && a === `-${short}`));
  return i !== -1 ? args[i + 1] : undefined;
}
const port = Number(arg("port", "p") || process.env.PORT || 7100);
const host = arg("host") || process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let path = normalize(join(root, url === "/" ? "/index-cn.html" : url));
    if (!path.startsWith(root)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (url.endsWith("/")) path = join(path, "index.html");
    const body = await readFile(path);
    res.writeHead(200, {
      "content-type": MIME[extname(path).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, host, () => {
  console.log(`portal-video preview → http://${host}:${port}/index-cn.html`);
});
