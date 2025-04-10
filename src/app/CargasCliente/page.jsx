"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, Filter, CreditCard, Droplet } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"
import { Checkbox } from "../../components/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Badge } from "../../components/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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

      const url = `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${userId}`

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
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cargas de Agua</h1>
        <Button onClick={() => setShowFilterDialog(true)}>
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Registro</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Fecha y Hora:</span>
              <span className="col-span-3">{selectedCharge && formatDate(selectedCharge.fechaHora)}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Estado:</span>
              <span className="col-span-3">
                {selectedCharge && (
                  <Badge className={selectedCharge.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>
                    {selectedCharge.estado}
                  </Badge>
                )}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Usuario:</span>
              <span className="col-span-3">{selectedCharge?.usuario?.nombre || "N/A"}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Tipo de Camión:</span>
              <span className="col-span-3">{selectedCharge?.tiposDeCamion?.descripcion || "N/A"}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Costo:</span>
              <span className="col-span-3">Bs {selectedCharge?.costo || 30}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
