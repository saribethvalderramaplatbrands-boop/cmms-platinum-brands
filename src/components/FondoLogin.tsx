import { MARCAS_LISTA, type MarcaKey } from '@/lib/marcas'

/**
 * Fondo animado del login: rejilla en perspectiva, orbes de luz con los
 * colores de las marcas y logos flotando. Solo transform/opacity (GPU),
 * pointer-events desactivados. Solo se usa fuera de la app autenticada.
 */
export default function FondoLogin({ marca }: { marca: MarcaKey | null }) {
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

      {/* Logos flotantes */}
      {MARCAS_LISTA.map((m, i) => {
        const pos = [
          'left-[6%] top-[16%] w-16 sm:w-20',
          'right-[7%] top-[24%] w-16 sm:w-20',
          'right-[16%] bottom-[14%] w-20 sm:w-24',
        ][i]
        const anim = ['anim-float-a', 'anim-float-b', 'anim-float-c'][i]
        const activa = marca === null || marca === m.key
        return (
          <img
            key={m.key}
            src={m.logo}
            alt=""
            className={`absolute rounded-2xl bg-white/95 object-contain p-2.5 shadow-2xl transition-opacity duration-1000 ${pos} ${anim}`}
            style={{
              opacity: activa ? 0.92 : 0.25,
              boxShadow: `0 18px 50px -12px rgba(${m.glow}, 0.55)`,
            }}
          />
        )
      })}

      {/* Viñeta para legibilidad */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(4,6,12,0.72)_100%)]" />
    </div>
  )
}
