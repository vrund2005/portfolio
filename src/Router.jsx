import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'
import NotFound from './404.jsx'

// Blog routes are lazy-loaded so the markdown pipeline never weighs down the home page
const Blog = lazy(() => import('./pages/Blog.jsx'))
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Router() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-ink" />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {/* Outside <Routes> so page views are tracked on every route, not just "/" */}
      <Analytics />
    </BrowserRouter>
  )
}

export default Router
