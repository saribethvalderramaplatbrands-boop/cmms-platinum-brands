import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ShieldCheck } from 'lucide-react'
import { logoPlatinum } from '@/assets/logos'

/** Solo para la configuración inicial: el primer usuario queda como admin */
export default function Registro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function crear(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setAviso(null)
    setCargando(true)
    const { error, needsConfirm } = await registrar(nombre, username, password)
    setCargando(false)
    if (error) {
      setError(error)
    } else if (needsConfirm) {
      setAviso('Cuenta creada, pero Supabase tiene la confirmación por correo activada. Desactívala en Authentication → Providers → Email → "Confirm email" y vuelve a entrar.')
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src={logoPlatinum} alt="Platinum Brands" className="mb-4 h-12 w-auto dark:invert dark:brightness-200" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Configuración inicial · Cuenta de administrador</span>
          </div>
        </div>

        <form onSubmit={crear} className="card-surface space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Saribeth Valderrama"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              type="text"
              autoCapitalize="none"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="svalderrama26"
            />
            <p className="mt-1 text-xs text-muted-foreground">Sin espacios ni acentos. Así entrarás siempre.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {aviso && <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">{aviso}</p>}

          <button type="submit" disabled={cargando} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {cargando ? 'Creando…' : 'Crear cuenta de administrador'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/login" className="underline underline-offset-2 hover:text-foreground">
            Ya tengo cuenta · Ir al login
          </Link>
        </p>
      </div>
    </div>
  )
}
