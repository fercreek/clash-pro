const modules = import.meta.glob('./samples/*.{wav,mp3}', {
  query: '?url',
  import: 'default',
  eager: true,
})

export const SAMPLE_URLS = Object.fromEntries(
  Object.entries(modules)
    .map(([p, url]) => {
      const m = p.match(/\/([^/]+)\.(wav|mp3)$/)
      return m ? [m[1], url] : null
    })
    .filter(Boolean)
)
