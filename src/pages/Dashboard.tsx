import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { ESTADOS_OT, PRIORIDADES, formatFecha } from '@/lib/constants'
import StatusBadge from '@/components/StatusBadge'
import {
  ClipboardList,
  Flame,
  Timer,
  Zap,
  HeartPulse,
  Target,
  CalendarCheck,
  Wrench,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  Package,
  CalendarClock,
  type LucideIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import {
  type OrdenKPI,
  type PreventivoKPI,
  type EjecucionKPI,
  type EquipoKPI,
  type RepuestoKPI,
  type PeriodoKPI,
  esAbierta,
  inicioPeriodo,
  calcMTTR,
  calcMTTA,
  calcMTBF,
  calcCumplimientoOT,
  calcCostos,
  calcBacklogAging,
  calcTendencia,
  calcTopSucursales,
  calcPorTecnico,
  calcPorCategoria,
  calcPreventivosAlDia,
  calcDisponibilidad,
  calcRepuestosBajos,
  fmtDuracion,
  fmtDias,
  fmtPct,
  fmtDineroCorto,
} from '@/lib/kpis'

const TOOLTIP_ESTILO = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 6,
  fontSize: 12,
} as const

const COLORES_PRIORIDAD: Record<string, string> = {
  critica: '#ef4444',
  alta: '#f97316',
  media: '#3b82f6',
  baja: '#a8a29e',
}

const COLORES_AGING = ['#22c55e', '#eab308', '#f97316', '#ef4444']

const TONOS: Record<string, { acento: string; fondo: string }> = {
  azul: { acento: 'text-blue-600 dark:text-blue-400', fondo: 'bg-blue-500/10' },
  rojo: { acento: 'text-red-600 dark:text-red-400', fondo: 'bg-red-500/10' },
  verde: { acento: 'text-green-600 dark:text-green-400', fondo: 'bg-green-500/10' },
  ambar: { acento: 'text-amber-600 dark:text-amber-400', fondo: 'bg-amber-500/10' },
  violeta: { acento: 'text-violet-600 dark:text-violet-400', fondo: 'bg-violet-500/10' },
  cian: { acento: 'text-cyan-600 dark:text-cyan-400', fondo: 'bg-cyan-500/10' },
}

const PERIODOS: { key: PeriodoKPI; label: string }[] = [
  { key: 'mes', label: 'Este mes' },
  { key: '90d', label: '90 días' },
  { key: 'anio', label: '12 meses' },
]

