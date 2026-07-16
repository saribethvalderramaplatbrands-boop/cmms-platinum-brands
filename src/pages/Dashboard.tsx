import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ESTADOS_OT, PRIORIDADES, formatFecha } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'
import { ClipboardList, AlertCircle, CheckCircle2, Flame, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Enums, Tables } from '@/types/database'

type EstadoOT = Enums<'estado_ot'>
type Orden = Tables<'ordenes_trabajo'> & { sucursales: { nombre: string } | null }

const COLORES_ESTADO: Record<EstadoOT, string> = {
  reportada: '#f59e0b',
  asignada: '#3b82f6',
  en_proceso: '#8b5cf6',
  espera_repuesto: '#f97316',
  completada: '#22c55e',
  cancelada: '#a8a29e',
}

export default function Dashboard() {
  const { perfil } = useAuth()
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase
      .from('ordenes_trabajo')
      .select('*, sucursales(nombre)')
      .order('fecha_reporte', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        setOrdenes((data as Orden[]) ?? [])
        setCargando(false)
      })
  }, [])

  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const abiertas = ordenes.filter((o) => o.estado !== 'completada' && o.estado !== 'cancelada')
  const sinAsignar = ordenes.filter((o) => o.estado === 'reportada')
  const completadasMes = ordenes.filter((o) => o.estado === 'completada' && o.fecha_cierre && new Date(o.fecha_cierre) >= inicioMes)
  const criticas = abiertas.filter((o) => o.prioridad === 'critica')

  const rol = perfil?.rol
  const kpis = [
    {
      label: rol === 'tecnico' ? 'Mis órdenes abiertas' : 'Órdenes abiertas',
      valor: abiertas.length,
      icono: ClipboardList,
      acento: 'text-blue-600 dark:text-blue-400',
      fondo: 'bg-blue-500/10',
    },
    {
      label: rol === 'sucursal' ? 'Esperando asignación' : 'Sin asignar',
      valor: sinAsignar.length,
      icono: AlertCircle,
      acento: 'text-amber-600 dark:text-amber-400',
      fondo: 'bg-amber-500/10',
    },
    {
      label: 'Completadas este mes',
      valor: completadasMes.length,
      icono: CheckCircle2,
      acento: 'text-green-600 dark:text-green-400',
      fondo: 'bg-green-500/10',
    },
    {
      label: 'Críticas abiertas',
      valor: criticas.length,
      icono: Flame,
      acento: 'text-red-600 dark:text-red-400',
      fondo: 'bg-red-500/10',
    },
  ]

  const porEstado = (Object.keys(ESTADOS_OT) as EstadoOT[])
    .map((e) => ({ estado: ESTADOS_OT[e].label, cantidad: ordenes.filter((o) => o.estado === e).length, key: e }))
    .filter((d) => d.cantidad > 0)

  const recientes = ordenes.slice(0, 8)

  if (cargando) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando dashboard…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Hola, {perfil?.nombre?.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">Resumen de mantenimiento</p>
        </div>
        <Link to="/ordenes/nueva" className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90">
          Nueva orden
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-surface p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${k.fondo}`}>
                <k.icono className={`h-5 w-5 ${k.acento}`} />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">{k.valor}</p>
                <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Gráfico por estado */}
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Órdenes por estado</h2>
          {porEstado.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay órdenes registradas</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porEstado} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="estado"
                  width={110}
                  tick={{ fontSize: 12, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={18}>
                  {porEstado.map((d) => (
                    <Cell key={d.key} fill={COLORES_ESTADO[d.key as EstadoOT]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recientes */}
        <div className="card-surface p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Órdenes recientes</h2>
            <Link to="/ordenes" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recientes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Cuando se reporte la primera falla aparecerá aquí
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recientes.map((o) => (
                <Link
                  key={o.id}
                  to={`/ordenes/${o.id}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-accent/50 -mx-2 rounded-md px-2"
                >
                  <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{o.numero}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.sucursales?.nombre ?? '—'} · {formatFecha(o.fecha_reporte)}
                    </p>
                  </div>
                  <StatusBadge {...PRIORIDADES[o.prioridad]} className="hidden sm:inline-flex" />
                  <StatusBadge {...ESTADOS_OT[o.estado]} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
