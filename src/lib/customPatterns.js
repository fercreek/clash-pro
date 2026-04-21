import { supabase } from './supabase'

export async function listPatterns() {
  const { data, error } = await supabase
    .from('custom_patterns')
    .select('id, name, bpm, pattern, created_at, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function savePattern({ id, name, bpm, pattern }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No hay sesión activa')

  if (id) {
    const { data, error } = await supabase
      .from('custom_patterns')
      .update({ name, bpm, pattern, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    return data
  }
  const { data, error } = await supabase
    .from('custom_patterns')
    .insert({ user_id: user.id, name, bpm, pattern })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePattern(id) {
  const { error } = await supabase.from('custom_patterns').delete().eq('id', id)
  if (error) throw error
}
