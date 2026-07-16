import { useEffect, useState, type FormEvent } from 'react'
import { supabase, normalizarUsername } from '@/lib/supabase'
import { ROLES } from '@/lib/constants'
import { Copy, KeyRound, Plus, X } from 'lucide-react'
import type { Enums, Tables } from '@/types/database'

type Rol = Enums<'rol_usuario'>
type Perfil = Tables<'perfiles'> & { sucursales: { nombre: string } | null }
type Sucursal = Tables<'sucursales'>

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempGenerada, setTempGenerada] = useState<{ usuario: string; password: string } | null>(null)

  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [rol, setRol] = useState<Rol>('sucursal')
  const [sucursalId, setSucursalId] = useState('')

  async function cargar() {
    const [{ data: u }, { data: s }] = await Promise.all([
      supabase.from('perfiles').select('*, sucursales(nombre)').order('nombre'),
      supabase.from('sucursales').select('*').eq('activa', true).order('nombre'),
    ])
    setUsuarios((u as Perfil[]) ?? [])
    setSucursales(s ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const limpio = normalizarUsername(username)
    if (limpio.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres válidos (letras, números, punto, guion)')
      return
    }
    if (rol === 'sucursal' && !sucursalId) {
      setError('Un usuario de sucursal necesita su sucursal asignada')
      return
    }
    setGuardando(true)
    const { data, error: errFn } = await supabase.functions.invoke('admin-users', {
      body: {
        action: 'create',
        nombre: nombre.trim(),
        username: limpio,
        rol,
        sucursal_id: rol === 'sucursal' ? sucursalId : null,
      },
    })
    setGuardando(false)
    if (errFn || data?.error) {
      setError(errFn?.message ?? data?.error ?? 'Error creando usuario')
      return
    }
    setTempGenerada({ usuario: limpio, password: data.password_temporal })
    setMostrarForm(false)
    setNombre(''); setUsername(''); setRol('sucursal'); setSucursalId('')
    await cargar()
  }

  async function resetear(u: Perfil) {
    setError(null)
    const { data, error: errFn } = await supabase.functions.invoke('admin-users', {
      body: { action: 'reset', user_id: u.id },
    })
    if (errFn || data?.error) {
      setError(errFn?.message ?? data?.error ?? 'Error reseteando contraseña')
      return
    }
    setTempGenerada({ usuario: u.username, password: data.password_temporal })
    await cargar()
  }

  async function toggleActivo(u: Perfil) {
    await supabase.from('perfiles').update({ activo: !u.activo }).eq('id', u.id)
    await cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{usuarios.length} usuarios registrados</p>
        </div>
        <button onClick={() => setMostrarForm(true)} className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Crear usuario
        </button>
      </div>

      {error && <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      <div className="card-surface overflow-hidden">
        {cargando ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando usuarios…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Rol</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Sucursal</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuarios.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium">{u.nombre}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.username}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.rol === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : u.rol === 'tecnico'
                            ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400'
                            : u.rol === 'sucursal'
                              ? 'bg-stone-500/10 text-stone-600 dark:text-stone-400'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      }`}>
                        {ROLES[u.rol]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{u.sucursales?.nombre ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${u.activo ? 'text-green-600 dark:text-green-400' : 'text-stone-400'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-stone-400'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => resetear(u)} title="Generar contraseña temporal"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <KeyRound className="h-3.5 w-3.5" /> Reset
                        </button>
                        <button onClick={() => toggleActivo(u)} className="text-xs font-medium text-muted-foreground hover:underline">
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear usuario */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={crear} className="card-surface w-full max-w-md space-y-4 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Crear usuario</h2>
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-full p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nombre completo *</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Usuario *</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required autoCapitalize="none"
                placeholder="ej. jperez"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              <p className="mt-1 text-xs text-muted-foreground">Con este nombre entrará a la app. Sin espacios ni acentos.</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Rol *</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ROLES) as Rol[]).map((r) => (
                  <button key={r} type="button" onClick={() => setRol(r)}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                      rol === r ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
                    }`}>
                    {ROLES[r]}
                  </button>
                ))}
              </div>
            </div>
            {rol === 'sucursal' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Sucursal asignada *</label>
                <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} required
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="">Selecciona…</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            )}
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={guardando} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {guardando ? 'Creando…' : 'Crear y generar contraseña temporal'}
            </button>
          </form>
        </div>
      )}

      {/* Modal contraseña temporal */}
      {tempGenerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-surface w-full max-w-sm space-y-4 p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <KeyRound className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Contraseña temporal generada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Compártela con <strong>{tempGenerada.usuario}</strong>. Al entrar, la app le pedirá crear una propia.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-md border border-border bg-muted px-4 py-3">
              <code className="text-lg font-semibold tracking-wide">{tempGenerada.password}</code>
              <button
                onClick={() => navigator.clipboard.writeText(tempGenerada.password)}
                className="rounded-full p-1.5 hover:bg-accent"
                title="Copiar"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <button onClick={() => setTempGenerada(null)} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
