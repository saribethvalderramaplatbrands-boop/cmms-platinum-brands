import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Wrench,
  CalendarClock,
  Package,
  FileSpreadsheet,
  Users,
  Building2,
  Moon,
  Sun,
  LogOut,
  KeyRound,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { MARCAS } from '@/lib/marcas'
import { ROLES } from '@/lib/constants'
import { cn } from '@/lib/utils'

const GERENCIAL = ['gerente_area', 'gerente_regional', 'supervisor']
const TODOS = ['admin', 'tecnico', 'sucursal', ...GERENCIAL]

const NAV_PRINCIPAL = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: TODOS },
  { to: '/ordenes', label: 'Órdenes de trabajo', icon: ClipboardList, roles: TODOS },
  { to: '/equipos', label: 'Equipos', icon: Wrench, roles: TODOS },
  { to: '/preventivos', label: 'Preventivos', icon: CalendarClock, roles: TODOS },
  { to: '/repuestos', label: 'Repuestos', icon: Package, roles: ['admin', 'tecnico'] },
  { to: '/reportes', label: 'Reportes', icon: FileSpreadsheet, roles: ['admin', 'tecnico', ...GERENCIAL] },
]

const NAV_ADMIN = [
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
  { to: '/admin/sucursales', label: 'Sucursales', icon: Building2, roles: ['admin'] },
]

function useTema() {
  const [oscuro, setOscuro] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
    localStorage.setItem('cmms-theme', oscuro ? 'dark' : 'light')
  }, [oscuro])
  return { oscuro, toggle: () => setOscuro((v) => !v) }
}

export default function Layout() {
  const { perfil, marca, signOut } = useAuth()
  const navigate = useNavigate()
  const { oscuro, toggle } = useTema()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const rol = perfil?.rol ?? 'sucursal'
  const info = MARCAS[marca ?? 'PLATINUM']
  const items = NAV_PRINCIPAL.filter((i) => i.roles.includes(rol))
  const itemsAdmin = NAV_ADMIN.filter((i) => i.roles.includes(rol))

  async function salir() {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium tracking-tight transition-all duration-150',
      isActive
        ? 'bg-primary/10 font-semibold text-primary'
        : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
    )

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
          <img src={info.logo} alt={info.nombre} className="max-h-full max-w-full object-contain" />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight">CMMS</p>
          <p className="text-xs font-medium text-muted-foreground">{info.corto}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass} onClick={() => setMenuAbierto(false)}>
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {itemsAdmin.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administración
            </p>
            {itemsAdmin.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMenuAbierto(false)}>
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {perfil?.nombre?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">{perfil?.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {ROLES[rol as keyof typeof ROLES] ?? rol} · {info.corto}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar escritorio */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar-background/85 backdrop-blur-xl lg:block">{sidebar}</aside>

      {/* Sidebar móvil */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAbierto(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-sidebar-background shadow-xl">{sidebar}</aside>
          <button
            onClick={() => setMenuAbierto(false)}
            className="absolute left-76 top-4 ml-72 rounded-full bg-card p-2 text-foreground shadow"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl lg:px-6">
          <button onClick={() => setMenuAbierto(true)} className="rounded-md p-2 hover:bg-accent lg:hidden" aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          {rol === 'admin' && (
            <button
              onClick={() => navigate('/cambiar-password')}
              className="rounded-full border border-border p-2 transition-colors duration-150 hover:bg-accent"
              aria-label="Cambiar mi contraseña"
              title="Cambiar mi contraseña"
            >
              <KeyRound className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={toggle}
            className="rounded-full border border-border p-2 transition-colors duration-150 hover:bg-accent"
            aria-label="Cambiar tema"
          >
            {oscuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={salir}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors duration-150 hover:bg-accent"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
