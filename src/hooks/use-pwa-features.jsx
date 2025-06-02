"use client"

import { useState, useEffect, useCallback } from "react"
import { initializeBackgroundSync, processPendingSyncRequests } from "../utils/pwa-helpers"

export function usePWAFeatures() {
  const [isOnline, setIsOnline] = useState(true)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [pendingSync, setPendingSync] = useState(0)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  // Verificar estado de la red
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    updateOnlineStatus()

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  // Verificar si la app está instalada
  useEffect(() => {
    const checkStandalone = () => {
      const isAppInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone ||
        document.referrer.includes("android-app://")

      setIsStandalone(isAppInstalled)
    }

    checkStandalone()

    // También verificar cuando cambie el modo de visualización
    const mediaQuery = window.matchMedia("(display-mode: standalone)")
    const handleChange = () => checkStandalone()

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [])

  // Capturar evento de instalación
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  // Cargar solicitudes pendientes
  useEffect(() => {
    try {
      const localData = localStorage.getItem("pendingRequestsCount")
      if (localData) {
        setPendingSync(Number.parseInt(localData, 10))
      }
    } catch (error) {
      console.error("Error al verificar solicitudes pendientes:", error)
    }
  }, [])

  // Inicializar Background Sync
  useEffect(() => {
    initializeBackgroundSync()
  }, [])

  // Función para mostrar el prompt de instalación
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    setDeferredPrompt(null)
    setCanInstall(false)

    return outcome === "accepted"
  }, [deferredPrompt])

  // Función para registrar una tarea de sincronización
  const registerSync = useCallback(async (tag) => {
    if (!("serviceWorker" in navigator) || !("SyncManager" in window)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // Usar notación de corchetes para evitar errores de TypeScript
      const syncManager = registration["sync"]

      if (!syncManager) {
        console.log("Background Sync no está disponible")
        return false
      }

      await syncManager["register"](tag)
      return true
    } catch (error) {
      console.error("Error al registrar sincronización:", error)
      return false
    }
  }, [])

  // Función para actualizar el contador de sincronizaciones pendientes
  const updatePendingSyncCount = useCallback((increment = true) => {
    setPendingSync((prev) => {
      const newCount = increment ? prev + 1 : Math.max(0, prev - 1)
      localStorage.setItem("pendingRequestsCount", newCount.toString())
      return newCount
    })
  }, [])

  // Función para procesar manualmente las solicitudes pendientes
  const processPendingRequests = useCallback(async () => {
    if (!navigator.onLine) return { processed: 0, failed: 0 }

    const result = await processPendingSyncRequests()

    // Actualizar el contador local
    setPendingSync((prev) => Math.max(0, prev - result.processed))

    return result
  }, [])

  return {
    isOnline,
    isStandalone,
    canInstall,
    pendingSync,
    promptInstall,
    registerSync,
    updatePendingSyncCount,
    processPendingRequests,
  }
}
