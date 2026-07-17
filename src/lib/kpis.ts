/**
 * Cálculo de KPIs de mantenimiento (funciones puras, sin side-effects).
 *
 * Definiciones (estándar de la industria):
 * - MTTR  : tiempo promedio de reparación = avg(fecha_cierre − fecha_reporte) de OT completadas
 * - MTTA  : tiempo promedio de respuesta  = avg(fecha_asignacion − fecha_reporte)
 * - MTBF  : tiempo promedio entre fallas  = promedio de intervalos entre fallas consecutivas
 *           de un mismo equipo (ventana móvil; se calcula con el historial completo)
 * - Cumplimiento OT : cohorte del período → creadas en el período ya completadas / creadas (sin canceladas)
 * - Preventivos al día : planes activos con proxima_fecha >= hoy / total activos
 * - Disponibilidad : equipos activos / (activos + en_reparacion)
 * - Backlog aging : OT abiertas agrupadas por antigüedad (0–7, 8–15, 16–30, +30 días)
 */

export interface OrdenKPI {
  id: string
  numero: string
  titulo: string
  estado: string
  prioridad: string
  sucursal_id: string
  equipo_id: string | null
  tecnico_id: string | null
  fecha_reporte: string
  fecha_asignacion: string | null
  fecha_cierre: string | null
  costo_mano_obra: number
  costo_repuestos: number
  sucursales?: { nombre: string; marcas: { nombre: string } | null } | null
  equipos?: { nombre: string; categorias_equipo: { nombre: string } | null } | null
  tecnico?: { nombre: string } | null
}

export interface PreventivoKPI {
  id: string
  nombre: string
  proxima_fecha: string
  activo: boolean
}

export interface EjecucionKPI {
  id: string
  preventivo_id: string
  fecha: string
}

export interface EquipoKPI {
  id: string
  nombre: string
  estado: string
}

export interface RepuestoKPI {
  id: string
  nombre: string
  stock: number
  stock_minimo: number
}

export type PeriodoKPI = 'mes' | '90d' | 'anio'

const HORA_MS = 3_600_000
const DIA_MS = 86_400_000

export const ESTADOS_ABIERTOS = ['reportada', 'asignada', 'en_proceso', 'espera_repuesto'] as const

export function esAbierta(o: OrdenKPI): boolean {
  return (ESTADOS_ABIERTOS as readonly string[]).includes(o.estado)
}

/** Fecha de inicio del período seleccionado */
export function inicioPeriodo(p: PeriodoKPI, ahora = new Date()): Date {
  if (p === 'mes') return new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  if (p === '90d') return new Date(ahora.getTime() - 90 * DIA_MS)
  return new Date(ahora.getFullYear(), ahora.getMonth() - 11, 1) // 12 meses
}

function dentro(fecha: string | null, inicio: Date): boolean {
  return !!fecha && new Date(fecha) >= inicio
}

function horasEntre(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / HORA_MS
}

/* ---------------- MTTR / MTTA / MTBF ---------------- */

/** MTTR en horas: promedio reporte→cierre de OT cerradas en el período */
export function calcMTTR(ordenes: OrdenKPI[], inicio: Date): number | null {
  const tiempos = ordenes
    .filter((o) => o.estado === 'completada' && dentro(o.fecha_cierre, inicio) && o.fecha_cierre)
    .map((o) => horasEntre(o.fecha_reporte, o.fecha_cierre!))
    .filter((h) => h >= 0)
  if (tiempos.length === 0) return null
  return tiempos.reduce((a, b) => a + b, 0) / tiempos.length
}

/** MTTA en horas: promedio reporte→asignación de OT creadas en el período */
export function calcMTTA(ordenes: OrdenKPI[], inicio: Date): number | null {
  const tiempos = ordenes
    .filter((o) => dentro(o.fecha_reporte, inicio) && o.fecha_asignacion)
    .map((o) => horasEntre(o.fecha_reporte, o.fecha_asignacion!))
    .filter((h) => h >= 0)
  if (tiempos.length === 0) return null
  return tiempos.reduce((a, b) => a + b, 0) / tiempos.length
}

