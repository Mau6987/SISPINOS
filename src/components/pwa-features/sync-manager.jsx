"use client"

import { useState, useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/components/ui/alert"
import { Button } from "@/components/components/ui/button"

export default function SyncManager({ onSync }) {
  const [pendingRequests, setPendingRequests] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Cargar solicitudes pendientes del localStorage
    const checkPendingRequests = () => {
      try {
        const localData = localStorage.getItem("pendingRequestsCount")
        if (localData) {
          setPendingRequests(Number.parseInt(localData, 10))
        }
      } catch (error) {
        console.error("Error al verificar solicitudes pendientes:", error)
      }
    }

    checkPendingRequests()

    // Verificar periódicamente si hay solicitudes pendientes
    const interval = setInterval(checkPendingRequests, 30000)

    // Escuchar eventos de sincronización del service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "SYNC_COMPLETED") {
          checkPendingRequests()
        }
      })
    }

    return () => clearInterval(interval)
  }, [])

  const handleManualSync = async () => {
    if (isSyncing || !onSync) return

    setIsSyncing(true)
    try {
      await onSync()
      // Actualizar contador de solicitudes pendientes
      const newCount = Math.max(0, pendingRequests - 1)
      localStorage.setItem("pendingRequestsCount", newCount.toString())
      setPendingRequests(newCount)
    } catch (error) {
      console.error("Error al sincronizar:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (pendingRequests <= 0) return null

  return (
    <Alert className="bg-yellow-50 border-yellow-200 mb-4">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex justify-between items-center">
        <span className="text-yellow-800">
          {pendingRequests} solicitud{pendingRequests === 1 ? "" : "es"} pendiente{pendingRequests === 1 ? "" : "s"} de
          sincronización
        </span>
        {navigator.onLine && (
          <Button
            size="sm"
            variant="outline"
            className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
