"use client"

import { useEffect } from "react"
import { isBackgroundSyncSupported } from "../../utils/pwa-helpers"

const registerBackgroundSync = async (syncTag, onSyncRegistered, onSyncError) => {
  // Verificar soporte básico
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker no está soportado en este navegador")
    return false
  }

  // Verificar si estamos en HTTPS o localhost
  const isSecureContext =
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"

  if (!isSecureContext) {
    console.log("Background Sync requiere HTTPS o localhost")
    return false
  }

  // Verificar si Background Sync está soportado y permitido
  const isSupported = await isBackgroundSyncSupported()
  if (!isSupported) {
    console.log("Background Sync no está disponible o no tiene permisos")
    return false
  }

  try {
    // Esperar a que el service worker esté listo
    const registration = await navigator.serviceWorker.ready

    // Registrar el sync
    await registration.sync.register(syncTag)

    if (onSyncRegistered) {
      onSyncRegistered()
    }

    console.log("Background Sync registrado con éxito:", syncTag)
    return true
  } catch (error) {
    console.log("Background Sync no disponible:", error.message)

    if (onSyncError) {
      onSyncError(error)
    }

    // Si falla Background Sync, la sincronización manual funcionará
    return false
  }
}

export default function BackgroundSyncEnhanced({ syncTag = "app-sync", onSyncRegistered, onSyncError }) {
  useEffect(() => {
    const handleSync = async () => {
      // Solo registrar si estamos online
      if (navigator.onLine) {
        await registerBackgroundSync(syncTag, onSyncRegistered, onSyncError)
      }
    }

    // Registrar cuando volvamos a estar online
    const handleOnline = () => {
      console.log("Conexión restaurada, intentando registrar Background Sync...")
      registerBackgroundSync(syncTag, onSyncRegistered, onSyncError)
    }

    // Registrar inmediatamente si estamos online
    handleSync()

    // Escuchar eventos de conexión
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [syncTag, onSyncRegistered, onSyncError])

  // Este componente no renderiza nada visible
  return null
}
