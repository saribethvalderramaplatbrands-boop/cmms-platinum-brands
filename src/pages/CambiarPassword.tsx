import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { KeyRound } from 'lucide-react'

/** Pantalla obligatoria cuando el perfil tiene debe_cambiar_password */
export default function CambiarPassword() {
  const { cambiarPassword, perfil } = useAuth()
  const navigate = useNavigate()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setCargando(true)
    const { error } = await cambiarPassword(nueva)
    setCargando(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-lg font-semibold">Crea tu contraseña</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hola {perfil?.nombre?.split(' ')[0]}, por seguridad debes cambiar la contraseña temporal antes de continuar.
          </p>
        </div>

        <form onSubmit={guardar} className="card-surface space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="nueva">Nueva contraseña</label>
            <input
              id="nueva"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="confirmar">Confirmar contraseña</label>
            <input
              id="confirmar"
              type="password"
              autoComplete="new-password"
              required
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={cargando} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {cargando ? 'Guardando…' : 'Guardar y entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
