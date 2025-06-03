"use client"

import { useState, useEffect } from "react"
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/components/ui/alert"
import { Button } from "@/components/components/ui/button"
import { processPendingSyncRequests, initializeBackgroundSync } from "../../utils/pwa-helpers"

export default function SyncManagerEnhanced({ onSync }) {
  const [pendingRequests, setPendingRequests] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncStatus, setLastSyncStatus] = useState(null)

  useEffect(() => {
    // Inicializar background sync
    initializeBackgroundSync()

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
    const interval = setInterval(checkPendingRequests, 10000) // Cada 10 segundos

    // Escuchar eventos de sincronización del service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      const handleMessage = (event) => {
        if (event.data && event.data.type === "SYNC_COMPLETED") {
          checkPendingRequests()
          setLastSyncStatus("success")
          setTimeout(() => setLastSyncStatus(null), 3000)
        }

        if (event.data && event.data.type === "SYNC_FAILED") {
          setLastSyncStatus("error")
          setTimeout(() => setLastSyncStatus(null), 5000)
        }
      }

      navigator.serviceWorker.addEventListener("message", handleMessage)

      return () => {
        clearInterval(interval)
        navigator.serviceWorker.removeEventListener("message", handleMessage)
      }
    }

    return () => clearInterval(interval)
  }, [])

  const handleManualSync = async () => {
    if (isSyncing) return

    setIsSyncing(true)
    setLastSyncStatus(null)

    try {
      // Procesar solicitudes pendientes de IndexedDB
      const result = await processPendingSyncRequests()

      console.log(`Sincronización manual: ${result.processed} procesadas, ${result.failed} fallidas`)

      // Ejecutar sincronización personalizada si se proporciona
      if (onSync) {
        await onSync()
      }

      // Actualizar contador de solicitudes pendientes
      const remainingCount = Number.parseInt(localStorage.getItem("pendingRequestsCount") || "0", 10)
      setPendingRequests(remainingCount)

      setLastSyncStatus("success")
      setTimeout(() => setLastSyncStatus(null), 3000)
    } catch (error) {
      console.error("Error al sincronizar:", error)
      setLastSyncStatus("error")
      setTimeout(() => setLastSyncStatus(null), 5000)
    } finally {
      setIsSyncing(false)
    }
  }

  if (pendingRequests <= 0 && !lastSyncStatus) return null

  return (
    <Alert
      className={`mb-4 ${
        lastSyncStatus === "success"
          ? "bg-green-50 border-green-200"
          : lastSyncStatus === "error"
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200"
      }`}
    >
      {lastSyncStatus === "success" ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : lastSyncStatus === "error" ? (
        <XCircle className="h-4 w-4 text-red-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-yellow-600" />
      )}

      <AlertDescription className="flex justify-between items-center">
        <span
          className={`${
            lastSyncStatus === "success"
              ? "text-green-800"
              : lastSyncStatus === "error"
                ? "text-red-800"
                : "text-yellow-800"
          }`}
        >
          {lastSyncStatus === "success"
            ? "Sincronización completada exitosamente"
            : lastSyncStatus === "error"
              ? "Error en la sincronización. Inténtalo de nuevo."
              : `${pendingRequests} solicitud${pendingRequests === 1 ? "" : "es"} pendiente${pendingRequests === 1 ? "" : "s"} de sincronización`}
        </span>

        {navigator.onLine && pendingRequests > 0 && (
          <Button
            size="sm"
            variant="outline"
            className={`${
              lastSyncStatus === "success"
                ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                : lastSyncStatus === "error"
                  ? "bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
                  : "bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
            }`}
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
