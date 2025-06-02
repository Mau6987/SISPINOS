"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/components/ui/button"
import { Card, CardContent } from "@/components/components/ui/card"

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Verificar si la app ya está instalada
    const isAppInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      document.referrer.includes("android-app://")

    if (isAppInstalled) {
      return // No mostrar el prompt si ya está instalada
    }

    // Capturar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevenir que Chrome muestre el prompt automáticamente
      e.preventDefault()
      // Guardar el evento para usarlo después
      setDeferredPrompt(e)
      // Mostrar nuestro prompt personalizado
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Mostrar el prompt de instalación
    deferredPrompt.prompt()

    // Esperar a que el usuario responda
    const choiceResult = await deferredPrompt.userChoice

    // Ocultar nuestro prompt
    setShowPrompt(false)
    setDeferredPrompt(null)

    // Registrar la respuesta del usuario
    if (choiceResult.outcome === "accepted") {
      console.log("Usuario aceptó la instalación")
    } else {
      console.log("Usuario rechazó la instalación")
    }
  }

  if (!showPrompt) return null

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-blue-800">¿Quieres instalar esta aplicación?</h3>
          <p className="text-sm text-blue-600">
            Instala esta app en tu dispositivo para un acceso más rápido y una mejor experiencia.
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrompt(false)}
            className="text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleInstallClick} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-1" /> Instalar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
