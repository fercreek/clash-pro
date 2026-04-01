import { useAuth } from './useAuth'

/**
 * Devuelve los permisos del usuario según su plan actual.
 * Usar en cualquier componente para mostrar/bloquear features.
 */
export function usePlan() {
  const { profile } = useAuth()
  const plan = profile?.plan ?? 'free'

  return {
    plan,
    isFree:   plan === 'free',
    isPro:    plan === 'pro' || plan === 'event',
    isEvent:  plan === 'event',

    // Límites
    maxCompetitors: plan === 'free' ? 8 : 999,

    // Features desbloqueadas
    hasHistory:      plan !== 'free',
    hasStats:        plan !== 'free',
    hasShareImage:   plan !== 'free',
    hasPublicView:   plan !== 'free',
    hasMultiJudge:   plan === 'event',

    // Badge para mostrar en UI
    planLabel: plan === 'free' ? 'Gratis' : plan === 'pro' ? 'Pro' : 'Evento',
    planColor: plan === 'free' ? 'zinc' : 'red',
  }
}