/** MTBF en días: promedio de intervalos entre fallas consecutivas del mismo equipo */
export function calcMTBF(ordenes: OrdenKPI[]): number | null {
  const porEquipo = new Map<string, number[]>()
  for (const o of ordenes) {
    if (!o.equipo_id || o.estado === 'cancelada') continue
    const arr = porEquipo.get(o.equipo_id) ?? []
    arr.push(new Date(o.fecha_reporte).getTime())
    porEquipo.set(o.equipo_id, arr)
  }
  const intervalos: number[] = []
  for (const tiempos of porEquipo.values()) {
    if (tiempos.length < 2) continue
    tiempos.sort((a, b) => a - b)
    for (let i = 1; i < tiempos.length; i++) {
      intervalos.push((tiempos[i] - tiempos[i - 1]) / DIA_MS)
    }
  }
  if (intervalos.length === 0) return null
  return intervalos.reduce((a, b) => a + b, 0) / intervalos.length
}

/* ---------------- Cumplimiento / Costos ---------------- */

/** % de OT creadas en el período que ya fueron completadas (cohorte, sin canceladas) */
export function calcCumplimientoOT(
  ordenes: OrdenKPI[],
  inicio: Date,
): { pct: number | null; creadas: number; completadas: number } {
  const cohorte = ordenes.filter((o) => dentro(o.fecha_reporte, inicio) && o.estado !== 'cancelada')
  const completadas = cohorte.filter((o) => o.estado === 'completada').length
  return {
    pct: cohorte.length === 0 ? null : (completadas / cohorte.length) * 100,
    creadas: cohorte.length,
    completadas,
  }
}

/** Costo de OT cerradas en el período (mano de obra + repuestos) */
export function calcCostos(
  ordenes: OrdenKPI[],
  inicio: Date,
): { total: number; promedio: number | null; cerradas: number } {
  const cerradas = ordenes.filter((o) => o.estado === 'completada' && dentro(o.fecha_cierre, inicio))
  const total = cerradas.reduce((s, o) => s + (o.costo_mano_obra ?? 0) + (o.costo_repuestos ?? 0), 0)
  return {
    total,
    promedio: cerradas.length === 0 ? null : total / cerradas.length,
    cerradas: cerradas.length,
  }
}

/* ---------------- Backlog ---------------- */

/** Antigüedad del backlog actual (OT abiertas) */
export function calcBacklogAging(
  ordenes: OrdenKPI[],
  ahora = new Date(),
): { rango: string; cantidad: number }[] {
  const buckets = [
    { rango: '0–7 d', min: 0, max: 7 },
    { rango: '8–15 d', min: 7, max: 15 },
    { rango: '16–30 d', min: 15, max: 30 },
    { rango: '+30 d', min: 30, max: Infinity },
  ]
  const abiertas = ordenes.filter(esAbierta)
  return buckets.map((b) => ({
    rango: b.rango,
    cantidad: abiertas.filter((o) => {
      const dias = (ahora.getTime() - new Date(o.fecha_reporte).getTime()) / DIA_MS
      return dias > b.min && dias <= b.max
    }).length,
  }))
}

/* ---------------- Tendencias y rankings ---------------- */

/** Últimos 6 meses: OT creadas vs completadas */
export function calcTendencia(
  ordenes: OrdenKPI[],
  ahora = new Date(),
): { mes: string; creadas: number; completadas: number }[] {
  const meses: { mes: string; y: number; m: number; creadas: number; completadas: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const label = d.toLocaleDateString('es-PA', { month: 'short' }).replace('.', '')
    meses.push({
      mes: label.charAt(0).toUpperCase() + label.slice(1),
      y: d.getFullYear(),
      m: d.getMonth(),
      creadas: 0,
      completadas: 0,
    })
  }
  for (const o of ordenes) {
    const fr = new Date(o.fecha_reporte)
    const bucket = meses.find((b) => b.y === fr.getFullYear() && b.m === fr.getMonth())
    if (bucket) bucket.creadas++
    if (o.estado === 'completada' && o.fecha_cierre) {
      const fc = new Date(o.fecha_cierre)
      const bc = meses.find((b) => b.y === fc.getFullYear() && b.m === fc.getMonth())
      if (bc) bc.completadas++
    }
  }
  return meses.map(({ mes, creadas, completadas }) => ({ mes, creadas, completadas }))
}

