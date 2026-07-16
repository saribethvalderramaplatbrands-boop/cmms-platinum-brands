import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, usernameAEmail, normalizarUsername } from '@/lib/supabase'
import type { Tables } from '@/types/database'

type Perfil = Tables<'perfiles'>

interface AuthState {
  session: Session | null
  perfil: Perfil | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error: string | null }>
  registrar: (nombre: string, username: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>
  cambiarPassword: (nueva: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  async function cargarPerfil(userId: string): Promise<Perfil | null> {
    const { data, error } = await supabase.from('perfiles').select('*').eq('id', userId).single()
    if (error || !data) return null
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        cargarPerfil(data.session.user.id).then((p) => {
          setPerfil(p)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) {
        cargarPerfil(s.user.id).then(setPerfil)
      } else {
        setPerfil(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(username: string, password: string) {
    const limpio = normalizarUsername(username)
    if (!limpio) return { error: 'Ingresa tu usuario' }
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameAEmail(limpio),
      password,
    })
    if (error) return { error: 'Usuario o contraseña incorrectos' }
    return { error: null }
  }

  async function registrar(nombre: string, username: string, password: string) {
    const limpio = normalizarUsername(username)
    if (!limpio || limpio.length < 3) return { error: 'El usuario debe tener al menos 3 caracteres válidos', needsConfirm: false }
    if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres', needsConfirm: false }
    const { data, error } = await supabase.auth.signUp({
      email: usernameAEmail(limpio),
      password,
      options: { data: { nombre, username: limpio } },
    })
    if (error) {
      if (error.message.includes('already registered')) return { error: 'Ese usuario ya existe', needsConfirm: false }
      return { error: error.message, needsConfirm: false }
    }
    return { error: null, needsConfirm: !data.session }
  }

  async function cambiarPassword(nueva: string) {
    if (nueva.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' }
    const { error } = await supabase.auth.updateUser({ password: nueva })
    if (error) return { error: error.message }
    if (perfil) {
      await supabase.from('perfiles').update({ debe_cambiar_password: false }).eq('id', perfil.id)
      await refreshPerfil()
    }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshPerfil() {
    if (session?.user) setPerfil(await cargarPerfil(session.user.id))
  }

  return (
    <AuthContext.Provider value={{ session, perfil, loading, signIn, registrar, cambiarPassword, signOut, refreshPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
