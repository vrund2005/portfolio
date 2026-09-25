/**
 * Bakes crawler-readable HTML into every route after `vite build`.
 *
 * Why this exists: the app is client-rendered, so the shipped index.html is an
 * empty <div id="root">. Search engines that execute JavaScript cope, but most
 * AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot …) do not — they would
 * see a blank page and could never answer "who is Vrund Patel".
 *
 * Why it is not a headless browser: Vercel builds on Amazon Linux, where
 * Playwright cannot install Chromium's system libraries (`apt-get` does not
 * exist), so the browser downloads but dies on launch. Generating the markup in
 * plain Node works on any host, needs no 170 MB download, and keeps builds fast.
 *
 * Safe because main.jsx uses createRoot().render(), which *replaces* whatever
 * is inside #root. The markup below is what crawlers read; visitors get React
 * a moment later. Content comes from the same data files the components use,
 * so the two cannot drift apart.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { profile } from '../src/data/profile.js'
import { skillGroups } from '../src/data/skills.js'
import { projects } from '../src/data/projects.js'
import { experience, describeMetric, formatMonth, formatPeriod } from '../src/data/experience.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const POSTS_DIR = path.join(ROOT, 'src/content/posts')
const SITE = profile.site

const esc = (value = '') =>
  String(value).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])

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
        project: data.project ?? '',
        content,
        words,
        minutes: Math.max(1, Math.round(words / 200)),
      }
    }),
  )
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date))
}

/* ---------- head ---------- */

function head({ title, description, canonical, type = 'website', jsonLd }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(description)}">`,
  ]
  if (jsonLd) {
    tags.push(`<script type="application/ld+json" data-seo="route">${JSON.stringify(jsonLd)}</script>`)
  }
  return tags.join('\n    ')
}

/**
 * Replaces the shell's own title/description/canonical/og tags with the
 * route's, so no page ships two of anything.
 */
function applyHead(shell, headHtml) {
  // [^>]* also matches newlines, so these survive the multi-line attribute
  // formatting used in index.html.
  return shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta[^>]*\bname="description"[^>]*>\s*/i, '')
    .replace(/<link[^>]*\brel="canonical"[^>]*>\s*/i, '')
    .replace(/<meta[^>]*\bproperty="og:(?:title|description|url|type)"[^>]*>\s*/gi, '')
    .replace(/<meta[^>]*\bname="twitter:(?:title|description)"[^>]*>\s*/gi, '')
    .replace('</head>', `  ${headHtml}\n  </head>`)
}

/**
 * The crawler markup below is plain semantic HTML, and it paints in the moment
 * between first byte and React mounting. This opaque cover sits over it so
 * visitors see the brand curtain instead of a flash of unstyled text; React
 * discards the whole thing when it renders. Crawlers still read the markup —
 * it is present, complete, and identical to what the page says.
 */
const CURTAIN = `<div id="prerender-curtain" aria-hidden="true" style="position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:#05060f"><p style="font-family:'Space Grotesk',Inter,system-ui,sans-serif;font-size:1.5rem;font-weight:700;letter-spacing:0.3em;color:#fff;margin:0">VRUND<span style="color:#a78bfa">.</span>PATEL</p></div>`

// Without JS the curtain would never be removed, so hide it in that case and
// let the readable markup show through.
const CURTAIN_NOSCRIPT = `<noscript><style>#prerender-curtain{display:none!important}</style></noscript>`

function injectBody(shell, bodyHtml) {
  return shell
    .replace('<div id="root"></div>', `<div id="root">${CURTAIN}${bodyHtml}</div>`)
    .replace('</head>', `${CURTAIN_NOSCRIPT}\n  </head>`)
}

/* ---------- page bodies ---------- */

const currentRole = experience
  .flatMap((company) => company.roles.map((role) => ({ ...role, company: company.company })))
  .find((role) => !role.end)

function experienceSection() {
  return experience
    .map(
      (company) => `<article>
    <h3>${esc(company.company)}</h3>
    ${company.roles
      .map((role) => {
        const lists = [
          ...(role.metrics ?? []).map(describeMetric),
          ...(role.highlights ?? []),
        ]
        return [
          `<h4>${esc(role.title)} · ${esc(role.type)} · ${formatPeriod(role.start, role.end)}</h4>`,
          role.summary ? `<p>${esc(role.summary)}</p>` : '',
          lists.length ? `<ul>\n      ${lists.map((item) => `<li>${esc(item)}</li>`).join('\n      ')}\n    </ul>` : '',
          role.stack?.length ? `<p>Tech: ${role.stack.map(esc).join(', ')}</p>` : '',
        ]
          .filter(Boolean)
          .join('\n    ')
      })
      .join('\n    ')}
  </article>`,
    )
    .join('\n  ')
}

