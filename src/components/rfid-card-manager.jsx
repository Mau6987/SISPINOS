"use client"

import { useState } from "react"
import { CreditCard, Save, X } from "lucide-react"
import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/components/ui/dialog"
import { toast } from "@/components/hooks/use-toast"

export default function RFIDCardManager({ userId, userName, currentCardNumber, onSave, isOnline }) {
  const [showModal, setShowModal] = useState(false)
  const [cardNumber, setCardNumber] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)

  const handleOpenModal = () => {
    setCardNumber(currentCardNumber || "")
    setShowModal(true)
  }

  const verifyCardNumber = async (number) => {
    if (!number.trim()) return { valida: true }

    try {
      setIsVerifying(true)
      const response = await fetch("https://mi-backendsecond.onrender.com/verificartarjeta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ numeroTarjetaRFID: number }),
      })

      if (response.ok) {
        const data = await response.json()
        return data
      } else {
        throw new Error("Error al verificar la tarjeta")
      }
    } catch (error) {
      console.error("Error al verificar la tarjeta:", error)
      return { valida: false, message: "Error de conexión al verificar la tarjeta" }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSaveCard = async () => {
    // Si el número de tarjeta no ha cambiado, cerramos el modal
    if (cardNumber === currentCardNumber) {
      setShowModal(false)
      return
    }

    // Verificar si la tarjeta ya existe (solo si hay un número)
    if (cardNumber.trim()) {
      const verificationResult = await verifyCardNumber(cardNumber)

      if (!verificationResult.valida) {
        toast({
          title: "Error",
          description: verificationResult.message || "El número de tarjeta ya está en uso",
          variant: "destructive",
        })
        return
      }
    }

    try {
      await onSave(cardNumber)
      setShowModal(false)

      toast({
        title: "Éxito",
        description: cardNumber.trim() ? "Tarjeta RFID asignada correctamente" : "Tarjeta RFID eliminada correctamente",
      })
    } catch (error) {
      console.error("Error al guardar la tarjeta:", error)

      toast({
        title: "Error",
        description: "No se pudo guardar la tarjeta RFID",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        size="sm"
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {currentCardNumber ? "Ver Tarjeta" : "Añadir Tarjeta"}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent aria-describedby="rfid-dialog-description">
          <DialogHeader>
            <DialogTitle>Gestión de Tarjeta RFID</DialogTitle>
          </DialogHeader>

          <div className="py-4" id="rfid-dialog-description">
            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-700">Información de Tarjeta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  Usuario: <span className="font-medium">{userName}</span>
                </p>
                {currentCardNumber && (
                  <div className="mb-4">
                    <p className="text-sm">Tarjeta actual:</p>
                    <div className="flex items-center mt-1 p-2 bg-white rounded-md border border-blue-200">
                      <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-mono">{currentCardNumber}</span>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label htmlFor="cardNumber" className="block text-sm font-medium mb-1">
                    {currentCardNumber ? "Nueva tarjeta RFID:" : "Número de tarjeta RFID:"}
                  </label>
                  <Input
                    id="cardNumber"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="Ingrese el número de tarjeta"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deje en blanco para eliminar la asignación de tarjeta</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveCard} disabled={isVerifying || !isOnline}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
