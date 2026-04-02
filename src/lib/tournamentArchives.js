import { supabase } from './supabase'

export async function saveTournamentArchive({
  userId,
  competitors,
  matches,
  roundTime,
  competitionMode,
}) {
  const { error } = await supabase.from('user_tournament_archives').insert({
    user_id: userId,
    competitors,
    matches,
    round_time: roundTime,
    competition_mode: competitionMode,
  })
  if (error) console.error('saveTournamentArchive', error)
}

export async function fetchTournamentArchives(userId, limit = 40) {
  const { data, error } = await supabase
    .from('user_tournament_archives')
    .select('id, finished_at, competitors, matches, round_time, competition_mode')
    .eq('user_id', userId)
    .order('finished_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.error('fetchTournamentArchives', error)
    return []
  }
  return data ?? []
}
