// Logos servidos desde Supabase Storage (bucket público "assets")
const ASSETS = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/assets`

export const logoPlatinum = `${ASSETS}/platinum.png`
export const logoKFC = `${ASSETS}/kfc.png`
export const logoDQ = `${ASSETS}/dq.png`
