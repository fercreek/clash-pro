import { useEffect, useState } from 'react'
import { ChevronLeft, BookOpen, Loader2 } from 'lucide-react'
import { marked } from 'marked'
import { POSTS, loadPostBody } from '../content/blog/index.js'

// Configure marked for safe output
marked.setOptions({ breaks: true })

export default function BlogPostScreen({ slug, onBack }) {
  const [html, setHtml]       = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const post = POSTS.find((p) => p.slug === slug)

  useEffect(() => {
    setLoading(true)
    setError(false)
    loadPostBody(slug)
      .then((md) => {
        if (!md) { setError(true); return }
        setHtml(marked.parse(md))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen size={16} className="text-red-500 shrink-0" />
            <h1 className="text-sm font-black truncate">{post?.title ?? 'Artículo'}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-zinc-500" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-zinc-500 text-sm">No se pudo cargar el artículo.</p>
            <button type="button" onClick={onBack} className="mt-3 text-red-400 text-sm hover:underline">
              Volver
            </button>
          </div>
        )}

        {!loading && !error && (
          <article
            className="prose-salsa"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  )
}
