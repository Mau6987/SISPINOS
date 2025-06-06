"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Trash2, Filter, Eye, Download, Receipt, AlertTriangle, X, User, Calendar, CreditCard, FileText, WifiOff } from 'lucide-react'
import { jsPDF } from "jspdf"
import Swal from "sweetalert2"

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Label } from "@/components/components/ui/label"
import { Badge } from "@/components/components/ui/badge"
import { Separator } from "@/components/components/ui/separator"
import { toast } from "@/components/hooks/use-toast"
import { Toaster } from "@/components/components/ui/toaster"

// Importar componentes PWA
import OfflineIndicator from "@/components/pwa-features/offline-indicator"
import NetworkStatusHandler from "@/components/pwa-features/network-status-handler"
import InstallPrompt from "@/components/pwa-features/install-prompt"
import CacheIndicator from "@/components/pwa-features/cache-indicator"
import SyncManagerEnhanced from "@/components/pwa-features/sync-manager"
import BackgroundSyncEnhanced from "@/components/pwa-features/background-sync"

// Importar utilidades PWA
import { usePWAFeatures } from "../../hooks/use-pwa-features"
import { saveToIndexedDB, getFromIndexedDB, registerSyncRequest, initializeBackgroundSync } from "../../utils/pwa-helpers"

