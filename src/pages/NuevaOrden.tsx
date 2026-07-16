import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PRIORIDADES } from '@/lib/constants'
import { Camera, X } from 'lucide-react'
import type { Enums, Tables } from '@/types/database'

type Prioridad = Enums<'prioridad_ot'>
type Sucursal = Tables<'sucursales'> & { marcas: { nombre: string } | null }
type Equipo = Tables<'equipos'>

export default function NuevaOrden() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const esSucursal = perfil?.rol === 'sucursal'

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [sucursalId, setSucursalId] = useState(perfil?.sucursal_id ?? '')
  const [equipoId, setEquipoId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('media')
  const [fotos, setFotos] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    supabase
      .from('sucursales')
      .select('*, marcas(nombre)')
      .eq('activa', true)
      .order('nombre')
      .then(({ data }) => setSucursales((data as Sucursal[]) ?? []))
  }, [])

  useEffect(() => {
    if (!sucursalId) {
      setEquipos([])
      return
    }
    supabase
      .from('equipos')
      .select('*')
      .eq('sucursal_id', sucursalId)
      .neq('estado', 'dado_de_baja')
      .order('nombre')
      .then(({ data }) => setEquipos(data ?? []))
  }, [sucursalId])

  function agregarFotos(archivos: FileList | null) {
    if (!archivos) return
    setFotos((prev) => [...prev, ...Array.from(archivos)].slice(0, 6))
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!sucursalId) {
      setError('Selecciona la sucursal')
      return
    }
    setGuardando(true)

    // 1. Crear la orden
    const { data: orden, error: errOrden } = await supabase
      .from('ordenes_trabajo')
      .insert({
        sucursal_id: sucursalId,
        equipo_id: equipoId || null,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        prioridad,
        reportado_por: perfil?.id,
      })
      .select()
      .single()

    if (errOrden || !orden) {
      setGuardando(false)
      setError('No se pudo crear la orden: ' + (errOrden?.message ?? 'error desconocido'))
      return
    }

    // 2. Subir fotos comprimidas
    for (const foto of fotos) {
      try {
        const comprimida = await imageCompression(foto, { maxSizeMB: 0.25, maxWidthOrHeight: 1600, useWebWorker: true })
        const path = `${orden.id}/${crypto.randomUUID()}.jpg`
        const { error: errSubida } = await supabase.storage
          .from('fotos-cmms')
          .upload(path, comprimida, { contentType: 'image/jpeg' })
        if (!errSubida) {
          await supabase.from('orden_fotos').insert({ orden_id: orden.id, url: path, tipo: 'falla', subida_por: perfil?.id })
        }
      } catch {
        // si una foto falla, seguimos con las demás
      }
    }

    navigate(`/ordenes/${orden.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Nueva orden de trabajo</h1>
        <p className="text-sm text-muted-foreground">Reporta una falla o solicitud de mantenimiento</p>
      </div>

      <form onSubmit={guardar} className="card-surface space-y-5 p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Sucursal *</label>
          {esSucursal ? (
            <p className="rounded-md border border-border bg-muted px-3 py-2.5 text-sm">
              {sucursales.find((s) => s.id === sucursalId)?.nombre ?? 'Tu sucursal'}
            </p>
          ) : (
            <select
              value={sucursalId}
              onChange={(e) => {
                setSucursalId(e.target.value)
                setEquipoId('')
              }}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Selecciona…</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.marcas?.nombre ? `${s.marcas.nombre} · ` : ''}{s.nombre}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Equipo (opcional)</label>
          <select
            value={equipoId}
            onChange={(e) => setEquipoId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">No aplica / no está en la lista</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.nombre}{eq.marca ? ` · ${eq.marca}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Título *</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            maxLength={120}
            placeholder="ej. Freidora no enciende"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            placeholder="Describe qué pasó, desde cuándo, y cualquier detalle útil…"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Prioridad</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRIORIDADES) as Prioridad[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioridad(p)}
                className={`btn-pill border text-sm ${
                  prioridad === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${PRIORIDADES[p].dot}`} />
                {PRIORIDADES[p].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Fotos de la falla (máx. 6)</label>
          <div className="flex flex-wrap gap-2">
            {fotos.map((f, i) => (
              <div key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt="" className="h-20 w-20 rounded-md border border-border object-cover" />
                <button
                  type="button"
                  onClick={() => setFotos((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {fotos.length < 6 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Camera className="h-5 w-5" />
                <span className="text-[10px]">Agregar</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => agregarFotos(e.target.files)} />
              </label>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Se comprimen automáticamente antes de subir (~250 KB c/u).</p>
        </div>

        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={guardando} className="btn-pill flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
            {guardando ? 'Guardando…' : 'Crear orden'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-pill border border-border hover:bg-accent">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
