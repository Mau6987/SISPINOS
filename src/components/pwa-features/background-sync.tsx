"use client"

import { useEffect } from "react"

const registerBackgroundSync = async (syncTag, onSyncRegistered) => {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
    console.log("Background Sync no está soportado en este navegador")
    return false
  }

  try {
    // Esperar a que el service worker esté listo
    const registration = await navigator.serviceWorker.ready

    // Acceder a sync usando notación de corchetes para evitar errores de TypeScript
    const syncManager = registration["sync"]

    if (!syncManager) {
      console.log("Background Sync no está disponible en este navegador")
      return false
    }

    // Usar notación de corchetes para acceder al método register
    await syncManager["register"](syncTag)

    if (onSyncRegistered) {
      onSyncRegistered()
    }

    console.log("Background Sync registrado con éxito")
    return true
  } catch (error) {
    console.error("Error al registrar Background Sync:", error)
    return false
  }
}

export default function BackgroundSync({ syncTag = "app-sync", onSyncRegistered }) {
  useEffect(() => {
    // Solo registrar si estamos online
    if (navigator.onLine) {
      registerBackgroundSync(syncTag, onSyncRegistered)
    }

    // Registrar cuando volvamos a estar online
    const handleOnline = () => {
      registerBackgroundSync(syncTag, onSyncRegistered)
    }

    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [syncTag, onSyncRegistered])

  // Este componente no renderiza nada visible
  return null
}
