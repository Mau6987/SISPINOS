"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, Truck, DollarSign, User, FileText, X, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { jsPDF } from "jspdf"
import Swal from "sweetalert2"

import { Button } from "../../components/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Badge } from "../../components/components/ui/badge"
import { Label } from "../../components/components/ui/label"
import { Avatar, AvatarFallback } from "../../components/components/ui/avatar"

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  return windowWidth
}

export default function OwnerDriversTable() {
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const [drivers, setDrivers] = useState([])
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showChargesDialog, setShowChargesDialog] = useState(false)
  const [showPaymentsDialog, setShowPaymentsDialog] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [charges, setCharges] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  // Estados para paginación
  const [currentChargesPage, setCurrentChargesPage] = useState(1)
  const [currentPaymentsPage, setCurrentPaymentsPage] = useState(1)
  const itemsPerPage = 6

  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "propietario") {
      router.push("/")
      return
    }

    const fetchDrivers = async () => {
      setLoading(true)
      const token = localStorage.getItem("token")
      const ownerId = localStorage.getItem("idUser")
      const url = `https://mi-backendsecond.onrender.com/conductores/${ownerId}`

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setDrivers(data)
        } else if (response.status === 401) {
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching drivers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [router])

  const handleViewDriver = (driver) => {
    setSelectedDriver(driver)
    setShowDetailsDialog(true)
  }

  const handleViewCharges = async (driver) => {
    setLoading(true)
    setSelectedDriver(driver)
    const token = localStorage.getItem("token")
    const url = `https://mi-backendsecond.onrender.com/cargascliente/${driver.id}`

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        // Ordenar por fecha más reciente primero
        data.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
        setCharges(data)
        setCurrentChargesPage(1)
        setShowChargesDialog(true)
      }
    } catch (error) {
      console.error("Error fetching charges:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPayments = async (driver) => {
    setLoading(true)
    setSelectedDriver(driver)
    const token = localStorage.getItem("token")
    const url = `https://mi-backendsecond.onrender.com/pagoscliente/${driver.id}`

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        // Ordenar por fecha más reciente primero
        data.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
        setPayments(data)
        setCurrentPaymentsPage(1)
        setShowPaymentsDialog(true)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  // Función para generar PDF de resumen de conductores
  const handleDownloadDriversPDF = async () => {
    try {
      if (drivers.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Sin datos",
          text: "No hay conductores para exportar.",
        })
        return
      }

      const ownerName = localStorage.getItem("userName") || "Propietario"

      const generateDriversPDF = () => {
        // Create a half-letter sized PDF (5.5" x 8.5")
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
        doc.text("Reporte de Conductores Asociados", pageWidth / 2, 18, { align: "center" })

        // Línea separadora
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.line(margin, 24, pageWidth - margin, 24)

        // Título del reporte
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...negro)
        doc.text("REPORTE DE CONDUCTORES", pageWidth / 2, 30, { align: "center" })

        // Información del reporte
        let yPos = 38
        doc.setFontSize(6)
        doc.setFont("helvetica", "bold")

        // Información del propietario
        doc.text(`Propietario: ${ownerName}`, margin, yPos)
        doc.text(`Total de conductores: ${drivers.length}`, margin, yPos + 4)
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString("es-ES")}`, margin, yPos + 8)
        yPos += 16

        // Título de la tabla
        doc.setFont("helvetica", "bold")
        doc.setFontSize(7)
        doc.text("LISTADO DE CONDUCTORES:", margin, yPos)
        yPos += 5

        // Configuración de la tabla
        const tableWidth = pageWidth - 2 * margin
        const colWidths = [15, 50, 35, 28] // ID, Nombre, CI, Username
        const rowHeight = 8

        // Encabezados de la tabla
        doc.setFillColor(...grisClaro)
        doc.rect(margin, yPos, tableWidth, rowHeight, "F")

        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.rect(margin, yPos, tableWidth, rowHeight)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(6)
        doc.setTextColor(...negro)

        let xPos = margin + 1
        doc.text("ID", xPos, yPos + 5)
        xPos += colWidths[0]
        doc.text("NOMBRE", xPos, yPos + 5)
        xPos += colWidths[1]
        doc.text("CI", xPos, yPos + 5)
        xPos += colWidths[2]
        doc.text("USERNAME", xPos, yPos + 5)

        yPos += rowHeight

        // Filas de datos
        doc.setFont("helvetica", "normal")
        doc.setFontSize(6)

        drivers.forEach((driver, index) => {
          if (yPos > 200) {
            // Si se acerca al final de la página
            doc.addPage()
            yPos = 20
          }

          const nombreCorto = driver.nombre.length > 25 ? driver.nombre.substring(0, 25) + "..." : driver.nombre
          const usernameCorto = driver.username.length > 15 ? driver.username.substring(0, 15) + "..." : driver.username

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
          doc.text(driver.id.toString(), xPos, yPos + 5)
          xPos += colWidths[0]
          doc.text(nombreCorto, xPos, yPos + 5)
          xPos += colWidths[1]
          doc.text(driver.ci || "N/A", xPos, yPos + 5)
          xPos += colWidths[2]
          doc.text(usernameCorto, xPos, yPos + 5)

          yPos += rowHeight
        })

        // Pie del reporte
        yPos += 10
        doc.setDrawColor(...azulOscuro)
        doc.line(margin, yPos, pageWidth - margin, yPos)

        yPos += 4
        doc.setFont("helvetica", "italic")
        doc.setFontSize(4)
        doc.text("Este reporte es válido como constancia de conductores asociados.", pageWidth / 2, yPos, {
          align: "center",
        })
        doc.text("Distribuidora de Agua Los Pinos", pageWidth / 2, yPos + 3, { align: "center" })
        doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 6, { align: "center" })

        // Guardar PDF
        const fileName = `conductores_${ownerName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
        doc.save(fileName)
      }

      generateDriversPDF()

      Swal.fire({
        icon: "success",
        title: "PDF Generado",
        text: "El reporte de conductores se ha descargado exitosamente.",
        timer: 2000,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error("Error al generar el PDF:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al generar el PDF del reporte.",
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

  const getInitials = (name) => {
    if (!name) return "C"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Funciones de paginación
  const getPaginatedData = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems, itemsPerPage) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const paginatedCharges = getPaginatedData(charges, currentChargesPage, itemsPerPage)
  const totalChargesPages = getTotalPages(charges.length, itemsPerPage)

  const paginatedPayments = getPaginatedData(payments, currentPaymentsPage, itemsPerPage)
  const totalPaymentsPages = getTotalPages(payments.length, itemsPerPage)

  const renderTable = () => (
    <div className="border-[3px] border-gray-600 rounded-lg overflow-hidden shadow-xl">
      <Table className="w-full border-collapse">
        <TableHeader className="bg-gray-700">
          <TableRow className="border-b-0">
            <TableHead className="font-bold text-white py-4 border-0">Conductor</TableHead>
            <TableHead className="font-bold text-white py-4 border-0">CI</TableHead>
            <TableHead className="font-bold text-white py-4 border-0">Username</TableHead>
            <TableHead className="font-bold text-white py-4 border-0">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id} className="border-0 hover:bg-gray-50">
              <TableCell className="border-0 py-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                      {getInitials(driver.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{driver.nombre}</div>
                    <div className="text-sm text-gray-500">Conductor</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="border-0 py-3">{driver.ci || "No disponible"}</TableCell>
              <TableCell className="border-0 py-3">{driver.username}</TableCell>
              <TableCell className="border-0 py-3">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    onClick={() => handleViewDriver(driver)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-500 hover:text-green-700 hover:bg-green-50 border-green-200"
                    onClick={() => handleViewCharges(driver)}
                  >
                    <Truck className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                    onClick={() => handleViewPayments(driver)}
                  >
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderCards = () => (
    <div className="space-y-4">
      {drivers.map((driver) => (
        <Card key={driver.id} className="border-2 border-gray-300 shadow-md">
          <CardHeader className="bg-gray-700 text-white p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                  {getInitials(driver.nombre)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg text-white">{driver.nombre}</CardTitle>
                <p className="text-gray-200 text-sm">Conductor</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">CI:</span>
                <span>{driver.ci || "No disponible"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Username:</span>
                <span>{driver.username}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-around p-3 bg-gray-50">
            <Button
              size="sm"
              variant="outline"
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => handleViewDriver(driver)}
            >
              <Eye className="h-4 w-4 mr-1" /> Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-green-500 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => handleViewCharges(driver)}
            >
              <Truck className="h-4 w-4 mr-1" /> Cargas
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
              onClick={() => handleViewPayments(driver)}
            >
              <DollarSign className="h-4 w-4 mr-1" /> Pagos
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conductores Asociados</h1>
        <Button
          onClick={handleDownloadDriversPDF}
          variant="outline"
          className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-300"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Resumen de conductores */}
      <div className="mb-8">
        <Card className="shadow-md border-2 border-gray-300 rounded-lg">
          <CardHeader className="bg-blue-900 text-white">
            <CardTitle className="text-white">Resumen de Conductores</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-100 p-2 rounded-t-md">
                  <p className="font-semibold text-blue-800">Total de Conductores</p>
                </div>
                <div className="border border-t-0 border-blue-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <p className="text-2xl font-bold">{drivers.length}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-green-100 p-2 rounded-t-md">
                  <p className="font-semibold text-green-800">Conductores Activos</p>
                </div>
                <div className="border border-t-0 border-green-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <p className="text-2xl font-bold">{drivers.length}</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 p-2 rounded-t-md">
                  <p className="font-semibold text-purple-800">Gestión</p>
                </div>
                <div className="border border-t-0 border-purple-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <p className="text-sm font-medium">Control Total</p>
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
      ) : drivers.length === 0 ? (
        <Card className="shadow-md border-2 border-gray-300 rounded-lg">
          <CardContent className="p-8 text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay conductores asociados</h3>
            <p className="text-gray-500">Aún no tienes conductores registrados en tu cuenta.</p>
          </CardContent>
        </Card>
      ) : (
        <>{isMobile ? renderCards() : renderTable()}</>
      )}

      {/* Diálogo de Detalles del Conductor Mejorado */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <User className="mr-2 h-5 w-5" />
              Detalles del Conductor
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
          {selectedDriver && (
            <div className="space-y-6">
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center text-blue-800">
                    <User className="mr-2 h-5 w-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-blue-100 text-blue-800 font-medium text-lg">
                        {getInitials(selectedDriver.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                        <div className="text-lg font-medium">{selectedDriver.nombre}</div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Cédula de Identidad</Label>
                          <div className="font-mono">{selectedDriver.ci || "No disponible"}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Username</Label>
                          <div className="font-mono">{selectedDriver.username}</div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Rol</Label>
                        <Badge variant="outline" className="ml-2">
                          Conductor
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Cargas Mejorado */}
      <Dialog open={showChargesDialog} onOpenChange={setShowChargesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <Truck className="mr-2 h-5 w-5" />
              Cargas Realizadas - {selectedDriver?.nombre}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => setShowChargesDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {charges.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay cargas realizadas</h3>
              <p className="text-gray-500">Este conductor aún no ha realizado cargas de agua.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen de cargas */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center text-green-800">
                    <Truck className="mr-2 h-5 w-5" />
                    Resumen de Cargas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{charges.length}</div>
                      <div className="text-sm text-gray-600">Total de Cargas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {charges.filter((c) => c.estado === "pagado").length}
                      </div>
                      <div className="text-sm text-gray-600">Cargas Pagadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {charges.filter((c) => c.estado === "deuda").length}
                      </div>
                      <div className="text-sm text-gray-600">Cargas Pendientes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de cargas */}
              <div className="border-[2px] border-gray-600 rounded-lg overflow-hidden shadow-md">
                <Table className="w-full border-collapse">
                  <TableHeader className="bg-gray-700">
                    <TableRow className="border-b-0">
                      <TableHead className="font-bold text-white py-3 border-0">Fecha y Hora</TableHead>
                      <TableHead className="font-bold text-white py-3 border-0">Estado</TableHead>
                      <TableHead className="font-bold text-white py-3 border-0">Costo</TableHead>
                      <TableHead className="font-bold text-white py-3 border-0">Tipo Camión</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCharges.map((charge) => (
                      <TableRow key={charge.id} className="border-0 hover:bg-gray-50">
                        <TableCell className="border-0 py-2">{formatDate(charge.fechaHora)}</TableCell>
                        <TableCell className="border-0 py-2">
                          <Badge className={charge.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>
                            {charge.estado === "deuda" ? "Pendiente" : "Pagado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-0 py-2">Bs {charge.costo || 30}</TableCell>
                        <TableCell className="border-0 py-2">
                          {charge.tiposDeCamion?.descripcion || "No especificado"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación para cargas */}
              {totalChargesPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    onClick={() => setCurrentChargesPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentChargesPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentChargesPage} de {totalChargesPages}
                  </span>
                  <Button
                    onClick={() => setCurrentChargesPage((prev) => Math.min(prev + 1, totalChargesPages))}
                    disabled={currentChargesPage === totalChargesPages}
                    variant="outline"
                    size="sm"
                  >
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowChargesDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Pagos Mejorado */}
      <Dialog open={showPaymentsDialog} onOpenChange={setShowPaymentsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-amber-600">
              <DollarSign className="mr-2 h-5 w-5" />
              Pagos Realizados - {selectedDriver?.nombre}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4"
              onClick={() => setShowPaymentsDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {payments.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos realizados</h3>
              <p className="text-gray-500">Este conductor aún no ha realizado pagos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen de pagos */}
              <Card className="border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center text-amber-800">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Resumen de Pagos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{payments.length}</div>
                      <div className="text-sm text-gray-600">Total de Pagos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        Bs {payments.reduce((total, payment) => total + (payment.monto || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-600">Monto Total Pagado</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabla de pagos */}
              <div className="border-[2px] border-gray-600 rounded-lg overflow-hidden shadow-md">
                <Table className="w-full border-collapse">
                  <TableHeader className="bg-gray-700">
                    <TableRow className="border-b-0">
                      <TableHead className="font-bold text-white py-3 border-0">Fecha y Hora</TableHead>
                      <TableHead className="font-bold text-white py-3 border-0">Monto</TableHead>
                      <TableHead className="font-bold text-white py-3 border-0">ID Pago</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-0 hover:bg-gray-50">
                        <TableCell className="border-0 py-2">{formatDate(payment.fechaHora)}</TableCell>
                        <TableCell className="border-0 py-2">
                          <span className="font-medium text-green-600">Bs {payment.monto}</span>
                        </TableCell>
                        <TableCell className="border-0 py-2">
                          <Badge variant="outline" className="font-mono">
                            #{payment.id}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación para pagos */}
              {totalPaymentsPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    onClick={() => setCurrentPaymentsPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPaymentsPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPaymentsPage} de {totalPaymentsPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPaymentsPage((prev) => Math.min(prev + 1, totalPaymentsPages))}
                    disabled={currentPaymentsPage === totalPaymentsPages}
                    variant="outline"
                    size="sm"
                  >
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowPaymentsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
