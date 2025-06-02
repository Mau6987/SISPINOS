"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "@/components/hooks/use-toast"

export default function NetworkStatusHandler({ children, onOffline, onOnline }) {
  const [isOnline, setIsOnline] = useState(true)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    toast({
      title: "Conexión restaurada",
      description: "Las solicitudes pendientes se sincronizarán automáticamente.",
    })

    if (onOnline) onOnline()
  }, [onOnline])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    toast({
      title: "Sin conexión",
      description: "Puedes seguir trabajando. Los cambios se sincronizarán cuando vuelva la conexión.",
      variant: "destructive",
    })

    if (onOffline) onOffline()
  }, [onOffline])

  useEffect(() => {
    // Establecer estado inicial
    setIsOnline(navigator.onLine)

    // Agregar event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Limpiar event listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [handleOnline, handleOffline])

  return (
    <div className="network-status-wrapper" data-online={isOnline}>
      {children}
    </div>
  )
}
