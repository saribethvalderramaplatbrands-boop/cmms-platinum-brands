import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Registro from '@/pages/Registro'
import CambiarPassword from '@/pages/CambiarPassword'
import Dashboard from '@/pages/Dashboard'
import Ordenes from '@/pages/Ordenes'
import NuevaOrden from '@/pages/NuevaOrden'
import OrdenDetalle from '@/pages/OrdenDetalle'
import Equipos from '@/pages/Equipos'
import AdminUsuarios from '@/pages/admin/Usuarios'
import AdminSucursales from '@/pages/admin/Sucursales'
import Proximamente from '@/pages/Proximamente'
import type { ReactNode } from 'react'
import { logoPlatinum } from '@/assets/logos'

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <img src={logoPlatinum} alt="Platinum Brands" className="h-10 w-auto animate-pulse dark:invert dark:brightness-200" />
    </div>
  )
}

/** Requiere sesión activa y usuario activo */
function Protegido({ children }: { children: ReactNode }) {
  const { session, perfil, loading } = useAuth()
  if (loading) return <Splash />
  if (!session) return <Navigate to="/login" replace />
  if (perfil && !perfil.activo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-center">
        <p className="text-sm text-muted-foreground">Tu usuario está desactivado. Contacta al administrador.</p>
      </div>
    )
  }
  return <>{children}</>
}

function SoloAdmin({ children }: { children: ReactNode }) {
  const { perfil, loading } = useAuth()
  if (loading) return <Splash />
  if (perfil?.rol !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function Rutas() {
  const { session, loading, validando } = useAuth()

  if (loading) return <Splash />

  return (
    <Routes>
      <Route path="/login" element={session && !validando ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/registro" element={session ? <Navigate to="/" replace /> : <Registro />} />
      <Route
        element={
          <Protegido>
            <Layout />
          </Protegido>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/cambiar-password"
          element={
            <SoloAdmin>
              <CambiarPassword />
            </SoloAdmin>
          }
        />
        <Route path="/ordenes" element={<Ordenes />} />
        <Route path="/ordenes/nueva" element={<NuevaOrden />} />
        <Route path="/ordenes/:id" element={<OrdenDetalle />} />
        <Route path="/equipos" element={<Equipos />} />
        <Route path="/preventivos" element={<Proximamente modulo="preventivos" />} />
        <Route path="/repuestos" element={<Proximamente modulo="repuestos" />} />
        <Route path="/reportes" element={<Proximamente modulo="reportes" />} />
        <Route
          path="/admin/usuarios"
          element={
            <SoloAdmin>
              <AdminUsuarios />
            </SoloAdmin>
          }
        />
        <Route
          path="/admin/sucursales"
          element={
            <SoloAdmin>
              <AdminSucursales />
            </SoloAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Rutas />
    </AuthProvider>
  )
}
