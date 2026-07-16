import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ESTADOS_OT, PRIORIDADES, formatDinero, formatFechaHora } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'
import SignedImage from '@/components/SignedImage'
import { ArrowLeft, Camera, MapPin, User, Wrench } from 'lucide-react'
import type { Enums, Tables, TablesUpdate } from '@/types/database'

type EstadoOT = Enums<'estado_ot'>
type Orden = Tables<'ordenes_trabajo'> & {
  sucursales: { nombre: string } | null
  equipos: { nombre: string } | null
  tecnico: { nombre: string } | null
  reportante: { nombre: string } | null
}
type Foto = Tables<'orden_fotos'>
type Tecnico = Pick<Tables<'perfiles'>, 'id' | 'nombre'>

const TRANSICIONES_TECNICO: EstadoOT[] = ['en_proceso', 'espera_repuesto', 'completada']

export default function OrdenDetalle() {
  const { id } = useParams<{ id: string }>()
  const { perfil } = useAuth()
  const [orden, setOrdenes] = useState<Orden | null>(null)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [fotoGrande, setFotoGrande] = useState<string | null>(null)

  const [costoMO, setCostoMO] = useState('0')
  const [costoRep, setCostoRep] = useState('0')
  const [notas, setNotas] = useState('')

  const esAdmin = perfil?.rol === 'admin'
  const esTecnicoAsignado = perfil?.rol === 'tecnico' && orden?.tecnico_id === perfil?.id

  async function cargar() {
    if (!id) return
    const { data } = await supabase
      .from('ordenes_trabajo')
      .select(
        '*, sucursales(nombre), equipos(nombre), tecnico:perfiles!ordenes_trabajo_tecnico_id_fkey(nombre), reportante:perfiles!ordenes_trabajo_reportado_por_fkey(nombre)'
      )
      .eq('id', id)
      .single()
    const o = (data as Orden) ?? null
    setOrdenes(o)
    if (o) {
      setCostoMO(String(o.costo_mano_obra))
      setCostoRep(String(o.costo_repuestos))
      setNotas(o.notas_cierre ?? '')
    }
    const { data: fs } = await supabase.from('orden_fotos').select('*').eq('orden_id', id).order('created_at')
    setFotos(fs ?? [])
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    if (esAdmin) {
      supabase
        .from('perfiles')
        .select('id, nombre')
        .eq('rol', 'tecnico')
        .eq('activo', true)
        .order('nombre')
        .then(({ data }) => setTecnicos(data ?? []))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, esAdmin])

  async function actualizar(cambios: TablesUpdate<'ordenes_trabajo'>, aviso: string) {
    if (!orden) return
    setGuardando(true)
    setMensaje(null)
    const { error } = await supabase.from('ordenes_trabajo').update(cambios).eq('id', orden.id)
    setGuardando(false)
    setMensaje(error ? 'Error: ' + error.message : aviso)
    if (!error) await cargar()
  }

  async function asignarTecnico(tecnicoId: string) {
    if (!tecnicoId) return
    const cambios: TablesUpdate<'ordenes_trabajo'> = {
      tecnico_id: tecnicoId,
      fecha_asignacion: new Date().toISOString(),
    }
    if (orden?.estado === 'reportada') cambios.estado = 'asignada'
    await actualizar(cambios, 'Técnico asignado')
  }

  async function cambiarEstado(estado: EstadoOT) {
    const cambios: TablesUpdate<'ordenes_trabajo'> = { estado }
    if (estado === 'completada') cambios.fecha_cierre = new Date().toISOString()
    await actualizar(cambios, 'Estado actualizado')
  }

  async function guardarCostos() {
    await actualizar(
      {
        costo_mano_obra: parseFloat(costoMO) || 0,
        costo_repuestos: parseFloat(costoRep) || 0,
        notas_cierre: notas.trim() || null,
      },
      'Información guardada'
    )
  }

  async function subirEvidencia(archivos: FileList | null) {
    if (!archivos || !orden) return
    setGuardando(true)
    for (const archivo of Array.from(archivos).slice(0, 4)) {
      try {
        const comprimida = await imageCompression(archivo, { maxSizeMB: 0.25, maxWidthOrHeight: 1600, useWebWorker: true })
        const path = `${orden.id}/${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage.from('fotos-cmms').upload(path, comprimida, { contentType: 'image/jpeg' })
        if (!error) {
          await supabase.from('orden_fotos').insert({ orden_id: orden.id, url: path, tipo: 'evidencia', subida_por: perfil?.id })
        }
      } catch {
        // continuar con las demás
      }
    }
    setGuardando(false)
    await cargar()
  }

  if (cargando) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando orden…</div>
  if (!orden) return <div className="py-16 text-center text-sm text-muted-foreground">Orden no encontrada</div>

  const fotosFalla = fotos.filter((f) => f.tipo === 'falla')
  const fotosEvidencia = fotos.filter((f) => f.tipo === 'evidencia')

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/ordenes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a órdenes
      </Link>

      {/* Encabezado */}
      <div className="card-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{orden.numero}</p>
            <h1 className="mt-1 text-xl font-semibold">{orden.titulo}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge {...ESTADOS_OT[orden.estado]} />
              <StatusBadge {...PRIORIDADES[orden.prioridad]} />
            </div>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            Reportada {formatFechaHora(orden.fecha_reporte)}
            {orden.fecha_cierre && (
              <>
                <br />
                Cerrada {formatFechaHora(orden.fecha_cierre)}
              </>
            )}
          </p>
        </div>

        <div className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{orden.sucursales?.nombre ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span>{orden.equipos?.nombre ?? 'Equipo no especificado'}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>Reportó: {orden.reportante?.nombre ?? '—'}</span>
          </div>
        </div>

        {orden.descripcion && (
          <p className="mt-4 rounded-md bg-muted px-4 py-3 text-sm leading-relaxed">{orden.descripcion}</p>
        )}
      </div>

      {/* Fotos de la falla */}
      {fotosFalla.length > 0 && (
        <div className="card-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Fotos de la falla</h2>
          <div className="flex flex-wrap gap-2">
            {fotosFalla.map((f) => (
              <SignedImage
                key={f.id}
                path={f.url}
                alt="Foto de la falla"
                className="h-24 w-24 cursor-pointer rounded-md border border-border object-cover transition-transform hover:scale-[1.02]"
                onClick={() => setFotoGrande(f.url)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gestión: asignación + estado */}
      {(esAdmin || esTecnicoAsignado) && (
        <div className="card-surface space-y-4 p-5">
          <h2 className="text-sm font-semibold">Gestión de la orden</h2>

          {esAdmin && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Técnico asignado</label>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={orden.tecnico_id ?? ''}
                  onChange={(e) => asignarTecnico(e.target.value)}
                  disabled={guardando}
                  className="rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Sin asignar…</option>
                  {tecnicos.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
                {orden.tecnico && <span className="text-sm text-muted-foreground">Actual: {orden.tecnico.nombre}</span>}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium">Cambiar estado</label>
            <div className="flex flex-wrap gap-2">
              {(esAdmin ? (Object.keys(ESTADOS_OT) as EstadoOT[]) : TRANSICIONES_TECNICO).map((e) => (
                <button
                  key={e}
                  onClick={() => cambiarEstado(e)}
                  disabled={guardando || orden.estado === e}
                  className={`btn-pill border text-sm ${
                    orden.estado === e ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${ESTADOS_OT[e].dot}`} />
                  {ESTADOS_OT[e].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Costo mano de obra ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costoMO}
                onChange={(e) => setCostoMO(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Costo repuestos ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={costoRep}
                onChange={(e) => setCostoRep(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notas de cierre / avance</label>
            <textarea
              rows={3}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Qué se hizo, qué falta, observaciones…"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={guardarCostos} disabled={guardando} className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90">
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <label className="btn-pill cursor-pointer border border-border hover:bg-accent">
              <Camera className="h-4 w-4" /> Subir evidencia
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => subirEvidencia(e.target.files)} />
            </label>
          </div>
        </div>
      )}

      {/* Resumen de costos visible para todos */}
      <div className="card-surface flex flex-wrap gap-6 p-5 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Mano de obra</p>
          <p className="mt-0.5 font-semibold">{formatDinero(orden.costo_mano_obra)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Repuestos</p>
          <p className="mt-0.5 font-semibold">{formatDinero(orden.costo_repuestos)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-0.5 font-semibold">{formatDinero(orden.costo_mano_obra + orden.costo_repuestos)}</p>
        </div>
      </div>

      {/* Evidencias */}
      {fotosEvidencia.length > 0 && (
        <div className="card-surface p-5">
          <h2 className="mb-3 text-sm font-semibold">Evidencia del trabajo</h2>
          <div className="flex flex-wrap gap-2">
            {fotosEvidencia.map((f) => (
              <SignedImage
                key={f.id}
                path={f.url}
                alt="Evidencia"
                className="h-24 w-24 cursor-pointer rounded-md border border-border object-cover transition-transform hover:scale-[1.02]"
                onClick={() => setFotoGrande(f.url)}
              />
            ))}
          </div>
        </div>
      )}

      {mensaje && (
        <p className={`rounded-md px-4 py-3 text-sm ${mensaje.startsWith('Error') ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700 dark:text-green-400'}`}>
          {mensaje}
        </p>
      )}

      {/* Visor de foto grande */}
      {fotoGrande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setFotoGrande(null)}>
          <SignedImage path={fotoGrande} alt="Foto ampliada" className="max-h-full max-w-full rounded-md object-contain" />
        </div>
      )}
    </div>
  )
}
