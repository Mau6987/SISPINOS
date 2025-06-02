"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  CreditCard,
  Download,
  X,
  User,
  Calendar,
  FileText,
  Receipt,
} from "lucide-react"
import { jsPDF } from "jspdf"
import Swal from "sweetalert2"

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Label } from "@/components/components/ui/label"
import { Badge } from "@/components/components/ui/badge"
import { Separator } from "@/components/components/ui/separator"

const ITEMS_PER_PAGE = 10

export default function OwnerPaymentsTable() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const isMobile = windowWidth < 768

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "propietario") {
      router.push("/")
      return
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setFilterStartDate(firstDayOfMonth.toISOString().split("T")[0])
    setFilterEndDate(lastDayOfMonth.toISOString().split("T")[0])

    const fetchData = async () => {
      setLoading(true)
      const token = localStorage.getItem("token")
      const ownerId = localStorage.getItem("idUser")
      const url = `https://mi-backendsecond.onrender.com/pagosPropietario/${ownerId}`

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const jsonData = await response.json()
          setData(jsonData)
          applyInitialFilters(jsonData, firstDayOfMonth, lastDayOfMonth)
        } else if (response.status === 401) {
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const applyInitialFilters = (data, startDate, endDate) => {
    const filtered = data.filter((item) => {
      const itemDate = new Date(item.fechaHora)
      return itemDate >= startDate && itemDate <= endDate
    })
    setFilteredData(filtered)
  }

  const applyFilters = () => {
    let filtered = data

    if (filterStartDate && filterEndDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.fechaHora)
        return itemDate >= new Date(filterStartDate) && itemDate <= new Date(filterEndDate)
      })
    }

    setFilteredData(filtered)
    setCurrentPage(1)
    setShowFilterDialog(false)
  }

  const handleViewDetails = async (item) => {
    try {
      setSelectedPayment(item)
      setShowDetailsDialog(true)
    } catch (error) {
      console.error("Error al obtener detalles del pago:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al obtener los detalles del pago",
      })
    }
  }

  const generateReceiptNumber = (paymentId, userCI) => {
    const ci = userCI || "000000"
    return `RP${ci}${paymentId}`
  }

  const handleDownloadPDF = async (payment) => {
    try {
      const receiptData = {
        receiptNumber: generateReceiptNumber(payment.id, payment.usuario?.ci),
        dateTime: new Date(payment.fechaHora).toLocaleString(),
        client: payment.usuario?.nombre || payment.usuario?.username || "N/A",
        ci: payment.usuario?.ci || "No disponible",
        email: payment.usuario?.correo || "No disponible",
        clientType: payment.usuario?.rol || "Propietario",
        amount: payment.monto,
        paymentId: payment.id,
      }

      const generatePDFReceipt = (receiptData) => {
        const doc = new jsPDF({
          format: [139.7, 215.9],
          orientation: "portrait",
        })

        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 8

        // Colores
        const darkBlue = [0, 51, 102]
        const lightGray = [240, 240, 240]
        const black = [0, 0, 0]

        // Encabezado
        doc.setFillColor(...lightGray)
        doc.rect(0, 0, pageWidth, 22, "F")

        doc.setFontSize(10)
        doc.setTextColor(...darkBlue)
        doc.setFont("helvetica", "bold")
        doc.text("DISTRIBUIDORA DE AGUA", pageWidth / 2, 7, { align: "center" })
        doc.text("LOS PINOS", pageWidth / 2, 13, { align: "center" })

        doc.setFontSize(6)
        doc.setFont("helvetica", "normal")
        doc.text("Comprobante de Pago - Propietario", pageWidth / 2, 18, { align: "center" })

        // Línea separadora
        doc.setDrawColor(...darkBlue)
        doc.setLineWidth(0.3)
        doc.line(margin, 24, pageWidth - margin, 24)

        // Título del recibo
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...black)
        doc.text("COMPROBANTE DE PAGO", pageWidth / 2, 30, { align: "center" })

        // Información del recibo
        let yPos = 38
        const colWidth = (pageWidth - 2 * margin) / 2

        doc.setDrawColor(...darkBlue)
        doc.setLineWidth(0.3)
        doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 20)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(6)

        // Columna izquierda
        doc.text("Número:", margin + 2, yPos + 2)
        doc.setFont("helvetica", "normal")
        doc.text(receiptData.receiptNumber, margin + 18, yPos + 2)

        doc.setFont("helvetica", "bold")
        doc.text("Fecha:", margin + 2, yPos + 6)
        doc.setFont("helvetica", "normal")
        doc.text(receiptData.dateTime, margin + 18, yPos + 6)

        doc.setFont("helvetica", "bold")
        doc.text("Cliente:", margin + 2, yPos + 10)
        doc.setFont("helvetica", "normal")
        const clientText =
          receiptData.client.length > 20 ? receiptData.client.substring(0, 20) + "..." : receiptData.client
        doc.text(clientText, margin + 18, yPos + 10)

        doc.setFont("helvetica", "bold")
        doc.text("Tipo:", margin + 2, yPos + 14)
        doc.setFont("helvetica", "normal")
        doc.text(receiptData.clientType, margin + 18, yPos + 14)

        // Columna derecha
        const col2X = pageWidth / 2 + 2

        doc.setFont("helvetica", "bold")
        doc.text("CI:", col2X, yPos + 2)
        doc.setFont("helvetica", "normal")
        doc.text(receiptData.ci, col2X + 12, yPos + 2)

        doc.setFont("helvetica", "bold")
        doc.text("Email:", col2X, yPos + 6)
        doc.setFont("helvetica", "normal")
        const emailText = receiptData.email.length > 25 ? receiptData.email.substring(0, 25) + "..." : receiptData.email
        doc.text(emailText, col2X + 16, yPos + 6)

        doc.setFont("helvetica", "bold")
        doc.text("Monto:", col2X, yPos + 10)
        doc.setFont("helvetica", "normal")
        doc.text(`Bs ${receiptData.amount.toFixed(2)}`, col2X + 16, yPos + 10)

        doc.setFont("helvetica", "bold")
        doc.text("ID Pago:", col2X, yPos + 14)
        doc.setFont("helvetica", "normal")
        doc.text(`#${receiptData.paymentId}`, col2X + 16, yPos + 14)

        // Información adicional
        yPos = 70
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("INFORMACIÓN DEL PAGO:", margin, yPos)

        yPos += 8
        doc.setFillColor(...lightGray)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 25, "F")
        doc.setDrawColor(...darkBlue)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 25)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(6)
        doc.setTextColor(...black)

        yPos += 5
        doc.text("Este comprobante certifica el pago realizado por el propietario", margin + 2, yPos)
        yPos += 4
        doc.text("en el sistema de distribución de agua Los Pinos.", margin + 2, yPos)
        yPos += 6
        doc.text(`Monto pagado: Bs ${receiptData.amount.toFixed(2)}`, margin + 2, yPos)
        yPos += 4
        doc.text(`Fecha de procesamiento: ${receiptData.dateTime}`, margin + 2, yPos)
        yPos += 4
        doc.text("Estado: PAGADO", margin + 2, yPos)

        // Pie del recibo
        yPos += 15
        doc.setDrawColor(...darkBlue)
        doc.line(margin, yPos, pageWidth - margin, yPos)

        yPos += 4
        doc.setFont("helvetica", "italic")
        doc.setFontSize(4)
        doc.text("Este comprobante es válido como constancia de pago.", pageWidth / 2, yPos, { align: "center" })
        doc.text("Distribuidora de Agua Los Pinos", pageWidth / 2, yPos + 3, { align: "center" })
        doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 6, { align: "center" })

        doc.save(`comprobante_${receiptData.receiptNumber}.pdf`)
      }

      generatePDFReceipt(receiptData)
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al generar el PDF",
      })
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const calcularMontoTotal = () => {
    return filteredData.reduce((total, item) => total + (item.monto || 0), 0)
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pagos del Propietario y Conductores</h1>
        <Button onClick={() => setShowFilterDialog(true)}>
          <Filter className="mr-2 h-4 w-4" /> Filtrar por Fecha
        </Button>
      </div>

      {/* Resumen de pagos */}
      <div className="mb-8">
        <Card className="shadow-md border-2 border-gray-300 rounded-lg">
          <CardHeader className="bg-blue-900 text-white">
            <CardTitle className="text-white">Resumen de Pagos</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total de pagos */}
              <div className="text-center">
                <div className="bg-blue-100 p-2 rounded-t-md">
                  <p className="font-semibold text-blue-800">Total de Pagos</p>
                </div>
                <div className="border border-t-0 border-blue-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <p className="text-2xl font-bold">{filteredData.length}</p>
                  </div>
                </div>
              </div>

              {/* Monto total */}
              <div className="text-center">
                <div className="bg-green-100 p-2 rounded-t-md">
                  <p className="font-semibold text-green-800">Monto Total</p>
                </div>
                <div className="border border-t-0 border-green-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <p className="text-2xl font-bold">Bs {calcularMontoTotal()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {/* Tabla con borde exterior más definido */}
          <div className="border-[3px] border-gray-600 rounded-lg overflow-hidden shadow-xl">
            <Table className="w-full border-collapse">
              <TableHeader className="bg-gray-700">
                <TableRow className="border-b-0">
                  <TableHead className="font-bold text-white py-4 border-0">Fecha y Hora</TableHead>
                  <TableHead className="font-bold text-white py-4 border-0">Monto</TableHead>
                  <TableHead className="font-bold text-white py-4 border-0">Nombre de Usuario</TableHead>
                  <TableHead className="font-bold text-white py-4 border-0">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <TableRow key={item.id} className="border-0 hover:bg-gray-50">
                      <TableCell className="border-0 py-3">{formatDate(item.fechaHora)}</TableCell>
                      <TableCell className="border-0 py-3">Bs {item.monto}</TableCell>
                      <TableCell className="border-0 py-3">{item.usuario?.nombre || "N/A"}</TableCell>
                      <TableCell className="border-0 py-3">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300 font-medium"
                            onClick={() => handleViewDetails(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-300 font-medium"
                            onClick={() => handleDownloadPDF(item)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500 border-0">
                      No hay pagos para mostrar con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
            </Button>
            <span>
              Página {currentPage} de {totalPages || 1}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Siguiente <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar por Fecha</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="filterStartDate" className="text-right">
                Fecha de Inicio:
              </label>
              <Input
                id="filterStartDate"
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="filterEndDate" className="text-right">
                Fecha de Fin:
              </label>
              <Input
                id="filterEndDate"
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={applyFilters}>Aplicar Filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Detalles del Pago Mejorado */}
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

          {selectedPayment && (
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
                          #{selectedPayment.id}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Número de Comprobante</Label>
                      <div className="font-mono text-blue-600 font-medium">
                        {generateReceiptNumber(selectedPayment.id, selectedPayment.usuario?.ci)}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Monto Total</Label>
                      <div className="text-2xl font-bold text-green-600">Bs {selectedPayment.monto?.toFixed(2)}</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Fecha y Hora</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(selectedPayment.fechaHora)}</span>
                      </div>
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
                        {selectedPayment.usuario?.nombre || selectedPayment.usuario?.username || "N/A"}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Cédula de Identidad</Label>
                      <div className="font-mono">{selectedPayment.usuario?.ci || "No disponible"}</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Correo Electrónico</Label>
                      <div className="text-blue-600">{selectedPayment.usuario?.correo || "No disponible"}</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Rol</Label>
                      <Badge variant="outline">{selectedPayment.usuario?.rol || "Propietario"}</Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">ID Usuario</Label>
                      <div className="font-mono text-gray-500">#{selectedPayment.usuario?.id}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información Adicional del Pago */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center text-green-800">
                    <Receipt className="mr-2 h-5 w-5" />
                    Detalles del Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Información del Pago</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-blue-600">Monto Pagado</Label>
                          <div className="text-xl font-bold text-blue-800">Bs {selectedPayment.monto?.toFixed(2)}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-blue-600">Fecha de Procesamiento</Label>
                          <div className="font-medium text-blue-800">{formatDate(selectedPayment.fechaHora)}</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Descripción</h4>
                      <p className="text-gray-600">
                        Este pago corresponde a los servicios de distribución de agua realizados por el propietario en
                        el sistema de Distribuidora de Agua Los Pinos.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex justify-between pt-6">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => selectedPayment && handleDownloadPDF(selectedPayment)}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
            <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
