"use client"

import Navbar from "./Navbar"
import { usePathname } from "next/navigation"

export default function ClientLayout({ children }) {
  const pathname = usePathname() // Obtiene la ruta actual

  // No mostrar el Navbar en la página principal
  const showNavbar = pathname !== "/"

  return (
    <div className="flex min-h-screen">
      {/* Condición para renderizar el Navbar */}
      {showNavbar && <Navbar />}

      <div className="flex-1">
        <main>{children}</main>
      </div>
    </div>
  )
}

