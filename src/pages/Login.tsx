import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ChevronRight, ChevronLeft, Wrench } from 'lucide-react'
import FondoLogin from '@/components/FondoLogin'
import { MARCAS, MARCAS_LISTA, type MarcaKey } from '@/lib/marcas'
import { logoPlatinum } from '@/assets/logos'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [marca, setMarca] = useState<MarcaKey | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    if (!marca) return
    setError(null)
    setCargando(true)
    const { error } = await signIn(username, password, marca)
    setCargando(false)
    if (error) setError(error)
    else navigate('/')
  }

  const info = marca ? MARCAS[marca] : null

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <FondoLogin marca={marca} />

      <div
        className={`relative z-10 w-full transition-all duration-500 ${
          marca === null ? 'max-w-md md:max-w-5xl' : 'max-w-md'
        }`}
      >
        {/* Encabezado */}
        <div className="anim-fade-up mb-8 flex flex-col items-center text-center md:mb-12">
          <img
            src={logoPlatinum}
            alt="Platinum Brands"
            className="mb-5 h-11 w-auto brightness-0 invert md:h-14"
          />
          <div className="flex items-center gap-2 text-white/70">
            <Wrench className="h-4 w-4" />
            <span className="text-sm font-medium tracking-tight">
              Sistema de Gestión de Mantenimiento
            </span>
          </div>
        </div>

        {marca === null ? (
          /* -------- Selector de marca: vertical en móvil, horizontal en web -------- */
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
            <p
              className="anim-fade-up px-1 text-center text-sm font-medium text-white/60 md:col-span-3 md:mb-1 md:text-base"
              style={{ animationDelay: '80ms' }}
            >
              ¿Dónde quieres entrar?
            </p>
            {MARCAS_LISTA.map((m, i) => (
              <button
                key={m.key}
                onClick={() => {
                  setMarca(m.key)
                  setError(null)
                }}
                className="glass-panel anim-fade-up group relative flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12] md:flex-col md:items-center md:gap-4 md:px-6 md:pb-8 md:pt-10 md:text-center"
                style={{
                  animationDelay: `${140 + i * 90}ms`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                }}
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg transition-transform duration-300 group-hover:scale-105 md:h-28 md:w-28 md:rounded-[1.75rem] md:p-4"
                  style={{ boxShadow: `0 14px 34px -8px rgba(${m.glow}, 0.5)` }}
                >
                  <img src={m.logo} alt={m.nombre} className="max-h-full max-w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1 md:flex-none">
                  <span className="block text-base font-bold tracking-tight text-white md:text-xl">
                    {m.nombre}
                  </span>
                  <span className="block truncate text-sm text-white/55 md:mt-1 md:whitespace-normal">
                    {m.tagline}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white/80 md:absolute md:right-4 md:top-4" />
              </button>
            ))}
          </div>
        ) : (
          /* -------- Formulario por marca -------- */
          <form
            onSubmit={entrar}
            className="glass-panel anim-fade-up space-y-4 p-6"
            style={{ boxShadow: `0 24px 64px -16px rgba(${info!.glow}, 0.4)` }}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setMarca(null)
                  setError(null)
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:bg-white/10"
                aria-label="Volver"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
                <img src={info!.logo} alt={info!.nombre} className="max-h-full max-w-full object-contain" />
              </span>
              <div className="leading-tight">
                <p className="text-base font-bold tracking-tight text-white">{info!.nombre}</p>
                <p className="text-xs text-white/55">{info!.tagline}</p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/85" htmlFor="usuario">
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35 focus:border-white/40 focus:bg-white/[0.14]"
                placeholder="ej. svalderrama26"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/85" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-[15px] text-white outline-none transition-all placeholder:text-white/35 focus:border-white/40 focus:bg-white/[0.14]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-medium text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-full py-3.5 text-[15px] font-bold tracking-tight text-white transition-all duration-200 active:scale-[0.97] disabled:opacity-50"
              style={{ background: `hsl(${info!.primario})` }}
            >
              {cargando ? 'Entrando…' : `Entrar a ${info!.corto}`}
            </button>
          </form>
        )}

        <p className="anim-fade-up mt-6 text-center text-xs text-white/45" style={{ animationDelay: '300ms' }}>
          ¿Olvidaste tu contraseña? Pídele al administrador que te genere una nueva.
        </p>
        <p className="mt-2 text-center text-xs text-white/35">
          <Link to="/registro" className="underline underline-offset-2 transition-colors hover:text-white/70">
            Configuración inicial: crear cuenta de administrador
          </Link>
        </p>
      </div>
    </div>
  )
}
