export const LEVEL_LABELS = {
  beginner:     'Principiante',
  intermediate: 'Intermedio',
  advanced:     'Avanzado',
}

export const LEVEL_COLORS = {
  beginner:     'bg-green-500/15 text-green-400 border-green-500/30',
  intermediate: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  advanced:     'bg-red-500/15 text-red-400 border-red-500/30',
}

export const BLOCK_TYPE_COLORS = {
  warmup: 'text-blue-400',
  drill:  'text-orange-400',
  free:   'text-green-400',
  rest:   'text-zinc-400',
}

export const ROUTINES = [
  {
    id: 'basico-30',
    title: 'Sesión Básica — 30 min',
    level: 'beginner',
    duration: 30,
    description: 'Ideal para construir los cimientos del paso básico, postura y movimiento de cadera.',
    blocks: [
      {
        name: 'Calentamiento',
        duration: 5 * 60,
        type: 'warmup',
        instructions: 'Caminata salsa lenta (sin música). Rotaciones de cadera y hombros. Estiramiento de tobillos y pantorrillas. Respira profundo — prepara tu cuerpo y tu mente.',
      },
      {
        name: 'Paso básico',
        duration: 10 * 60,
        type: 'drill',
        instructions: 'Practica el paso básico frente a un espejo. Enfócate en: transferencia de peso limpia, rodillas ligeramente dobladas, caderas moviéndose naturalmente con cada paso. Cuenta en voz alta: 1-2-3, 5-6-7.',
      },
      {
        name: 'Shines básicos',
        duration: 10 * 60,
        type: 'drill',
        instructions: 'Alterna entre: Suzy Q (8 tiempos), lateral básico (8 tiempos), grapevine hacia adelante y atrás. Repite cada elemento 4 veces antes de pasar al siguiente. Mantén el ritmo consistente.',
      },
      {
        name: 'Baile libre',
        duration: 5 * 60,
        type: 'free',
        instructions: 'Pon música salsa que te guste. Baila sin pensar — solo muévete. Usa lo que acabas de practicar, pero sin presión. Este tiempo es para disfrutar y escuchar la música.',
      },
    ],
  },
  {
    id: 'musicalidad-20',
    title: 'Musicalidad — 20 min',
    level: 'intermediate',
    duration: 20,
    description: 'Entrena tu oído para los 4 ritmos de la salsa y aprende a responder a los cambios musicales.',
    blocks: [
      {
        name: 'Escucha activa',
        duration: 5 * 60,
        type: 'warmup',
        instructions: 'Siéntate o párate quieto. Pon una canción de salsa que no conozcas bien. Primera vuelta: solo escucha el bajo. Segunda vuelta: solo escucha la clave. Tercera vuelta: solo escucha el piano. Identifica cuándo entra el montuno.',
      },
      {
        name: 'Los 4 ritmos — Básico y Acorde',
        duration: 7 * 60,
        type: 'drill',
        instructions: 'Con música: practica el ritmo básico (1-2-3, 5-6-7) durante 32 tiempos. Luego cambia al ritmo de acorde (1-3-5-7, solo tiempos fuertes). Alterna entre los dos cada 16 tiempos. Siente la diferencia de energía.',
      },
      {
        name: 'Contraste musical',
        duration: 5 * 60,
        type: 'drill',
        instructions: 'Baila respondiendo a la energía de la canción: cuando la música es tranquila → pasos simples y movimiento suave. Cuando sube la energía (montuno, mambo) → más pasos, más expresión. Deja que la música te diga qué hacer.',
      },
      {
        name: 'Improvisación musical libre',
        duration: 3 * 60,
        type: 'free',
        instructions: 'Baila con una canción desconocida. Objetivo: que tu movimiento cambie cada vez que cambia la música. No planees — reacciona. 80 segundos de presión como en un battle real.',
      },
    ],
  },
  {
    id: 'improvisacion-25',
    title: 'Improvisación — 25 min',
    level: 'advanced',
    duration: 25,
    description: 'Desarrolla vocabulario de shines, respuesta musical y el mindset de la improvisación real.',
    blocks: [
      {
        name: 'Activación corporal',
        duration: 5 * 60,
        type: 'warmup',
        instructions: 'Aislamientos: mueve solo las caderas (30 seg), solo el torso (30 seg), solo los hombros (30 seg). Luego combínalos. Practica giros simples (4 con mano izquierda, 4 con mano derecha). Lleva el ritmo con los pies todo el tiempo.',
      },
      {
        name: 'Vocabulario de shines',
        duration: 8 * 60,
        type: 'drill',
        instructions: 'Practica en frases de 8 tiempos: 1) Suzy Q → 2) Cross-body shine → 3) Grapevine → 4) Freeze creativo (para y mantén una posición 4 tiempos) → 5) Freestyle 8 tiempos. Repite la secuencia completa 4 veces.',
      },
      {
        name: 'Prohibición de moves favoritos',
        duration: 7 * 60,
        type: 'drill',
        instructions: 'Baila 7 minutos sin usar tus 3 moves favoritos. Esto fuerza respuestas nuevas y expande tu vocabulario. Si te quedas "en blanco", vuelve al paso básico y escucha la música — siempre hay algo que decir.',
      },
      {
        name: 'Simulacro de battle (80 seg)',
        duration: 3 * 60,
        type: 'free',
        instructions: 'Pon shuffle en música que no conozcas. Cuando empiece: 80 segundos de battle real. Sin parar. Sin repetir el mismo shine más de 2 veces. Recuerda: básico obligatorio cada 40 segundos. Después analiza: ¿qué funcionó?',
      },
      {
        name: 'Enfriamiento y reflexión',
        duration: 2 * 60,
        type: 'rest',
        instructions: 'Estira cuádriceps, pantorrillas y espalda baja. Piensa: ¿qué quiero trabajar en la próxima sesión? ¿Qué músculo musical siento más débil hoy? Anota o memoriza una sola cosa a mejorar.',
      },
    ],
  },
  {
    id: 'footwork-20',
    title: 'Footwork Intensivo — 20 min',
    level: 'intermediate',
    duration: 20,
    description: 'Sesión enfocada en la limpieza, velocidad y complejidad del trabajo de pies.',
    blocks: [
      {
        name: 'Warm-up de pies',
        duration: 4 * 60,
        type: 'warmup',
        instructions: 'Marcha en el lugar manteniendo el tiempo. Alternativa: step tap básico (un pie toca, regresa). Velocidad lenta primero, luego acelera gradualmente. Asegúrate de que tus tobillos están calientes antes de empezar.',
      },
      {
        name: 'Patrones rítmicos',
        duration: 8 * 60,
        type: 'drill',
        instructions: 'Practica los 4 ritmos con solo los pies (sin mover brazos): básico → acorde → tiempo completo (un paso por beat) → síncopas. Cada ritmo 2 minutos. Usa un metrónomo o el ritmo del app a 80-100 BPM.',
      },
      {
        name: 'Velocidad progresiva',
        duration: 5 * 60,
        type: 'drill',
        instructions: 'Toma tu shine favorito y practícalo a 3 velocidades: lento (70 BPM), normal (100 BPM), rápido (130 BPM+). La lentitud revela errores que la velocidad esconde. Busca la misma limpieza en los 3 tempos.',
      },
      {
        name: 'Jam de footwork',
        duration: 3 * 60,
        type: 'free',
        instructions: 'Pon música caleña o timba (alta velocidad). 3 minutos de footwork libre — sin preocuparte por el upper body. Solo los pies. Explora, equivócate, descubre.',
      },
    ],
  },
]
