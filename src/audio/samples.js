const modules = import.meta.glob('./samples/*.{wav,mp3,flac}', {
  query: '?url',
  import: 'default',
  eager: true,
})

export const SAMPLE_URLS = Object.fromEntries(
  Object.entries(modules)
    .map(([p, url]) => {
      const m = p.match(/\/([^/]+)\.(wav|mp3|flac)$/)
      return m ? [m[1], url] : null
    })
    .filter(Boolean)
)
