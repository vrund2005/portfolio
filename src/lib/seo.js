export const SITE_URL = 'https://vrund.dev'
export const SITE_NAME = 'Vrund Patel'
export const AUTHOR = 'Vrund Patel'
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
export const PERSON_ID = `${SITE_URL}/#person`

/**
 * Imperative head management.
 *
 * Done by hand rather than with React 19's metadata hoisting because that
 * appends tags — index.html already ships a <title> and description, and two
 * of either is worse than none. Upserting guarantees exactly one of each.
 *
 * The prerender step runs a real browser, so whatever this writes at runtime
 * ends up baked into the static HTML that crawlers receive.
 */
function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applySeo({ title, description, path = '/', image = DEFAULT_IMAGE, type = 'website', jsonLd }) {
  const url = `${SITE_URL}${path}`

  document.title = title
  upsertMeta('name', 'description', description)
  upsertLink('canonical', url)

  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:type', type)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:site_name', SITE_NAME)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)

  // Route-scoped structured data; the site-wide graph stays in index.html
  const existing = document.head.querySelector('script[data-seo="route"]')
  if (existing) existing.remove()
  if (jsonLd) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seo = 'route'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
  }
}

export function articleJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${SITE_URL}/blog/${post.slug}#article`,
    headline: post.title,
    description: post.subtitle,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: 'en',
    keywords: post.tags.join(', '),
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${post.minutes}M`,
    url: `${SITE_URL}/blog/${post.slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
    image: DEFAULT_IMAGE,
    isPartOf: { '@type': 'Blog', '@id': `${SITE_URL}/blog#blog`, name: `${SITE_NAME} — Blog` },
  }
}

export function breadcrumbJsonLd(trail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}
