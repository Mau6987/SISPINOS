"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  CreditCard,
  Filter,
  User,
  Mail,
  BadgeIcon as IdCard,
  Calendar,
  Shield,
} from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/components/ui/dialog"
import { Checkbox } from "@/components/components/ui/checkbox"
import { Toaster } from "@/components/components/ui/toaster"
import { toast } from "@/components/hooks/use-toast"
import { Badge } from "@/components/components/ui/badge"
import { Label } from "@/components/components/ui/label"

// Importar componentes PWA
import OfflineIndicator from "@/components/pwa-features/offline-indicator"
import SyncManager from "@/components/pwa-features/sync-manager"
import NetworkStatusHandler from "@/components/pwa-features/network-status-handler"
import InstallPrompt from "@/components/pwa-features/install-prompt"
import CacheIndicator from "@/components/pwa-features/cache-indicator"
import ResponsiveContainer from "@/components/responsive-container"
import { usePWAFeatures } from "../../hooks/use-pwa-features"
import { saveToIndexedDB, getFromIndexedDB, registerSyncRequest } from "../../utils/pwa-helpers"
import BackgroundSync from "@/components/pwa-features/background-sync"

// Componente simulado para RFID Card Manager
//save@/components/utils/pwa-helpers
function RFIDCardManager({ userId, userName, currentCardNumber, onSave, isOnline }) {
  const [showDialog, setShowDialog] = useState(false)
  const [cardNumber, setCardNumber] = useState(currentCardNumber || "")
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(cardNumber)
      setShowDialog(false)
      toast({
        title: "Éxito",
        description: "Tarjeta RFID actualizada correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la tarjeta RFID",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 border-purple-300 h-8 w-full text-xs font-medium transition-colors duration-200 flex items-center justify-center"
        onClick={() => setShowDialog(true)}
      >
        <CreditCard className="h-3 w-3 mr-1" />
        RFID
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar Tarjeta RFID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Número de Tarjeta RFID</Label>
              <Input
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Ingrese el número de la tarjeta"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !isOnline}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Componente simulado para User Block Manager
function UserBlockManager({ userId, userName, isBlocked, blockReason, blockDate, onBlockStatusChange, isOnline }) {
  const [showDialog, setShowDialog] = useState(false)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleBlock = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Debe proporcionar un motivo para el bloqueo",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await onBlockStatusChange(true, reason)
      setShowDialog(false)
      setReason("")
      toast({
        title: "Usuario bloqueado",
        description: "El usuario ha sido bloqueado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Error al bloquear el usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnblock = async () => {
    setIsLoading(true)
    try {
      await onBlockStatusChange(false)
      toast({
        title: "Usuario desbloqueado",
        description: "El usuario ha sido desbloqueado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Error al desbloquear el usuario",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className={`${
          isBlocked
            ? "text-green-600 hover:text-green-800 hover:bg-green-50 border-green-300"
            : "text-red-600 hover:text-red-800 hover:bg-red-50 border-red-300"
        } h-8 w-full text-xs font-medium transition-colors duration-200 flex items-center justify-center`}
        onClick={() => {
          if (isBlocked) {
            handleUnblock()
          } else {
            setShowDialog(true)
          }
        }}
        disabled={isLoading || !isOnline}
      >
        <Shield className="h-3 w-3 mr-1" />
        {isBlocked ? "Desbloquear" : "Bloquear"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="blockReason">Motivo del bloqueo</Label>
              <Input
                id="blockReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ingrese el motivo del bloqueo"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleBlock} disabled={isLoading}>
                {isLoading ? "Bloqueando..." : "Bloquear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function ClientManagementEnhanced() {
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(8)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState(["propietario", "conductor"])

  const router = useRouter()
  const { isOnline, updatePendingSyncCount } = usePWAFeatures()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [allUsers, selectedRoles, searchQuery])

  const fetchData = async () => {
    try {
      const response = await fetch("https://mi-backendsecond.onrender.com/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (response.ok) {
        let jsonData = await response.json()

        jsonData = jsonData.filter((user) => user.rol === "propietario" || user.rol === "conductor")

        jsonData.sort((a, b) => {
          const rolesOrden = { propietario: 1, conductor: 2 }
          return rolesOrden[a.rol] - rolesOrden[b.rol]
        })

        // Guardar en caché local y IndexedDB
        localStorage.setItem("cachedUsers", JSON.stringify(jsonData))
        await saveToIndexedDB("clients", { id: "all", data: jsonData, timestamp: Date.now() })
        setAllUsers(jsonData)
        localStorage.setItem("usingCachedData", "false")
      } else if (response.status === 401) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)

      // Intentar cargar desde IndexedDB primero
      try {
        const cachedData = await getFromIndexedDB("clients", "all")
        if (cachedData && cachedData.data) {
          let jsonData = cachedData.data
          jsonData = jsonData.filter((user) => user.rol === "propietario" || user.rol === "conductor")
          setAllUsers(jsonData)
          localStorage.setItem("usingCachedData", "true")

          toast({
            title: "Usando datos en caché",
            description: "Estás viendo datos almacenados localmente.",
          })
          return
        }
      } catch (indexedDBError) {
        console.error("Error al cargar desde IndexedDB:", indexedDBError)
      }

      // Fallback a localStorage
      const cachedData = localStorage.getItem("cachedUsers")
      if (cachedData) {
        let jsonData = JSON.parse(cachedData)
        jsonData = jsonData.filter((user) => user.rol === "propietario" || user.rol === "conductor")
        setAllUsers(jsonData)
        localStorage.setItem("usingCachedData", "true")

        if (!navigator.onLine) {
          toast({
            title: "Usando datos en caché",
            description: "Estás viendo datos almacenados localmente.",
          })
        }
      }
    }
  }

  const fetchUserById = async (userId) => {
    try {
      const response = await fetch(`https://mi-backendsecond.onrender.com/usuarios/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (response.ok) {
        const userData = await response.json()
        return userData
      } else {
        throw new Error("Error al obtener los datos del usuario")
      }
    } catch (error) {
      console.error("Error al obtener usuario por ID:", error)
      const user = allUsers.find((u) => u.id === userId)
      if (user) {
        return user
      }
      throw error
    }
  }

  const applyFilters = () => {
    let filtered = [...allUsers]

    if (selectedRoles.length > 0) {
      filtered = filtered.filter((user) => selectedRoles.includes(user.rol))
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.rol?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
    setShowFilterMenu(false)
  }

  const handleRoleFilterChange = (role) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const handleViewDetails = async (user) => {
    try {
      // Intentar obtener datos actualizados del usuario
      const updatedUser = await fetchUserById(user.id)
      setSelectedUser(updatedUser)
    } catch (error) {
      // Si falla, usar los datos locales
      setSelectedUser(user)
    }
    setShowDetailsDialog(true)
  }

  const handleConsultas = (user) => {
    localStorage.setItem("selectedUserId", user.id.toString())
    router.push("/Consultas")
  }

  const handlePagos = (user) => {
    localStorage.setItem("selectedUserId", user.id.toString())
    router.push("/PagosUsuario")
  }

  const handleUpdateRFIDCard = async (userId, cardNumber) => {
    try {
      if (!navigator.onLine) {
        // Registrar para sincronización en segundo plano
        await registerSyncRequest(`https://mi-backendsecond.onrender.com/usuarios/${userId}`, "PUT", {
          numeroTarjetaRFID: cardNumber,
        })
        updatePendingSyncCount(true)

        setAllUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, numeroTarjetaRFID: cardNumber, _isPending: true } : user,
          ),
        )

        return Promise.resolve()
      }

      const userData = await fetchUserById(userId)

      const updatedUserData = {
        nombre: userData.nombre,
        correo: userData.correo,
        ci: userData.ci,
        username: userData.username,
        rol: userData.rol,
        numeroTarjetaRFID: cardNumber,
        propietarioId: userData.propietarioId,
        bloqueado: userData.bloqueado,
        motivoBloqueo: userData.motivoBloqueo,
      }

      const response = await fetch(`https://mi-backendsecond.onrender.com/usuarios/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedUserData),
      })

      if (response.ok) {
        setAllUsers((prevUsers) =>
          prevUsers.map((user) => (user.id === userId ? { ...user, numeroTarjetaRFID: cardNumber } : user)),
        )

        fetchData()
        return Promise.resolve()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error del servidor:", errorData)
        return Promise.reject(errorData.message || "Error al actualizar la tarjeta")
      }
    } catch (error) {
      console.error("Error al actualizar la tarjeta RFID:", error)
      return Promise.reject(error.message || "Error de conexión")
    }
  }

  const handleBlockStatusChange = async (userId, blocked, reason = "") => {
    try {
      if (!navigator.onLine) {
        // Registrar para sincronización en segundo plano
        const url = blocked
          ? `https://mi-backendsecond.onrender.com/usuarios/${userId}/bloquear`
          : `https://mi-backendsecond.onrender.com/usuarios/${userId}/desbloquear`

        await registerSyncRequest(url, "POST", blocked ? { motivoBloqueo: reason } : {})
        updatePendingSyncCount(true)

        setAllUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  bloqueado: blocked,
                  motivoBloqueo: blocked ? reason : null,
                  fechaBloqueo: blocked ? new Date().toISOString() : null,
                  _isPending: true,
                }
              : user,
          ),
        )

        return Promise.resolve()
      }

      const url = blocked
        ? `https://mi-backendsecond.onrender.com/usuarios/${userId}/bloquear`
        : `https://mi-backendsecond.onrender.com/usuarios/${userId}/desbloquear`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: blocked ? JSON.stringify({ motivoBloqueo: reason }) : "{}",
      })

      if (response.ok) {
        fetchData()
        return Promise.resolve()
      } else {
        const errorData = await response.json().catch(() => ({}))
        return Promise.reject(errorData.message || `Error al ${blocked ? "bloquear" : "desbloquear"} al usuario`)
      }
    } catch (error) {
      console.error(`Error al ${blocked ? "bloquear" : "desbloquear"} al usuario:`, error)
      return Promise.reject("Error de conexión")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  return (
    <NetworkStatusHandler onOffline={() => console.log("Modo offline activado")} onOnline={() => fetchData()}>
      <ResponsiveContainer className="max-w-6xl mx-auto pt-16">
        <Toaster />

        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Clientes</h1>
          <div className="flex justify-end items-center w-full">
            <OfflineIndicator />
          </div>
        </div>

        <InstallPrompt />
        <SyncManager onSync={fetchData} />
        <CacheIndicator />
        <BackgroundSync syncTag="client-sync" onSyncRegistered={() => console.log("Sync registrado para clientes")} />

        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center mb-4 gap-2">
          <Input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm w-full sm:max-w-xs"
          />
          <Button size="sm" onClick={() => setShowFilterMenu(!showFilterMenu)} className="w-full sm:w-auto">
            <Filter className="mr-1 h-3 w-3" /> Filtros
          </Button>
        </div>

        {showFilterMenu && (
          <div className="bg-white p-3 rounded-lg shadow-md mb-4 border text-sm">
            <h2 className="font-semibold mb-2">Filtrar por Rol</h2>
            <div className="space-y-1">
              {["propietario", "conductor"].map((rol) => (
                <div key={rol} className="flex items-center">
                  <Checkbox
                    id={rol}
                    checked={selectedRoles.includes(rol)}
                    onCheckedChange={() => handleRoleFilterChange(rol)}
                  />
                  <label htmlFor={rol} className="ml-2 text-sm">
                    {rol.charAt(0).toUpperCase() + rol.slice(1)}
                  </label>
                </div>
              ))}
            </div>
            <div className="mt-3 space-x-2">
              <Button size="sm" onClick={applyFilters}>
                Aplicar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowFilterMenu(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-indigo-700 to-indigo-600">
                <TableRow>
                  <TableHead className="text-white font-semibold text-sm py-3 px-4 border-r-2 border-indigo-500 last:border-r-0">
                    Nombre
                  </TableHead>
                  <TableHead className="text-white font-semibold text-sm py-3 px-4 border-r-2 border-indigo-500 last:border-r-0">
                    Username
                  </TableHead>
                  <TableHead className="text-white font-semibold text-sm py-3 px-4 border-r-2 border-indigo-500 last:border-r-0 hidden sm:table-cell">
                    Rol
                  </TableHead>
                  <TableHead className="text-white font-semibold text-sm py-3 px-4 border-r-2 border-indigo-500 last:border-r-0 hidden sm:table-cell">
                    Estado
                  </TableHead>
                  <TableHead className="text-white font-semibold text-sm py-3 px-4">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      className={`${
                        user._isPending
                          ? "bg-yellow-50 border-l-4 border-yellow-400"
                          : user.bloqueado
                            ? "bg-red-50 border-l-4 border-red-400"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50"
                      } hover:bg-indigo-50 transition-all duration-200 border-b border-gray-100 last:border-b-0`}
                    >
                      <TableCell className="py-3 px-4 font-medium text-gray-900 border-r border-gray-200 last:border-r-0">
                        <div className="max-w-[120px] truncate">{user.nombre}</div>
                        {user._isPending && (
                          <Badge
                            variant="outline"
                            className="ml-1 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs font-medium"
                          >
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-gray-700 border-r border-gray-200 last:border-r-0">
                        <div className="max-w-[100px] truncate font-mono text-sm">{user.username}</div>
                      </TableCell>
                      <TableCell className="py-3 px-4 border-r border-gray-200 last:border-r-0 hidden sm:table-cell">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            user.rol === "propietario"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {user.rol}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-4 border-r border-gray-200 last:border-r-0 hidden sm:table-cell">
                        {user.bloqueado ? (
                          <Badge
                            variant="outline"
                            className="bg-red-100 text-red-700 border-red-300 text-xs font-medium"
                          >
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-300 text-xs font-medium"
                          >
                            Activo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-300 h-8 w-full text-xs font-medium transition-colors duration-200 flex items-center justify-center col-span-2 sm:col-span-1"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>

                          <div className="h-8 w-full">
                            <RFIDCardManager
                              userId={user.id}
                              userName={user.nombre}
                              currentCardNumber={user.numeroTarjetaRFID}
                              onSave={(cardNumber) => handleUpdateRFIDCard(user.id, cardNumber)}
                              isOnline={isOnline}
                            />
                          </div>

                          <div className="h-8 w-full">
                            <UserBlockManager
                              userId={user.id}
                              userName={user.nombre}
                              isBlocked={user.bloqueado}
                              blockReason={user.motivoBloqueo}
                              blockDate={user.fechaBloqueo}
                              onBlockStatusChange={(blocked, reason) =>
                                handleBlockStatusChange(user.id, blocked, reason)
                              }
                              isOnline={isOnline}
                            />
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-300 h-8 w-full text-xs font-medium transition-colors duration-200 flex items-center justify-center"
                            onClick={() => handleConsultas(user)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Consultas
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 border-amber-300 h-8 w-full text-xs font-medium transition-colors duration-200 flex items-center justify-center"
                            onClick={() => handlePagos(user)}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Pago
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500 font-medium">
                      No se encontraron clientes con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
          <Button
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
          >
            <ChevronLeft className="mr-1 h-3 w-3" /> Anterior
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages || 1}
          </span>
          <Button
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
          >
            Siguiente <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl" aria-describedby="details-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-indigo-700 text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                Detalles del Cliente
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4" id="details-dialog-description">
                {/* Información Personal */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Información Personal
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Nombre:</span>
                        <span className="text-gray-900">{selectedUser.nombre || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">CI:</span>
                        <span className="text-gray-900 font-mono">{selectedUser.ci || "N/A"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-600">Correo:</span>
                        <span className="text-gray-900">{selectedUser.correo || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Username:</span>
                        <span className="text-gray-900 font-mono">{selectedUser.username || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información del Sistema */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    Información del Sistema
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">ID:</span>
                        <span className="text-gray-900 font-mono">{selectedUser.id || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Rol:</span>
                        <Badge
                          className={`${
                            selectedUser.rol === "propietario"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {selectedUser.rol || "N/A"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Tarjeta RFID:</span>
                        <span className="text-gray-900 font-mono">
                          {selectedUser.numeroTarjetaRFID || "Sin asignar"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Propietario ID:</span>
                        <span className="text-gray-900 font-mono">{selectedUser.propietarioId || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estado y Bloqueo */}
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Estado y Seguridad
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Estado:</span>
                      <Badge
                        variant="outline"
                        className={`${
                          selectedUser.bloqueado
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-green-100 text-green-700 border-green-300"
                        }`}
                      >
                        {selectedUser.bloqueado ? "Bloqueado" : "Activo"}
                      </Badge>
                    </div>
                    {selectedUser.bloqueado && (
                      <>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-600">Motivo del bloqueo:</span>
                          <span className="text-red-700 bg-red-100 px-2 py-1 rounded text-sm">
                            {selectedUser.motivoBloqueo || "No especificado"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-600">Fecha de bloqueo:</span>
                          <span className="text-gray-900">{formatDate(selectedUser.fechaBloqueo)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Fechas del Sistema */}
                {(selectedUser.createdAt || selectedUser.updatedAt) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fechas del Sistema
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedUser.createdAt && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-600">Creado:</span>
                          <span className="text-gray-900 text-sm">{formatDate(selectedUser.createdAt)}</span>
                        </div>
                      )}
                      {selectedUser.updatedAt && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-600">Actualizado:</span>
                          <span className="text-gray-900 text-sm">{formatDate(selectedUser.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </ResponsiveContainer>
    </NetworkStatusHandler>
  )
}
