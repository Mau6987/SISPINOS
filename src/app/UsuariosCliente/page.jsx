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
  Calendar,
  Shield,
  WifiOff,
} from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/components/ui/dialog"
import { Checkbox } from "@/components/components/ui/checkbox"
import { toast } from "@/components/hooks/use-toast"
import { Badge } from "@/components/components/ui/badge"
import { Label } from "@/components/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Toaster } from "@/components/components/ui/toaster"

// Importar componentes PWA
import OfflineIndicator from "@/components/pwa-features/offline-indicator"
import NetworkStatusHandler from "@/components/pwa-features/network-status-handler"
import InstallPrompt from "@/components/pwa-features/install-prompt"
import CacheIndicator from "@/components/pwa-features/cache-indicator"
import ResponsiveContainer from "@/components/responsive-container"
import { usePWAFeatures } from "../../hooks/use-pwa-features"
import { saveToIndexedDB, getFromIndexedDB, registerSyncRequest, initializeBackgroundSync } from "../../utils/pwa-helpers"
import BackgroundSyncEnhanced from "@/components/pwa-features/background-sync"
import SyncManagerEnhanced from "@/components/pwa-features/sync-manager"

// Componente para RFID Card Manager
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
        description: isOnline ? "Tarjeta RFID actualizada correctamente" : "Tarjeta RFID guardada para sincronizar",
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
        <DialogContent className="max-w-md" aria-describedby="rfid-dialog-description">
          <DialogHeader>
            <DialogTitle>Gestionar Tarjeta RFID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" id="rfid-dialog-description">
            <div>
              <Label htmlFor="cardNumber">Número de Tarjeta RFID</Label>
              <Input
                id="cardNumber"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Ingrese el número de la tarjeta"
              />
            </div>
            {!isOnline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Sin conexión - Se guardará para sincronizar después</span>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Componente para User Block Manager
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
        description: isOnline ? "El usuario ha sido bloqueado correctamente" : "Bloqueo guardado para sincronizar",
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
        description: isOnline
          ? "El usuario ha sido desbloqueado correctamente"
          : "Desbloqueo guardado para sincronizar",
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
        disabled={isLoading}
      >
        <Shield className="h-3 w-3 mr-1" />
        {isBlocked ? "Desbloquear" : "Bloquear"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" aria-describedby="block-dialog-description">
          <DialogHeader>
            <DialogTitle>Bloquear Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4" id="block-dialog-description">
            <div>
              <Label htmlFor="blockReason">Motivo del bloqueo</Label>
              <Input
                id="blockReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ingrese el motivo del bloqueo"
              />
            </div>
            {!isOnline && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-800">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm">Sin conexión - Se guardará para sincronizar después</span>
                </div>
              </div>
            )}
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

export default function ClientManagementOffline() {
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
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      // Inicializar background sync
      initializeBackgroundSync()
      fetchData()
    }
  }, [router])

  useEffect(() => {
    applyFilters()
  }, [allUsers, selectedRoles, searchQuery])

  const fetchData = async () => {
    try {
      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
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
        localStorage.setItem("cachedClients", JSON.stringify(jsonData))
        await saveToIndexedDB("clients", { id: "all", data: jsonData, timestamp: Date.now() })

        setAllUsers(jsonData)
        localStorage.setItem("usingCachedData", "false")
      } else if (response.status === 401) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error al obtener clientes:", error)

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
      const cachedData = localStorage.getItem("cachedClients")
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
      if (!navigator.onLine) {
        const user = allUsers.find((u) => u.id === userId)
        if (user) return user
        throw new Error("Usuario no encontrado en caché")
      }

      const response = await fetch(`https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${userId}`, {
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
      if (user) return user
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
      const updatedUser = await fetchUserById(user.id)
      setSelectedUser(updatedUser)
    } catch (error) {
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
        // Registrar para sincronización offline
        await registerSyncRequest(
          `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${userId}`,
          "PUT",
          {
            numeroTarjetaRFID: cardNumber,
          },
        )

        // Actualizar estado local
        setAllUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, numeroTarjetaRFID: cardNumber, _isPending: true } : user,
          ),
        )

        updatePendingSyncCount(true)
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

      const response = await fetch(`https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${userId}`, {
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
        // Registrar para sincronización offline
        const url = blocked
          ? `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${userId}/bloquear`
          : `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${userId}/desbloquear`

        await registerSyncRequest(url, "POST", blocked ? { motivoBloqueo: reason } : {})

        // Actualizar estado local
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

        updatePendingSyncCount(true)
        return Promise.resolve()
      }

      const url = blocked
        ? `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${userId}/bloquear`
        : `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${userId}/desbloquear`

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
        <Toaster />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h1 className="text-xl font-bold">Gestión de Clientes</h1>
          <OfflineIndicator />
        </div>

        <InstallPrompt />
        <SyncManagerEnhanced onSync={fetchData} />
        <CacheIndicator />
        <BackgroundSyncEnhanced
          syncTag="client-sync"
          onSyncRegistered={() => console.log("Sync registrado para clientes")}
          onSyncError={(error) => console.error("Error en Background Sync:", error)}
        />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 flex-1 w-full sm:w-auto">
            <Button size="sm" onClick={() => setShowFilterMenu(!showFilterMenu)} className="w-full sm:w-auto">
              <Filter className="mr-1 h-3 w-3" /> Filtros
            </Button>
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm w-full sm:max-w-xs"
            />
          </div>
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

        <Card className="mb-4">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-blue-900">
                  <TableRow>
                    <TableHead className="text-white font-bold text-sm py-2">Nombre</TableHead>
                    <TableHead className="text-white font-bold text-sm py-2">Username</TableHead>
                    <TableHead className="text-white font-bold text-sm py-2 hidden sm:table-cell">Rol</TableHead>
                    <TableHead className="text-white font-bold text-sm py-2 hidden sm:table-cell">Estado</TableHead>
                    <TableHead className="text-white font-bold text-sm py-2">Acciones</TableHead>
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
                        <TableCell className="py-2">
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
                        <TableCell className="py-2">
                          <div className="max-w-[100px] truncate font-mono text-sm">{user.username}</div>
                        </TableCell>
                        <TableCell className="py-2 hidden sm:table-cell">
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
                        <TableCell className="py-2 hidden sm:table-cell">
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
                        <TableCell className="py-2">
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
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
          <Button
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-full sm:w-auto"
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
            className="w-full sm:w-auto"
          >
            Siguiente <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent
            className="max-w-2xl max-h-[85vh] overflow-y-auto"
            aria-describedby="details-dialog-description"
          >
            <DialogHeader>
              <DialogTitle className="text-indigo-700 text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                Detalles del Cliente
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4" id="details-dialog-description">
                {/* Header with user avatar and basic info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.nombre?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{selectedUser.nombre || "N/A"}</h3>
                      <p className="text-gray-600">@{selectedUser.username || "N/A"}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`${
                            selectedUser.rol === "propietario"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {selectedUser.rol?.charAt(0).toUpperCase() + selectedUser.rol?.slice(1) || "N/A"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${
                            selectedUser.bloqueado
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {selectedUser.bloqueado ? "Bloqueado" : "Activo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center text-gray-800">
                      <User className="mr-2 h-5 w-5" />
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Nombre Completo</Label>
                        <div className="font-medium text-gray-900">{selectedUser.nombre || "No disponible"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Nombre de Usuario</Label>
                        <div className="font-medium text-gray-900">@{selectedUser.username || "No disponible"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Cédula de Identidad</Label>
                        <div className="font-mono text-gray-900">{selectedUser.ci || "No disponible"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Correo Electrónico</Label>
                        <div className="text-blue-600">{selectedUser.correo || "No disponible"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card className="border-gray-200">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="flex items-center text-gray-800">
                      <CreditCard className="mr-2 h-5 w-5" />
                      Información de Cuenta
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">ID de Usuario</Label>
                        <div className="font-mono text-gray-500">#{selectedUser.id || "N/A"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Rol del Sistema</Label>
                        <Badge
                          variant="outline"
                          className={`${
                            selectedUser.rol === "propietario"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {selectedUser.rol?.charAt(0).toUpperCase() + selectedUser.rol?.slice(1) || "No asignado"}
                        </Badge>
                      </div>

                      {selectedUser.numeroTarjetaRFID && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Tarjeta RFID</Label>
                          <div className="font-mono bg-gray-100 px-3 py-2 rounded border">
                            {selectedUser.numeroTarjetaRFID}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Estado de la Cuenta</Label>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={`${
                              selectedUser.bloqueado
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }`}
                          >
                            {selectedUser.bloqueado ? "Cuenta Bloqueada" : "Cuenta Activa"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Propietario Information (for conductors) */}
                {selectedUser.rol === "conductor" && selectedUser.propietarioId && (
                  <Card className="border-orange-200">
                    <CardHeader className="bg-orange-50">
                      <CardTitle className="flex items-center text-orange-800">
                        <User className="mr-2 h-5 w-5" />
                        Información del Propietario
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Propietario Asignado</Label>
                        <div className="font-medium text-gray-900">ID: {selectedUser.propietarioId}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Block Information (if blocked) */}
                {selectedUser.bloqueado && (
                  <Card className="border-red-200">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="flex items-center text-red-800">
                        <Shield className="mr-2 h-5 w-5" />
                        Información de Bloqueo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {selectedUser.motivoBloqueo && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Motivo del Bloqueo</Label>
                            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
                              {selectedUser.motivoBloqueo}
                            </div>
                          </div>
                        )}

                        {selectedUser.fechaBloqueo && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Fecha de Bloqueo</Label>
                            <div className="font-medium text-gray-900">{formatDate(selectedUser.fechaBloqueo)}</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fechas del Sistema */}
                {(selectedUser.createdAt || selectedUser.updatedAt) && (
                  <Card className="border-gray-200">
                    <CardHeader className="bg-gray-50">
                      <CardTitle className="flex items-center text-gray-800">
                        <Calendar className="mr-2 h-5 w-5" />
                        Fechas del Sistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
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
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
    </NetworkStatusHandler>
  )
}
