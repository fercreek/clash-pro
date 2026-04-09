import { useState } from 'react'
import { ChevronLeft, BookOpen, Star, ArrowRight } from 'lucide-react'
import { POSTS } from '../content/blog/index.js'

const CATEGORY_LABELS = {
  'conocimiento': 'Conocimiento',
  'buenas-practicas': 'Buenas Prácticas',
}

const CATEGORY_COLORS = {
  'conocimiento': 'bg-red-500/15 text-red-400 border-red-500/30',
  'buenas-practicas': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

export default function BlogScreen({ filter = null, onPostClick, onBack }) {
  const [activeFilter, setActiveFilter] = useState(filter)

  const filtered = activeFilter
    ? POSTS.filter((p) => p.category === activeFilter)
    : POSTS

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
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-red-500" />
            <h1 className="text-base font-black">
              {activeFilter ? CATEGORY_LABELS[activeFilter] : 'Aprender Salsa'}
            </h1>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 px-4 pb-3">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
              !activeFilter
                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'
            }`}
          >
            Todo
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                activeFilter === key
                  ? CATEGORY_COLORS[key]
                  : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Post list */}
      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        {filtered.map((post) => (
          <button
            key={post.slug}
            type="button"
            onClick={() => onPostClick(post.slug)}
            className="w-full text-left bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 transition-all active:scale-[0.99] group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[post.category]}`}>
                    {CATEGORY_LABELS[post.category]}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(post.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-sm font-black leading-snug text-white mb-1 group-hover:text-red-400 transition-colors">
                  {post.title}
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
              <ArrowRight size={16} className="text-zinc-700 group-hover:text-red-400 shrink-0 mt-1 transition-colors" />
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Star size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No hay artículos en esta categoría todavía.</p>
          </div>
        )}
      </div>
    </div>
  )
}
