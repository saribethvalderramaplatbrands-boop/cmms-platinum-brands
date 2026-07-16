import { CalendarClock, Package, FileSpreadsheet } from 'lucide-react'

const ICONOS: Record<string, typeof CalendarClock> = {
  preventivos: CalendarClock,
  repuestos: Package,
  reportes: FileSpreadsheet,
}

const TEXTOS: Record<string, { titulo: string; descripcion: string }> = {
  preventivos: {
    titulo: 'Mantenimientos preventivos',
    descripcion: 'Calendario mensual con auto-repetición por frecuencia, checklists por equipo y registro de evidencia. Ya está en construcción.',
  },
  repuestos: {
    titulo: 'Inventario de repuestos',
    descripcion: 'Catálogo con stock, descuento automático al usarse en una orden y alertas de stock bajo. Ya está en construcción.',
  },
  reportes: {
    titulo: 'Reportes y exportación',
    descripcion: 'Exporta a Excel las órdenes por fechas y sucursal, costos y cumplimiento de preventivos. Ya está en construcción.',
  },
}

export default function Proximamente({ modulo }: { modulo: 'preventivos' | 'repuestos' | 'reportes' }) {
  const Icono = ICONOS[modulo]
  const texto = TEXTOS[modulo]
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icono className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold">{texto.titulo}</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{texto.descripcion}</p>
      <span className="mt-4 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">Próximamente</span>
    </div>
  )
}
