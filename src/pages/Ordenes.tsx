import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { ESTADOS_OT, PRIORIDADES, formatFecha } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'
import { Plus, Search } from 'lucide-react'
import type { Enums, Tables } from '@/types/database'

type EstadoOT = Enums<'estado_ot'>
type Prioridad = Enums<'prioridad_ot'>
type Orden = Tables<'ordenes_trabajo'> & {
  sucursales: { nombre: string } | null
  tecnico: { nombre: string } | null
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [fEstado, setFEstado] = useState<EstadoOT | 'todas'>('todas')
  const [fPrioridad, setFPrioridad] = useState<Prioridad | 'todas'>('todas')

  useEffect(() => {
    supabase
      .from('ordenes_trabajo')
      .select('*, sucursales(nombre), tecnico:perfiles!ordenes_trabajo_tecnico_id_fkey(nombre)')
      .order('fecha_reporte', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setOrdenes((data as Orden[]) ?? [])
        setCargando(false)
      })
  }, [])

  const filtradas = useMemo(() => {
    return ordenes.filter((o) => {
      if (fEstado !== 'todas' && o.estado !== fEstado) return false
      if (fPrioridad !== 'todas' && o.prioridad !== fPrioridad) return false
      if (buscar) {
        const q = buscar.toLowerCase()
        return (
          o.titulo.toLowerCase().includes(q) ||
          o.numero.toLowerCase().includes(q) ||
          (o.sucursales?.nombre ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [ordenes, buscar, fEstado, fPrioridad])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Órdenes de trabajo</h1>
          <p className="text-sm text-muted-foreground">{filtradas.length} órdenes</p>
        </div>
        <Link to="/ordenes/nueva" className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nueva orden
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por número, título o sucursal…"
            className="w-full rounded-full border border-input bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value as EstadoOT | 'todas')}
          className="rounded-full border border-input bg-card px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="todas">Todos los estados</option>
          {(Object.keys(ESTADOS_OT) as EstadoOT[]).map((e) => (
            <option key={e} value={e}>{ESTADOS_OT[e].label}</option>
          ))}
        </select>
        <select
          value={fPrioridad}
          onChange={(e) => setFPrioridad(e.target.value as Prioridad | 'todas')}
          className="rounded-full border border-input bg-card px-4 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="todas">Todas las prioridades</option>
          {(Object.keys(PRIORIDADES) as Prioridad[]).map((p) => (
            <option key={p} value={p}>{PRIORIDADES[p].label}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="card-surface overflow-hidden">
        {cargando ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando órdenes…</p>
        ) : filtradas.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">No hay órdenes con estos filtros</p>
            <Link to="/ordenes/nueva" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
              Reportar la primera falla
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Número</th>
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Sucursal</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Prioridad</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Técnico</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtradas.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <Link to={`/ordenes/${o.id}`} className="font-mono text-xs text-primary hover:underline">
                        {o.numero}
                      </Link>
                    </td>
                    <td className="max-w-48 truncate px-4 py-3 font-medium">
                      <Link to={`/ordenes/${o.id}`} className="hover:underline">{o.titulo}</Link>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{o.sucursales?.nombre ?? '—'}</td>
                    <td className="hidden px-4 py-3 sm:table-cell"><StatusBadge {...PRIORIDADES[o.prioridad]} /></td>
                    <td className="px-4 py-3"><StatusBadge {...ESTADOS_OT[o.estado]} /></td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{o.tecnico?.nombre ?? 'Sin asignar'}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{formatFecha(o.fecha_reporte)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
