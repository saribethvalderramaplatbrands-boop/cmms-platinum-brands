# CMMS · Platinum Brands

Sistema de Gestión de Mantenimiento (CMMS) para las marcas KFC y DQ de Platinum Brands.

## Stack

- React 19 + TypeScript + Vite + Tailwind CSS
- Supabase (Auth, PostgreSQL con RLS, Storage, Edge Functions)
- Despliegue en Vercel

## Configuración de Vercel

Crear estas variables de entorno en el proyecto de Vercel:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | https://zgbkwlfymdfziawcrlix.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | (publishable key del proyecto) |

## Puesta en marcha (una sola vez)

1. En Supabase → **Authentication → Sign In / Providers → Email**: desactivar **"Confirm email"**
   (los usuarios usan correos internos `@platinumbrands.com`, no reciben correos reales).
2. Abrir la app → "Configuración inicial: crear cuenta de administrador".
3. Registrar el primer usuario → queda como **administrador automáticamente**.
4. Volver a Supabase → **Authentication**: desactivar el registro público
   ("Allow new users to sign up") para que solo el admin cree usuarios desde la app.

## Roles

- **Admin**: control total (usuarios, sucursales, equipos, asignación de órdenes).
- **Técnico**: ve y gestiona sus órdenes asignadas, sube evidencias, registra costos.
- **Sucursal**: reporta fallas con fotos y ve el estado de sus órdenes.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar con los valores reales
npm run dev
npm run build
```
