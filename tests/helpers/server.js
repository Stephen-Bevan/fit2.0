// Minimal static file server for the docs/ site, used only by the test suite.
const http = require("http");
const fs = require("fs");
const path = require("path");

const DOCS_DIR = path.join(__dirname, "..", "..", "docs");
const PORT = 5311;
const BASE_URL = `http://localhost:${PORT}/`;

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

let server = null;

function start() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      let reqPath = decodeURIComponent(req.url.split("?")[0]);
      if (reqPath === "/") reqPath = "/index.html";
      const filePath = path.join(DOCS_DIR, reqPath);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("Not found: " + reqPath);
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.on("error", reject);
    server.listen(PORT, () => resolve());
  });
}

function stop() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });
}

function pageFiles() {
  return fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".html"));
}

module.exports = { start, stop, BASE_URL, DOCS_DIR, pageFiles };
