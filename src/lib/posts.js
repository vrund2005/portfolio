// Markdown-driven blog content pipeline.
// Every .md file in src/content/posts becomes a post — its filename is the URL slug.
// Frontmatter (between the opening `---` fences) carries the metadata:
//
//   ---
//   title: My post title
//   subtitle: One-line teaser shown under the title
//   date: 2026-08-06
//   tags: ["Agentic AI", "LangGraph"]
//   project: https://github.com/vrund2005/repo   (optional)
//   ---
//
// Publishing a post = drop a file here + git push. No CMS, no backend.

const modules = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function parseValue(raw) {
  const value = raw.trim()
  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value.replace(/^["']|["']$/g, '')
}

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, content: raw }

  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    const key = line.slice(0, separator).trim()
    if (key) data[key] = parseValue(line.slice(separator + 1))
  }

  return { data, content: raw.slice(match[0].length) }
}

function readingTime(content) {
  const words = content.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

export const posts = Object.entries(modules)
  .map(([path, raw]) => {
    const slug = path.split('/').pop().replace(/\.md$/, '')
    const { data, content } = parseFrontmatter(raw)
    return {
      slug,
      title: data.title ?? slug,
      subtitle: data.subtitle ?? '',
      date: data.date ?? '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      project: data.project ?? '',
      // Optional `art:` picks the cover animation; blank falls back to tags
      art: data.art ?? '',
      // Optional `accent:` picks the cover colour; blank hashes from the slug
      accentName: data.accent ?? '',
      content,
      minutes: readingTime(content),
    }
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date))

export const getPost = (slug) => posts.find((post) => post.slug === slug)

// Cover colours. A post picks one with `accent: <name>` in its frontmatter;
// without that it gets a stable colour hashed from its slug, so posts differ
// from each other without anyone having to choose.
export const ACCENTS = {
  violet: { bar: 'from-violet-500 via-indigo-400 to-cyan-300', orb: 'bg-violet-500/25', chip: 'text-violet-200', c1: '#a78bfa', c2: '#22d3ee' },
  amber: { bar: 'from-amber-400 via-orange-400 to-rose-400', orb: 'bg-amber-500/20', chip: 'text-amber-200', c1: '#fbbf24', c2: '#fb7185' },
  emerald: { bar: 'from-emerald-400 via-teal-300 to-cyan-300', orb: 'bg-emerald-500/20', chip: 'text-emerald-200', c1: '#34d399', c2: '#22d3ee' },
  fuchsia: { bar: 'from-fuchsia-500 via-pink-400 to-violet-400', orb: 'bg-fuchsia-500/20', chip: 'text-fuchsia-200', c1: '#e879f9', c2: '#a78bfa' },
  sky: { bar: 'from-sky-400 via-blue-400 to-indigo-400', orb: 'bg-sky-500/20', chip: 'text-sky-200', c1: '#38bdf8', c2: '#818cf8' },
}

const ACCENT_NAMES = Object.keys(ACCENTS)

export function accentFor(slug, name) {
  if (name && ACCENTS[name]) return ACCENTS[name]
  let hash = 0
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  return ACCENTS[ACCENT_NAMES[hash % ACCENT_NAMES.length]]
}

// Turns a heading into a URL-safe anchor id — must stay in sync with the
// heading ids rendered in BlogPost, since the table of contents links to them.
export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Pulls h2/h3 headings out of markdown for the table of contents,
// skipping anything inside fenced code blocks.
export function extractHeadings(content) {
  const headings = []
  let inFence = false

  for (const line of content.split('\n')) {
    if (/^(```|~~~)/.test(line.trim())) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{2,3})\s+(.*)/.exec(line)
    if (!match) continue

    const text = match[2]
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → their label
      .replace(/[*_`]/g, '')
      .trim()
    headings.push({ level: match[1].length, text, id: slugify(text) })
  }

  return headings
}

export function formatDate(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
