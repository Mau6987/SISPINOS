"use client"

import { useState, useEffect } from "react"

export default function CacheIndicator() {
  const [usingCache, setUsingCache] = useState(false)

  useEffect(() => {
    // Verificar si estamos usando datos en caché
    const checkCacheStatus = () => {
      const cacheStatus = localStorage.getItem("usingCachedData")
      setUsingCache(cacheStatus === "true")
    }

    checkCacheStatus()

    // Escuchar eventos del service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "USING_CACHED_DATA") {
          setUsingCache(true)
          localStorage.setItem("usingCachedData", "true")
        }

        if (event.data && event.data.type === "USING_FRESH_DATA") {
          setUsingCache(false)
          localStorage.setItem("usingCachedData", "false")
        }
      })
    }
  }, [])

  // Este componente mantiene la lógica de caché pero no renderiza nada visible
  return null
}
