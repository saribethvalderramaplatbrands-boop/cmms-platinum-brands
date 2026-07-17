// Logos DQ y Platinum servidos desde Supabase Storage (bucket público "assets")
// Logo KFC: versión clásica incrustada en base64 (ver kfcLogo.ts)
import { logoKFCData } from './kfcLogo'

const ASSETS = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets`

export const logoPlatinum = `${ASSETS}/platinum.png`
export const logoKFC = logoKFCData
export const logoDQ = `${ASSETS}/dq.png`
