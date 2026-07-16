import type { Enums } from '@/types/database'

export const ESTADOS_OT: Record<Enums<'estado_ot'>, { label: string; dot: string; pill: string }> = {
  reportada: { label: 'Reportada', dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  asignada: { label: 'Asignada', dot: 'bg-blue-500', pill: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  en_proceso: { label: 'En proceso', dot: 'bg-violet-500', pill: 'bg-violet-500/10 text-violet-700 dark:text-violet-400' },
  espera_repuesto: { label: 'Espera de repuesto', dot: 'bg-orange-500', pill: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  completada: { label: 'Completada', dot: 'bg-green-500', pill: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  cancelada: { label: 'Cancelada', dot: 'bg-stone-400', pill: 'bg-stone-500/10 text-stone-600 dark:text-stone-400' },
}

export const PRIORIDADES: Record<Enums<'prioridad_ot'>, { label: string; dot: string; pill: string }> = {
  baja: { label: 'Baja', dot: 'bg-stone-400', pill: 'bg-stone-500/10 text-stone-600 dark:text-stone-400' },
  media: { label: 'Media', dot: 'bg-blue-500', pill: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  alta: { label: 'Alta', dot: 'bg-orange-500', pill: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  critica: { label: 'Crítica', dot: 'bg-red-500', pill: 'bg-red-500/10 text-red-700 dark:text-red-400' },
}

export const ROLES: Record<Enums<'rol_usuario'>, string> = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  sucursal: 'Sucursal',
  gerente_area: 'Gerente de Área',
  gerente_regional: 'Gerente Regional',
  supervisor: 'Supervisor',
}

export const ESTADOS_EQUIPO: Record<Enums<'estado_equipo'>, { label: string; dot: string; pill: string }> = {
  activo: { label: 'Activo', dot: 'bg-green-500', pill: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  en_reparacion: { label: 'En reparación', dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  dado_de_baja: { label: 'Dado de baja', dot: 'bg-stone-400', pill: 'bg-stone-500/10 text-stone-600 dark:text-stone-400' },
}

export const FRECUENCIAS: Record<Enums<'frecuencia_preventivo'>, string> = {
  semanal: 'Semanal',
  quincenal: 'Quincenal',
  mensual: 'Mensual',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PA', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-PA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatDinero(n: number | null | undefined): string {
  return `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
