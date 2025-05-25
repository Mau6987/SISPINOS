"use client"

import { useState } from "react"
import { Lock, Unlock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/components/ui/button"
import { Textarea } from "@/components/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/components/ui/dialog"
import { Badge } from "@/components/components/ui/badge"
import { toast } from "@/components/hooks/use-toast"

export default function UserBlockManager({
  userId,
  userName,
  isBlocked,
  blockReason,
  blockDate,
  onBlockStatusChange,
  isOnline,
}) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleOpenModal = () => {
    setReason(blockReason || "")
    setShowModal(true)
  }

  const handleBlockAction = async () => {
    if (isBlocked) {
      // Desbloquear usuario
      try {
        setIsProcessing(true)
        await onBlockStatusChange(false)
        setShowModal(false)

        toast({
          title: "Usuario desbloqueado",
          description: `${userName} ha sido desbloqueado exitosamente.`,
        })
      } catch (error) {
        console.error("Error al desbloquear usuario:", error)

        toast({
          title: "Error",
          description: "No se pudo desbloquear al usuario.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    } else {
      // Bloquear usuario
      if (!reason.trim()) {
        toast({
          title: "Error",
          description: "Debe proporcionar un motivo para el bloqueo.",
          variant: "destructive",
        })
        return
      }

      try {
        setIsProcessing(true)
        await onBlockStatusChange(true, reason)
        setShowModal(false)

        toast({
          title: "Usuario bloqueado",
          description: `${userName} ha sido bloqueado exitosamente.`,
        })
      } catch (error) {
        console.error("Error al bloquear usuario:", error)

        toast({
          title: "Error",
          description: "No se pudo bloquear al usuario.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        size="sm"
        className={
          isBlocked
            ? "text-green-600 hover:text-green-800 hover:bg-green-50 border-green-300"
            : "text-red-600 hover:text-red-800 hover:bg-red-50 border-red-300"
        }
      >
        {isBlocked ? (
          <>
            <Unlock className="h-4 w-4 mr-2" />
            Desbloquear
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Bloquear
          </>
        )}
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>{isBlocked ? "Desbloquear Usuario" : "Bloquear Usuario"}</DialogTitle>
          </DialogHeader>

          <div className="py-4" id="dialog-description">
            <div className="mb-4">
              <p className="font-medium">Usuario: {userName}</p>

              {isBlocked && (
                <div className="mt-2 space-y-2">
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    Bloqueado
                  </Badge>

                  <div className="text-sm">
                    <p className="font-medium">Motivo del bloqueo:</p>
                    <p className="mt-1 p-2 bg-gray-50 rounded border">{blockReason || "No especificado"}</p>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium">Fecha de bloqueo:</p>
                    <p>{formatDate(blockDate)}</p>
                  </div>
                </div>
              )}
            </div>

            {!isBlocked && (
              <div className="space-y-2">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">Advertencia</p>
                    <p className="text-amber-700 text-sm">
                      El usuario no podrá acceder al sistema mientras esté bloqueado.
                    </p>
                  </div>
                </div>

                <label htmlFor="blockReason" className="block text-sm font-medium">
                  Motivo del bloqueo:
                </label>
                <Textarea
                  id="blockReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ingrese el motivo del bloqueo"
                  rows={3}
                  className="resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBlockAction}
              disabled={isProcessing || !isOnline || (!isBlocked && !reason.trim())}
              variant={isBlocked ? "default" : "destructive"}
            >
              {isBlocked ? "Desbloquear Usuario" : "Bloquear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
