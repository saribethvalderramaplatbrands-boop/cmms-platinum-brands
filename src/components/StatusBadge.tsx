import { cn } from '@/lib/utils'

interface Props {
  label: string
  dot: string
  pill: string
  className?: string
}

/** Insignia tipo píldora con punto de color — estados y prioridades */
export default function StatusBadge({ label, dot, pill, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        pill,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {label}
    </span>
  )
}
