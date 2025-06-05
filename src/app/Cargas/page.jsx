"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus, Filter, Eye, Truck, User, Calendar, CheckCircle, AlertCircle, WifiOff } from 'lucide-react'

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Checkbox } from "@/components/components/ui/checkbox"
import { Badge } from "@/components/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/components/ui/avatar"
import { toast } from "@/components/hooks/use-toast"
import { Toaster } from "@/components/components/ui/toaster"

// Importar componentes PWA
import OfflineIndicator from "@/components/pwa-features/offline-indicator"
import NetworkStatusHandler from "@/components/pwa-features/network-status-handler"
import InstallPrompt from "@/components/pwa-features/install-prompt"
import CacheIndicator from "@/components/pwa-features/cache-indicator"
import SyncManagerEnhanced from "@/components/pwa-features/sync-manager"
import BackgroundSyncEnhanced from "@/components/pwa-features/background-sync"

// Importar utilidades PWA
import { usePWAFeatures } from "../../hooks/use-pwa-features"
import { saveToIndexedDB, getFromIndexedDB, registerSyncRequest, initializeBackgroundSync } from "../../utils/pwa-helpers"

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return windowWidth
}

export default function WaterChargesOffline() {
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

  const { isOnline, updatePendingSyncCount } = usePWAFeatures()

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      // Inicializar background sync
      initializeBackgroundSync()

      fetchWaterCharges()
      fetchTruckTypes()
      fetchUsers()
      fetchCurrentPrice()
    }
  }, [router])

  const fetchCurrentPrice = async () => {
    try {
      if (!isOnline) {
        const cachedPrice = await getFromIndexedDB("cache", "currentPrice")
        if (cachedPrice) {
          setCurrentPrice(cachedPrice.value)
          return
        }
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/precios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        const activePrice = data.find((price) => price.activo === true)
        if (activePrice) {
          setCurrentPrice(activePrice.valor)
          // Guardar en caché
          await saveToIndexedDB("cache", { id: "currentPrice", value: activePrice.valor, timestamp: Date.now() })
        }
      }
    } catch (error) {
      console.error("Error fetching current price:", error)
      // Intentar cargar desde caché
      const cachedPrice = await getFromIndexedDB("cache", "currentPrice")
      if (cachedPrice) {
        setCurrentPrice(cachedPrice.value)
      }
    }
  }

  const fetchWaterCharges = async () => {
    try {
      if (!isOnline) {
        const cachedData = await getFromIndexedDB("waterCharges", "all")
        if (cachedData && cachedData.data) {
          setWaterCharges(cachedData.data)
          return
        }
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        data.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
        setWaterCharges(data)
        // Guardar en caché
        await saveToIndexedDB("waterCharges", { id: "all", data, timestamp: Date.now() })
      } else if (response.status === 401) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching water charges:", error)
      // Cargar desde caché
      const cachedData = await getFromIndexedDB("waterCharges", "all")
      if (cachedData && cachedData.data) {
        setWaterCharges(cachedData.data)
        toast({
          title: "Usando datos en caché",
          description: "Estás viendo datos almacenados localmente.",
        })
      }
    }
  }

  const fetchTruckTypes = async () => {
    try {
      if (!isOnline) {
        const cachedData = await getFromIndexedDB("cache", "truckTypes")
        if (cachedData) {
          setTruckTypes(cachedData.data)
          return
        }
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/tiposDeCamion", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setTruckTypes(data)
        await saveToIndexedDB("cache", { id: "truckTypes", data, timestamp: Date.now() })
      }
    } catch (error) {
      console.error("Error fetching truck types:", error)
      const cachedData = await getFromIndexedDB("cache", "truckTypes")
      if (cachedData) {
        setTruckTypes(cachedData.data)
      }
    }
  }

  const fetchUsers = async () => {
    try {
      if (!isOnline) {
        const cachedData = await getFromIndexedDB("cache", "users")
        if (cachedData) {
          setUsers(cachedData.data)
          return
        }
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuariosrol", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        await saveToIndexedDB("cache", { id: "users", data, timestamp: Date.now() })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      const cachedData = await getFromIndexedDB("cache", "users")
      if (cachedData) {
        setUsers(cachedData.data)
      }
    }
  }

  const handleViewCharge = async (charge) => {
    try {
      if (!isOnline) {
        setSelectedCharge(charge)
        setShowModal(true)
        setEditMode(false)
        setViewMode(true)
        return
      }

      const response = await fetch(`https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua/${charge.id}`, {
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
      setSelectedCharge(charge)
      setShowModal(true)
      setEditMode(false)
      setViewMode(true)
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
      if (!isOnline) {
        // Registrar para sincronización offline
        const url = editMode
          ? `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua/${selectedCharge.id}`
          : "https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua"
        const method = editMode ? "PUT" : "POST"

        await registerSyncRequest(url, method, chargeData)

        // Actualizar estado local
        if (editMode) {
          setWaterCharges((prev) =>
            prev.map((charge) => (charge.id === selectedCharge.id ? { ...chargeData, _isPending: true } : charge)),
          )
        } else {
          const newCharge = {
            ...chargeData,
            id: `temp_${Date.now()}`,
            _isPending: true,
            _isNew: true,
          }
          setWaterCharges((prev) => [newCharge, ...prev])
        }

        updatePendingSyncCount(true)
        setShowModal(false)
        toast({
          title: editMode ? "Carga actualizada" : "Carga creada",
          description: "Se guardará cuando vuelva la conexión",
        })
        return
      }

      const url = editMode
        ? `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua/${selectedCharge.id}`
        : "https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua"
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
        toast({
          title: "Éxito",
          description: editMode ? "Carga actualizada correctamente" : "Carga creada correctamente",
        })
      }
    } catch (error) {
      console.error("Error saving water charge:", error)
      toast({
        title: "Error",
        description: "Error al guardar la carga de agua",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCharge = async () => {
    try {
      if (!isOnline) {
        // Registrar para sincronización offline
        await registerSyncRequest(
          `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua/${selectedCharge.id}`,
          "DELETE",
          {},
        )

        // Marcar como pendiente de eliminación
        setWaterCharges((prev) =>
          prev.map((charge) => (charge.id === selectedCharge.id ? { ...charge, _isPendingDelete: true } : charge)),
        )

        updatePendingSyncCount(true)
        setShowDeleteModal(false)
        toast({
          title: "Carga marcada para eliminar",
          description: "Se eliminará cuando vuelva la conexión",
        })
        return
      }

      const response = await fetch(
        `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua/${selectedCharge.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      if (response.ok) {
        setShowDeleteModal(false)
        fetchWaterCharges()
        toast({
          title: "Éxito",
          description: "Carga eliminada correctamente",
        })
      }
    } catch (error) {
      console.error("Error deleting water charge:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la carga de agua",
        variant: "destructive",
      })
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
    <NetworkStatusHandler onOffline={() => console.log("Modo offline activado")} onOnline={() => fetchWaterCharges()}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
          <Toaster />

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestión de Cargas de Agua</h1>
            <OfflineIndicator />
          </div>

          <InstallPrompt />
          <SyncManagerEnhanced onSync={fetchWaterCharges} />
          <CacheIndicator />
          <BackgroundSyncEnhanced
            syncTag="water-charges-sync"
            onSyncRegistered={() => console.log("Sync registrado para cargas de agua")}
            onSyncError={(error) => console.error("Error en Background Sync:", error)}
          />

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
                      <TableRow
                        key={charge.id}
                        className={`${
                          charge._isPending || charge._isPendingDelete || charge._isNew
                            ? "bg-yellow-50 border-l-4 border-yellow-400"
                            : ""
                        }`}
                      >
                        <TableCell>
                          {new Date(charge.fechaHora).toLocaleString()}
                          {(charge._isPending || charge._isPendingDelete || charge._isNew) && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
                            >
                              {charge._isPendingDelete ? "Eliminar" : charge._isNew ? "Nuevo" : "Pendiente"}
                            </Badge>
                          )}
                        </TableCell>
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
                              disabled={charge._isPendingDelete}
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
                              disabled={charge._isPendingDelete}
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

          {/* Modal para ver/crear/editar */}
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
              aria-describedby="charge-dialog-description"
            >
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
                <div className="space-y-6" id="charge-dialog-description">
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

                  {/* Información detallada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Información de fecha y hora */}
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
                      </CardContent>
                    </Card>

                    {/* Información del usuario */}
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
                          </>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No hay información del usuario disponible</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveCharge}>
                  <div className="grid gap-4 py-4" id="charge-dialog-description">
                    {!isOnline && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <WifiOff className="h-4 w-4" />
                          <span className="text-sm">Sin conexión - Se guardará para sincronizar después</span>
                        </div>
                      </div>
                    )}

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

          {/* Modal de confirmación de eliminación */}
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent aria-describedby="delete-dialog-description">
              <DialogHeader>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogDescription id="delete-dialog-description">
                  ¿Está seguro que desea eliminar esta carga de agua?
                  {!isOnline && " Se marcará para eliminar cuando vuelva la conexión."}
                </DialogDescription>
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
      </div>
    </NetworkStatusHandler>
  )
}