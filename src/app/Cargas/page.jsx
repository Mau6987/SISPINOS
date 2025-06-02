"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Filter,
  Eye,
  Truck,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Checkbox } from "../../components/components/ui/checkbox"
import { Badge } from "../../components/components/ui/badge"
import { Avatar, AvatarFallback } from "../../components/components/ui/avatar"  
import { Separator } from "../../components/components/ui/separator"

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return windowWidth
}

export default function WaterChargesManagement() {
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const router = useRouter()

  const [waterCharges, setWaterCharges] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(6)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split("T")[0]
  })
  const [filterEndDate, setFilterEndDate] = useState(() => new Date().toISOString().split("T")[0])
  const [selectedStatus, setSelectedStatus] = useState([])
  const [truckTypes, setTruckTypes] = useState([])
  const [users, setUsers] = useState([])
  const [currentPrice, setCurrentPrice] = useState(30)

  const fetchCurrentPrice = async () => {
    try {
      const response = await fetch("https://mi-backendsecond.onrender.com/precios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        const activePrice = data.find((price) => price.activo === true)
        if (activePrice) {
          setCurrentPrice(activePrice.valor)
        }
      }
    } catch (error) {
      console.error("Error fetching current price:", error)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      fetchWaterCharges()
      fetchTruckTypes()
      fetchUsers()
      fetchCurrentPrice()
    }
  }, [router])

  const fetchWaterCharges = async () => {
    try {
      const response = await fetch("https://mi-backendsecond.onrender.com/cargagua", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        console.log("Datos recibidos:", data)
        data.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
        setWaterCharges(data)
      } else if (response.status === 401) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching water charges:", error)
    }
  }

  const fetchTruckTypes = async () => {
    try {
      const response = await fetch("https://mi-backendsecond.onrender.com/tiposDeCamion", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTruckTypes(data)
      }
    } catch (error) {
      console.error("Error fetching truck types:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("https://mi-backendsecond.onrender.com/usuariosrol", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleViewCharge = async (charge) => {
    try {
      const response = await fetch(`https://mi-backendsecond.onrender.com/cargagua/${charge.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedCharge(data)
        setShowModal(true)
        setEditMode(false)
        setViewMode(true)
      }
    } catch (error) {
      console.error("Error fetching charge details:", error)
    }
  }

  const handleEditCharge = (charge) => {
    setSelectedCharge(charge)
    setShowModal(true)
    setEditMode(true)
    setViewMode(false)
  }

  const handleCreateCharge = () => {
    setSelectedCharge(null)
    setShowModal(true)
    setEditMode(false)
    setViewMode(false)
  }

  const handleSaveCharge = async (e) => {
    e.preventDefault()
    const chargeData = editMode
      ? selectedCharge
      : {
          fechaHora: e.target.fechaHora.value,
          estado: "deuda",
          usuarioId: Number.parseInt(e.target.usuarioId.value),
          tipoCamionId: Number.parseInt(e.target.tipoCamionId.value),
          costo: currentPrice,
        }

    try {
      const url = editMode
        ? `https://mi-backendsecond.onrender.com/cargagua/${selectedCharge.id}`
        : "https://mi-backendsecond.onrender.com/cargagua"
      const method = editMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(chargeData),
      })

      if (response.ok) {
        setShowModal(false)
        fetchWaterCharges()
      }
    } catch (error) {
      console.error("Error saving water charge:", error)
    }
  }

  const handleDeleteCharge = async () => {
    try {
      const response = await fetch(`https://mi-backendsecond.onrender.com/cargagua/${selectedCharge.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        setShowDeleteModal(false)
        fetchWaterCharges()
      }
    } catch (error) {
      console.error("Error deleting water charge:", error)
    }
  }

  const getUserInitials = (nombre) => {
    return (
      nombre
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??"
    )
  }

  const getStatusBadgeColor = (estado) => {
    return estado === "pagado"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200"
  }

  const getStatusIcon = (estado) => {
    return estado === "pagado" ? CheckCircle : AlertCircle
  }

  const filteredCharges = waterCharges.filter((charge) => {
    if (!filterStartDate && !filterEndDate) return true

    const chargeDate = new Date(charge.fechaHora)
    const startDate = filterStartDate ? new Date(filterStartDate) : new Date(0)
    const endDate = filterEndDate ? new Date(filterEndDate) : new Date(8640000000000000)

    if (filterEndDate) {
      endDate.setHours(23, 59, 59, 999)
    }

    return (
      chargeDate >= startDate &&
      chargeDate <= endDate &&
      (selectedStatus.length === 0 || selectedStatus.includes(charge.estado))
    )
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentCharges = filteredCharges.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCharges.length / itemsPerPage)

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-2xl font-bold mb-6">Gestión de Cargas de Agua</h1>

      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => setShowFilterMenu(!showFilterMenu)}>
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
        <Button onClick={handleCreateCharge} className="bg-green-700 hover:bg-green-800 text-white">
          <Plus className="mr-2 h-4 w-4" /> Crear Registro
        </Button>
      </div>

      {showFilterMenu && (
        <Card className="mb-6 border border-gray-300 shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold mb-4">Filtrar Registros</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Fecha Inicio:</label>
                <Input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block mb-2">Fecha Fin:</label>
                <Input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-2">Estado:</label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <Checkbox
                    id="deuda"
                    checked={selectedStatus.includes("deuda")}
                    onCheckedChange={(checked) => {
                      setSelectedStatus((prev) =>
                        checked ? [...prev, "deuda"] : prev.filter((status) => status !== "deuda"),
                      )
                    }}
                  />
                  <label htmlFor="deuda" className="ml-2">
                    Deuda
                  </label>
                </div>
                <div className="flex items-center">
                  <Checkbox
                    id="pagado"
                    checked={selectedStatus.includes("pagado")}
                    onCheckedChange={(checked) => {
                      setSelectedStatus((prev) =>
                        checked ? [...prev, "pagado"] : prev.filter((status) => status !== "pagado"),
                      )
                    }}
                  />
                  <label htmlFor="pagado" className="ml-2">
                    Pagado
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button onClick={() => setShowFilterMenu(false)}>Aplicar Filtros</Button>
              <Button variant="outline" onClick={() => setShowFilterMenu(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border border-gray-300 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle>Listado de Cargas de Agua</CardTitle>
        </CardHeader>

        <CardContent>
          {currentCharges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay registros para mostrar. Intente ajustar los filtros o crear un nuevo registro.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-200 border-b-2 border-gray-300 shadow-md">
                <TableRow>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">Fecha y Hora</TableHead>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">Estado</TableHead>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">Usuario</TableHead>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">Costo</TableHead>
                  <TableHead className="font-bold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{new Date(charge.fechaHora).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadgeColor(charge.estado)}>
                        {charge.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{charge.usuario?.nombre || "N/A"}</TableCell>
                    <TableCell>Bs {charge.costo || currentPrice}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCharge(charge)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCharge(charge)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCharge(charge)
                            setShowDeleteModal(true)
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-800 border-red-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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

      {/* Enhanced View Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {viewMode ? (
                <>
                  <Eye className="h-5 w-5 text-blue-600" />
                  Detalles de Carga de Agua
                </>
              ) : editMode ? (
                <>
                  <Pencil className="h-5 w-5 text-amber-600" />
                  Editar Carga de Agua
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-green-600" />
                  Crear Carga de Agua
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {viewMode && selectedCharge ? (
            <div className="space-y-6">
              {/* Charge Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Truck className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Carga #{selectedCharge.id}</h3>
                    <p className="text-gray-600">
                      {new Date(selectedCharge.fechaHora).toLocaleDateString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={getStatusBadgeColor(selectedCharge.estado)}>
                        {React.createElement(getStatusIcon(selectedCharge.estado), { className: "h-3 w-3 mr-1" })}
                        {selectedCharge.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">Bs {selectedCharge.costo || currentPrice}</div>
                  <div className="text-sm text-gray-500">Costo total</div>
                </div>
              </div>

              {/* Charge Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date and Time Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Información de Fecha y Hora
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fecha:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedCharge.fechaHora).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hora:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedCharge.fechaHora).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Día de la semana:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedCharge.fechaHora).toLocaleDateString("es-ES", {
                          weekday: "long",
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* User Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información del Usuario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCharge.usuario ? (
                      <>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">
                              {getUserInitials(selectedCharge.usuario.nombre)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{selectedCharge.usuario.nombre}</div>
                            <div className="text-sm text-gray-500">@{selectedCharge.usuario.username}</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Nombre:</span>
                            <span className="text-sm font-medium">{selectedCharge.usuario.nombre}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Usuario:</span>
                            <span className="text-sm font-medium">@{selectedCharge.usuario.username}</span>
                          </div>
                          {selectedCharge.usuario.correo && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Correo:</span>
                              <span className="text-sm font-medium">{selectedCharge.usuario.correo}</span>
                            </div>
                          )}
                          {selectedCharge.usuario.rol && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Rol:</span>
                              <Badge variant="outline" className="text-xs">
                                {selectedCharge.usuario.rol}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No hay información del usuario disponible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Truck Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Información del Camión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedCharge.tiposDeCamion ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tipo de camión:</span>
                          <span className="text-sm font-medium">{selectedCharge.tiposDeCamion.descripcion}</span>
                        </div>
                        {selectedCharge.tiposDeCamion.capacidad && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Capacidad:</span>
                            <span className="text-sm font-medium">{selectedCharge.tiposDeCamion.capacidad} L</span>
                          </div>
                        )}
                        {selectedCharge.tiposDeCamion.marca && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Marca:</span>
                            <span className="text-sm font-medium">{selectedCharge.tiposDeCamion.marca}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No hay información del camión disponible</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Información de Pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <Badge variant="outline" className={getStatusBadgeColor(selectedCharge.estado)}>
                        {React.createElement(getStatusIcon(selectedCharge.estado), { className: "h-3 w-3 mr-1" })}
                        {selectedCharge.estado}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Costo:</span>
                      <span className="text-lg font-bold text-green-600">
                        Bs {selectedCharge.costo || currentPrice}
                      </span>
                    </div>
                    {selectedCharge.fechaPago && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Fecha de pago:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedCharge.fechaPago).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Additional Information */}
              {selectedCharge.observaciones && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Observaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedCharge.observaciones}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveCharge}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="fechaHora" className="text-right">
                    Fecha y Hora:
                  </label>
                  <Input
                    id="fechaHora"
                    name="fechaHora"
                    type="datetime-local"
                    defaultValue={selectedCharge ? new Date(selectedCharge.fechaHora).toISOString().slice(0, 16) : ""}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="estado" className="text-right">
                    Estado:
                  </label>
                  <Input id="estado" name="estado" defaultValue="deuda" className="col-span-3" disabled />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="usuarioId" className="text-right">
                    Usuario:
                  </label>
                  <Select name="usuarioId" defaultValue={selectedCharge?.usuarioId?.toString()}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="tipoCamionId" className="text-right">
                    Tipo de Camión:
                  </label>
                  <Select name="tipoCamionId" defaultValue={selectedCharge?.tipoCamionId?.toString()}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un tipo de camión" />
                    </SelectTrigger>
                    <SelectContent>
                      {truckTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="costo" className="text-right">
                    Costo:
                  </label>
                  <Input
                    id="costo"
                    name="costo"
                    type="number"
                    value={selectedCharge?.costo || currentPrice.toString()}
                    className="col-span-3 bg-gray-100 cursor-not-allowed"
                    readOnly
                  />
                </div>
              </div>
              <DialogFooter>
                {viewMode ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setViewMode(false)
                        setEditMode(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button onClick={() => setShowModal(false)}>Cerrar</Button>
                  </div>
                ) : (
                  <Button type="submit">{editMode ? "Guardar Cambios" : "Crear Carga de Agua"}</Button>
                )}
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>¿Está seguro que desea eliminar esta carga de agua?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteCharge}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
