"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"
import { Badge } from "@/components/components/ui/badge"
import { toast } from "@/components/hooks/use-toast"

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Establecer estado inicial
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Conexión restaurada",
        description: "Los datos se están sincronizando automáticamente.",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Sin conexión",
        description: "Puedes seguir trabajando. Los cambios se sincronizarán cuando vuelva la conexión.",
        variant: "destructive",
      })
    }

    // Agregar event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Limpiar event listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <Badge
      variant="outline"
      className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1 animate-pulse"
    >
      <WifiOff className="h-3 w-3" /> Modo Offline
    </Badge>
  )
}
