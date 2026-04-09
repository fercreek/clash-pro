/**
 * Índice de artículos del blog.
 * Para agregar un artículo: añade una entrada aquí y crea el .md correspondiente.
 * El campo `body` se importa como texto raw (import.meta.glob con { as: 'raw' }).
 */

export const POSTS = [
  {
    slug: 'reglas-salsanama',
    title: 'Reglas del Formato Salsanama',
    date: '2026-04-08',
    category: 'conocimiento',
    excerpt: '80 segundos, improvisación pura y el 80% salsero obligatorio. Todo lo que necesitas saber antes de tu primer battle.',
  },
  {
    slug: 'criterios-de-jurado',
    title: 'Cómo te Juzgan en un Torneo de Salsa',
    date: '2026-04-08',
    category: 'conocimiento',
    excerpt: 'Musicalidad 30%, Técnica 30%, Creatividad 15%, Conexión 15%. Entiende la mente del jurado antes de subir a la pista.',
  },
  {
    slug: 'improvisacion-fundamentos',
    title: 'Fundamentos de la Improvisación en Salsa',
    date: '2026-04-08',
    category: 'conocimiento',
    excerpt: 'Imitación → Inmersión → Insight → Internalización. El proceso real para improvisar con autenticidad.',
  },
  {
    slug: 'estilos-de-salsa',
    title: 'Los 4 Estilos de Salsa y Cómo Improvisar en Cada Uno',
    date: '2026-04-08',
    category: 'conocimiento',
    excerpt: 'LA, NY, Cubano, Caleño: cada estilo tiene su lenguaje. Aprende qué improvisan los mejores en cada corriente.',
  },
  {
    slug: 'la-clave',
    title: 'La Clave: El Código Rítmico de la Salsa',
    date: '2026-04-08',
    category: 'conocimiento',
    excerpt: 'El patrón de 5 golpes que estructura toda la música. Entender la clave cambia para siempre cómo escuchas y bailas.',
  },
  {
    slug: 'buenas-practicas-salsa',
    title: 'Buenas Prácticas en la Pista de Salsa',
    date: '2026-04-08',
    category: 'buenas-practicas',
    excerpt: 'Etiqueta, conexión, musicidad y respeto: lo que separa a un buen bailarín de uno memorable.',
  },
  {
    slug: 'progresion-beginner-avanzado',
    title: 'Tu Camino en la Salsa: de Principiante a Avanzado',
    date: '2026-04-08',
    category: 'conocimiento',
    excerpt: 'Línea de tiempo real con hitos claros. Saber dónde estás te ayuda a entrenar con propósito.',
  },
]

/** Carga el markdown de un artículo por slug */
const modules = import.meta.glob('./*.md', { as: 'raw' })

export async function loadPostBody(slug) {
  const path = `./${slug}.md`
  const loader = modules[path]
  if (!loader) return null
  return loader()
}
