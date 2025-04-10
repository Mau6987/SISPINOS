"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, Filter, CreditCard } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/components/ui/card"

const ITEMS_PER_PAGE = 10

export default function OwnerPaymentsTable() {
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
      const url = `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/pagosPropietario/${ownerId}`

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

  const handleViewDetails = (item) => {
    setSelectedPayment(item)
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

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  // Calcular el monto total de pagos
  const calcularMontoTotal = () => {
    return filteredData.reduce((total, item) => total + (item.monto || 0), 0)
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pagos del Propietario</h1>
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300 font-medium"
                          onClick={() => handleViewDetails(item)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
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

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-700">Detalles del Pago</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Fecha y Hora:</span>
              <span className="col-span-3">{selectedPayment && formatDate(selectedPayment.fechaHora)}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Monto:</span>
              <span className="col-span-3">Bs {selectedPayment?.monto}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Usuario:</span>
              <span className="col-span-3">{selectedPayment?.usuario?.nombre || "N/A"}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
