import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, usernameAEmail, normalizarUsername } from '@/lib/supabase'
import { MARCAS, marcaDePerfil, type MarcaKey } from '@/lib/marcas'
import type { Tables } from '@/types/database'

type Perfil = Tables<'perfiles'> & { marcas: { nombre: string } | null }

interface AuthState {
  session: Session | null
  perfil: Perfil | null
  marca: MarcaKey | null
  loading: boolean
  /** true mientras se valida la marca tras autenticar (evita redirigir al dashboard) */
  validando: boolean
  signIn: (username: string, password: string, marca: MarcaKey) => Promise<{ error: string | null }>
  registrar: (nombre: string, username: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>
  cambiarPassword: (nueva: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshPerfil: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

/** Acento de marca: pinta --primary/--ring con los colores de la marca del usuario */
function aplicarMarca(marca: MarcaKey | null) {
  const primario = MARCAS[marca ?? 'PLATINUM'].primario
  const root = document.documentElement
  root.style.setProperty('--primary', primario)
  root.style.setProperty('--ring', primario)
  root.style.setProperty('--sidebar-primary', primario)
  root.style.setProperty('--sidebar-ring', primario)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [marca, setMarca] = useState<MarcaKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [validando, setValidando] = useState(false)

  async function cargarPerfil(userId: string): Promise<Perfil | null> {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, marcas(nombre)')
      .eq('id', userId)
      .single()
    if (error || !data) return null
    return data as Perfil
  }

  function establecerPerfil(p: Perfil | null) {
    setPerfil(p)
    const m = p ? marcaDePerfil(p) : null
    setMarca(m)
    aplicarMarca(m)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) {
        cargarPerfil(data.session.user.id).then((p) => {
          establecerPerfil(p)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) {
        cargarPerfil(s.user.id).then(establecerPerfil)
      } else {
        establecerPerfil(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(username: string, password: string, marcaElegida: MarcaKey) {
    const limpio = normalizarUsername(username)
    if (!limpio) return { error: 'Ingresa tu usuario' }
    setValidando(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameAEmail(limpio),
      password,
    })
    if (error) {
      setValidando(false)
      return { error: 'Usuario o contraseña incorrectos' }
    }

    // Validar que la cuenta pertenezca a la marca elegida
    const p = await cargarPerfil(data.user.id)
    const real = p ? marcaDePerfil(p) : 'PLATINUM'
    if (real !== marcaElegida) {
      await supabase.auth.signOut()
      setValidando(false)
      return { error: `Esta cuenta pertenece a ${MARCAS[real].nombre}. Entra por esa opción.` }
    }
    setValidando(false)
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
    if (session?.user) establecerPerfil(await cargarPerfil(session.user.id))
  }

  return (
    <AuthContext.Provider value={{ session, perfil, marca, loading, validando, signIn, registrar, cambiarPassword, signOut, refreshPerfil }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
