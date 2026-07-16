import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en las variables de entorno')
}

export const supabase = createClient<Database>(supabaseUrl ?? '', supabaseKey ?? '')

/** Dominio interno: los usuarios entran con username simple, por dentro es un correo */
export const DOMINIO_INTERNO = '@platinumbrands.com'

/** Normaliza el username: minúsculas, sin espacios ni acentos */
export function normalizarUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9._-]/g, '')
}

export function usernameAEmail(username: string): string {
  return `${normalizarUsername(username)}${DOMINIO_INTERNO}`
}

/** Genera URL firmada temporal para ver fotos del bucket privado */
export async function urlFirmada(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('fotos-cmms').createSignedUrl(path, 3600)
  if (error || !data) return null
  return data.signedUrl
}