/** Semáforo para KPIs porcentuales según metas de la industria */
function semaforo(pct: number | null, ok: number, warn: number): string {
  if (pct === null) return ''
  if (pct >= ok) return 'text-green-600 dark:text-green-400'
  if (pct >= warn) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function KpiCard({
  label,
  valor,
  sub,
  icono: Icono,
  tono,
  valorClase = '',
  alerta = false,
}: {
  label: string
  valor: string | number
  sub?: string
  icono: LucideIcon
  tono: keyof typeof TONOS
  valorClase?: string
  alerta?: boolean
}) {
  const t = TONOS[tono]
  return (
    <div className={`card-surface p-4 ${alerta ? 'ring-1 ring-red-500/50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${t.fondo}`}>
          <Icono className={`h-5 w-5 ${t.acento}`} />
        </div>
        <div className="min-w-0">
          <p className={`text-2xl font-semibold leading-none ${valorClase}`}>{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          {sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground/70">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  titulo,
  sub,
  children,
  className = '',
}: {
  titulo: string
  sub?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`card-surface p-5 ${className}`}>
      <h2 className="text-sm font-semibold">{titulo}</h2>
      {sub && <p className="mb-2 text-[11px] text-muted-foreground">{sub}</p>}
      <div className={sub ? '' : 'mt-4'}>{children}</div>
    </div>
  )
}

function EmptyChart({ msg }: { msg: string }) {
  return <p className="flex h-[220px] items-center justify-center px-6 text-center text-sm text-muted-foreground">{msg}</p>
}

export default function Dashboard() {
  const { perfil } = useAuth()
  const [ordenes, setOrdenes] = useState<OrdenKPI[]>([])
  const [preventivos, setPreventivos] = useState<PreventivoKPI[]>([])
  const [ejecuciones, setEjecuciones] = useState<EjecucionKPI[]>([])
  const [equipos, setEquipos] = useState<EquipoKPI[]>([])
  const [repuestos, setRepuestos] = useState<RepuestoKPI[]>([])
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState<PeriodoKPI>('mes')

  useEffect(() => {
    async function cargar() {
      const [ord, prev, ejec, eq, rep] = await Promise.all([
        supabase
          .from('ordenes_trabajo')
          .select(
            'id,numero,titulo,estado,prioridad,sucursal_id,equipo_id,tecnico_id,fecha_reporte,fecha_asignacion,fecha_cierre,costo_mano_obra,costo_repuestos,sucursales(nombre,marcas(nombre)),equipos(nombre,categorias_equipo(nombre)),tecnico:perfiles!ordenes_trabajo_tecnico_id_fkey(nombre)',
          )
          .order('fecha_reporte', { ascending: false })
          .limit(2000),
        supabase.from('preventivos').select('id,nombre,proxima_fecha,activo'),
        supabase.from('preventivo_ejecuciones').select('id,preventivo_id,fecha'),
        supabase.from('equipos').select('id,nombre,estado'),
        supabase.from('repuestos').select('id,nombre,stock,stock_minimo').eq('activo', true),
      ])
      setOrdenes((ord.data as unknown as OrdenKPI[]) ?? [])
      setPreventivos((prev.data as PreventivoKPI[]) ?? [])
      setEjecuciones((ejec.data as EjecucionKPI[]) ?? [])
      setEquipos((eq.data as EquipoKPI[]) ?? [])
      setRepuestos((rep.data as RepuestoKPI[]) ?? [])
      setCargando(false)
    }
    cargar()
  }, [])

  const inicio = useMemo(() => inicioPeriodo(periodo), [periodo])

  /* ---------- KPIs ---------- */
  const k = useMemo(() => {
    const abiertas = ordenes.filter(esAbierta)
    return {
      abiertas,
      sinAsignar: abiertas.filter((o) => o.estado === 'reportada').length,
      criticasAbiertas: abiertas.filter((o) => o.prioridad === 'critica' || o.prioridad === 'alta'),
      criticasSinAsignar: abiertas.filter((o) => o.prioridad === 'critica' && o.estado === 'reportada').length,
      mttr: calcMTTR(ordenes, inicio),
      mtta: calcMTTA(ordenes, inicio),
      mtbf: calcMTBF(ordenes),
      cumpl: calcCumplimientoOT(ordenes, inicio),
      costos: calcCostos(ordenes, inicio),
      pm: calcPreventivosAlDia(preventivos),
      disp: calcDisponibilidad(equipos),
      repBajos: calcRepuestosBajos(repuestos),
      ejecPeriodo: ejecuciones.filter((e) => new Date(e.fecha) >= inicio).length,
    }
  }, [ordenes, preventivos, ejecuciones, equipos, repuestos, inicio])

  /* ---------- Gráficos ---------- */
  const tendencia = useMemo(() => calcTendencia(ordenes), [ordenes])
  const aging = useMemo(() => calcBacklogAging(ordenes), [ordenes])
  const topSucursales = useMemo(() => calcTopSucursales(ordenes, inicio), [ordenes, inicio])
  const porTecnico = useMemo(() => calcPorTecnico(ordenes, inicio), [ordenes, inicio])
  const porCategoria = useMemo(() => calcPorCategoria(ordenes, inicio), [ordenes, inicio])
  const donutPrioridad = useMemo(() => {
    const orden = ['critica', 'alta', 'media', 'baja']
    return orden
      .map((p) => ({
        key: p,
        nombre: PRIORIDADES[p as keyof typeof PRIORIDADES].label,
        cantidad: k.abiertas.filter((o) => o.prioridad === p).length,
      }))
      .filter((d) => d.cantidad > 0)
  }, [k.abiertas])

  /* ---------- Alertas de excepción ---------- */
  const alertas: { icono: LucideIcon; texto: string; grave: boolean }[] = []
  if (k.criticasSinAsignar > 0)
    alertas.push({ icono: Flame, texto: `${k.criticasSinAsignar} orden(es) crítica(s) esperando asignación`, grave: true })
  if (k.pm.vencidos > 0)
    alertas.push({ icono: CalendarClock, texto: `${k.pm.vencidos} plan(es) de mantenimiento preventivo vencido(s)`, grave: true })
  if (k.repBajos.length > 0)
    alertas.push({ icono: Package, texto: `${k.repBajos.length} repuesto(s) en o bajo el stock mínimo`, grave: false })

  if (cargando) {
    return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Cargando dashboard…</div>
  }

  const kpis = [
    {
      label: 'Órdenes abiertas',
      valor: k.abiertas.length,
      sub: `${k.sinAsignar} sin asignar`,
      icono: ClipboardList,
      tono: 'azul' as const,
    },
    {
      label: 'Críticas + altas abiertas',
      valor: k.criticasAbiertas.length,
      sub: `${k.criticasSinAsignar} críticas sin asignar`,
      icono: Flame,
      tono: 'rojo' as const,
      alerta: k.criticasAbiertas.length > 0,
    },
    {
      label: 'MTTR',
      valor: fmtDuracion(k.mttr),
      sub: 'tiempo promedio de reparación',
      icono: Timer,
      tono: 'violeta' as const,
    },
    {
      label: 'Respuesta (MTTA)',
      valor: fmtDuracion(k.mtta),
      sub: 'reporte → asignación',
      icono: Zap,
      tono: 'cian' as const,
    },
    {
      label: 'MTBF',
      valor: fmtDias(k.mtbf),
      sub: 'promedio entre fallas de un equipo',
      icono: HeartPulse,
      tono: 'verde' as const,
    },
    {
      label: 'Cumplimiento de OT',
      valor: fmtPct(k.cumpl.pct),
      sub: k.cumpl.creadas === 0 ? 'sin OT en el período' : `${k.cumpl.completadas} de ${k.cumpl.creadas} creadas · meta 90%`,
      icono: Target,
      tono: 'verde' as const,
      valorClase: semaforo(k.cumpl.pct, 90, 70),
    },
    {
      label: 'Preventivos al día',
      valor: fmtPct(k.pm.pct),
      sub: k.pm.total === 0 ? 'sin planes creados' : `${k.pm.vencidos} vencidos · ${k.ejecPeriodo} ejecutados`,
      icono: CalendarCheck,
      tono: 'ambar' as const,
      valorClase: semaforo(k.pm.pct, 90, 70),
    },
    {
      label: 'Disponibilidad de equipos',
      valor: fmtPct(k.disp.pct),
      sub: k.disp.total === 0 ? 'sin equipos registrados' : `${k.disp.enReparacion} en reparación de ${k.disp.total}`,
      icono: Wrench,
      tono: 'azul' as const,
      valorClase: semaforo(k.disp.pct, 95, 85),
    },
    {
      label: 'Costo del período',
      valor: fmtDineroCorto(k.costos.total),
      sub: k.costos.promedio === null ? 'sin cierres en el período' : `~${fmtDineroCorto(k.costos.promedio)} por OT cerrada`,
      icono: DollarSign,
      tono: 'verde' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Hola, {perfil?.nombre?.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">KPIs y salud del mantenimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-card p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  periodo === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Link to="/ordenes/nueva" className="btn-pill bg-primary text-primary-foreground hover:bg-primary/90">
            Nueva orden
          </Link>
        </div>
      </div>

      {/* Alertas de excepción */}
      {alertas.length > 0 && (
        <div
          className={`flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border p-3.5 text-sm font-medium ${
            alertas.some((a) => a.grave)
              ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Requiere atención:
          </span>
          {alertas.map((a) => (
            <span key={a.texto} className="flex items-center gap-1.5">
              <a.icono className="h-4 w-4" /> {a.texto}
            </span>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
        {kpis.map((c) => (
          <KpiCard key={c.label} {...c} />
        ))}
      </div>

      {/* Fila 1: tendencia + aging */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard titulo="Tendencia de órdenes" sub="Creadas vs completadas · últimos 6 meses" className="lg:col-span-2">
          {ordenes.length === 0 ? (
            <EmptyChart msg="Aún no hay órdenes — el gráfico aparecerá con las primeras fallas reportadas" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tendencia} margin={{ left: -18, right: 8 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_ESTILO} />
                  <Bar dataKey="creadas" name="Creadas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="completadas" name="Completadas" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#3b82f6]" /> Creadas</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#22c55e]" /> Completadas</span>
              </div>
            </>
          )}
        </ChartCard>

        <ChartCard titulo="Antigüedad del backlog" sub="OT abiertas según días sin resolver">
          {k.abiertas.length === 0 ? (
            <EmptyChart msg="Sin backlog — no hay órdenes abiertas" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aging} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="rango" width={62} tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_ESTILO} />
                <Bar dataKey="cantidad" name="Órdenes" radius={[0, 4, 4, 0]} barSize={20}>
                  {aging.map((d, i) => (
                    <Cell key={d.rango} fill={COLORES_AGING[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Fila 2: sucursales + técnicos + prioridad */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard titulo="Sucursales con más OT" sub="Top 5 del período">
          {topSucursales.length === 0 ? (
            <EmptyChart msg="Sin órdenes en el período" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topSucursales} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nombre" width={118} tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_ESTILO} />
                <Bar dataKey="cantidad" name="Órdenes" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard titulo="Completadas por técnico" sub="OT cerradas en el período">
          {porTecnico.length === 0 ? (
            <EmptyChart msg="Aún no hay órdenes completadas en el período" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porTecnico} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nombre" width={118} tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_ESTILO} />
                <Bar dataKey="cantidad" name="Completadas" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard titulo="Backlog por prioridad" sub="Órdenes abiertas actuales">
          {donutPrioridad.length === 0 ? (
            <EmptyChart msg="Sin órdenes abiertas" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={donutPrioridad}
                    dataKey="cantidad"
                    nameKey="nombre"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {donutPrioridad.map((d) => (
                      <Cell key={d.key} fill={COLORES_PRIORIDAD[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_ESTILO} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {donutPrioridad.map((d) => (
                  <span key={d.key} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORES_PRIORIDAD[d.key] }} />
                    {d.nombre} ({d.cantidad})
                  </span>
                ))}
              </div>
            </>
          )}
        </ChartCard>
      </div>

      {/* Fila 3: categorías + recientes */}
      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard titulo="Fallas por categoría" sub="Tipos de equipo con más OT en el período" className="lg:col-span-2">
          {porCategoria.length === 0 ? (
            <EmptyChart msg="Vincula equipos a las órdenes para ver este análisis" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={porCategoria} margin={{ left: -18, right: 8 }}>
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={TOOLTIP_ESTILO} />
                <Bar dataKey="cantidad" name="Fallas" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Recientes */}
        <div className="card-surface p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Órdenes recientes</h2>
            <Link to="/ordenes" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {ordenes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Cuando se reporte la primera falla aparecerá aquí
            </p>
          ) : (
            <div className="divide-y divide-border">
              {ordenes.slice(0, 8).map((o) => (
                <Link
                  key={o.id}
                  to={`/ordenes/${o.id}`}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-accent/50"
                >
                  <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{o.numero}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.sucursales?.nombre ?? '—'} · {formatFecha(o.fecha_reporte)}
                    </p>
                  </div>
                  <StatusBadge {...PRIORIDADES[o.prioridad as keyof typeof PRIORIDADES]} className="hidden sm:inline-flex" />
                  <StatusBadge {...ESTADOS_OT[o.estado as keyof typeof ESTADOS_OT]} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
