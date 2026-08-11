/**
 * Prerenders every route to static HTML after `vite build`.
 *
 * Why: this is a client-rendered SPA, so the shipped index.html is an empty
 * <div id="root">. Search engines that run JavaScript cope, but most AI
 * crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot …) do not — they would see
 * a blank page. Rendering each route in a real browser and saving the result
 * means every crawler gets the full text.
 *
 * The browser runs with reduced motion forced on, which makes the app render
 * its static end-state: the preloader self-dismisses, scroll reveals skip their
 * opacity:0 start, Lenis and the WebGL scene stay off. Without that we would
 * bake `opacity: 0` inline styles into the markup and hide our own content.
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const POSTS_DIR = path.join(ROOT, 'src/content/posts')
const PORT = 4178

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
}

function startServer() {
  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname)
    const ext = path.extname(urlPath)
    // No extension → SPA route, fall back to the shell
    const filePath = path.join(DIST, ext ? urlPath : 'index.html')

    res.setHeader('Content-Type', MIME[ext || '.html'] ?? 'application/octet-stream')
    createReadStream(filePath)
      .on('error', () => {
        res.statusCode = 404
        res.end('not found')
      })
      .pipe(res)
  })

  return new Promise((resolve) => server.listen(PORT, () => resolve(server)))
}

// A static stand-in for the preloader overlay. The prerendered HTML paints
// before React mounts; without this the visitor would see the finished page
// flash past and then be covered by the intro animation.
const CURTAIN = `<div id="prerender-curtain" aria-hidden="true" style="position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#05060f"><p style="font-family:'Space Grotesk',Inter,system-ui,sans-serif;font-size:1.5rem;font-weight:700;letter-spacing:0.3em;color:#fff;margin:0">VRUND<span style="color:#a78bfa">.</span>PATEL</p></div>`

const CURTAIN_NOSCRIPT = `<noscript><style>#prerender-curtain{display:none!important}</style></noscript>`

async function routes() {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'))
  return [
    { url: '/', waitFor: '#contact' },
    { url: '/blog', waitFor: 'main article' },
    ...files.map((file) => ({ url: `/blog/${file.replace(/\.md$/, '')}`, waitFor: '.post-body' })),
  ]
}

const server = await startServer()

let browser
try {
  browser = await chromium.launch()
} catch (error) {
  // Never fail a deploy over this. Without prerendering the site still ships
  // its JSON-LD graph and <noscript> summary, so crawlers are not empty-handed.
  server.close()
  console.warn('\n⚠️  Prerendering skipped — could not launch Chromium.')
  console.warn('   Run `npx playwright install chromium` to enable it.')
  console.warn(`   (${error.message.split('\n')[0]})\n`)
  process.exit(0)
}

const context = await browser.newContext({
  reducedMotion: 'reduce',
  viewport: { width: 1280, height: 900 },
})

const list = await routes()
const captured = []

for (const route of list) {
  const page = await context.newPage()
  await page.goto(`http://localhost:${PORT}${route.url}`, { waitUntil: 'networkidle' })
  await page.waitForSelector(route.waitFor, { timeout: 15000 })

  let html = await page.content()

  if (route.url === '/') {
    html = html
      .replace('<div id="root">', `<div id="root">${CURTAIN}`)
      .replace('</head>', `${CURTAIN_NOSCRIPT}</head>`)
  }

  captured.push({ url: route.url, html })
  await page.close()

  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  console.log(`  prerendered ${route.url.padEnd(38)} ${String(words).padStart(6)} words`)
}

await browser.close()
server.close()

// Written only after every route is captured, so overwriting index.html can't
// change what later routes are served during the run.
for (const { url, html } of captured) {
  const outDir = url === '/' ? DIST : path.join(DIST, url)
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'index.html'), html)
}

console.log(`Prerendered ${captured.length} route(s).`)
