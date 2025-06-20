"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  CreditCard,
  Droplet,
  X,
  User,
  Calendar,
  FileText,
  Download,
} from "lucide-react"
import { jsPDF } from "jspdf"
import Swal from "sweetalert2"

import { Button } from "../../components/components/ui/button"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"
import { Checkbox } from "../../components/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Badge } from "../../components/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Label } from "../../components/components/ui/label"
import { Separator } from "../../components/components/ui/separator"

const ITEMS_PER_PAGE = 6

export default function WaterChargesClient() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState(null)
  const [filterStatus, setFilterStatus] = useState([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [showAllTime, setShowAllTime] = useState(false)

  // Resumen de datos
  const [summary, setSummary] = useState({
    totalCargas: 0,
    totalPagadas: 0,
    totalDeuda: 0,
    montoPagadas: 0,
    montoDeuda: 0,
  })

  const router = useRouter()

  // Modificar el useEffect para asegurar que los filtros se apliquen correctamente al mes actual
  useEffect(() => {
    // Set default dates to first and last day of current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Formato para input date
    const firstDayStr = firstDay.toISOString().split("T")[0]
    const lastDayStr = lastDay.toISOString().split("T")[0]

    // Solo establecer las fechas si no están ya establecidas y no se ha seleccionado "Mostrar todo"
    if (!startDate && !showAllTime) setStartDate(firstDayStr)
    if (!endDate && !showAllTime) setEndDate(lastDayStr)

    const fetchData = async () => {
      setLoading(true)
      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("idUser")
      const role = localStorage.getItem("rol")

      // Check if user has the required role (conductor or propietario)
      if (role !== "conductor" && role !== "propietario") {
        router.push("/") // Redirect to home page if not authorized
        return
      }

      const url = `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${userId}`

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const jsonData = await response.json()
          setData(jsonData)

          // Aplicar filtro según las fechas o mostrar todo
          let filtered = jsonData

          if (!showAllTime) {
            filtered = jsonData.filter((item) => {
              const itemDate = new Date(item.fechaHora)
              // Usar las fechas actuales para el filtro inicial
              const startDateTime = startDate ? new Date(startDate) : firstDay
              const endDateTime = endDate ? new Date(endDate) : lastDay

              // Ajustar la hora de la fecha final para incluir todo el día
              endDateTime.setHours(23, 59, 59, 999)

              const dateInRange = itemDate >= startDateTime && itemDate <= endDateTime
              return dateInRange && (filterStatus.length === 0 || filterStatus.includes(item.estado))
            })
          } else {
            // Si se seleccionó "Mostrar todo", solo filtrar por estado
            filtered = jsonData.filter((item) => filterStatus.length === 0 || filterStatus.includes(item.estado))
          }

          setFilteredData(filtered)
          updateSummary(filtered)
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
  }, [router, filterStatus, startDate, endDate, showAllTime])

  const updateSummary = (data) => {
    const pagadas = data.filter((item) => item.estado === "pagado")
    const deuda = data.filter((item) => item.estado === "deuda")

    const montoPagadas = pagadas.reduce((total, item) => total + (item.costo || 30), 0)
    const montoDeuda = deuda.reduce((total, item) => total + (item.costo || 30), 0)

    setSummary({
      totalCargas: data.length,
      totalPagadas: pagadas.length,
      totalDeuda: deuda.length,
      montoPagadas,
      montoDeuda,
    })
  }

  // Modificar la función applyFilters para manejar correctamente las fechas
  const applyFilters = () => {
    if (showAllTime) {
      // Si se seleccionó "Mostrar todo", solo filtrar por estado
      const filtered = data.filter((item) => filterStatus.length === 0 || filterStatus.includes(item.estado))
      setFilteredData(filtered)
      updateSummary(filtered)
    } else {
      const startDateTime = startDate ? new Date(startDate) : null
      let endDateTime = endDate ? new Date(endDate) : null

      // Si end date está definido, ajustar al final del día para incluir todo el día
      if (endDateTime) {
        // Crear una nueva instancia para evitar modificar la fecha original
        endDateTime = new Date(endDateTime)
        endDateTime.setHours(23, 59, 59, 999)
      }

      const filtered = data.filter((item) => {
        const itemDate = new Date(item.fechaHora)

        const dateInRange = (!startDateTime || itemDate >= startDateTime) && (!endDateTime || itemDate <= endDateTime)

        return dateInRange && (filterStatus.length === 0 || filterStatus.includes(item.estado))
      })

      setFilteredData(filtered)
      updateSummary(filtered)
    }

    setCurrentPage(1)
    setShowFilterDialog(false)
  }

  const handleViewDetails = (item) => {
    setSelectedCharge(item)
    setShowDetailsDialog(true)
  }

  // Función para generar PDF de todas las cargas filtradas con formato de comprobante
  const handleDownloadAllChargesPDF = async () => {
    try {
      if (filteredData.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Sin datos",
          text: "No hay cargas para exportar con los filtros seleccionados.",
        })
        return
      }

      const userName = localStorage.getItem("userName") || "Usuario"
      const userRole = localStorage.getItem("rol") || "Cliente"

      const generateChargesPDF = () => {
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
        doc.text("Reporte de Cargas de Agua", pageWidth / 2, 18, { align: "center" })

        // Línea separadora
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.line(margin, 24, pageWidth - margin, 24)

        // Título del reporte
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...negro)
        doc.text("REPORTE DE CARGAS", pageWidth / 2, 30, { align: "center" })

        // Información del reporte en formato compacto
        let yPos = 38
        const lineHeight = 4

        // Dibujar recuadro para la información
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 16)

        // Información básica del reporte
        doc.setFont("helvetica", "bold")
        doc.setFontSize(6)

        // Primera fila
        doc.text("Generado:", margin + 2, yPos + 2)
        doc.setFont("helvetica", "normal")
        doc.text(format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }), margin + 22, yPos + 2)

        doc.setFont("helvetica", "bold")
        doc.text(`${userName}:`, pageWidth / 2 + 2, yPos + 2)
        doc.setFont("helvetica", "normal")
        doc.text("Cliente", pageWidth / 2 + 18, yPos + 2)

        // Segunda fila - Período con fechas completas
        if (!showAllTime && startDate && endDate) {
          doc.setFont("helvetica", "bold")
          doc.text("Período:", margin + 2, yPos + 6)
          doc.setFont("helvetica", "normal")
          const fechaInicioCompleta = format(new Date(startDate), "d 'de' MMMM 'del' yyyy", { locale: es })
          const fechaFinCompleta = format(new Date(endDate), "d 'de' MMMM 'del' yyyy", { locale: es })
          const periodoTexto = `${fechaInicioCompleta} al ${fechaFinCompleta}`

          // Si el texto es muy largo, usar formato corto
          if (periodoTexto.length > 80) {
            doc.text(
              `${format(new Date(startDate), "dd/MM/yyyy")} - ${format(new Date(endDate), "dd/MM/yyyy")}`,
              margin + 22,
              yPos + 6,
            )
          } else {
            // Dividir en múltiples líneas si es necesario
            const lineasPeriodo = doc.splitTextToSize(periodoTexto, pageWidth - margin - 24)
            doc.text(lineasPeriodo, margin + 22, yPos + 6)
          }
        } else {
          doc.setFont("helvetica", "bold")
          doc.text("Período:", margin + 2, yPos + 6)
          doc.setFont("helvetica", "normal")
          doc.text("Todas las cargas", margin + 22, yPos + 6)
        }

        doc.setFont("helvetica", "bold")
        doc.text("Total cargas:", pageWidth / 2 + 2, yPos + 10)
        doc.setFont("helvetica", "normal")
        doc.text(summary.totalCargas.toString(), pageWidth / 2 + 25, yPos + 10)

        // Métricas principales en formato de tabla compacta
        yPos = 58
        doc.setFont("helvetica", "bold")
        doc.setFontSize(6)
        doc.text("RESUMEN:", margin, yPos)
        yPos += 5

        // Crear tabla de resumen
        const resumenTableWidth = pageWidth - 2 * margin
        const resumenColWidths = [35, 25, 25, 25]
        const resumenRowHeight = 5

        // Encabezados de la tabla de resumen
        doc.setFillColor(...grisClaro)
        doc.rect(margin, yPos, resumenTableWidth, resumenRowHeight, "F")
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.2)
        doc.rect(margin, yPos, resumenTableWidth, resumenRowHeight)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(5)
        const xPos = margin + 1
        doc.text("CONCEPTO", xPos, yPos + 3)
        doc.text("PAGADAS", xPos + resumenColWidths[0], yPos + 3)
        doc.text("PENDIENTES", xPos + resumenColWidths[0] + resumenColWidths[1], yPos + 3)
        doc.text("TOTAL", xPos + resumenColWidths[0] + resumenColWidths[1] + resumenColWidths[2], yPos + 3)

        yPos += resumenRowHeight

        // Fila de cantidades
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.1)
        doc.rect(margin, yPos, resumenTableWidth, resumenRowHeight)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(5)
        doc.text("Cantidad de Cargas", xPos, yPos + 3)
        doc.text(summary.totalPagadas.toString(), xPos + resumenColWidths[0], yPos + 3)
        doc.text(summary.totalDeuda.toString(), xPos + resumenColWidths[0] + resumenColWidths[1], yPos + 3)
        doc.text(
          summary.totalCargas.toString(),
          xPos + resumenColWidths[0] + resumenColWidths[1] + resumenColWidths[2],
          yPos + 3,
        )

        yPos += resumenRowHeight

        // Fila de montos
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.1)
        doc.rect(margin, yPos, resumenTableWidth, resumenRowHeight)

        doc.setFont("helvetica", "normal")
        doc.setFontSize(5)
        doc.text("Monto (Bs)", xPos, yPos + 3)
        doc.text(summary.montoPagadas.toString(), xPos + resumenColWidths[0], yPos + 3)
        doc.text(summary.montoDeuda.toString(), xPos + resumenColWidths[0] + resumenColWidths[1], yPos + 3)
        doc.text(
          (summary.montoPagadas + summary.montoDeuda).toString(),
          xPos + resumenColWidths[0] + resumenColWidths[1] + resumenColWidths[2],
          yPos + 3,
        )

        yPos += resumenRowHeight + 8

        // Tabla de datos en formato compacto
        doc.setFont("helvetica", "bold")
        doc.setFontSize(6)
        doc.text("DETALLE DE CARGAS:", margin, yPos)
        yPos += 5

        // Configuración de tabla compacta
        const tableWidth = pageWidth - 2 * margin
        const colWidths = [15, 25, 20, 18, 30, 20] // ID, Fecha, Hora, Estado, Usuario, Costo
        const rowHeight = 6

        // Encabezados de la tabla
        doc.setFillColor(...grisClaro)
        doc.rect(margin, yPos, tableWidth, rowHeight, "F")

        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.3)
        doc.rect(margin, yPos, tableWidth, rowHeight)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(5)
        doc.setTextColor(...negro)

        doc.text("ID", margin + 1, yPos + 4)
        doc.text("FECHA", margin + 1 + colWidths[0], yPos + 4)
        doc.text("HORA", margin + 1 + colWidths[0] + colWidths[1], yPos + 4)
        doc.text("ESTADO", margin + 1 + colWidths[0] + colWidths[1] + colWidths[2], yPos + 4)
        doc.text("NOMBRE", margin + 1 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos + 4)
        doc.text(
          "COSTO",
          margin + 1 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
          yPos + 4,
        )

        yPos += rowHeight

        // Filas de datos
        doc.setFont("helvetica", "normal")
        doc.setFontSize(5)

        const maxRowsToShow = Math.min(filteredData.length, 12)
        const dataToShow = filteredData.slice(0, maxRowsToShow)

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
          const fechaCarga = new Date(item.fechaHora).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
          const horaCarga = new Date(item.fechaHora).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
          const usuarioCarga = (item.usuario?.nombre || "N/A").substring(0, 15)
          const estadoCarga = item.estado === "deuda" ? "Pendiente" : "Pagado"

          doc.text(item.id.toString(), margin + 1, yPos + 4)
          doc.text(fechaCarga, margin + 1 + colWidths[0], yPos + 4)
          doc.text(horaCarga, margin + 1 + colWidths[0] + colWidths[1], yPos + 4)
          doc.text(estadoCarga, margin + 1 + colWidths[0] + colWidths[1] + colWidths[2], yPos + 4)
          doc.text(usuarioCarga, margin + 1 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos + 4)
          doc.text(
            `Bs ${item.costo || 30}`,
            margin + 1 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
            yPos + 4,
          )

          yPos += rowHeight
        })

        // Si hay más datos de los que se muestran, indicarlo
        if (filteredData.length > maxRowsToShow) {
          yPos += 2
          doc.setFont("helvetica", "italic")
          doc.setFontSize(4)
          doc.text(`... y ${filteredData.length - maxRowsToShow} registros más`, margin, yPos)
          yPos += 3
        }

        // Pie del reporte (igual que el recibo)
        yPos = 200 // Posición fija cerca del final
        doc.setDrawColor(...azulOscuro)
        doc.line(margin, yPos, pageWidth - margin, yPos)

        yPos += 4
        doc.setFont("helvetica", "italic")
        doc.setFontSize(4)
        doc.text("Este reporte es válido como constancia de cargas.", pageWidth / 2, yPos, { align: "center" })
        doc.text("Distribuidora de Agua Los Pinos", pageWidth / 2, yPos + 3, { align: "center" })
        doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, pageWidth / 2, yPos + 6, {
          align: "center",
        })

        // Guardar PDF
        const fileName = showAllTime
          ? `cargas_agua_todas_${new Date().toISOString().split("T")[0]}.pdf`
          : `cargas_agua_${startDate}_${endDate}.pdf`

        doc.save(fileName)
      }

      generateChargesPDF()

      Swal.fire({
        icon: "success",
        title: "PDF Generado",
        text: "El reporte de cargas se ha descargado exitosamente.",
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

  // Función para formatear el rango de fechas en formato completo
  const formatDateRange = () => {
    if (showAllTime) return ""
    if (!startDate || !endDate) return ""

    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)

    const formattedStart = format(startDateObj, "d 'de' MMMM 'del' yyyy", { locale: es })
    const formattedEnd = format(endDateObj, "d 'de' MMMM 'del' yyyy", { locale: es })

    return `${formattedStart} al ${formattedEnd}`
  }

  // Función para determinar el título del resumen
  const getSummaryTitle = () => {
    if (showAllTime) {
      return "Resumen de Cargas Totales"
    }

    const dateRange = formatDateRange()
    if (dateRange) {
      return `Resumen de Cargas ${dateRange}`
    }

    return "Resumen de Cargas"
  }

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 max-w-5xl">
      <div className="bg-white rounded-lg shadow-md border border-gray-300 mb-6 overflow-hidden">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-800 rounded-full flex items-center justify-center shadow-lg border border-gray-300">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 3C10 3 6 7 6 12C6 16 9 20 12 20C15 20 18 16 18 12C18 7 14 3 12 3Z" strokeWidth="2" />
                <path
                  d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                  strokeWidth="2"
                />
                <path d="M7 10L5 12" strokeWidth="2" />
                <path d="M19 12L17 10" strokeWidth="2" />
                <path d="M12 7V9" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-black tracking-tight">Cargas de Agua</h1>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-teal-600 to-teal-800"></div>
      </div>

      <div className="flex items-center mb-6">
        <div className="ml-auto flex gap-2">
          <Button
            onClick={handleDownloadAllChargesPDF}
            variant="outline"
            className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar datos en PDF
          </Button>
          <Button onClick={() => setShowFilterDialog(true)}>
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      {/* Resumen de cargas */}
      <div className="mb-8">
        <Card className="shadow-md border-2 border-gray-300 rounded-lg">
          {/* Modificar el título del resumen para mostrar el rango de fechas completo */}
          <CardHeader className="bg-blue-900 text-white">
            <CardTitle className="text-white">{getSummaryTitle()}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total de cargas */}
              <div className="text-center">
                <div className="bg-blue-100 p-2 rounded-t-md">
                  <p className="font-semibold text-blue-800">Total de Cargas</p>
                </div>
                <div className="border border-t-0 border-blue-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <Droplet className="h-5 w-5 text-blue-600" />
                    <p className="text-2xl font-bold">{summary.totalCargas}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Bs {summary.montoPagadas + summary.montoDeuda}</p>
                </div>
              </div>

              {/* Cargas pagadas */}
              <div className="text-center">
                <div className="bg-green-100 p-2 rounded-t-md">
                  <p className="font-semibold text-green-800">Cargas Pagadas</p>
                </div>
                <div className="border border-t-0 border-green-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <p className="text-2xl font-bold">{summary.totalPagadas}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Bs {summary.montoPagadas}</p>
                </div>
              </div>

              {/* Cargas con deuda - Cambiado el ícono a CreditCard */}
              <div className="text-center">
                <div className="bg-red-100 p-2 rounded-t-md">
                  <p className="font-semibold text-red-800">Cargas con Deuda</p>
                </div>
                <div className="border border-t-0 border-red-200 rounded-b-md p-3">
                  <div className="flex items-center justify-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    <p className="text-2xl font-bold">{summary.totalDeuda}</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Bs {summary.montoDeuda}</p>
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
                  <TableHead className="font-bold text-white py-4 border-0">Estado</TableHead>
                  <TableHead className="font-bold text-white py-4 border-0">Nombre de Usuario</TableHead>
                  <TableHead className="font-bold text-white py-4 border-0">Costo</TableHead>
                  <TableHead className="font-bold text-white py-4 border-0">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((item) => (
                    <TableRow key={item.id} className="border-0 hover:bg-gray-50">
                      <TableCell className="border-0 py-3">{formatDate(item.fechaHora)}</TableCell>
                      <TableCell className="border-0 py-3">
                        <Badge className={item.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>{item.estado}</Badge>
                      </TableCell>
                      <TableCell className="border-0 py-3">{item.usuario?.nombre || "N/A"}</TableCell>
                      <TableCell className="border-0 py-3">Bs {item.costo || 30}</TableCell>
                      <TableCell className="border-0 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          onClick={() => handleViewDetails(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500 border-0">
                      No hay cargas para mostrar con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center mt-4">
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
            <DialogTitle>Filtrar Registros</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Opción para mostrar todas las cargas de todos los tiempos */}
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="showAllTime"
                checked={showAllTime}
                onCheckedChange={(checked) => {
                  setShowAllTime(!!checked)
                  if (checked) {
                    setStartDate("")
                    setEndDate("")
                  } else {
                    // Restaurar fechas por defecto
                    const now = new Date()
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    setStartDate(firstDay.toISOString().split("T")[0])
                    setEndDate(lastDay.toISOString().split("T")[0])
                  }
                }}
              />
              <label htmlFor="showAllTime" className="font-medium">
                Mostrar todas las cargas (sin filtro de fecha)
              </label>
            </div>

            {/* Campos de fecha deshabilitados si se selecciona "Mostrar todo" */}
            <div className={`grid gap-4 ${showAllTime ? "opacity-50" : ""}`}>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="startDate" className="text-right">
                  Fecha Inicio:
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="col-span-3"
                  disabled={showAllTime}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="endDate" className="text-right">
                  Fecha Fin:
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="col-span-3"
                  disabled={showAllTime}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Estado:</label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="deuda"
                    checked={filterStatus.includes("deuda")}
                    onCheckedChange={(checked) => {
                      setFilterStatus((prev) =>
                        checked ? [...prev, "deuda"] : prev.filter((status) => status !== "deuda"),
                      )
                    }}
                  />
                  <label htmlFor="deuda">Deuda</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pagado"
                    checked={filterStatus.includes("pagado")}
                    onCheckedChange={(checked) => {
                      setFilterStatus((prev) =>
                        checked ? [...prev, "pagado"] : prev.filter((status) => status !== "pagado"),
                      )
                    }}
                  />
                  <label htmlFor="pagado">Pagado</label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={applyFilters}>Aplicar Filtros</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-blue-600">
              <Droplet className="mr-2 h-5 w-5" />
              Detalles de la Carga de Agua
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

          {selectedCharge && (
            <div className="space-y-6">
              {/* Información General de la Carga */}
              <Card className="border-blue-200">
                <CardHeader className="bg-blue-50">
                  <CardTitle className="flex items-center text-blue-800">
                    <Droplet className="mr-2 h-5 w-5" />
                    Información de la Carga
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">ID de la Carga</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono">
                          #{selectedCharge.id}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Fecha y Hora</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(selectedCharge.fechaHora)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Estado</Label>
                      <Badge
                        className={
                          selectedCharge.estado === "deuda"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        }
                      >
                        {selectedCharge.estado === "deuda" ? "Pendiente de Pago" : "Pagado"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Costo</Label>
                      <div className="text-2xl font-bold text-green-600">Bs {selectedCharge.costo || 30}</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Tipo de Camión</Label>
                      <div className="font-medium">
                        {selectedCharge.tiposDeCamion?.descripcion || "No especificado"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del Usuario */}
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center text-purple-800">
                    <User className="mr-2 h-5 w-5" />
                    Información del Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Nombre</Label>
                      <div className="font-medium">{selectedCharge.usuario?.nombre || "No disponible"}</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">ID Usuario</Label>
                      <div className="font-mono text-gray-500">#{selectedCharge.usuario?.id}</div>
                    </div>

                    {selectedCharge.usuario?.correo && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Correo Electrónico</Label>
                        <div className="text-blue-600">{selectedCharge.usuario.correo}</div>
                      </div>
                    )}

                    {selectedCharge.usuario?.rol && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Rol</Label>
                        <Badge variant="outline">{selectedCharge.usuario.rol}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Información Adicional */}
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center text-green-800">
                    <FileText className="mr-2 h-5 w-5" />
                    Detalles Adicionales
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Información del Servicio</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-blue-600">Costo del Servicio</Label>
                          <div className="text-xl font-bold text-blue-800">Bs {selectedCharge.costo || 30}</div>
                        </div>
                        <div>
                          <Label className="text-sm text-blue-600">Fecha de Registro</Label>
                          <div className="font-medium text-blue-800">{formatDate(selectedCharge.fechaHora)}</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-800 mb-2">Descripción</h4>
                      <p className="text-gray-600">
                        Esta carga corresponde al servicio de distribución de agua realizado
                        {selectedCharge.tiposDeCamion?.descripcion &&
                          ` con ${selectedCharge.tiposDeCamion.descripcion.toLowerCase()}`}
                        . El estado actual es:{" "}
                        <strong>{selectedCharge.estado === "deuda" ? "Pendiente de pago" : "Pagado"}</strong>.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex justify-between pt-6">
            <div className="flex space-x-2">
              {selectedCharge?.estado === "deuda" && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Acción requerida: Realizar pago
                </Badge>
              )}
            </div>
            <Button onClick={() => setShowDetailsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
