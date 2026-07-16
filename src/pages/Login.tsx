import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Wrench } from 'lucide-react'
import { logoPlatinum } from '@/assets/logos'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    const { error } = await signIn(username, password)
    setCargando(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logoPlatinum} alt="Platinum Brands" className="mb-4 h-12 w-auto dark:invert dark:brightness-200" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span className="text-sm font-medium">Sistema de Gestión de Mantenimiento</span>
          </div>
        </div>

        <form onSubmit={entrar} className="card-surface space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="usuario">
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
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              placeholder="ej. svalderrama26"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <button type="submit" disabled={cargando} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          ¿Olvidaste tu contraseña? Pídele al administrador que te genere una temporal.
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          <Link to="/registro" className="underline underline-offset-2 hover:text-foreground">
            Configuración inicial: crear cuenta de administrador
          </Link>
        </p>
      </div>
    </div>
  )
}
