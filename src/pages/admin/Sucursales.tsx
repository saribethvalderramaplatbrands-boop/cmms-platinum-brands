import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X } from 'lucide-react'
import { logoKFC, logoDQ } from '@/assets/logos'
import type { Tables } from '@/types/database'

type Sucursal = Tables<'sucursales'> & { marcas: { nombre: string } | null }
type Marca = Tables<'marcas'>

const LOGOS: Record<string, string> = { KFC: logoKFC, DQ: logoDQ }

export default function AdminSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [direccion, setDireccion] = useState('')

  async function cargar() {
    const [{ data: s }, { data: m }] = await Promise.all([
      supabase.from('sucursales').select('*, marcas(nombre)').order('nombre'),
      supabase.from('marcas').select('*').order('nombre'),
    ])
    setSucursales((s as Sucursal[]) ?? [])
    setMarcas(m ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!marcaId) {
      setError('Selecciona la marca')
      return
    }
    setGuardando(true)
    const { error } = await supabase.from('sucursales').insert({
      nombre: nombre.trim(),
      codigo: codigo.trim() || null,
      marca_id: marcaId,
      direccion: direccion.trim() || null,
    })
    setGuardando(false)
    if (error) {
      setError(error.message)
      return
    }
    setMostrarForm(false)
    setNombre(''); setCodigo(''); setMarcaId(''); setDireccion('')
    await cargar()
  }

  async function toggleActiva(s: Sucursal) {
    await supabase.from('sucursales').update({ activa: !s.activa }).eq('id', s.id)
    await cargar()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Sucursales</h1>
          <p className="text-sm text-muted-foreground">{sucursales.filter((s) => s.activa).length} activas de {sucursales.length}</p>
        </div>
        <button onClick={() => setMostrarForm(true)} className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nueva sucursal
        </button>
      </div>

      <div className="card-surface overflow-hidden">
        {cargando ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando sucursales…</p>
        ) : sucursales.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Registra la primera sucursal</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Código</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Gerencia</th>
                  <th className="hidden px-4 py-3 font-medium xl:table-cell">Dirección</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sucursales.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.marcas?.nombre && LOGOS[s.marcas.nombre] && (
                          <img src={LOGOS[s.marcas.nombre]} alt={s.marcas.nombre} className="h-6 w-6 rounded object-contain" />
                        )}
                        <span className="text-muted-foreground">{s.marcas?.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{s.nombre}</td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">{s.codigo ?? '—'}</td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {s.gerente_area && <p><span className="font-medium text-foreground/70">Área:</span> {s.gerente_area}</p>}
                        {s.gerente_regional && <p><span className="font-medium text-foreground/70">Regional:</span> {s.gerente_regional}</p>}
                        {s.supervisor && <p><span className="font-medium text-foreground/70">Sup:</span> {s.supervisor}</p>}
                      </div>
                    </td>
                    <td className="hidden max-w-48 truncate px-4 py-3 text-muted-foreground xl:table-cell">{s.direccion ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        s.activa ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-stone-500/10 text-stone-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.activa ? 'bg-green-500' : 'bg-stone-400'}`} />
                        {s.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActiva(s)} className="text-xs font-medium text-primary hover:underline">
                        {s.activa ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={crear} className="card-surface w-full max-w-md space-y-4 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Nueva sucursal</h2>
              <button type="button" onClick={() => setMostrarForm(false)} className="rounded-full p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Marca *</label>
              <div className="flex gap-2">
                {marcas.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMarcaId(m.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                      marcaId === m.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                    }`}
                  >
                    {LOGOS[m.nombre] && <img src={LOGOS[m.nombre]} alt="" className="h-6 w-6 object-contain" />}
                    {m.nombre}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nombre *</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="ej. Multiplaza"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Código</label>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="ej. KFC-012"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Dirección</label>
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <button type="submit" disabled={guardando} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
              {guardando ? 'Guardando…' : 'Crear sucursal'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
