import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { KeyRound } from 'lucide-react'

/** Cambio de contraseña propio — solo accesible para administradores */
export default function CambiarPassword() {
  const { cambiarPassword, perfil } = useAuth()
  const navigate = useNavigate()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
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
    if (error) {
      setError(error)
      return
    }
    setOk(true)
    setTimeout(() => navigate('/'), 1500)
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 pt-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Cambiar mi contraseña</h1>
          <p className="text-sm text-muted-foreground">
            {perfil?.nombre} · Solo los administradores pueden cambiar contraseñas
          </p>
        </div>
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
        {ok && (
          <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            Contraseña actualizada correctamente
          </p>
        )}

        <button type="submit" disabled={cargando || ok} className="btn-pill w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {cargando ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  )
}
