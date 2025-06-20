"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Navbar from "../Navbar"
import { FileText, Download, Users, DollarSign, AlertTriangle, Truck, BarChart3, Loader2, CheckCircle, AlertCircle, X, ChevronDown, ChevronLeft, ChevronRight, RefreshCw, Calendar, Filter, Settings } from 'lucide-react'

import { Button } from "@/components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/components/ui/card"
import { Input } from "@/components/components/ui/input"
import { Label } from "@/components/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/components/ui/popover"
import { Badge } from "@/components/components/ui/badge"
import { Checkbox } from "@/components/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/components/ui/select"
import LogoWithText from "@/components/logo"

// URL de la API
const API_URL = "https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev"


export default function ReportesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)
  const [selectedReportType, setSelectedReportType] = useState("")
  const [reportData, setReportData] = useState(null)
  const [showReportForm, setShowReportForm] = useState(true)

  // Estados para filtros de reportes
  const [reportFechaInicio, setReportFechaInicio] = useState("")
  const [reportFechaFin, setReportFechaFin] = useState("")
  const [usuarioId, setUsuarioId] = useState("todos")
  const [selectedEstados, setSelectedEstados] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])
  const [agruparPor, setAgruparPor] = useState("dia")

  // Estados para datos auxiliares
  const [usuarios, setUsuarios] = useState([])

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Tipos de reportes disponibles
  const reportTypes = [
    {
      id: "cargas-periodo",
      name: "Cargas por Período",
      icon: Truck,
      color: "bg-blue-600",
      description: "Reporte de cargas agrupadas por tiempo",
      requiresDates: true,
      endpoint: "cargas-por-periodo",
    },
    {
      id: "cargas-usuario",
      name: "Cargas por Usuario",
      icon: Users,
      color: "bg-indigo-600",
      description: "Reporte de cargas por propietario/conductor",
      requiresDates: false,
      endpoint: "cargas-por-usuario",
    },
    {
      id: "pagos-periodo",
      name: "Pagos por Período",
      icon: DollarSign,
      color: "bg-green-600",
      description: "Reporte de pagos agrupados por tiempo",
      requiresDates: true,
      endpoint: "pagos-por-periodo",
    },
    {
      id: "deudas",
      name: "Deudas Pendientes",
      icon: AlertTriangle,
      color: "bg-red-600",
      description: "Usuarios con deudas pendientes",
      requiresDates: false,
      endpoint: "deudas-por-usuario",
      method: "GET",
    },
  ]

  useEffect(() => {
    fetchUsuarios()
  }, [])

  // Mostrar notificación
  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // Obtener usuarios para filtros
  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${API_URL}/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data.filter((user) => user.rol === "propietario" || user.rol === "conductor"))
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
    }
  }

  // Función genérica para generar reportes
  const generateReport = async () => {
    if (!selectedReportType) {
      showNotification("error", "Seleccione un tipo de reporte")
      return
    }

    const reportConfig = reportTypes.find((r) => r.id === selectedReportType)
    if (!reportConfig) return

    if (reportConfig.requiresDates && (!reportFechaInicio || !reportFechaFin)) {
      showNotification("error", "Las fechas de inicio y fin son requeridas para este reporte")
      return
    }

    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const body = {}
      if (reportFechaInicio) body.fechaInicio = reportFechaInicio
      if (reportFechaFin) body.fechaFin = reportFechaFin
      if (usuarioId && usuarioId !== "todos") body.usuarioId = Number.parseInt(usuarioId)
      if (selectedEstados.length > 0) body.estado = selectedEstados[0]
      if (selectedRoles.length > 0) body.rol = selectedRoles[0]
      if (agruparPor) body.agruparPor = agruparPor

      const config = {
        method: reportConfig.method || "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }

      if (config.method === "POST") {
        config.body = JSON.stringify(body)
      }

      const response = await fetch(`${API_URL}/${reportConfig.endpoint}`, config)

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          router.push("/login")
          return
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setReportData(data)
      setShowReportForm(false)
      setCurrentPage(1)
      showNotification("success", "Reporte generado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      setError("Error al generar el reporte. Intente nuevamente.")
      showNotification("error", "Error al generar el reporte")
    } finally {
      setLoading(false)
    }
  }

  // Toggle functions para filtros
  const toggleEstado = (estado) => {
    setSelectedEstados((prev) => {
      if (prev.includes(estado)) {
        return prev.filter((e) => e !== estado)
      } else {
        return [estado] // Solo permitir un estado a la vez
      }
    })
  }

  const toggleRol = (rol) => {
    setSelectedRoles((prev) => {
      if (prev.includes(rol)) {
        return prev.filter((r) => r !== rol)
      } else {
        return [rol] // Solo permitir un rol a la vez
      }
    })
  }

  // Limpiar filtros de reportes
  const clearReportFilters = () => {
    setReportFechaInicio("")
    setReportFechaFin("")
    setUsuarioId("todos")
    setSelectedEstados([])
    setSelectedRoles([])
    setAgruparPor("dia")
    setSelectedReportType("")
    setReportData(null)
    setShowReportForm(true)
    setCurrentPage(1)
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(amount || 0)
  }

  // Formatear fecha completa
  const formatDateComplete = (dateString) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "EEEE d 'de' MMMM 'del' yyyy", { locale: es })
    } catch (error) {
      return ""
    }
  }

  // Formatear fecha corta
  const formatDate = (dateString) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return ""
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return ""
    }
  }

  // Función mejorada para exportar reportes a PDF con diseño similar al recibo de pagos
  const exportReportToPDF = () => {
    if (!reportData) return

    const doc = new jsPDF({
      format: [139.7, 215.9], // Half letter size in mm (igual que el recibo)
      orientation: "portrait",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 8
    const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })

    // Colores (igual que el recibo)
    const azulOscuro = [0, 51, 102]
    const grisClaro = [240, 240, 240]
    const negro = [0, 0, 0]
    const reportConfig = reportTypes.find((r) => r.id === selectedReportType)

    // Encabezado con logo y título (igual que el recibo)
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
    doc.text("Sistema de Reportes Empresariales", pageWidth / 2, 18, { align: "center" })

    // Línea separadora
    doc.setDrawColor(...azulOscuro)
    doc.setLineWidth(0.3)
    doc.line(margin, 24, pageWidth - margin, 24)

    // Título del reporte
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...negro)
    doc.text(`REPORTE: ${reportConfig?.name.toUpperCase() || "GENERAL"}`, pageWidth / 2, 30, { align: "center" })

    // Información del reporte en doble columna (similar al recibo)
    let yPos = 38
    const lineHeight = 4

    // Dibujar recuadro para la información
    doc.setDrawColor(...azulOscuro)
    doc.setLineWidth(0.3)
    doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 16)

    // Primera columna de información
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)

    // Columna izquierda
    doc.text("Generado:", margin + 2, yPos + 2)
    doc.setFont("helvetica", "normal")
    doc.text(currentDate, margin + 22, yPos + 2)

    doc.setFont("helvetica", "bold")
    doc.text("Usuario:", margin + 2, yPos + 6)
    doc.setFont("helvetica", "normal")
    const nombreUsuario = localStorage.getItem("nombreUsuario") || localStorage.getItem("username") || "Sistema"
    const usuarioText = nombreUsuario.length > 20 ? nombreUsuario.substring(0, 20) + "..." : nombreUsuario
    doc.text(usuarioText, margin + 22, yPos + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Tipo:", margin + 2, yPos + 10)
    doc.setFont("helvetica", "normal")
    doc.text(reportConfig?.name || "Reporte", margin + 22, yPos + 10)

    // Columna derecha
    const col2X = pageWidth / 2 + 2

    if (reportFechaInicio && reportFechaFin) {
      doc.setFont("helvetica", "bold")
      doc.text("Desde:", col2X, yPos + 2)
      doc.setFont("helvetica", "normal")
      doc.text(formatDate(reportFechaInicio), col2X + 16, yPos + 2)

      doc.setFont("helvetica", "bold")
      doc.text("Hasta:", col2X, yPos + 6)
      doc.setFont("helvetica", "normal")
      doc.text(formatDate(reportFechaFin), col2X + 16, yPos + 6)
    }

    doc.setFont("helvetica", "bold")
    doc.text("Registros:", col2X, yPos + 10)
    doc.setFont("helvetica", "normal")
    doc.text(tableData.length.toString(), col2X + 20, yPos + 10)

    // Detalle de datos en tabla (similar al recibo)
    yPos = 58
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text("DETALLE DEL REPORTE:", margin, yPos)

    yPos += 5

    // Configuración de la tabla
    const tableWidth = pageWidth - 2 * margin
    let colWidths = []
    let headers = []

    switch (selectedReportType) {
      case "cargas-periodo":
        headers = ["PERÍODO", "CARGAS", "MONTO", "PAGADAS", "DEUDA"]
        colWidths = [30, 18, 25, 18, 18]
        break
      case "cargas-usuario":
        headers = ["ROL", "USUARIO", "CARGAS", "MONTO", "DEUDA"]
        colWidths = [18, 30, 18, 25, 18]
        break
      case "pagos-periodo":
        headers = ["PERÍODO", "PAGOS", "MONTO", "ACTIVOS", "ANULADOS"]
        colWidths = [30, 18, 25, 18, 18]
        break
      case "deudas":
        headers = ["ROL", "USUARIO", "CARGAS", "MONTO"]
        colWidths = [20, 35, 20, 25]
        break
    }

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
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 4)
      xPos += colWidths[i]
    })

    yPos += rowHeight

    // Filas de datos
    doc.setFont("helvetica", "normal")
    doc.setFontSize(5)

    const maxRowsToShow = Math.min(tableData.length, 12)
    const dataToShow = tableData.slice(0, maxRowsToShow)

    dataToShow.forEach((item, index) => {
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
      let rowData = []

      switch (selectedReportType) {
        case "cargas-periodo":
          rowData = [
            (item.dataValues?.periodo || item.periodo).substring(0, 12),
            (item.dataValues?.totalCargas || item.totalCargas).toString(),
            formatCurrency(item.dataValues?.montoTotal || item.montoTotal).substring(0, 8),
            (item.dataValues?.cargasPagadas || item.cargasPagadas).toString(),
            (item.dataValues?.cargasEnDeuda || item.cargasEnDeuda).toString(),
          ]
          break
        case "cargas-usuario":
          rowData = [
            item.rol.substring(0, 8),
            item.nombre.substring(0, 15),
            (item.dataValues?.totalCargas || item.totalCargas).toString(),
            formatCurrency(item.dataValues?.montoTotal || item.montoTotal).substring(0, 8),
            (item.dataValues?.cargasEnDeuda || item.cargasEnDeuda).toString(),
          ]
          break
        case "pagos-periodo":
          rowData = [
            (item.dataValues?.periodo || item.periodo).substring(0, 12),
            (item.dataValues?.totalPagos || item.totalPagos).toString(),
            formatCurrency(item.dataValues?.montoTotal || item.montoTotal).substring(0, 8),
            (item.dataValues?.pagosActivos || item.pagosActivos).toString(),
            (item.dataValues?.pagosAnulados || item.pagosAnulados).toString(),
          ]
          break
        case "deudas":
          rowData = [
            item.rol.substring(0, 8),
            item.nombre.substring(0, 18),
            (item.dataValues?.cargasEnDeuda || item.cargasEnDeuda).toString(),
            formatCurrency(item.dataValues?.montoDeuda || item.montoDeuda).substring(0, 8),
          ]
          break
      }

      rowData.forEach((data, j) => {
        doc.text(data, xPos, yPos + 4)
        xPos += colWidths[j]
      })

      yPos += rowHeight
    })

    // Si hay más datos de los que se muestran, indicarlo
    if (tableData.length > maxRowsToShow) {
      yPos += 2
      doc.setFont("helvetica", "italic")
      doc.setFontSize(4)
      doc.text(`... y ${tableData.length - maxRowsToShow} registros más`, margin, yPos)
      yPos += 3
    }

    // Pie del reporte (igual que el recibo)
    yPos += 5
    doc.setDrawColor(...azulOscuro)
    doc.line(margin, yPos, pageWidth - margin, yPos)

    yPos += 4
    doc.setFont("helvetica", "italic")
    doc.setFontSize(4)
    doc.text("Este reporte es generado automáticamente por el sistema.", pageWidth / 2, yPos, { align: "center" })
    doc.text("Distribuidora de Agua Los Pinos", pageWidth / 2, yPos + 3, { align: "center" })
    doc.text(`Generado: ${currentDate}`, pageWidth / 2, yPos + 6, { align: "center" })

    // Guardar PDF
    doc.save(`reporte_${selectedReportType}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  // Obtener datos para la tabla actual
  const getCurrentTableData = () => {
    if (!reportData) return []

    switch (selectedReportType) {
      case "cargas-periodo":
      case "pagos-periodo":
        return reportData.reporte || []
      case "cargas-usuario":
        return reportData.reporte || []
      case "deudas":
        return reportData.reporte || []
      default:
        return []
    }
  }

  // Paginación
  const tableData = getCurrentTableData()
  const totalPages = Math.ceil(tableData.length / itemsPerPage)
  const paginatedData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleNuevoReporte = () => {
    setShowReportForm(true)
    setReportData(null)
    setSelectedReportType("")
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="sticky top-0 z-50 w-full">
        <Navbar />
      </div>

      {/* Notificación emergente */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in">
          <div
            className={`rounded-lg shadow-lg p-4 flex items-center ${
              notification.type === "success"
                ? "bg-green-100 border-l-4 border-green-500"
                : "bg-red-100 border-l-4 border-red-500"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            )}
            <span className="text-black font-medium">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-4 text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 py-4 pt-16 max-w-4xl">
        {/* Header */}
         <div className="bg-white rounded-lg shadow-md border border-gray-300 mb-6 overflow-hidden">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center shadow-lg border border-gray-300">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 17V11M15 17V13M12 17V15" strokeWidth="2"/>
                  <path d="M12 3C10 3 6 7 6 12C6 16 9 20 12 20C15 20 18 16 18 12C18 7 14 3 12 3Z" strokeWidth="2"/>
                  <path d="M12 7V9" strokeWidth="2"/>
                  <path d="M19 3L21 5" strokeWidth="2"/>
                  <path d="M5 5L3 3" strokeWidth="2"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-black tracking-tight">Sistema de Reportes</h1>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-purple-600 to-purple-800"></div>
        </div>
        {showReportForm ? (
          <Card className="shadow-lg border-2 border-gray-300 rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white pb-3">
              <CardTitle className="text-center text-lg flex items-center justify-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Generación de Reportes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              )}

              {/* Selección de tipo de reporte */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-700 flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Seleccione el Tipo de Reporte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((reportType) => {
                    const IconComponent = reportType.icon
                    return (
                      <Card
                        key={reportType.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedReportType === reportType.id ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedReportType(reportType.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${reportType.color} text-white`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{reportType.name}</h4>
                              <p className="text-xs text-gray-600">{reportType.description}</p>
                            </div>
                            {selectedReportType === reportType.id && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Filtros específicos según el tipo de reporte seleccionado */}
              {selectedReportType && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-base font-semibold text-gray-700 flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros para {reportTypes.find((r) => r.id === selectedReportType)?.name}
                  </h3>

                  {/* Filtros de fecha (si son requeridos) */}
                  {reportTypes.find((r) => r.id === selectedReportType)?.requiresDates && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="reportFechaInicio" className="text-sm flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Fecha Inicio *
                        </Label>
                        <Input
                          id="reportFechaInicio"
                          type="date"
                          value={reportFechaInicio}
                          onChange={(e) => setReportFechaInicio(e.target.value)}
                          className="border-gray-300 h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="reportFechaFin" className="text-sm flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Fecha Fin *
                        </Label>
                        <Input
                          id="reportFechaFin"
                          type="date"
                          value={reportFechaFin}
                          onChange={(e) => setReportFechaFin(e.target.value)}
                          className="border-gray-300 h-8"
                        />
                      </div>
                      {(selectedReportType === "cargas-periodo" || selectedReportType === "pagos-periodo") && (
                        <div className="space-y-1">
                          <Label className="text-sm">Agrupar Por</Label>
                          <Select value={agruparPor} onValueChange={setAgruparPor}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Seleccione agrupación" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dia">Día</SelectItem>
                              <SelectItem value="semana">Semana</SelectItem>
                              <SelectItem value="mes">Mes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Filtros opcionales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Filtro de usuario */}
                    {(selectedReportType === "cargas-usuario" || selectedReportType === "cargas-periodo") && (
                      <div className="space-y-1">
                        <Label className="text-sm">Usuario (Opcional)</Label>
                        <Select value={usuarioId} onValueChange={setUsuarioId}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Todos los usuarios" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos los usuarios</SelectItem>
                            {usuarios.map((usuario) => (
                              <SelectItem key={usuario.id} value={usuario.id.toString()}>
                                {usuario.nombre} ({usuario.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Filtro de estado */}
                    {(selectedReportType === "cargas-usuario" || selectedReportType === "cargas-periodo") && (
                      <div className="space-y-1">
                        <Label className="text-sm">Estado de Carga</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-8">
                              {selectedEstados.length > 0 ? selectedEstados.join(", ") : "Seleccione estados"}
                              <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <div className="p-3 space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="estado-deuda"
                                  checked={selectedEstados.includes("deuda")}
                                  onCheckedChange={() => toggleEstado("deuda")}
                                />
                                <Label htmlFor="estado-deuda" className="flex-1 cursor-pointer text-sm">
                                  Deuda
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="estado-pagado"
                                  checked={selectedEstados.includes("pagado")}
                                  onCheckedChange={() => toggleEstado("pagado")}
                                />
                                <Label htmlFor="estado-pagado" className="flex-1 cursor-pointer text-sm">
                                  Pagado
                                </Label>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}

                    {/* Filtro de rol */}
                    {selectedReportType === "cargas-usuario" && (
                      <div className="space-y-1">
                        <Label className="text-sm">Rol de Usuario</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between h-8">
                              {selectedRoles.length > 0 ? selectedRoles.join(", ") : "Seleccione roles"}
                              <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <div className="p-3 space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="rol-propietario"
                                  checked={selectedRoles.includes("propietario")}
                                  onCheckedChange={() => toggleRol("propietario")}
                                />
                                <Label htmlFor="rol-propietario" className="flex-1 cursor-pointer text-sm">
                                  Propietario
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="rol-conductor"
                                  checked={selectedRoles.includes("conductor")}
                                  onCheckedChange={() => toggleRol("conductor")}
                                />
                                <Label htmlFor="rol-conductor" className="flex-1 cursor-pointer text-sm">
                                  Conductor
                                </Label>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {/* Badges para filtros seleccionados */}
                  {(selectedEstados.length > 0 || selectedRoles.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEstados.map((estado) => (
                        <Badge
                          key={estado}
                          variant="secondary"
                          className="cursor-pointer text-xs"
                          onClick={() => toggleEstado(estado)}
                        >
                          Estado: {estado}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                      {selectedRoles.map((rol) => (
                        <Badge
                          key={rol}
                          variant="secondary"
                          className="cursor-pointer text-xs"
                          onClick={() => toggleRol(rol)}
                        >
                          Rol: {rol}
                          <span className="ml-1">×</span>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex justify-center gap-3 pt-3">
                    <Button
                      onClick={generateReport}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-3 w-3" />
                          Generar Reporte
                        </>
                      )}
                    </Button>
                    <Button onClick={clearReportFilters} variant="outline" size="sm">
                      <X className="mr-2 h-3 w-3" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Botones de acción para reportes */}
            <div className="flex justify-center gap-3 mb-4">
              <Button
                onClick={exportReportToPDF}
                className="bg-slate-900 hover:bg-slate-950 text-white"
                disabled={!reportData}
                size="sm"
              >
                <Download className="mr-2 h-3 w-3" />
                Exportar PDF
              </Button>
              <Button onClick={handleNuevoReporte} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-3 w-3" />
                Nuevo Reporte
              </Button>
            </div>

            {/* Información del reporte y estadísticas */}
            {/* Tabla de resultados */}
            {tableData.length > 0 && (
              <Card className="border-2 border-gray-300 rounded-lg">
                <CardHeader className="bg-gray-700 text-white pb-3">
                  <CardTitle className="text-white text-base">Detalle del Reporte</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-700 text-white">
                      <TableRow>
                        {selectedReportType === "cargas-periodo" && (
                          <>
                            <TableHead className="font-bold text-white text-xs">Período</TableHead>
                            <TableHead className="font-bold text-white text-xs">Total Cargas</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto Total</TableHead>
                            <TableHead className="font-bold text-white text-xs">Cargas Pagadas</TableHead>
                            <TableHead className="font-bold text-white text-xs">Cargas en Deuda</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto Pagado</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto en Deuda</TableHead>
                          </>
                        )}
                        {selectedReportType === "cargas-usuario" && (
                          <>
                            <TableHead className="font-bold text-white text-xs">Rol</TableHead>
                            <TableHead className="font-bold text-white text-xs">Usuario</TableHead>
                            <TableHead className="font-bold text-white text-xs">Total Cargas</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto Total</TableHead>
                            <TableHead className="font-bold text-white text-xs">Cargas Pagadas</TableHead>
                            <TableHead className="font-bold text-white text-xs">Cargas en Deuda</TableHead>
                          </>
                        )}
                        {selectedReportType === "deudas" && (
                          <>
                            <TableHead className="font-bold text-white text-xs">Rol</TableHead>
                            <TableHead className="font-bold text-white text-xs">Usuario</TableHead>
                            <TableHead className="font-bold text-white text-xs">Cargas en Deuda</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto Deuda</TableHead>
                          </>
                        )}
                        {selectedReportType === "pagos-periodo" && (
                          <>
                            <TableHead className="font-bold text-white text-xs">Período</TableHead>
                            <TableHead className="font-bold text-white text-xs">Total Pagos</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto Total</TableHead>
                            <TableHead className="font-bold text-white text-xs">Pagos Activos</TableHead>
                            <TableHead className="font-bold text-white text-xs">Pagos Anulados</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto Activo</TableHead>
                            <TableHead className="font-bold text-white text-xs">Monto Anulado</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          {selectedReportType === "cargas-periodo" && (
                            <>
                              <TableCell className="font-medium text-sm">
                                {item.dataValues?.periodo || item.periodo}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {item.dataValues?.totalCargas || item.totalCargas}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(item.dataValues?.montoTotal || item.montoTotal)}
                              </TableCell>
                              <TableCell className="text-center text-green-600 text-sm">
                                {item.dataValues?.cargasPagadas || item.cargasPagadas}
                              </TableCell>
                              <TableCell className="text-center text-red-600 text-sm">
                                {item.dataValues?.cargasEnDeuda || item.cargasEnDeuda}
                              </TableCell>
                              <TableCell className="text-right text-green-600 text-sm">
                                {formatCurrency(item.dataValues?.montoPagado || item.montoPagado)}
                              </TableCell>
                              <TableCell className="text-right text-red-600 text-sm">
                                {formatCurrency(item.dataValues?.montoEnDeuda || item.montoEnDeuda)}
                              </TableCell>
                            </>
                          )}
                          {selectedReportType === "cargas-usuario" && (
                            <>
                              <TableCell className="text-sm">
                                <Badge
                                  variant={item.rol === "propietario" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {item.rol}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-sm">{item.nombre}</TableCell>
                              <TableCell className="text-center text-sm">
                                {item.dataValues?.totalCargas || item.totalCargas}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(item.dataValues?.montoTotal || item.montoTotal)}
                              </TableCell>
                              <TableCell className="text-center text-green-600 text-sm">
                                {item.dataValues?.cargasPagadas || item.cargasPagadas}
                              </TableCell>
                              <TableCell className="text-center text-red-600 text-sm">
                                {item.dataValues?.cargasEnDeuda || item.cargasEnDeuda}
                              </TableCell>
                            </>
                          )}
                          {selectedReportType === "pagos-periodo" && (
                            <>
                              <TableCell className="font-medium text-sm">
                                {item.dataValues?.periodo || item.periodo}
                              </TableCell>
                              <TableCell className="text-center text-sm">
                                {item.dataValues?.totalPagos || item.totalPagos}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(item.dataValues?.montoTotal || item.montoTotal)}
                              </TableCell>
                              <TableCell className="text-center text-green-600 text-sm">
                                {item.dataValues?.pagosActivos || item.pagosActivos}
                              </TableCell>
                              <TableCell className="text-center text-red-600 text-sm">
                                {item.dataValues?.pagosAnulados || item.pagosAnulados}
                              </TableCell>
                              <TableCell className="text-right text-green-600 text-sm">
                                {formatCurrency(item.dataValues?.montoActivo || item.montoActivo)}
                              </TableCell>
                              <TableCell className="text-right text-red-600 text-sm">
                                {formatCurrency(item.dataValues?.montoAnulado || item.montoAnulado)}
                              </TableCell>
                            </>
                          )}
                          {selectedReportType === "deudas" && (
                            <>
                              <TableCell className="text-sm">
                                <Badge
                                  variant={item.rol === "propietario" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {item.rol}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-sm">{item.nombre}</TableCell>
                              <TableCell className="text-center text-red-600 text-sm">
                                {item.dataValues?.cargasEnDeuda || item.cargasEnDeuda}
                              </TableCell>
                              <TableCell className="text-right text-red-600 font-bold text-sm">
                                {formatCurrency(item.dataValues?.montoDeuda || item.montoDeuda)}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-3 border-t">
                  <div className="text-xs text-gray-500">
                    Mostrando {Math.min(tableData.length, (currentPage - 1) * itemsPerPage + 1)}-
                    {Math.min(currentPage * itemsPerPage, tableData.length)} de {tableData.length} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <div className="text-xs">
                      Página {currentPage} de {totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}

            {/* Mensaje si no hay datos */}
            {reportData && tableData.length === 0 && (
              <Card className="border-2 border-gray-300 rounded-lg">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500 text-sm">No se encontraron datos para mostrar en este reporte.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}