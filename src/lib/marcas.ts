import { logoKFC, logoDQ, logoPlatinum } from '@/assets/logos'

export type MarcaKey = 'PLATINUM' | 'KFC' | 'DQ'

export interface MarcaInfo {
  key: MarcaKey
  nombre: string
  corto: string
  tagline: string
  logo: string
  /** triplete HSL para variables CSS (--primary) */
  primario: string
  /** RGB para orbes brillantes del fondo */
  glow: string
}

export const MARCAS: Record<MarcaKey, MarcaInfo> = {
  KFC: {
    key: 'KFC',
    nombre: 'KFC',
    corto: 'KFC',
    tagline: 'Sucursales y gerencias KFC',
    logo: logoKFC,
    primario: '349 100% 45%', // rojo del logo #E4002B
    glow: '228, 0, 43',
  },
  DQ: {
    key: 'DQ',
    nombre: 'Dairy Queen',
    corto: 'DQ',
    tagline: 'Sucursales y gerencias DQ',
    logo: logoDQ,
    primario: '32 94% 52%', // naranja del logo #F7941D
    glow: '247, 148, 29',
  },
  PLATINUM: {
    key: 'PLATINUM',
    nombre: 'Platinum Brands',
    corto: 'Platinum',
    tagline: 'Administración, técnicos y supervisión',
    logo: logoPlatinum,
    primario: '213 100% 38%', // azul corporativo #0048A8
    glow: '0, 72, 168',
  },
}

export const MARCAS_LISTA: MarcaInfo[] = [MARCAS.KFC, MARCAS.DQ, MARCAS.PLATINUM]

/** Marca a la que pertenece un perfil: corporativo (Platinum) o su marca (KFC/DQ) */
export function marcaDePerfil(perfil: {
  rol: string
  marcas?: { nombre: string } | null
}): MarcaKey {
  if (perfil.rol === 'admin' || perfil.rol === 'tecnico' || perfil.rol === 'supervisor') return 'PLATINUM'
  if (perfil.marcas?.nombre === 'KFC') return 'KFC'
  if (perfil.marcas?.nombre === 'DQ') return 'DQ'
  return 'PLATINUM'
}
