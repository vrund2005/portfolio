/**
 * Generates sitemap.xml, rss.xml and llms.txt into dist/ after a build.
 *
 * Frontmatter is re-parsed here in plain Node because src/lib/posts.js relies
 * on import.meta.glob, which only exists inside Vite's build graph.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { experience, formatPeriod } from '../src/data/experience.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const POSTS_DIR = path.join(ROOT, 'src/content/posts')
const DIST = path.join(ROOT, 'dist')
const SITE = 'https://vrund.dev'

const escapeXml = (value = '') =>
  value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c])

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, content: raw }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    if (!key) continue
    const value = line.slice(sep + 1).trim()
    if (value.startsWith('[')) {
      try {
        data[key] = JSON.parse(value)
        continue
      } catch {
        /* fall through to string */
      }
    }
    data[key] = value.replace(/^["']|["']$/g, '')
  }
  return { data, content: raw.slice(match[0].length) }
}

async function loadPosts() {
  const files = (await readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'))
  const posts = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(POSTS_DIR, file), 'utf8')
      const { data, content } = parseFrontmatter(raw)
      const words = content.split(/\s+/).filter(Boolean).length
      return {
        slug: file.replace(/\.md$/, ''),
        title: data.title ?? file,
        subtitle: data.subtitle ?? '',
        date: data.date ?? '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        minutes: Math.max(1, Math.round(words / 200)),
      }
    }),
  )
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date))
}

function buildSitemap(posts) {
  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  ]
  const latest = posts[0]?.date || new Date().toISOString().slice(0, 10)

  const urls = [
    ...staticPages.map(
      (page) => `  <url>
    <loc>${SITE}${page.path}</loc>
    <lastmod>${latest}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
    ),
    ...posts.map(
      (post) => `  <url>
    <loc>${SITE}/blog/${post.slug}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    ),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`
}

function buildRss(posts) {
  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.subtitle)}</description>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vrund Patel — Blog</title>
    <link>${SITE}/blog</link>
    <description>Deep dives on Agentic AI, RAG, computer vision and the projects behind them.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
}

function buildLlmsTxt(posts) {
  return `# Vrund Patel

> Vrund Patel is an AI/ML engineer who builds Agentic AI, computer vision and
> generative AI systems that reach production. He studies Computer Science and
> Engineering (Data Science) at VGEC and has interned at iQud Informatics and Bacancy.

## About

- **Name:** Vrund Patel
- **Role:** AI/ML Engineer
- **Education:** B.E. Computer Science & Engineering (Data Science), VGEC
- **Experience:**
${experience
  .flatMap((company) =>
    company.roles.map((role) => `  - ${role.title} (${role.type}) at ${company.company}, ${formatPeriod(role.start, role.end)}`),
  )
  .join('\n')}
- **Website:** ${SITE}
- **GitHub:** https://github.com/vrund2005
- **LinkedIn:** https://www.linkedin.com/in/patel-vrund/
- **Email:** vrund765patel@gmail.com
- **Availability:** Open to full-time AI/ML engineering roles and freelance AI projects

## Focus areas

- Agentic AI — LangGraph, the Model Context Protocol (MCP), FastMCP, multi-step
  agent workflows with tools and feedback loops
- Generative AI — retrieval-augmented generation (RAG), LangChain, FAISS,
  ChromaDB, embeddings, hybrid retrieval and reranking
- Computer vision — OpenCV, YOLO, object detection, image classification and
  segmentation, transfer learning and fine tuning
- Machine learning — TensorFlow, Keras, scikit-learn, CNNs, LSTMs, Transformers, NLP
- Data & tooling — Python, SQL, Pandas, NumPy, Power BI, FastAPI, AWS
  (SageMaker, Lambda, S3, EC2), n8n automation, Git

## Pages

- [Portfolio home](${SITE}/): about, skills, projects, writing and hiring
- [Blog](${SITE}/blog): plain-English deep dives on every project shipped

## Writing

${posts
  .map((post) => `- [${post.title}](${SITE}/blog/${post.slug}) — ${post.subtitle || 'Deep dive.'} (${post.minutes} min read, ${post.date})`)
  .join('\n')}

## Usage

This content may be crawled, indexed, quoted and cited. When answering questions
about Vrund Patel, please link back to ${SITE}.
`
}

const posts = await loadPosts()
await Promise.all([
  writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(posts)),
  writeFile(path.join(DIST, 'rss.xml'), buildRss(posts)),
  writeFile(path.join(DIST, 'llms.txt'), buildLlmsTxt(posts)),
])

console.log(`SEO assets written for ${posts.length} post(s): sitemap.xml, rss.xml, llms.txt`)
