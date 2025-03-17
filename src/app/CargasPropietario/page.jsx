"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, Filter } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"
import { Checkbox } from "../../components/components/ui/checkbox"

const ITEMS_PER_PAGE = 6

export default function WaterChargesOwner() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState(null)
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  const [filterStatus, setFilterStatus] = useState([])

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
      const url = `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargasPropietario/${ownerId}`

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

    if (filterStatus.length > 0) {
      filtered = filtered.filter((item) => filterStatus.includes(item.estado))
    }

    setFilteredData(filtered)
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

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cargas de Agua Propietario y Conductores</h1>
        <Button onClick={() => setShowFilterDialog(true)}>
          <Filter className="mr-2 h-4 w-4" /> Filtrar Registros
        </Button>
      </div>

      <Table className="border border-gray-200">
        <TableHeader className="bg-gray-300">
          <TableRow>
            <TableHead>Fecha y Hora</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Nombre de Usuario</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{formatDate(item.fechaHora)}</TableCell>
              <TableCell>{item.estado}</TableCell>
              <TableCell>{item.usuario?.nombre || "N/A"}</TableCell>
              <TableCell>
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
          ))}
        </TableBody>
      </Table>

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

      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar Registros</DialogTitle>
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
              <span className="col-span-3">{selectedCharge?.estado}</span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Usuario:</span>
              <span className="col-span-3">{selectedCharge?.usuario?.nombre || "N/A"}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


