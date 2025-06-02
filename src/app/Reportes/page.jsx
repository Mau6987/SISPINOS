"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Navbar from "../Navbar"
import {
  FileText,
  Download,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Truck,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/components/ui/card"
import { Input } from "@/components/components/ui/input"
import { Label } from "@/components/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/components/ui/popover"
import { Badge } from "@/components/components/ui/badge"
import { Checkbox } from "@/components/components/ui/checkbox"

// URL de la API

// URL de la API
const API_URL = "https://mi-backendsecond.onrender.com"


export default function ReportesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)
  const [activeReport, setActiveReport] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [showForm, setShowForm] = useState(true)

  // Estados para filtros comunes
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [usuarioId, setUsuarioId] = useState("")
  const [tipoCamionId, setTipoCamionId] = useState("")
  const [selectedEstados, setSelectedEstados] = useState([])
  const [selectedRoles, setSelectedRoles] = useState([])
  const [agruparPor, setAgruparPor] = useState("dia")

  // Estados para datos auxiliares
  const [usuarios, setUsuarios] = useState([])
  const [tiposCamion, setTiposCamion] = useState([])

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Cargar datos auxiliares al iniciar
  useEffect(() => {
    fetchUsuarios()
    fetchTiposCamion()
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
      const response = await fetch(`${API_URL}/usuarios`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  // Obtener tipos de camión para filtros
  const fetchTiposCamion = async () => {
    try {
      const response = await fetch(`${API_URL}/tiposDeCamion`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setTiposCamion(data)
      }
    } catch (error) {
      console.error("Error al cargar tipos de camión:", error)
    }
  }

  // Función genérica para generar reportes
  const generateReport = async (endpoint, method = "POST", body = null) => {
    try {
      setLoading(true)
      setError("")

      const config = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }

      if (body && method === "POST") {
        config.body = JSON.stringify(body)
      }

      const response = await fetch(`${API_URL}/${endpoint}`, config)

      if (!response.ok) {
        throw new Error("Error al generar el reporte")
      }

      const data = await response.json()
      setReportData(data)
      setShowForm(false)
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

  // Funciones específicas para cada reporte
  const generateCargasReport = () => {
    const body = {}
    if (fechaInicio) body.fechaInicio = fechaInicio
    if (fechaFin) body.fechaFin = fechaFin
    if (usuarioId) body.usuarioId = Number.parseInt(usuarioId)
    if (tipoCamionId) body.tipoCamionId = Number.parseInt(tipoCamionId)
    if (selectedEstados.length > 0) body.estado = selectedEstados[0]

    setActiveReport("cargas")
    generateReport("cargas/periodo", "POST", body)
  }

  const generatePagosReport = () => {
    const body = {}
    if (fechaInicio) body.fechaInicio = fechaInicio
    if (fechaFin) body.fechaFin = fechaFin
    if (usuarioId) body.usuarioId = Number.parseInt(usuarioId)

    setActiveReport("pagos")
    generateReport("pagos/periodo", "POST", body)
  }

  const generateActividadReport = () => {
    const body = {}
    if (fechaInicio) body.fechaInicio = fechaInicio
    if (fechaFin) body.fechaFin = fechaFin
    if (selectedRoles.length > 0) body.rol = selectedRoles[0]

    setActiveReport("actividad")
    generateReport("usuarios/actividad", "POST", body)
  }

  const generateDeudasReport = () => {
    setActiveReport("deudas")
    generateReport("deudas", "GET")
  }

  const generateIngresosReport = () => {
    if (!fechaInicio || !fechaFin) {
      showNotification("error", "Las fechas de inicio y fin son requeridas para el reporte de ingresos")
      return
    }

    const body = {
      fechaInicio,
      fechaFin,
      agruparPor,
    }

    setActiveReport("ingresos")
    generateReport("ingresos", "POST", body)
  }

  const generateBloqueadosReport = () => {
    setActiveReport("bloqueados")
    generateReport("usuarios/bloqueados", "GET")
  }

  const generateRendimientoReport = () => {
    if (!fechaInicio || !fechaFin) {
      showNotification("error", "Las fechas de inicio y fin son requeridas para el reporte de rendimiento")
      return
    }

    const body = {
      fechaInicio,
      fechaFin,
    }

    setActiveReport("rendimiento")
    generateReport("rendimiento/tipoCamion", "POST", body)
  }

  // Toggle functions para filtros
  const toggleEstado = (estado) => {
    setSelectedEstados((prev) => {
      if (prev.includes(estado)) {
        return prev.filter((e) => e !== estado)
      } else {
        return [...prev, estado]
      }
    })
  }

  const toggleRol = (rol) => {
    setSelectedRoles((prev) => {
      if (prev.includes(rol)) {
        return prev.filter((r) => r !== rol)
      } else {
        return [...prev, rol]
      }
    })
  }

  // Limpiar filtros
  const clearFilters = () => {
    setFechaInicio("")
    setFechaFin("")
    setUsuarioId("")
    setTipoCamionId("")
    setSelectedEstados([])
    setSelectedRoles([])
    setAgruparPor("dia")
    setActiveReport(null)
    setReportData(null)
    setShowForm(true)
    setCurrentPage(1)
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(amount)
  }

  // Formatear fecha
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

  // Función para exportar a PDF con el nuevo diseño profesional
  const exportToPDF = () => {
    if (!reportData) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - 2 * margin
    const currentDate = format(new Date(), "dd/MM/yyyy", { locale: es })

    // Colores profesionales
    const titleColor = [30, 50, 80] // Azul oscuro para títulos
    const borderColor = [0, 51, 102] // Azul formal para bordes
    const textColor = [40, 40, 40] // Gris oscuro para texto
    const bgColor = [250, 250, 250] // Gris muy claro para fondos

    // Configuración inicial
    doc.setFillColor(...bgColor)
    doc.rect(0, 0, pageWidth, pageHeight, "F")

    // Función para dibujar un recuadro con borde azul
    const drawBox = (x, y, width, height, title = "", isTableTitle = false) => {
      // Borde azul
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.5)
      doc.rect(x, y, width, height, "S")

      if (title) {
        // Título del recuadro
        doc.setFontSize(isTableTitle ? 14 : 12)
        doc.setTextColor(...titleColor)
        doc.setFont("helvetica", "bold")
        doc.text(title, x + 5, y + (isTableTitle ? 6 : 8))
      }
    }

    // Título principal
    doc.setFontSize(24)
    doc.setTextColor(...titleColor)
    doc.setFont("helvetica", "bold")
    doc.text(`REPORTE ${getReportTitle().toUpperCase()}`, pageWidth / 2, margin + 8, { align: "center" })

    // Subtítulo
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("DISTRIBUIDORA DE AGUA LOS PINOS", pageWidth / 2, margin + 16, { align: "center" })

    // Información básica - Dos columnas
    const boxHeight = 35
    const boxWidth = (contentWidth - 10) / 2
    const startY = margin + 24

    // Recuadro izquierdo - Información del Reporte
    drawBox(margin, startY, boxWidth, boxHeight, "INFORMACIÓN DEL REPORTE")
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")

    const reportInfo = [
      `Tipo: ${getReportTitle()}`,
      `Fecha generación: ${currentDate}`,
      `Usuario: ${localStorage.getItem("nombreUsuario") || "Sistema"}`,
    ]
    doc.text(reportInfo, margin + 5, startY + 16)

    // Recuadro derecho - Parámetros de Consulta
    drawBox(margin + boxWidth + 10, startY, boxWidth, boxHeight, "PARÁMETROS DE CONSULTA")

    const parametros = [
      `Período: ${fechaInicio || "Todas"} - ${fechaFin || "Todas"}`,
      `Estados: ${selectedEstados.length > 0 ? selectedEstados.join(", ") : "Todos"}`,
      `Roles: ${selectedRoles.length > 0 ? selectedRoles.join(", ") : "Todos"}`,
    ]
    doc.text(parametros, margin + boxWidth + 15, startY + 16)

    // Resumen de estadísticas
    let currentY = startY + boxHeight + 6

    if (reportData.estadisticas || reportData.totales) {
      const summaryHeight = 25
      drawBox(margin, currentY, contentWidth, summaryHeight, "RESUMEN DE ESTADÍSTICAS")

      const stats = reportData.estadisticas || reportData.totales || {}
      const statsEntries = Object.entries(stats)

      if (statsEntries.length > 0) {
        const colWidth = (contentWidth - 20) / Math.min(statsEntries.length, 4)

        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")

        statsEntries.slice(0, 4).forEach(([key, value], index) => {
          const x = margin + 5 + colWidth * index
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
          const formattedValue =
            typeof value === "number" && key.includes("osto")
              ? formatCurrency(value)
              : typeof value === "number" && key.includes("orcentaje")
                ? `${value.toFixed(1)}%`
                : value

          doc.text(`${label}: ${formattedValue}`, x, currentY + 16)
        })
      }

      currentY += summaryHeight + 6
    }

    // Generar contenido específico según el tipo de reporte
    generateReportContent(doc, currentY)

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...textColor)
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - margin, { align: "right" })
      doc.text(`Generado el ${currentDate}`, margin, pageHeight - margin)
    }

    // Guardar PDF
    doc.save(`reporte_${activeReport}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const getReportTitle = () => {
    const titles = {
      cargas: "DE CARGAS POR PERÍODO",
      pagos: "DE PAGOS POR PERÍODO",
      actividad: "DE ACTIVIDAD DE USUARIOS",
      deudas: "DE DEUDAS PENDIENTES",
      ingresos: "DE INGRESOS",
      bloqueados: "DE USUARIOS BLOQUEADOS",
      rendimiento: "DE RENDIMIENTO POR TIPO DE CAMIÓN",
    }
    return titles[activeReport] || "GENERAL"
  }

  const generateReportContent = (doc, startY) => {
    const margin = 15
    const contentWidth = doc.internal.pageSize.getWidth() - 2 * margin
    const borderColor = [0, 51, 102]
    const currentY = startY

    // Función para dibujar un recuadro con borde azul
    const drawBox = (x, y, width, height, title = "", isTableTitle = false) => {
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.5)
      doc.rect(x, y, width, height, "S")

      if (title) {
        doc.setFontSize(isTableTitle ? 14 : 12)
        doc.setTextColor(30, 50, 80)
        doc.setFont("helvetica", "bold")
        doc.text(title, x + 5, y + (isTableTitle ? 6 : 8))
      }
    }

    if (activeReport === "cargas" && reportData.cargas && reportData.cargas.length > 0) {
      drawBox(margin, currentY, contentWidth, 15, "DETALLE DE CARGAS", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Usuario", "Tipo Camión", "Fecha", "Costo", "Estado"]],
        body: reportData.cargas.map((carga) => [
          carga.usuario?.nombre || "N/A",
          carga.tipoDeCamion?.descripcion || "N/A",
          formatDateTime(carga.fechaHora),
          formatCurrency(carga.costo),
          carga.estado,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    } else if (activeReport === "deudas" && reportData.deudores && reportData.deudores.length > 0) {
      drawBox(margin, currentY, contentWidth, 15, "USUARIOS CON DEUDAS PENDIENTES", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Usuario", "Correo", "Cargas en Deuda", "Monto Deuda"]],
        body: reportData.deudores.map((deudor) => [
          deudor.nombre,
          deudor.correo,
          deudor.deuda.cantidadCargasDeuda,
          formatCurrency(deudor.deuda.montoDeuda),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    } else if (
      activeReport === "rendimiento" &&
      reportData.rendimientoPorTipo &&
      reportData.rendimientoPorTipo.length > 0
    ) {
      drawBox(margin, currentY, contentWidth, 15, "RENDIMIENTO POR TIPO DE CAMIÓN", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [
          ["Tipo Camión", "Total Cargas", "Cargas Pagadas", "Cargas Deuda", "Total Costo", "Total Litros", "% Pagado"],
        ],
        body: reportData.rendimientoPorTipo.map((rendimiento) => [
          rendimiento.tipoCamion?.descripcion || "N/A",
          rendimiento.estadisticas.totalCargas,
          rendimiento.estadisticas.cargasPagadas,
          rendimiento.estadisticas.cargasDeuda,
          formatCurrency(rendimiento.estadisticas.totalCosto),
          `${rendimiento.estadisticas.totalLitros.toLocaleString()} L`,
          `${rendimiento.estadisticas.porcentajePagado.toFixed(1)}%`,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    } else if (activeReport === "pagos" && reportData.pagos && reportData.pagos.length > 0) {
      drawBox(margin, currentY, contentWidth, 15, "DETALLE DE PAGOS", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Usuario", "Fecha", "Monto", "Cargas Asociadas"]],
        body: reportData.pagos.map((pago) => [
          pago.usuario?.nombre || "N/A",
          formatDateTime(pago.fechaHora),
          formatCurrency(pago.monto),
          pago.cargas ? pago.cargas.length : 0,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    } else if (
      activeReport === "bloqueados" &&
      reportData.usuariosBloqueados &&
      reportData.usuariosBloqueados.length > 0
    ) {
      drawBox(margin, currentY, contentWidth, 15, "USUARIOS BLOQUEADOS", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Usuario", "Correo", "Fecha Bloqueo", "Motivo"]],
        body: reportData.usuariosBloqueados.map((usuario) => [
          usuario.nombre,
          usuario.correo,
          formatDate(usuario.fechaBloqueo),
          usuario.motivoBloqueo || "Sin especificar",
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    } else if (activeReport === "actividad" && reportData && reportData.length > 0) {
      drawBox(margin, currentY, contentWidth, 15, "ACTIVIDAD DE USUARIOS", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Usuario", "Rol", "Total Cargas", "Cargas Pagadas", "Cargas Deuda", "Total Costo"]],
        body: reportData.map((usuario) => [
          usuario.nombre,
          usuario.rol,
          usuario.actividad?.totalCargas || 0,
          usuario.actividad?.cargasPagadas || 0,
          usuario.actividad?.cargasDeuda || 0,
          formatCurrency(usuario.actividad?.totalCosto || 0),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    } else if (activeReport === "ingresos" && reportData.ingresos && reportData.ingresos.length > 0) {
      drawBox(margin, currentY, contentWidth, 15, "INGRESOS POR PERÍODO", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Período", "Total Ingresos", "Cantidad Pagos"]],
        body: reportData.ingresos.map((ingreso) => [
          formatDate(ingreso.periodo),
          formatCurrency(ingreso.total),
          ingreso.cantidad,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    }
  }

  // Obtener datos para la tabla actual
  const getCurrentTableData = () => {
    if (!reportData) return []

    switch (activeReport) {
      case "cargas":
        return reportData.cargas || []
      case "pagos":
        return reportData.pagos || []
      case "actividad":
        return reportData || []
      case "deudas":
        return reportData.deudores || []
      case "bloqueados":
        return reportData.usuariosBloqueados || []
      case "ingresos":
        return reportData.ingresos || []
      case "rendimiento":
        return reportData.rendimientoPorTipo || []
      default:
        return []
    }
  }

  // Paginación
  const tableData = getCurrentTableData()
  const totalPages = Math.ceil(tableData.length / itemsPerPage)
  const paginatedData = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleNuevoReporte = () => {
    setShowForm(true)
    setReportData(null)
    setActiveReport(null)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

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

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Sistema de Reportes</h1>

        {showForm ? (
          <Card className="max-w-4xl mx-auto shadow-lg border-2 border-gray-300 rounded-lg">
            <CardHeader>
              <CardTitle className="text-center text-xl flex items-center justify-center">
                <BarChart3 className="mr-2 h-6 w-6 text-[#1E3A8A]" />
                Generación de Reportes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mensaje de error */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              )}

              {/* Filtros de fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha Fin</Label>
                  <Input id="fechaFin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                </div>
              </div>

              {/* Filtros adicionales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Usuario</Label>
                  <select
                    value={usuarioId}
                    onChange={(e) => setUsuarioId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="">Todos los usuarios</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nombre} ({usuario.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Camión</Label>
                  <select
                    value={tipoCamionId}
                    onChange={(e) => setTipoCamionId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="">Todos los tipos</option>
                    {tiposCamion.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.descripcion} ({tipo.cantidadDeAgua}L)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtros de estado y rol */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Carga</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedEstados.length > 0
                          ? `${selectedEstados.length} estados seleccionados`
                          : "Seleccione estados"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="estado-deuda"
                            checked={selectedEstados.includes("deuda")}
                            onCheckedChange={() => toggleEstado("deuda")}
                          />
                          <Label htmlFor="estado-deuda" className="flex-1 cursor-pointer">
                            Deuda
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="estado-pagado"
                            checked={selectedEstados.includes("pagado")}
                            onCheckedChange={() => toggleEstado("pagado")}
                          />
                          <Label htmlFor="estado-pagado" className="flex-1 cursor-pointer">
                            Pagado
                          </Label>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Rol de Usuario</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedRoles.length > 0 ? `${selectedRoles.length} roles seleccionados` : "Seleccione roles"}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="p-4 space-y-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rol-propietario"
                            checked={selectedRoles.includes("propietario")}
                            onCheckedChange={() => toggleRol("propietario")}
                          />
                          <Label htmlFor="rol-propietario" className="flex-1 cursor-pointer">
                            Propietario
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="rol-conductor"
                            checked={selectedRoles.includes("conductor")}
                            onCheckedChange={() => toggleRol("conductor")}
                          />
                          <Label htmlFor="rol-conductor" className="flex-1 cursor-pointer">
                            Conductor
                          </Label>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Agrupar Por</Label>
                  <select
                    value={agruparPor}
                    onChange={(e) => setAgruparPor(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-black"
                  >
                    <option value="dia">Día</option>
                    <option value="semana">Semana</option>
                    <option value="mes">Mes</option>
                  </select>
                </div>
              </div>

              {/* Badges para filtros seleccionados */}
              {(selectedEstados.length > 0 || selectedRoles.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {selectedEstados.map((estado) => (
                    <Badge
                      key={estado}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleEstado(estado)}
                    >
                      Estado: {estado}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                  {selectedRoles.map((rol) => (
                    <Badge key={rol} variant="secondary" className="cursor-pointer" onClick={() => toggleRol(rol)}>
                      Rol: {rol}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Botones de reportes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <Button
                  onClick={generateCargasReport}
                  disabled={loading}
                  className="bg-blue-600 text-white p-4 h-auto hover:bg-blue-700 transition-colors flex flex-col items-center"
                >
                  <Truck className="h-8 w-8 mb-2" />
                  <span className="font-medium">Cargas por Período</span>
                </Button>

                <Button
                  onClick={generatePagosReport}
                  disabled={loading}
                  className="bg-green-600 text-white p-4 h-auto hover:bg-green-700 transition-colors flex flex-col items-center"
                >
                  <DollarSign className="h-8 w-8 mb-2" />
                  <span className="font-medium">Pagos por Período</span>
                </Button>

                <Button
                  onClick={generateActividadReport}
                  disabled={loading}
                  className="bg-purple-600 text-white p-4 h-auto hover:bg-purple-700 transition-colors flex flex-col items-center"
                >
                  <Users className="h-8 w-8 mb-2" />
                  <span className="font-medium">Actividad de Usuarios</span>
                </Button>

                <Button
                  onClick={generateDeudasReport}
                  disabled={loading}
                  className="bg-red-600 text-white p-4 h-auto hover:bg-red-700 transition-colors flex flex-col items-center"
                >
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <span className="font-medium">Reporte de Deudas</span>
                </Button>

                <Button
                  onClick={generateIngresosReport}
                  disabled={loading}
                  className="bg-yellow-600 text-white p-4 h-auto hover:bg-yellow-700 transition-colors flex flex-col items-center"
                >
                  <TrendingUp className="h-8 w-8 mb-2" />
                  <span className="font-medium">Ingresos</span>
                </Button>

                <Button
                  onClick={generateBloqueadosReport}
                  disabled={loading}
                  className="bg-gray-600 text-white p-4 h-auto hover:bg-gray-700 transition-colors flex flex-col items-center"
                >
                  <Users className="h-8 w-8 mb-2" />
                  <span className="font-medium">Usuarios Bloqueados</span>
                </Button>

                <Button
                  onClick={generateRendimientoReport}
                  disabled={loading}
                  className="bg-indigo-600 text-white p-4 h-auto hover:bg-indigo-700 transition-colors flex flex-col items-center"
                >
                  <BarChart3 className="h-8 w-8 mb-2" />
                  <span className="font-medium">Rendimiento Camiones</span>
                </Button>

                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="p-4 h-auto border-2 border-gray-300 hover:bg-gray-50 transition-colors flex flex-col items-center"
                >
                  <X className="h-8 w-8 mb-2" />
                  <span className="font-medium">Limpiar Filtros</span>
                </Button>
              </div>

              {/* Indicador de carga */}
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1E3A8A] mr-4" />
                  <span className="text-black">Generando reporte...</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Botones de acción */}
            <div className="flex justify-center gap-4 mb-6">
              <Button
                onClick={exportToPDF}
                className="bg-slate-900 hover:bg-slate-950 text-white"
                disabled={!reportData}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button onClick={handleNuevoReporte} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Nuevo Reporte
              </Button>
            </div>

            {/* Información del reporte y estadísticas */}
            {reportData && (
              <Card className="mb-6 shadow-md border-2 border-gray-300 rounded-lg">
                <CardHeader className="bg-blue-900 text-white">
                  <CardTitle className="text-white flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    {getReportTitle()} - Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {reportData.estadisticas && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(reportData.estadisticas).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="bg-gray-100 p-2 rounded-t-md">
                            <p className="font-semibold text-gray-800 text-sm">
                              {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                            </p>
                          </div>
                          <p className="text-xl font-bold py-2">
                            {typeof value === "number" && key.includes("osto")
                              ? formatCurrency(value)
                              : typeof value === "number" && key.includes("orcentaje")
                                ? `${value.toFixed(2)}%`
                                : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Totales Generales */}
            {reportData.totales && activeReport === "rendimiento" && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">Totales Generales</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{reportData.totales.totalCargas}</p>
                    <p className="text-sm text-gray-600">Total Cargas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totales.totalCosto)}</p>
                    <p className="text-sm text-gray-600">Total Costo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {reportData.totales.totalLitros.toLocaleString()} L
                    </p>
                    <p className="text-sm text-gray-600">Total Litros</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {formatCurrency(reportData.totales.ingresoPromedioPorCarga)}
                    </p>
                    <p className="text-sm text-gray-600">Promedio por Carga</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de resultados */}
            {tableData.length > 0 && (
              <Card className="border-2 border-gray-300 rounded-lg">
                <CardHeader className="bg-gray-700 text-white">
                  <CardTitle className="text-white">Detalle del Reporte</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-700 text-white">
                      <TableRow>
                        {activeReport === "cargas" && (
                          <>
                            <TableHead className="font-bold text-white">Usuario</TableHead>
                            <TableHead className="font-bold text-white">Tipo Camión</TableHead>
                            <TableHead className="font-bold text-white">Fecha</TableHead>
                            <TableHead className="font-bold text-white">Costo</TableHead>
                            <TableHead className="font-bold text-white">Estado</TableHead>
                          </>
                        )}
                        {activeReport === "deudas" && (
                          <>
                            <TableHead className="font-bold text-white">Usuario</TableHead>
                            <TableHead className="font-bold text-white">Correo</TableHead>
                            <TableHead className="font-bold text-white">Cargas en Deuda</TableHead>
                            <TableHead className="font-bold text-white">Monto Deuda</TableHead>
                          </>
                        )}
                        {activeReport === "bloqueados" && (
                          <>
                            <TableHead className="font-bold text-white">Usuario</TableHead>
                            <TableHead className="font-bold text-white">Correo</TableHead>
                            <TableHead className="font-bold text-white">Fecha Bloqueo</TableHead>
                            <TableHead className="font-bold text-white">Motivo</TableHead>
                          </>
                        )}
                        {activeReport === "pagos" && (
                          <>
                            <TableHead className="font-bold text-white">Usuario</TableHead>
                            <TableHead className="font-bold text-white">Fecha</TableHead>
                            <TableHead className="font-bold text-white">Monto</TableHead>
                            <TableHead className="font-bold text-white">Cargas Asociadas</TableHead>
                          </>
                        )}
                        {activeReport === "actividad" && (
                          <>
                            <TableHead className="font-bold text-white">Usuario</TableHead>
                            <TableHead className="font-bold text-white">Correo</TableHead>
                            <TableHead className="font-bold text-white">Último Acceso</TableHead>
                          </>
                        )}
                        {activeReport === "rendimiento" && (
                          <>
                            <TableHead className="font-bold text-white">Tipo Camión</TableHead>
                            <TableHead className="font-bold text-white">Total Cargas</TableHead>
                            <TableHead className="font-bold text-white">Cargas Pagadas</TableHead>
                            <TableHead className="font-bold text-white">Cargas Deuda</TableHead>
                            <TableHead className="font-bold text-white">Total Costo</TableHead>
                            <TableHead className="font-bold text-white">Total Litros</TableHead>
                            <TableHead className="font-bold text-white">% Pagado</TableHead>
                          </>
                        )}
                        {activeReport === "ingresos" && (
                          <>
                            <TableHead className="font-bold text-white">Periodo</TableHead>
                            <TableHead className="font-bold text-white">Ingreso Total</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((item, index) => (
                        <TableRow key={index} className="hover:bg-gray-50">
                          {activeReport === "cargas" && (
                            <>
                              <TableCell>{item.usuario?.nombre || "N/A"}</TableCell>
                              <TableCell>{item.tipoDeCamion?.descripcion || "N/A"}</TableCell>
                              <TableCell>{formatDateTime(item.fechaHora)}</TableCell>
                              <TableCell>{formatCurrency(item.costo)}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.estado === "deuda" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {item.estado}
                                </span>
                              </TableCell>
                            </>
                          )}
                          {activeReport === "deudas" && (
                            <>
                              <TableCell>{item.nombre}</TableCell>
                              <TableCell>{item.correo}</TableCell>
                              <TableCell className="text-center">{item.deuda.cantidadCargasDeuda}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.deuda.montoDeuda)}</TableCell>
                            </>
                          )}
                          {activeReport === "bloqueados" && (
                            <>
                              <TableCell>{item.nombre}</TableCell>
                              <TableCell>{item.correo}</TableCell>
                              <TableCell>{formatDate(item.fechaBloqueo)}</TableCell>
                              <TableCell>{item.motivoBloqueo}</TableCell>
                            </>
                          )}
                          {activeReport === "pagos" && (
                            <>
                              <TableCell>{item.usuario?.nombre || "N/A"}</TableCell>
                              <TableCell>{formatDateTime(item.fechaHora)}</TableCell>
                              <TableCell>{formatCurrency(item.monto)}</TableCell>
                              <TableCell>{item.cargasAsociadas ? item.cargasAsociadas.length : 0}</TableCell>
                            </>
                          )}
                          {activeReport === "actividad" && (
                            <>
                              <TableCell>{item.nombre}</TableCell>
                              <TableCell>{item.correo}</TableCell>
                              <TableCell>{formatDateTime(item.ultimoAcceso)}</TableCell>
                            </>
                          )}
                          {activeReport === "rendimiento" && (
                            <>
                              <TableCell className="font-medium">{item.tipoCamion?.descripcion || "N/A"}</TableCell>
                              <TableCell className="text-center">{item.estadisticas.totalCargas}</TableCell>
                              <TableCell className="text-center text-green-600">
                                {item.estadisticas.cargasPagadas}
                              </TableCell>
                              <TableCell className="text-center text-red-600">
                                {item.estadisticas.cargasDeuda}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCurrency(item.estadisticas.totalCosto)}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.estadisticas.totalLitros.toLocaleString()} L
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.estadisticas.porcentajePagado >= 80
                                      ? "bg-green-100 text-green-800"
                                      : item.estadisticas.porcentajePagado >= 50
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {item.estadisticas.porcentajePagado.toFixed(1)}%
                                </span>
                              </TableCell>
                            </>
                          )}
                          {activeReport === "ingresos" && (
                            <>
                              <TableCell>{item.periodo}</TableCell>
                              <TableCell>{formatCurrency(item.ingresoTotal)}</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
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
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Página {currentPage} de {totalPages || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )}

            {/* Mensaje si no hay datos */}
            {reportData && tableData.length === 0 && (
              <Card className="border-2 border-gray-300 rounded-lg">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No se encontraron datos para mostrar en este reporte.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
