"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Navbar from "../Navbar"
import {
  Truck,
  DollarSign,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  RefreshCw,
  CreditCard,
  Loader2,
  Calendar,
  Filter,
  Download,
} from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Progress } from "@/components/components/ui/progress"
import { Input } from "@/components/components/ui/input"
import { Label } from "@/components/components/ui/label"
import jsPDF from "jspdf"

// Importar componentes PWA
import OfflineIndicator from "@/components/pwa-features/offline-indicator"
import NetworkStatusHandler from "@/components/pwa-features/network-status-handler"
import InstallPrompt from "@/components/pwa-features/install-prompt"
import CacheIndicator from "@/components/pwa-features/cache-indicator"
import SyncManagerEnhanced from "@/components/pwa-features/sync-manager"
import BackgroundSyncEnhanced from "@/components/pwa-features/background-sync"

// Importar utilidades PWA
import { usePWAFeatures } from "../../hooks/use-pwa-features"
import { saveToIndexedDB, getFromIndexedDB, initializeBackgroundSync } from "../../utils/pwa-helpers"

// URL de la API
const API_URL = "https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev"

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState("")

  const { isOnline, updatePendingSyncCount } = usePWAFeatures()
  const [usingCachedData, setUsingCachedData] = useState(false)

  // Estados para filtros de fecha
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  // Función para obtener el primer y último día del mes actual
  const getCurrentMonthDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    return {
      inicio: format(firstDay, "yyyy-MM-dd"),
      fin: format(lastDay, "yyyy-MM-dd"),
    }
  }

  useEffect(() => {
    // Establecer fechas del mes actual por defecto
    const { inicio, fin } = getCurrentMonthDates()
    setFechaInicio(inicio)
    setFechaFin(fin)
  }, [])

  useEffect(() => {
    // Cargar datos cuando las fechas estén establecidas
    if (fechaInicio && fechaFin) {
      fetchDashboardData()
    }
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    // Inicializar background sync
    initializeBackgroundSync()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError("")

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      if (!isOnline) {
        // Cargar desde IndexedDB cuando está offline
        const cacheKey = `dashboard_${fechaInicio}_${fechaFin}`
        const cachedData = await getFromIndexedDB("dashboard", cacheKey)
        if (cachedData && cachedData.data) {
          setDashboardData(cachedData.data)
          setUsingCachedData(true)
          setError("")
          return
        }
      }

      const response = await fetch(`${API_URL}/dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fechaInicio,
          fechaFin,
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token")
          router.push("/login")
          return
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setDashboardData(data)
      setUsingCachedData(false)

      // Guardar en caché
      const cacheKey = `dashboard_${fechaInicio}_${fechaFin}`
      await saveToIndexedDB("dashboard", { id: cacheKey, data, timestamp: Date.now() })
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar los datos del dashboard")

      // Cargar desde caché en caso de error
      const cacheKey = `dashboard_${fechaInicio}_${fechaFin}`
      const cachedData = await getFromIndexedDB("dashboard", cacheKey)
      if (cachedData && cachedData.data) {
        setDashboardData(cachedData.data)
        setUsingCachedData(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilters = () => {
    if (fechaInicio && fechaFin) {
      fetchDashboardData()
    }
  }

  const handleResetToCurrentMonth = () => {
    const { inicio, fin } = getCurrentMonthDates()
    setFechaInicio(inicio)
    setFechaFin(fin)
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

  // Función mejorada para exportar dashboard a PDF con diseño compacto similar al recibo
  const exportDashboardToPDF = async () => {
    if (!dashboardData) return

    // Create a half-letter sized PDF (5.5" x 8.5")
    const doc = new jsPDF({
      format: [139.7, 215.9], // Half letter size in mm
      orientation: "portrait",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 8
    const currentDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })

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
    doc.text("Dashboard Ejecutivo", pageWidth / 2, 18, { align: "center" })

    // Línea separadora
    doc.setDrawColor(...azulOscuro)
    doc.setLineWidth(0.3)
    doc.line(margin, 24, pageWidth - margin, 24)

    // Título del dashboard
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...negro)
    doc.text("REPORTE EJECUTIVO", pageWidth / 2, 30, { align: "center" })

    // Información del período en formato compacto
    let yPos = 38
    const lineHeight = 4

    // Dibujar recuadro para la información
    doc.setDrawColor(...azulOscuro)
    doc.setLineWidth(0.3)
    doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 16)

    // Información básica
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)

    // Primera fila
    doc.text("Generado:", margin + 2, yPos + 2)
    doc.setFont("helvetica", "normal")
    doc.text(currentDate, margin + 22, yPos + 2)

    doc.setFont("helvetica", "bold")
    doc.text("Usuario:", pageWidth / 2 + 2, yPos + 2)
    doc.setFont("helvetica", "normal")
    doc.text(localStorage.getItem("nombreUsuario") || "Sistema", pageWidth / 2 + 18, yPos + 2)

    // Segunda fila - Período con fechas completas
    doc.setFont("helvetica", "bold")
    doc.text("Período:", margin + 2, yPos + 6)
    doc.setFont("helvetica", "normal")
    const fechaInicioCompleta = formatDateComplete(fechaInicio)
    const fechaFinCompleta = formatDateComplete(fechaFin)
    const periodoTexto = `${fechaInicioCompleta} al ${fechaFinCompleta}`

    // Si el texto es muy largo, usar formato corto
    if (periodoTexto.length > 80) {
      doc.text(`${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`, margin + 22, yPos + 6)
    } else {
      // Dividir en múltiples líneas si es necesario
      const lineasPeriodo = doc.splitTextToSize(periodoTexto, pageWidth - margin - 24)
      doc.text(lineasPeriodo, margin + 22, yPos + 6)
    }

    // Tercera fila
    doc.setFont("helvetica", "bold")
    doc.text("Precio Actual:", margin + 2, yPos + 10)
    doc.setFont("helvetica", "normal")
    doc.text(formatCurrency(dashboardData?.estadisticasGenerales?.precioActual || 0), margin + 22, yPos + 10)

    // Métricas principales en formato compacto
    yPos = 62
    if (dashboardData?.estadisticasGenerales) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(6)
      doc.text("MÉTRICAS PRINCIPALES:", margin, yPos)
      yPos += 4

      const metricas = [
        `Total Cargas: ${dashboardData.estadisticasGenerales.cargas?.totalCargas || 0}`,
        `Ingresos: ${formatCurrency(dashboardData.estadisticasGenerales.cargas?.montoPagado || 0)}`,
        `Deudas: ${formatCurrency(dashboardData.estadisticasGenerales.cargas?.montoEnDeuda || 0)}`,
        `Eficiencia: ${dashboardData.estadisticasGenerales.cargas?.totalCargas > 0 ? ((dashboardData.estadisticasGenerales.cargas?.cargasPagadas / dashboardData.estadisticasGenerales.cargas?.totalCargas) * 100).toFixed(1) : 0}%`,
      ]

      doc.setFont("helvetica", "normal")
      doc.setFontSize(5)
      metricas.forEach((metrica, index) => {
        const xPos = margin + 2 + (index % 2) * (pageWidth / 2 - margin)
        if (index % 2 === 0 && index > 0) yPos += 4
        doc.text(`• ${metrica}`, xPos, yPos)
      })
      yPos += 8
    }

    // Estadísticas de cargas en tabla compacta
    if (dashboardData?.estadisticasGenerales?.cargas) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(6)
      doc.text("ESTADÍSTICAS DE CARGAS:", margin, yPos)
      yPos += 5

      const tableWidth = pageWidth - 2 * margin
      const colWidths = [35, 25, 25, 25]
      const rowHeight = 6

      // Encabezados
      doc.setFillColor(...grisClaro)
      doc.rect(margin, yPos, tableWidth, rowHeight, "F")
      doc.setDrawColor(...azulOscuro)
      doc.setLineWidth(0.2)
      doc.rect(margin, yPos, tableWidth, rowHeight)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(5)
      const headers = ["Concepto", "Cantidad", "Monto", "Porcentaje"]
      let xPos = margin + 1
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos + 4)
        xPos += colWidths[i]
      })

      yPos += rowHeight

      // Datos de cargas
      const cargasData = [
        [
          "Total Cargas",
          dashboardData.estadisticasGenerales.cargas.totalCargas,
          dashboardData.estadisticasGenerales.cargas.montoTotal,
          "100%",
        ],
        [
          "Cargas Pagadas",
          dashboardData.estadisticasGenerales.cargas.cargasPagadas,
          dashboardData.estadisticasGenerales.cargas.montoPagado,
          `${((dashboardData.estadisticasGenerales.cargas.cargasPagadas / dashboardData.estadisticasGenerales.cargas.totalCargas) * 100).toFixed(1)}%`,
        ],
        [
          "Cargas en Deuda",
          dashboardData.estadisticasGenerales.cargas.cargasEnDeuda,
          dashboardData.estadisticasGenerales.cargas.montoEnDeuda,
          `${((dashboardData.estadisticasGenerales.cargas.cargasEnDeuda / dashboardData.estadisticasGenerales.cargas.totalCargas) * 100).toFixed(1)}%`,
        ],
      ]

      doc.setFont("helvetica", "normal")
      doc.setFontSize(4)

      cargasData.forEach((row, index) => {
        // Dibujar fila
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.1)
        doc.rect(margin, yPos, tableWidth, rowHeight)

        xPos = margin + 1
        doc.text(row[0], xPos, yPos + 4)
        xPos += colWidths[0]
        doc.text(row[1].toString(), xPos, yPos + 4)
        xPos += colWidths[1]
        doc.text(typeof row[2] === "number" ? formatCurrency(row[2]).substring(0, 10) : row[2], xPos, yPos + 4)
        xPos += colWidths[2]
        doc.text(row[3], xPos, yPos + 4)

        yPos += rowHeight
      })

      yPos += 5
    }

    // Estadísticas de pagos
    if (dashboardData?.estadisticasGenerales?.pagos) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(6)
      doc.text("ESTADÍSTICAS DE PAGOS:", margin, yPos)
      yPos += 5

      const pagosData = [
        `Total Pagos: ${dashboardData.estadisticasGenerales.pagos.totalPagos || 0}`,
        `Pagos Activos: ${dashboardData.estadisticasGenerales.pagos.pagosActivos || 0}`,
        `Pagos Anulados: ${dashboardData.estadisticasGenerales.pagos.pagosAnulados || 0}`,
        `Monto Total: ${formatCurrency(dashboardData.estadisticasGenerales.pagos.montoTotal || 0)}`,
      ]

      doc.setFont("helvetica", "normal")
      doc.setFontSize(5)
      pagosData.forEach((dato, index) => {
        const xPos = margin + 2 + (index % 2) * (pageWidth / 2 - margin)
        if (index % 2 === 0 && index > 0) yPos += 4
        doc.text(`• ${dato}`, xPos, yPos)
      })
      yPos += 8
    }

    // Días con más cargas (si hay datos)
    if (dashboardData?.cargasPorDia && dashboardData.cargasPorDia.length > 0) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(6)
      doc.text("DÍAS CON MÁS CARGAS:", margin, yPos)
      yPos += 5

      const diasOrdenados = dashboardData.cargasPorDia
        .sort((a, b) => (b.totalCargas || 0) - (a.totalCargas || 0))
        .slice(0, 5)

      const tableWidth = pageWidth - 2 * margin
      const colWidths = [40, 20, 30]
      const rowHeight = 5

      // Encabezados
      doc.setFillColor(...grisClaro)
      doc.rect(margin, yPos, tableWidth, rowHeight, "F")
      doc.setDrawColor(...azulOscuro)
      doc.setLineWidth(0.2)
      doc.rect(margin, yPos, tableWidth, rowHeight)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(4)
      const headers = ["Fecha", "Cargas", "Monto"]
      let xPos = margin + 1
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos + 3)
        xPos += colWidths[i]
      })

      yPos += rowHeight

      // Datos
      doc.setFont("helvetica", "normal")
      doc.setFontSize(4)

      diasOrdenados.forEach((dia) => {
        doc.setDrawColor(...azulOscuro)
        doc.setLineWidth(0.1)
        doc.rect(margin, yPos, tableWidth, rowHeight)

        xPos = margin + 1
        doc.text(formatDateComplete(dia.fecha).substring(0, 18), xPos, yPos + 3)
        xPos += colWidths[0]
        doc.text((dia.totalCargas || 0).toString(), xPos, yPos + 3)
        xPos += colWidths[1]
        doc.text(formatCurrency(dia.montoTotal || 0).substring(0, 12), xPos, yPos + 3)

        yPos += rowHeight
      })
    }

    // Pie del reporte
    yPos = 200 // Posición fija cerca del final
    doc.setDrawColor(...azulOscuro)
    doc.line(margin, yPos, pageWidth - margin, yPos)

    yPos += 4
    doc.setFont("helvetica", "italic")
    doc.setFontSize(4)
    doc.text("Este dashboard es generado automáticamente por el sistema.", pageWidth / 2, yPos, { align: "center" })
    doc.text("Distribuidora de Agua Los Pinos", pageWidth / 2, yPos + 3, { align: "center" })
    doc.text(`Dashboard Ejecutivo - ${currentDate}`, pageWidth / 2, yPos + 6, { align: "center" })

    doc.save(`dashboard_ejecutivo_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-50 w-full">
          <Navbar />
        </div>
        <div className="container mx-auto px-3 py-4 pt-16 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-4" />
            <span className="text-lg">Cargando dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-50 w-full">
          <Navbar />
        </div>
        <div className="container mx-auto px-3 py-4 pt-16 max-w-4xl">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { estadisticasGenerales, cargasPorDia, parametros } = dashboardData || {}

  return (
    <NetworkStatusHandler onOffline={() => console.log("Modo offline activado")} onOnline={() => fetchDashboardData()}>
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-50 w-full">
          <Navbar />
        </div>

        <div className="container mx-auto px-3 py-4 pt-16 max-w-4xl">
          <InstallPrompt />
          <SyncManagerEnhanced onSync={fetchDashboardData} />
          <CacheIndicator />
          <BackgroundSyncEnhanced
            syncTag="dashboard-sync"
            onSyncRegistered={() => console.log("Sync registrado para dashboard")}
            onSyncError={(error) => console.error("Error en Background Sync:", error)}
          />

          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Ejecutivo</h1>
                <p className="text-gray-600 text-sm">Distribuidora de Agua Los Pinos</p>
              </div>
              <OfflineIndicator />
            </div>
            <div className="flex flex-wrap gap-2">
              {dashboardData && (
                <Button onClick={exportDashboardToPDF} className="bg-slate-900 hover:bg-slate-950" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
              )}
            </div>
          </div>

          {/* Indicador de datos en caché */}
          {usingCachedData && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 flex items-center">
              <span className="text-sm">
                Estás viendo datos almacenados localmente. Algunos cambios podrían no estar sincronizados.
              </span>
            </div>
          )}

          {/* Filtros de Fecha */}
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                Filtros de Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <div className="space-y-1">
                  <Label htmlFor="fechaInicio" className="text-sm flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Fecha Inicio
                  </Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="border-gray-300 h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fechaFin" className="text-sm flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Fecha Fin
                  </Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="border-gray-300 h-8"
                  />
                </div>
                <Button
                  onClick={handleApplyFilters}
                  disabled={!fechaInicio || !fechaFin || loading}
                  className="bg-blue-600 hover:bg-blue-700 h-8"
                  size="sm"
                >
                  {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Filter className="mr-2 h-3 w-3" />}
                  Aplicar Filtros
                </Button>
                <Button
                  onClick={handleResetToCurrentMonth}
                  variant="outline"
                  disabled={loading}
                  size="sm"
                  className="h-8"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Mes Actual
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Período seleccionado:{" "}
                {parametros?.fechaInicio ? formatDate(parametros.fechaInicio) : formatDate(fechaInicio)} -{" "}
                {parametros?.fechaFin ? formatDate(parametros.fechaFin) : formatDate(fechaFin)}
              </div>
            </CardContent>
          </Card>

          {/* Estadísticas Principales */}
          {estadisticasGenerales && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Total Cargas */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">Total Cargas</CardTitle>
                  <Truck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{estadisticasGenerales.cargas?.totalCargas || 0}</div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span className="text-blue-600 font-medium">Período seleccionado</span>
                  </div>
                </CardContent>
              </Card>

              {/* Ingresos Totales */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatCurrency(estadisticasGenerales.cargas?.montoPagado || 0)}
                  </div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span className="text-green-600 font-medium">Pagos recibidos</span>
                  </div>
                </CardContent>
              </Card>

              {/* Deudas Pendientes */}
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">Deudas Pendientes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatCurrency(estadisticasGenerales.cargas?.montoEnDeuda || 0)}
                  </div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span className="text-red-600 font-medium">
                      {estadisticasGenerales.cargas?.cargasEnDeuda || 0} cargas
                    </span>
                    <span className="ml-1">pendientes</span>
                  </div>
                </CardContent>
              </Card>

              {/* Precio Actual */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">Precio Actual</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{formatCurrency(estadisticasGenerales.precioActual || 0)}</div>
                  <div className="flex items-center text-xs text-gray-600 mt-1">
                    <span className="text-purple-600 font-medium">por carga</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráfico de Cargas por Día */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Cargas por Día */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Cargas por Día (Período Seleccionado)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cargasPorDia && cargasPorDia.length > 0 ? (
                  <div className="space-y-2">
                    {cargasPorDia.map((dia, index) => {
                      const maxCargas = Math.max(...cargasPorDia.map((d) => Number(d.totalCargas || 0)))
                      const totalCargas = Number(dia.totalCargas || 0)
                      const percentage = maxCargas > 0 ? (totalCargas / maxCargas) * 100 : 0

                      return (
                        <div key={index} className="flex items-center space-x-3 text-sm">
                          <div className="w-16 font-medium">{formatDate(dia.fecha)}</div>
                          <div className="flex-1">
                            <Progress value={percentage} className="h-2" />
                          </div>
                          <div className="w-8 text-right">{totalCargas}</div>
                          <div className="w-20 text-right text-xs">{formatCurrency(dia.montoTotal || 0)}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6 text-sm">
                    No hay datos disponibles para el período seleccionado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas de Pagos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Activity className="mr-2 h-4 w-4" />
                  Estadísticas de Pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estadisticasGenerales?.pagos && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Pagos</span>
                      <span className="font-semibold">{estadisticasGenerales.pagos?.totalPagos || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pagos Activos</span>
                      <span className="font-semibold text-green-600">
                        {estadisticasGenerales.pagos?.pagosActivos || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pagos Anulados</span>
                      <span className="font-semibold text-red-600">
                        {estadisticasGenerales.pagos?.pagosAnulados || 0}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monto Total</span>
                        <span className="font-semibold">
                          {formatCurrency(estadisticasGenerales.pagos?.montoTotal || 0)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen de Eficiencia */}
          {estadisticasGenerales?.cargas && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <PieChart className="mr-2 h-4 w-4" />
                  Resumen de Eficiencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Tasa de Cobro */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {Number(estadisticasGenerales.cargas.totalCargas) > 0
                        ? (
                            (Number(estadisticasGenerales.cargas.cargasPagadas) /
                              Number(estadisticasGenerales.cargas.totalCargas)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Tasa de Cobro</div>
                    <Progress
                      value={
                        Number(estadisticasGenerales.cargas.totalCargas) > 0
                          ? (Number(estadisticasGenerales.cargas.cargasPagadas) /
                              Number(estadisticasGenerales.cargas.totalCargas)) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Eficiencia de Ingresos */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {Number(estadisticasGenerales.cargas.montoTotal) > 0
                        ? (
                            (Number(estadisticasGenerales.cargas.montoPagado) /
                              Number(estadisticasGenerales.cargas.montoTotal)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Eficiencia de Ingresos</div>
                    <Progress
                      value={
                        Number(estadisticasGenerales.cargas.montoTotal) > 0
                          ? (Number(estadisticasGenerales.cargas.montoPagado) /
                              Number(estadisticasGenerales.cargas.montoTotal)) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Promedio por Carga */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {formatCurrency(
                        Number(estadisticasGenerales.cargas.totalCargas) > 0
                          ? Number(estadisticasGenerales.cargas.montoTotal) /
                              Number(estadisticasGenerales.cargas.totalCargas)
                          : 0,
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Promedio por Carga</div>
                    <div className="text-xs text-gray-500">
                      Precio actual: {formatCurrency(estadisticasGenerales.precioActual)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </NetworkStatusHandler>
  )
}