function homeBody(posts) {
  return `
<main>
  <h1>${esc(profile.name)} — ${esc(profile.role)}</h1>
  <p>${esc(profile.summary)}</p>
  ${profile.bio.map((p) => `<p>${esc(p)}</p>`).join('\n  ')}

  <h2>About</h2>
  <ul>
    <li><strong>Role:</strong> ${esc(profile.role)}</li>
    <li><strong>Education:</strong> ${esc(profile.education)}</li>
    ${currentRole ? `<li><strong>Current role:</strong> ${esc(currentRole.title)} at ${esc(currentRole.company)} (${esc(currentRole.type.toLowerCase())}, since ${formatMonth(currentRole.start)})</li>` : ''}
    <li><strong>Availability:</strong> ${esc(profile.availability)}</li>
  </ul>

  <h2>Experience</h2>
  ${experienceSection()}

  <h2>Focus areas</h2>
  <ul>
    ${profile.focus.map((f) => `<li>${esc(f)}</li>`).join('\n    ')}
  </ul>

  <h2>Skills</h2>
  <ul>
    ${skillGroups.map((g) => `<li><strong>${esc(g.group)}:</strong> ${g.skills.map(esc).join(', ')}</li>`).join('\n    ')}
  </ul>

  <h2>Projects</h2>
  ${projects
    .map(
      (project) => `<article>
    <h3><a href="${esc(project.github)}">${esc(project.title)}</a></h3>
    <p>${esc(project.description)}</p>
    <p>Tech: ${(project.tags ?? []).map(esc).join(', ')}</p>
  </article>`,
    )
    .join('\n  ')}

  <h2>Writing</h2>
  <ul>
    ${posts
      .map(
        (post) =>
          `<li><a href="${SITE}/blog/${post.slug}">${esc(post.title)}</a> — ${esc(post.subtitle)} (${post.minutes} min read)</li>`,
      )
      .join('\n    ')}
  </ul>

  <h2>Hire me</h2>
  ${profile.hiring
    .map((offer) => `<h3>${esc(offer.tag)} — ${esc(offer.title)}</h3>\n  <p>${esc(offer.description)}</p>`)
    .join('\n  ')}

  <h2>Contact</h2>
  <ul>
    <li>Email: <a href="mailto:${profile.email}">${profile.email}</a></li>
    <li>GitHub: <a href="${profile.github}">${profile.github}</a></li>
    <li>LinkedIn: <a href="${profile.linkedin}">${profile.linkedin}</a></li>
  </ul>
</main>`
}

function blogIndexBody(posts) {
  return `
<main>
  <h1>Blog — ${esc(profile.name)}</h1>
  <p>Plain-English deep dives on the projects ${esc(profile.name)} ships: what was built, the tech behind it, and why.</p>
  ${posts
    .map(
      (post) => `<article>
    <h2><a href="${SITE}/blog/${post.slug}">${esc(post.title)}</a></h2>
    <p>${esc(post.subtitle)}</p>
    <p><time datetime="${post.date}">${post.date}</time> · ${post.minutes} min read · ${post.tags.map(esc).join(', ')}</p>
  </article>`,
    )
    .join('\n  ')}
</main>`
}

function postBody(post) {
  return `
<main>
  <article>
    <h1>${esc(post.title)}</h1>
    <p>${esc(post.subtitle)}</p>
    <p>By <a href="${SITE}/">${esc(profile.name)}</a> · <time datetime="${post.date}">${post.date}</time> · ${post.minutes} min read</p>
    <p>Topics: ${post.tags.map(esc).join(', ')}</p>
    ${marked.parse(post.content)}
    ${post.project ? `<p>Source code: <a href="${esc(post.project)}">${esc(post.project)}</a></p>` : ''}
  </article>
  <nav><a href="${SITE}/blog">All posts</a> · <a href="${SITE}/">${esc(profile.name)}</a></nav>
</main>`
}

/* ---------- build ---------- */

const shell = await readFile(path.join(DIST, 'index.html'), 'utf8')
const posts = await loadPosts()

const pages = [
  {
    url: '/',
    body: homeBody(posts),
    head: head({
      title: `${profile.name} — AI/ML Engineer | Agentic AI, Computer Vision & GenAI`,
      description: profile.metaDescription,
      canonical: `${SITE}/`,
      type: 'profile',
    }),
  },
  {
    url: '/blog',
    body: blogIndexBody(posts),
    head: head({
      title: `Blog — ${profile.name} | Agentic AI, RAG & Computer Vision Deep Dives`,
      description: `Plain-English deep dives by ${profile.name} on Agentic AI and LangGraph, RAG pipelines, MCP, computer vision and automation.`,
      canonical: `${SITE}/blog`,
    }),
  },
  ...posts.map((post) => ({
    url: `/blog/${post.slug}`,
    body: postBody(post),
    head: head({
      title: `${post.title} — ${profile.name}`,
      description: post.subtitle || `${post.title} — a deep dive by ${profile.name}.`,
      canonical: `${SITE}/blog/${post.slug}`,
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.subtitle,
        datePublished: post.date,
        dateModified: post.date,
        keywords: post.tags.join(', '),
        wordCount: post.words,
        timeRequired: `PT${post.minutes}M`,
        url: `${SITE}/blog/${post.slug}`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}` },
        author: { '@id': `${SITE}/#person` },
        publisher: { '@id': `${SITE}/#person` },
        inLanguage: 'en',
      },
    }),
  })),
]

for (const page of pages) {
  const html = injectBody(applyHead(shell, page.head), page.body)
  const outDir = page.url === '/' ? DIST : path.join(DIST, page.url)
  await mkdir(outDir, { recursive: true })
  await writeFile(path.join(outDir, 'index.html'), html)

  const words = page.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  console.log(`  ${page.url.padEnd(38)} ${String(words).padStart(6)} crawlable words`)
}

console.log(`Prerendered ${pages.length} route(s) — no browser required.`)
