import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ESTADOS_EQUIPO } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'
import { Plus, X } from 'lucide-react'
import type { Enums, Tables } from '@/types/database'

type EstadoEquipo = Enums<'estado_equipo'>
type Equipo = Tables<'equipos'> & {
  sucursales: { nombre: string } | null
  categorias_equipo: { nombre: string } | null
}
type Sucursal = Tables<'sucursales'>
type Categoria = Tables<'categorias_equipo'>

export default function Equipos() {
  const { perfil } = useAuth()
  const esAdmin = perfil?.rol === 'admin'
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [sucursalId, setSucursalId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [serie, setSerie] = useState('')

  async function cargar() {
    const { data } = await supabase
      .from('equipos')
      .select('*, sucursales(nombre), categorias_equipo(nombre)')
      .order('nombre')
      .limit(500)
    setEquipos((data as Equipo[]) ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    if (esAdmin) {
      supabase.from('sucursales').select('*').eq('activa', true).order('nombre').then(({ data }) => setSucursales(data ?? []))
      supabase.from('categorias_equipo').select('*').order('nombre').then(({ data }) => setCategorias(data ?? []))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin])

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    const { error } = await supabase.from('equipos').insert({
      nombre: nombre.trim(),
      sucursal_id: sucursalId,
      categoria_id: categoriaId || null,
      marca: marca.trim() || null,
      modelo: modelo.trim() || null,
      serie: serie.trim() || null,
    })
    setGuardando(false)
    if (error) {
      setError(error.message)
      return
    }
    setMostrarForm(false)
    setNombre(''); setSucursalId(''); setCategoriaId(''); setMarca(''); setModelo(''); setSerie('')
    await cargar()
  }

  async function cambiarEstado(id: string, estado: EstadoEquipo) {
    await supabase.from('equipos').update({ estado }).eq('id', id)
    await cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Equipos</h1>
          <p className="text-sm text-muted-foreground">{equipos.length} activos registrados</p>
        </div>
        {esAdmin && (
          <button onClick={() => setMostrarForm(true)} className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Registrar equipo
          </button>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        {cargando ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando equipos…</p>
        ) : equipos.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {esAdmin ? 'Registra el primer equipo de tus sucursales' : 'Aún no hay equipos registrados en tu sucursal'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Equipo</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Categoría</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Sucursal</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Marca / Modelo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  {(esAdmin || perfil?.rol === 'tecnico') && <th className="px-4 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {equipos.map((eq) => (
                  <tr key={eq.id} className="transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium">{eq.nombre}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{eq.categorias_equipo?.nombre ?? '—'}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{eq.sucursales?.nombre ?? '—'}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {[eq.marca, eq.modelo].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge {...ESTADOS_EQUIPO[eq.estado]} /></td>
                    {(esAdmin || perfil?.rol === 'tecnico') && (
                      <td className="px-4 py-3">
                        <select
                          value={eq.estado}
                          onChange={(e) => cambiarEstado(eq.id, e.target.value as EstadoEquipo)}
                          className="rounded-full border border-input bg-card px-2 py-1 text-xs outline-none"
                        >
                          {(Object.keys(ESTADOS_EQUIPO) as EstadoEquipo[]).map((es) => (
                            <option key={es} value={es}>{ESTADOS_EQUIPO[es].label}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal registrar equipo */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={crear} className="card-surface w-full max-w-md space-y-4 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Registrar equipo</h2>
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-full p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nombre *</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="ej. Freidora principal"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Sucursal *</label>
                <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} required
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="">Selecciona…</option>
                  {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Categoría</label>
                <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="">Selecciona…</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Marca</label>
                <input value={marca} onChange={(e) => setMarca(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Modelo</label>
                <input value={modelo} onChange={(e) => setModelo(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Serie</label>
                <input value={serie} onChange={(e) => setSerie(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={guardando} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {guardando ? 'Guardando…' : 'Registrar equipo'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
