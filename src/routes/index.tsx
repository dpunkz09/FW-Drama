import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from '../components/layout/Layout'

// Eagerly loaded — part of the initial shell, small components
import Home     from '../pages/Home'
import Rank     from '../pages/Rank'
import Search   from '../pages/Search'
import Category from '../pages/Category'

// Lazy-loaded — only downloaded when user navigates to /watch/:id
// This keeps hls.js (~490KB) out of the initial bundle
const Watch = lazy(() => import('../pages/Watch'))

function VideoFallback() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"         element={<Home />} />
        <Route path="/rank"     element={<Rank />} />
        <Route path="/search"   element={<Search />} />
        <Route path="/category" element={<Category />} />
      </Route>

      <Route
        path="/watch/:id"
        element={
          <Suspense fallback={<VideoFallback />}>
            <Watch />
          </Suspense>
        }
      />

      {/* Catch-all → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