function agruparContar(registros: (string | null | undefined)[], top: number) {
  const mapa = new Map<string, number>()
  for (const r of registros) {
    const key = r?.trim() ? r! : 'Sin asignar'
    mapa.set(key, (mapa.get(key) ?? 0) + 1)
  }
  return [...mapa.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, top)
}

/** Top sucursales por OT creadas en el período */
export function calcTopSucursales(ordenes: OrdenKPI[], inicio: Date, top = 5) {
  return agruparContar(
    ordenes.filter((o) => dentro(o.fecha_reporte, inicio)).map((o) => o.sucursales?.nombre),
    top,
  )
}

/** OT completadas por técnico en el período */
export function calcPorTecnico(ordenes: OrdenKPI[], inicio: Date, top = 6) {
  return agruparContar(
    ordenes
      .filter((o) => o.estado === 'completada' && dentro(o.fecha_cierre, inicio))
      .map((o) => o.tecnico?.nombre),
    top,
  )
}

/** Fallas por categoría de equipo en el período (solo OT ligadas a equipo) */
export function calcPorCategoria(ordenes: OrdenKPI[], inicio: Date, top = 6) {
  const nombres = ordenes
    .filter((o) => dentro(o.fecha_reporte, inicio))
    .map((o) => o.equipos?.categorias_equipo?.nombre)
    .filter((n): n is string => !!n)
  return agruparContar(nombres, top)
}

/* ---------------- Preventivos / Equipos / Repuestos ---------------- */

/** % de planes preventivos activos al día (proxima_fecha >= hoy) */
export function calcPreventivosAlDia(
  preventivos: PreventivoKPI[],
  ahora = new Date(),
): { pct: number | null; vencidos: number; alDia: number; total: number } {
  const activos = preventivos.filter((p) => p.activo)
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime()
  const vencidos = activos.filter((p) => new Date(p.proxima_fecha + 'T00:00:00').getTime() < hoy).length
  const alDia = activos.length - vencidos
  return {
    pct: activos.length === 0 ? null : (alDia / activos.length) * 100,
    vencidos,
    alDia,
    total: activos.length,
  }
}

/** % de equipos activos sobre el parque instalado (activos + en reparación) */
export function calcDisponibilidad(
  equipos: EquipoKPI[],
): { pct: number | null; activos: number; enReparacion: number; total: number } {
  const instalados = equipos.filter((e) => e.estado !== 'dado_de_baja')
  const enReparacion = instalados.filter((e) => e.estado === 'en_reparacion').length
  const activos = instalados.length - enReparacion
  return {
    pct: instalados.length === 0 ? null : (activos / instalados.length) * 100,
    activos,
    enReparacion,
    total: instalados.length,
  }
}

/** Repuestos activos en o por debajo del stock mínimo */
export function calcRepuestosBajos(repuestos: RepuestoKPI[]): RepuestoKPI[] {
  return repuestos.filter((r) => r.stock_minimo > 0 && r.stock <= r.stock_minimo)
}

/* ---------------- Formato ---------------- */

/** '45 min', '8.5 h', '3.2 d' — según magnitud */
export function fmtDuracion(horas: number | null): string {
  if (horas === null) return '—'
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`
  if (horas < 48) return `${horas.toFixed(1)} h`
  return `${(horas / 24).toFixed(1)} d`
}

export function fmtDias(dias: number | null): string {
  if (dias === null) return '—'
  return `${dias.toFixed(0)} d`
}

export function fmtPct(pct: number | null): string {
  if (pct === null) return '—'
  return `${pct.toFixed(0)}%`
}

export function fmtDineroCorto(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}
