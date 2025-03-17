"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, Filter } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"

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

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Pagos del Propietario y Conductores</h1>
      <div className="flex justify-end items-center mb-6">
        <Button onClick={() => setShowFilterDialog(true)}>
          <Filter className="mr-2 h-4 w-4" /> Filtrar por Fecha
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-300">
        <Table>
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead className="text-gray-800 font-semibold">Fecha y Hora</TableHead>
              <TableHead className="text-gray-800 font-semibold">Monto</TableHead>
              <TableHead className="text-gray-800 font-semibold">Nombre de Usuario</TableHead>
              <TableHead className="text-gray-800 font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.fechaHora)}</TableCell>
                <TableCell>{item.monto}</TableCell>
                <TableCell>{item.usuario?.nombre || "N/A"}</TableCell>
                <TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-6">
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
              <span className="col-span-3">{selectedPayment?.monto}</span>
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

