/**
 * Serve ./out exactly the way GitHub Pages will — under /biolane-basket/.
 *
 *     GITHUB_PAGES=true npm run build && node scripts/serve-pages.mjs
 *     → http://localhost:3100/biolane-basket/
 *
 * Catches basePath mistakes (missing images, bad asset URLs) before pushing.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out')
const BASE = '/biolane-basket'
const PORT = Number(process.env.PORT || 3100)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    let p = decodeURIComponent(url.pathname)

    if (p === '/' || p === BASE) {
      res.writeHead(302, { Location: BASE + '/' })
      return res.end()
    }
    if (!p.startsWith(BASE + '/')) {
      res.writeHead(404)
      return res.end('outside basePath — GitHub Pages would 404 here too: ' + p)
    }

    p = p.slice(BASE.length)
    let file = path.join(ROOT, p)
    if (p.endsWith('/')) file = path.join(file, 'index.html')

    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const nf = path.join(ROOT, '404.html')
      res.writeHead(404, { 'Content-Type': 'text/html' })
      return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'not found')
    }

    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  .listen(PORT, () => console.log(`Pages mirror → http://localhost:${PORT}${BASE}/`))