export default function PagosOffline() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)
  const [usuarios, setUsuarios] = useState([])
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pagos, setPagos] = useState([])
  const [selectedPago, setSelectedPago] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split("T")[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split("T")[0])
  const [usuarioFiltro, setUsuarioFiltro] = useState("")

  const router = useRouter()
  const itemsPerPage = 6
  const isMobile = windowWidth < 768
  const { isOnline, updatePendingSyncCount } = usePWAFeatures()

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      // Inicializar background sync
      initializeBackgroundSync()
      fetchUsuarios()
      fetchPagos()
    }
  }, [router])

  const fetchUsuarios = async () => {
    try {
      if (!isOnline) {
        const cachedData = await getFromIndexedDB("cache", "usuarios")
        if (cachedData) {
          setUsuarios(cachedData.data)
          return
        }
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuariosrol", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
        await saveToIndexedDB("cache", { id: "usuarios", data, timestamp: Date.now() })
      }
    } catch (error) {
      console.error("Error al obtener los usuarios:", error)
      const cachedData = await getFromIndexedDB("cache", "usuarios")
      if (cachedData) {
        setUsuarios(cachedData.data)
      }
    }
  }

  const fetchPagos = async () => {
    try {
      if (!isOnline) {
        const cachedData = await getFromIndexedDB("pagos", "all")
        if (cachedData && cachedData.data) {
          setPagos(cachedData.data)
          return
        }
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPagos(data)
        await saveToIndexedDB("pagos", { id: "all", data, timestamp: Date.now() })
      }
    } catch (error) {
      console.error("Error al obtener los pagos:", error)
      const cachedData = await getFromIndexedDB("pagos", "all")
      if (cachedData && cachedData.data) {
        setPagos(cachedData.data)
        toast({
          title: "Usando datos en caché",
          description: "Estás viendo datos almacenados localmente.",
        })
      }
    }
  }

  // Función para generar número de recibo
  const generarNumeroRecibo = (pagoId, usuarioCI) => {
    const ci = usuarioCI || "000000"
    return `R${ci}${pagoId}`
  }

  const handleVerPago = async (pago) => {
    try {
      if (!isOnline) {
        setSelectedPago(pago)
        setShowDetailsDialog(true)
        return
      }

      const response = await fetch(
        `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua/${pago.id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      if (response.ok) {
        const data = await response.json()
        setSelectedPago(data)
        setShowDetailsDialog(true)
      }
    } catch (error) {
      console.error("Error al obtener la información del pago:", error)
      setSelectedPago(pago)
      setShowDetailsDialog(true)
    }
  }

  const handleDescargarPDF = async (pago) => {
    try {
      let data = pago
      if (isOnline) {
        const response = await fetch(
          `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua/${pago.id}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          },
        )
        if (response.ok) {
          data = await response.json()
        }
      }

      const datosRecibo = {
        numeroRecibo: generarNumeroRecibo(data.id, data.usuario?.ci),
        fechaHora: new Date(data.fechaHora).toLocaleString(),
        cliente: data.usuario?.nombre || data.usuario?.username || "N/A",
        ci: data.usuario?.ci || "No disponible",
        correo: data.usuario?.correo || "No disponible",
        tipoCliente: data.usuario?.rol || "Cliente",
        numeroCargas: data.cargas?.length || data.cargaAguaIds?.length || 0,
        montoTotal: data.monto,
        cargasDetalle: data.cargas || [],
        pagoId: data.id,
      }

      // Función para generar PDF del recibo
      const generarPDFRecibo = (datosRecibo) => {
        const doc = new jsPDF({
          format: [139.7, 215.9], // Half letter size in mm
          orientation: "portrait",
        })

        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 8

        // Colores
        const azulOscuro = [0, 51, 102]
        const grisClaro = [240, 240, 240]
        const negro = [0, 0, 0]

        // Encabezado con logo y título
        doc.setFillColor(...grisClaro)
        doc.rect(0, 0, pageWidth, 22, "F")

        // Logo/Título de la empresa
        doc.setFontSize(10)
        doc.setTextColor(...azulOscuro)
        doc.setFont("helvetica", "bold")
        doc.text("DISTRIBUIDORA DE AGUA", pageWidth / 2, 7, { align: "center" })
        doc.text("LOS PINOS", pageWidth / 2, 13, { align: "center" })

        doc.setFontSize(6)
        doc.setFont("helvetica", "normal")
        doc.text("Servicio de distribución de agua potable", pageWidth / 2, 18, { align: "center" })

        // Línea separadora
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.line(margin, 24, pageWidth - margin, 24)

        // Título del recibo
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...negro)
        doc.text("COMPROBANTE DE PAGO", pageWidth / 2, 30, { align: "center" })

        // Información del recibo en doble columna
        let yPos = 38
        const lineHeight = 4
        const colWidth = (pageWidth - 2 * margin) / 2

        // Dibujar recuadro para la información
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 16)

        // Primera columna de información
        doc.setFont("helvetica", "bold")
        doc.setFontSize(6)

        // Columna izquierda
        doc.text("Número:", margin + 2, yPos + 2)
        doc.setFont("helvetica", "normal")
        doc.text(datosRecibo.numeroRecibo, margin + 18, yPos + 2)

        doc.setFont("helvetica", "bold")
        doc.text("Fecha:", margin + 2, yPos + 6)
        doc.setFont("helvetica", "normal")
        doc.text(datosRecibo.fechaHora, margin + 18, yPos + 6)

        doc.setFont("helvetica", "bold")
        doc.text("Cliente:", margin + 2, yPos + 10)
        doc.setFont("helvetica", "normal")
        const clienteText =
          datosRecibo.cliente.length > 20 ? datosRecibo.cliente.substring(0, 20) + "..." : datosRecibo.cliente
        doc.text(clienteText, margin + 18, yPos + 10)

        // Columna derecha
        const col2X = pageWidth / 2 + 2

        doc.setFont("helvetica", "bold")
        doc.text("CI:", col2X, yPos + 2)
        doc.setFont("helvetica", "normal")
        doc.text(datosRecibo.ci || "No disponible", col2X + 12, yPos + 2)

        doc.setFont("helvetica", "bold")
        doc.text("Cargas:", col2X, yPos + 6)
        doc.setFont("helvetica", "normal")
        doc.text(datosRecibo.numeroCargas.toString(), col2X + 16, yPos + 6)

        doc.setFont("helvetica", "bold")
        doc.text("Total:", col2X, yPos + 10)
        doc.setFont("helvetica", "normal")
        doc.text(`Bs ${datosRecibo.montoTotal.toFixed(2)}`, col2X + 16, yPos + 10)

        // Detalle de cargas pagadas en tabla
        yPos = 58
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("DETALLE DE CARGAS PAGADAS:", margin, yPos)

        yPos += 5

        // Configuración de la tabla
        const tableWidth = pageWidth - 2 * margin
        const colWidths = [22, 30, 42, 18] // Fecha, Hora, Usuario, Costo
        const rowHeight = 7

        // Encabezados de la tabla
        doc.setFillColor(...grisClaro)
        doc.rect(margin, yPos, tableWidth, rowHeight, "F")

        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.rect(margin, yPos, tableWidth, rowHeight)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(5)
        doc.setTextColor(...negro)

        let xPos = margin + 1
        doc.text("FECHA", xPos, yPos + 4)
        xPos += colWidths[0]
        doc.text("HORA", xPos, yPos + 4)
        xPos += colWidths[1]
        doc.text("USUARIO", xPos, yPos + 4)
        xPos += colWidths[2]
        doc.text("COSTO", xPos, yPos + 4)

        yPos += rowHeight

        // Filas de datos
        doc.setFont("helvetica", "normal")
        doc.setFontSize(5)

        const maxCargasToShow = Math.min(datosRecibo.cargasDetalle.length, 12)
        const cargasToShow = datosRecibo.cargasDetalle.slice(0, maxCargasToShow)

        cargasToShow.forEach((carga, index) => {
          const fechaCarga = new Date(carga.fechaHora).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
          const horaCarga = new Date(carga.fechaHora).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
          const usuarioCarga = (datosRecibo.cliente || "N/A").substring(0, 15)

          // Dibujar bordes de la fila
          doc.setDrawColor(...azulOscuro)
          doc.setLineWidth(0.2)
          doc.rect(margin, yPos, tableWidth, rowHeight)

          // Líneas verticales
          let currentX = margin
          for (let i = 0; i < colWidths.length - 1; i++) {
            currentX += colWidths[i]
            doc.line(currentX, yPos, currentX, yPos + rowHeight)
          }

          // Contenido de la fila
          xPos = margin + 1
          doc.text(fechaCarga, xPos, yPos + 4)
          xPos += colWidths[0]
          doc.text(horaCarga, xPos, yPos + 4)
          xPos += colWidths[1]
          doc.text(usuarioCarga, xPos, yPos + 4)
          xPos += colWidths[2]
          doc.text(`Bs ${carga.costo}`, xPos, yPos + 4)

          yPos += rowHeight
        })

        // Si hay más cargas de las que se muestran, indicarlo
        if (datosRecibo.cargasDetalle.length > maxCargasToShow) {
          yPos += 2
          doc.setFont("helvetica", "italic")
          doc.setFontSize(4)
          doc.text(`... y ${datosRecibo.cargasDetalle.length - maxCargasToShow} cargas más`, margin, yPos)
          yPos += 3
        }

        // Pie del recibo
        yPos += 5
        doc.setDrawColor(...azulOscuro)
        doc.line(margin, yPos, pageWidth - margin, yPos)

        yPos += 4
        doc.setFont("helvetica", "italic")
        doc.setFontSize(4)
        doc.text("Este comprobante es válido como constancia de pago.", pageWidth / 2, yPos, { align: "center" })
        doc.text("Distribuidora de Agua Los Pinos", pageWidth / 2, yPos + 3, { align: "center" })
        doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 6, { align: "center" })

        // Guardar PDF
        doc.save(`recibo_${datosRecibo.numeroRecibo}.pdf`)
      }

      generarPDFRecibo(datosRecibo)
    } catch (error) {
      console.error("Error al obtener la información del pago:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al generar el PDF",
      })
    }
  }

  const handleDeletePago = async () => {
    if (!selectedPago) return

    try {
      if (!isOnline) {
        // Registrar para sincronización offline
        await registerSyncRequest(
          `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua/${selectedPago.id}`,
          "DELETE",
          {},
        )

        // Marcar como pendiente de eliminación
        setPagos((prevPagos) =>
          prevPagos.map((pago) => (pago.id === selectedPago.id ? { ...pago, _isPendingDelete: true } : pago)),
        )

        updatePendingSyncCount(true)
        setShowDeleteModal(false)
        toast({
          title: "Pago marcado para eliminar",
          description: "Se eliminará cuando vuelva la conexión",
        })
        return
      }

      const response = await fetch(
        `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua/${selectedPago.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      if (response.ok) {
        setPagos(pagos.filter((pago) => pago.id !== selectedPago.id))
        setShowDeleteModal(false)

        Swal.fire({
          icon: "success",
          title: "Pago eliminado",
          text: "El pago ha sido eliminado exitosamente y las cargas han vuelto a estado de deuda.",
          timer: 3000,
          showConfirmButton: false,
        })

        fetchPagos()
      }
    } catch (error) {
      console.error("Error al eliminar el pago:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al eliminar el pago",
      })
    }
  }

  const filtrarPagos = () => {
    return pagos.filter((pago) => {
      const fechaPago = new Date(pago.fechaHora)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)

      const cumpleFecha = fechaPago >= inicio && fechaPago <= fin
      const cumpleUsuario =
        !usuarioFiltro ||
        (pago.usuario?.nombre && pago.usuario.nombre.toLowerCase().includes(usuarioFiltro.toLowerCase())) ||
        (pago.usuario?.username && pago.usuario.username.toLowerCase().includes(usuarioFiltro.toLowerCase()))

      return cumpleFecha && cumpleUsuario
    })
  }

  const pagosFiltrados = filtrarPagos()
  const totalPages = Math.ceil(pagosFiltrados.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPagos = pagosFiltrados.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <NetworkStatusHandler onOffline={() => console.log("Modo offline activado")} onOnline={() => fetchPagos()}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
          <Toaster />

           <div className="bg-white rounded-lg shadow-md border border-gray-300 mb-6 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-lg border border-gray-300">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 3C10 3 6 7 6 12C6 16 9 20 12 20C15 20 18 16 18 12C18 7 14 3 12 3Z" strokeWidth="2"/>
                    <path d="M8 12H16" strokeWidth="2"/>
                    <path d="M12 8V16" strokeWidth="2"/>
                    <path d="M17 8H19C20.1046 8 21 8.89543 21 10V14C21 15.1046 20.1046 16 19 16H17" strokeWidth="2"/>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-black tracking-tight">Gestión de Pagos de Carga de Agua</h1>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-800"></div>
          </div>

          <InstallPrompt />
          <SyncManagerEnhanced onSync={fetchPagos} />
          <CacheIndicator />
          <BackgroundSyncEnhanced
            syncTag="pagos-sync"
            onSyncRegistered={() => console.log("Sync registrado para pagos")}
            onSyncError={(error) => console.error("Error en Background Sync:", error)}
          />

          <div className="flex justify-start items-center mb-6">
            <Button onClick={() => setShowFilterModal(true)}>
              <Filter className="mr-2 h-4 w-4" /> Filtros
            </Button>
          </div>

          <Card className="mb-6 border border-gray-300 shadow-sm">
            <CardHeader>
              <CardTitle>Listado de Pagos de Carga de Agua</CardTitle>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-4">
                  {currentPagos.map((pago) => (
                    <Card
                      key={pago.id}
                      className={`border border-gray-200 ${pago._isPendingDelete ? "bg-yellow-50 border-l-4 border-yellow-400" : ""}`}
                    >
                      <CardContent className="p-4">
                        <p>
                          <strong>Usuario:</strong> {pago.usuario?.nombre || pago.usuario?.username || "N/A"}
                        </p>
                        <p>
                          <strong>Monto:</strong> Bs {pago.monto}
                        </p>
                        <p>
                          <strong>Fecha:</strong>{" "}
                          {new Date(pago.fechaHora).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p>
                          <strong>Cargas:</strong> {pago.cargas?.length || pago.cargaAguaIds?.length || 0}
                        </p>
                        {pago._isPendingDelete && (
                          <Badge
                            variant="outline"
                            className="mt-2 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
                          >
                            Pendiente eliminar
                          </Badge>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerPago(pago)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDescargarPDF(pago)}
                          className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPago(pago)
                            setShowDeleteModal(true)
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-800 border-red-200"
                          disabled={pago._isPendingDelete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-200 border-b-2 border-gray-300 shadow-md">
                    <TableRow>
                      <TableHead className="font-bold text-gray-700 border-r border-gray-300">Usuario</TableHead>
                      <TableHead className="font-bold text-gray-700 border-r border-gray-300">Monto</TableHead>
                      <TableHead className="font-bold text-gray-700 border-r border-gray-300">Cargas</TableHead>
                      <TableHead className="font-bold text-gray-700 border-r border-gray-300">Fecha</TableHead>
                      <TableHead className="font-bold text-gray-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPagos.map((pago) => (
                      <TableRow
                        key={pago.id}
                        className={pago._isPendingDelete ? "bg-yellow-50 border-l-4 border-yellow-400" : ""}
                      >
                        <TableCell>
                          {pago.usuario?.nombre || pago.usuario?.username || "N/A"}
                          {pago._isPendingDelete && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
                            >
                              Pendiente eliminar
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>Bs {pago.monto}</TableCell>
                        <TableCell>{pago.cargas?.length || pago.cargaAguaIds?.length || 0}</TableCell>
                        <TableCell>
                          {new Date(pago.fechaHora).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerPago(pago)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDescargarPDF(pago)}
                              className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPago(pago)
                                setShowDeleteModal(true)
                              }}
                              className="bg-red-100 hover:bg-red-200 text-red-800 border-red-200"
                              disabled={pago._isPendingDelete}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center mt-4">
            <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Diálogo de Detalles del Pago */}
          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center text-blue-600">
                  <FileText className="mr-2 h-5 w-5" />
                  Detalles del Pago
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-4"
                  onClick={() => setShowDetailsDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogHeader>

              {selectedPago && (
                <div className="space-y-6">
                  {/* Información General del Pago */}
                  <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="flex items-center text-blue-800">
                        <CreditCard className="mr-2 h-5 w-5" />
                        Información del Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">ID del Pago</Label>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="font-mono">
                              #{selectedPago.id}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Número de Recibo</Label>
                          <div className="font-mono text-blue-600 font-medium">
                            {generarNumeroRecibo(selectedPago.id, selectedPago.usuario?.ci)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Monto Total</Label>
                          <div className="text-2xl font-bold text-green-600">Bs {selectedPago.monto?.toFixed(2)}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Fecha y Hora</Label>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              {new Date(selectedPago.fechaHora).toLocaleString("es-ES", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Cargas Pagadas</Label>
                          <Badge variant="secondary" className="text-lg">
                            {selectedPago.cargas?.length || selectedPago.cargaAguaIds?.length || 0} cargas
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Estado</Label>
                          <Badge className="bg-green-100 text-green-800 border-green-200">Pagado</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Información del Cliente */}
                  <Card className="border-purple-200">
                    <CardHeader className="bg-purple-50">
                      <CardTitle className="flex items-center text-purple-800">
                        <User className="mr-2 h-5 w-5" />
                        Información del Cliente
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                          <div className="font-medium">
                            {selectedPago.usuario?.nombre || selectedPago.usuario?.username || "N/A"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Cédula de Identidad</Label>
                          <div className="font-mono">{selectedPago.usuario?.ci || "No disponible"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Correo Electrónico</Label>
                          <div className="text-blue-600">{selectedPago.usuario?.correo || "No disponible"}</div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Rol</Label>
                          <Badge variant="outline">{selectedPago.usuario?.rol || "Cliente"}</Badge>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">ID Usuario</Label>
                          <div className="font-mono text-gray-500">#{selectedPago.usuario?.id}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detalle de Cargas Pagadas */}
                  <Card className="border-green-200">
                    <CardHeader className="bg-green-50">
                      <CardTitle className="flex items-center text-green-800">
                        <Receipt className="mr-2 h-5 w-5" />
                        Detalle de Cargas Pagadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {selectedPago.cargas && selectedPago.cargas.length > 0 ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-sm text-blue-600 font-medium">Total de Cargas</div>
                              <div className="text-2xl font-bold text-blue-800">{selectedPago.cargas.length}</div>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-sm text-green-600 font-medium">Monto Total</div>
                              <div className="text-2xl font-bold text-green-800">
                                Bs{" "}
                                {selectedPago.cargas.reduce((total, carga) => total + (carga.costo || 30), 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="text-sm text-purple-600 font-medium">Promedio por Carga</div>
                              <div className="text-2xl font-bold text-purple-800">
                                Bs{" "}
                                {(
                                  selectedPago.cargas.reduce((total, carga) => total + (carga.costo || 30), 0) /
                                  selectedPago.cargas.length
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-800">Lista de Cargas:</h4>
                            <div className="max-h-64 overflow-y-auto border rounded-lg">
                              <Table>
                                <TableHeader className="bg-gray-50">
                                  <TableRow>
                                    <TableHead className="font-medium">ID Carga</TableHead>
                                    <TableHead className="font-medium">Fecha</TableHead>
                                    <TableHead className="font-medium">Hora</TableHead>
                                    <TableHead className="font-medium">Costo</TableHead>
                                    <TableHead className="font-medium">Estado</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedPago.cargas.map((carga, index) => (
                                    <TableRow key={carga.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                      <TableCell className="font-mono">#{carga.id}</TableCell>
                                      <TableCell>
                                        {new Date(carga.fechaHora).toLocaleDateString("es-ES", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })}
                                      </TableCell>
                                      <TableCell>
                                        {new Date(carga.fechaHora).toLocaleTimeString("es-ES", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </TableCell>
                                      <TableCell className="font-medium text-green-600">Bs {carga.costo || 30}</TableCell>
                                      <TableCell>
                                        <Badge className="bg-green-100 text-green-800 border-green-200">Pagado</Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Receipt className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                          <p>No se encontraron detalles de cargas para este pago</p>
                          <p className="text-sm mt-2">Cargas registradas: {selectedPago.cargaAguaIds?.length || 0}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <DialogFooter className="flex justify-between pt-6">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => selectedPago && handleDescargarPDF(selectedPago)}
                    className="flex items-center"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsDialog(false)
                      setShowDeleteModal(true)
                    }}
                    className="flex items-center text-red-600 border-red-200 hover:bg-red-50"
                    disabled={selectedPago?._isPendingDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Pago
                  </Button>
                </div>
                <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de confirmación para eliminar */}
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent className="border-2 border-gray-300">
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Confirmar Eliminación
                </DialogTitle>
                <DialogDescription>
                  ¿Está seguro que desea eliminar este pago? Esta acción no se puede deshacer.
                  {!isOnline && " Se marcará para eliminar cuando vuelva la conexión."}
                </DialogDescription>
              </DialogHeader>

              {selectedPago && (
                <div className="space-y-4">
                  {!isOnline && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <WifiOff className="h-4 w-4" />
                        <span className="text-sm">Sin conexión - Se marcará para eliminar cuando vuelva la conexión</span>
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">⚠️ Advertencia:</h4>
                    <p className="text-sm text-yellow-700 mb-3">
                      Al eliminar este pago, las siguientes cargas volverán al estado de "deuda":
                    </p>

                    {selectedPago.cargas && selectedPago.cargas.length > 0 ? (
                      <div className="max-h-32 overflow-y-auto border rounded p-2 bg-white">
                        {selectedPago.cargas.map((carga, index) => (
                          <div key={carga.id} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                            <span>
                              Carga #{carga.id} - {new Date(carga.fechaHora).toLocaleDateString()}
                            </span>
                            <span className="font-medium text-red-600">Bs {carga.costo}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                        {selectedPago.cargaAguaIds?.length || 0} cargas volverán al estado de deuda
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-yellow-200">
                      <div className="flex justify-between font-medium text-yellow-800">
                        <span>Total del pago a eliminar:</span>
                        <span>Bs {selectedPago.monto}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeletePago}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Pago
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal de filtros */}
          <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
            <DialogContent className="border-2 border-gray-300">
              <DialogHeader>
                <DialogTitle>Filtrar Pagos</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="usuarioFiltro" className="text-right">
                    Usuario:
                  </Label>
                  <Input
                    id="usuarioFiltro"
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={usuarioFiltro}
                    onChange={(e) => setUsuarioFiltro(e.target.value)}
                    className="col-span-3 border-2 border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fechaInicio" className="text-right">
                    Fecha Inicio:
                  </Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="col-span-3 border-2 border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fechaFin" className="text-right">
                    Fecha Fin:
                  </Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="col-span-3 border-2 border-gray-300"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setCurrentPage(1)
                    setShowFilterModal(false)
                  }}
                  className="border-2 border-gray-300"
                >
                  Aplicar Filtros
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </NetworkStatusHandler>
  )
}