import { useEffect, useState } from 'react'
import { urlFirmada } from '@/lib/supabase'
import { ImageOff } from 'lucide-react'

interface Props {
  path: string
  alt: string
  className?: string
  onClick?: () => void
}

/** Imagen del bucket privado: resuelve URL firmada al montar */
export default function SignedImage({ path, alt, className, onClick }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vivo = true
    urlFirmada(path).then((u) => {
      if (!vivo) return
      if (u) setUrl(u)
      else setError(true)
    })
    return () => {
      vivo = false
    }
  }, [path])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className ?? ''}`}>
        <ImageOff className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }
  if (!url) return <div className={`animate-pulse bg-muted ${className ?? ''}`} />
  return <img src={url} alt={alt} className={className} onClick={onClick} loading="lazy" />
}
