"use client"

import { useState, useEffect } from "react"

export default function ResponsiveContainer({ children, className = "" }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Verificar tamaño inicial
    checkScreenSize()

    // Agregar listener para cambios de tamaño
    window.addEventListener("resize", checkScreenSize)

    // Limpiar listener
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return (
    <div className={`transition-all duration-300 ${isMobile ? "px-3 py-4" : "px-6 py-8"} ${className}`}>{children}</div>
  )
}
