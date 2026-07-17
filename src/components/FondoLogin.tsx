import { useMemo, type CSSProperties } from 'react'
import { MARCAS_LISTA, type MarcaKey } from '@/lib/marcas'

/**
 * Fondo animado del login: rejilla en perspectiva, orbes de luz con los
 * colores de las marcas y una lluvia sutil de íconos (muslitos KFC,
 * blizzards DQ y llaves de mantenimiento). Solo transform/opacity (GPU),
 * pointer-events desactivados. Solo se usa fuera de la app autenticada.
 */

/* ---- Íconos de línea (estilo outline simple) ---- */
function SvgLlave() {
  return (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  )
}

function SvgMuslito() {
  return (
    <>
      <ellipse cx="13.2" cy="9.2" rx="5" ry="6" transform="rotate(35 13.2 9.2)" />
      <path d="M8.6 13.4 5 17" />
      <circle cx="3.6" cy="17.9" r="1.5" />
      <circle cx="5.7" cy="19.4" r="1.5" />
    </>
  )
}

function SvgBlizzard() {
  return (
    <>
      <path d="M8.4 10.4c-.5-1.7.8-3.2 2.5-3.4-.5-1.6.5-3.1 2.1-3.5 1.6.4 2.6 1.9 2.1 3.5 1.7.2 3 1.7 2.5 3.4" />
      <path d="M6.4 10.4h11.2l-1.3 9a2.1 2.1 0 0 1-2.1 1.6H9.8a2.1 2.1 0 0 1-2.1-1.6l-1.3-9Z" />
      <path d="M14.6 6.2 18.2 2.6" />
      <circle cx="19.3" cy="2" r="1.2" />
    </>
  )
}

const TIPOS_ICONO = [
  { Comp: SvgMuslito, color: '255, 120, 130' }, // rojo suave KFC
  { Comp: SvgBlizzard, color: '255, 185, 120' }, // naranja suave DQ
  { Comp: SvgLlave, color: '215, 228, 255' }, // blanco azulado
] as const

interface IconoCfg {
  tipo: number
  left: string
  size: number
  op: number
  dur: number
  delay: number
  drift: string
}

function generarIconos(n: number): IconoCfg[] {
  return Array.from({ length: n }, (_, i) => {
    const dur = 17 + Math.random() * 12 // 17–29 s, caída lenta
    return {
      tipo: i % TIPOS_ICONO.length,
      left: `${(Math.random() * 96).toFixed(1)}%`,
      size: Math.round(20 + Math.random() * 18), // 20–38 px, pequeños
      op: +(0.07 + Math.random() * 0.07).toFixed(2), // 0.07–0.14, sutiles
      dur,
      delay: -Math.random() * dur, // ya repartidos al cargar
      drift: `${(Math.random() * 8 - 4).toFixed(1)}vw`,
    }
  })
}

export default function FondoLogin({ marca }: { marca: MarcaKey | null }) {
  const iconos = useMemo(() => generarIconos(21), [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#04060c]" aria-hidden="true">
      {/* Rejilla tecnológica en perspectiva */}
      <div className="anim-grid absolute -inset-x-1/2 top-1/2 h-[200%] opacity-[0.22]" />

      {/* Orbes de color por marca */}
      {MARCAS_LISTA.map((m, i) => {
        const activa = marca === null || marca === m.key
        const pos = [
          'left-[-12%] top-[-18%] h-[34rem] w-[34rem]',
          'right-[-14%] top-[8%] h-[30rem] w-[30rem]',
          'left-[22%] bottom-[-30%] h-[38rem] w-[38rem]',
        ][i]
        const dur = ['anim-orb-a', 'anim-orb-b', 'anim-orb-c'][i]
        return (
          <div
            key={m.key}
            className={`absolute rounded-full blur-[110px] transition-opacity duration-1000 ${pos} ${dur}`}
            style={{
              background: `radial-gradient(circle, rgba(${m.glow}, 0.65) 0%, transparent 65%)`,
              opacity: activa ? 1 : 0.18,
            }}
          />
        )
      })}

      {/* Lluvia sutil de íconos: muslitos, blizzards y llaves */}
      {iconos.map((ic, i) => {
        const { Comp, color } = TIPOS_ICONO[ic.tipo]
        return (
          <div
            key={i}
            className="anim-icono-cae absolute"
            style={
              {
                left: ic.left,
                '--icono-op': ic.op,
                '--icono-drift': ic.drift,
                animationDuration: `${ic.dur}s`,
                animationDelay: `${ic.delay}s`,
                color: `rgba(${color}, 1)`,
              } as CSSProperties
            }
          >
            <svg
              width={ic.size}
              height={ic.size}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Comp />
            </svg>
          </div>
        )
      })}

      {/* Viñeta para legibilidad */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(4,6,12,0.72)_100%)]" />
    </div>
  )
}
