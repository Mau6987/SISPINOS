"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, FileText, CreditCard, Filter } from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/components/ui/dialog"
import { Checkbox } from "@/components/components/ui/checkbox"
import { Toaster } from "@/components/components/ui/toaster"
import { toast } from "@/components/hooks/use-toast"
import { Badge } from "@/components/components/ui/badge"
import RFIDCardManager from "@/components/rfid-card-manager"
import UserBlockManager from "@/components/user-block-manager"


export default function ClientManagement() {
  const [allUsers, setAllUsers] = useState([]) // Todos los usuarios sin filtrar
  const [filteredUsers, setFilteredUsers] = useState([]) // Usuarios filtrados por rol y búsqueda
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(6)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState(["propietario", "conductor"]) // Por defecto, ambos roles seleccionados
  const [pendingRequests, setPendingRequests] = useState(0)

  const router = useRouter()

  // Detectar estado de conexión
  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Conexión restaurada",
        description: "Las solicitudes pendientes se sincronizarán automáticamente.",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Sin conexión",
        description: "Puedes seguir trabajando. Los cambios se sincronizarán cuando vuelva la conexión.",
        variant: "destructive",
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Verificar si hay solicitudes pendientes
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      checkPendingRequests()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Función para verificar solicitudes pendientes (simplificada)
  const checkPendingRequests = async () => {
    try {
      const localData = localStorage.getItem("pendingRequestsCount")
      if (localData) {
        setPendingRequests(Number.parseInt(localData, 10))
      }
    } catch (error) {
      console.error("Error al verificar solicitudes pendientes:", error)
    }
  }

  // Función para actualizar el contador de solicitudes pendientes
  const updatePendingRequestsCount = (increment = true) => {
    setPendingRequests((prev) => {
      const newCount = increment ? prev + 1 : Math.max(0, prev - 1)
      localStorage.setItem("pendingRequestsCount", newCount.toString())
      return newCount
    })
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchData()
  }, [])

  // Aplicar filtros cuando cambian los criterios
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

        // Filtrar solo propietarios y conductores para el conjunto completo
        jsonData = jsonData.filter((user) => user.rol === "propietario" || user.rol === "conductor")

        // Ordenar por rol
        jsonData.sort((a, b) => {
          const rolesOrden = { propietario: 1, conductor: 2 }
          return rolesOrden[a.rol] - rolesOrden[b.rol]
        })

        // Guardar en localStorage para acceso offline
        localStorage.setItem("cachedUsers", JSON.stringify(jsonData))

        // Guardar todos los usuarios (solo propietarios y conductores)
        setAllUsers(jsonData)
      } else if (response.status === 401) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)

      // En caso de error (probablemente offline), usar datos en caché
      const cachedData = localStorage.getItem("cachedUsers")
      if (cachedData) {
        let jsonData = JSON.parse(cachedData)
        // Asegurar que solo se muestren propietarios y conductores incluso desde caché
        jsonData = jsonData.filter((user) => user.rol === "propietario" || user.rol === "conductor")
        setAllUsers(jsonData)

        if (!navigator.onLine) {
          toast({
            title: "Usando datos en caché",
            description: "Estás viendo datos almacenados localmente.",
          })
        }
      }
    }
  }

  // Función para obtener los datos completos de un usuario específico
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
      // Si falla la petición, buscar en los datos locales
      const user = allUsers.find((u) => u.id === userId)
      if (user) {
        return user
      }
      throw error
    }
  }

  // Aplicar filtros de rol y búsqueda
  const applyFilters = () => {
    let filtered = [...allUsers]

    // Filtrar por roles seleccionados
    if (selectedRoles.length > 0) {
      filtered = filtered.filter((user) => selectedRoles.includes(user.rol))
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.rol?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredUsers(filtered)
    setCurrentPage(1) // Resetear a la primera página cuando cambian los filtros
    setShowFilterMenu(false) // Cerrar menú de filtros si está abierto
  }

  const handleRoleFilterChange = (role) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]))
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    setShowDetailsDialog(true)
  }

  const handleConsultas = (user) => {
    // Guardar el ID del usuario seleccionado en localStorage
    localStorage.setItem("selectedUserId", user.id.toString())
    router.push("/Consultas")
  }

  const handlePagos = (user) => {
    // Guardar el ID del usuario seleccionado en localStorage
    localStorage.setItem("selectedUserId", user.id.toString())
    router.push("/PagosUsuario")
  }

  // Función para manejar la actualización de la tarjeta RFID
  const handleUpdateRFIDCard = async (userId, cardNumber) => {
    try {
      // Si estamos offline, actualizar la UI optimistamente
      if (!navigator.onLine) {
        updatePendingRequestsCount(true)

        // Actualizar usuario en la UI
        setAllUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId ? { ...user, numeroTarjetaRFID: cardNumber, _isPending: true } : user,
          ),
        )

        return Promise.resolve() // Resolver la promesa para la UI
      }

      // Obtener los datos completos del usuario
      const userData = await fetchUserById(userId)

      // Preparar los datos completos con solo el RFID modificado
      const updatedUserData = {
        nombre: userData.nombre,
        correo: userData.correo,
        ci: userData.ci,
        username: userData.username,
        // No enviamos password para mantener la actual
        rol: userData.rol,
        numeroTarjetaRFID: cardNumber, // Solo este campo cambia
        propietarioId: userData.propietarioId,
        bloqueado: userData.bloqueado,
        motivoBloqueo: userData.motivoBloqueo,
      }

      // Enviar la actualización con todos los campos
      const response = await fetch(`https://mi-backendsecond.onrender.com/usuarios/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(updatedUserData),
      })

      if (response.ok) {
        // Actualizar los datos locales inmediatamente
        setAllUsers((prevUsers) =>
          prevUsers.map((user) => (user.id === userId ? { ...user, numeroTarjetaRFID: cardNumber } : user)),
        )

        // También recargar desde el servidor para asegurar sincronización
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

  // Función para manejar el bloqueo/desbloqueo de usuarios
  const handleBlockStatusChange = async (userId, blocked, reason = "") => {
    try {
      // Si estamos offline, actualizar la UI optimistamente
      if (!navigator.onLine) {
        updatePendingRequestsCount(true)

        // Actualizar usuario en la UI
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

        return Promise.resolve() // Resolver la promesa para la UI
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
        fetchData() // Actualizar datos desde el servidor
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

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  // Estilos para el encabezado de la tabla
  const tableHeaderStyle = "bg-blue-900"
  const tableHeaderCellStyle = "border-r border-blue-800 last:border-r-0"

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8 text-center">Gestión de Clientes</h1>

      {pendingRequests > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
          <p className="text-yellow-800 font-medium">
            Tienes {pendingRequests} {pendingRequests === 1 ? "solicitud" : "solicitudes"} pendiente
            {pendingRequests === 1 ? "" : "s"} de sincronización
          </p>
          <p className="text-yellow-600 text-sm">
            Los cambios se sincronizarán automáticamente cuando se restaure la conexión
          </p>
        </div>
      )}

      <div className="flex justify-end items-center mb-6">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={() => setShowFilterMenu(!showFilterMenu)}>
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
        </div>
      </div>

      {showFilterMenu && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
          <h2 className="font-semibold mb-2">Filtrar por Rol</h2>
          <div className="space-y-2">
            {["propietario", "conductor"].map((rol) => (
              <div key={rol} className="flex items-center">
                <Checkbox
                  id={rol}
                  checked={selectedRoles.includes(rol)}
                  onCheckedChange={() => handleRoleFilterChange(rol)}
                />
                <label
                  htmlFor={rol}
                  className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {rol.charAt(0).toUpperCase() + rol.slice(1)}
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 space-x-2">
            <Button onClick={applyFilters}>Aplicar Filtros</Button>
            <Button variant="outline" onClick={() => setShowFilterMenu(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-300">
        <Table>
          <TableHeader className={tableHeaderStyle}>
            <TableRow>
              <TableHead className={`text-white font-bold ${tableHeaderCellStyle}`}>Nombre</TableHead>
              <TableHead className={`text-white font-bold ${tableHeaderCellStyle}`}>Username</TableHead>
              <TableHead className={`text-white font-bold ${tableHeaderCellStyle}`}>Rol</TableHead>
              <TableHead className={`text-white font-bold ${tableHeaderCellStyle}`}>Estado</TableHead>
              <TableHead className="text-white font-bold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className={`${
                    user._isPending
                      ? "bg-yellow-50"
                      : user.bloqueado
                        ? "bg-red-50"
                        : currentUsers.indexOf(user) % 2 === 0
                          ? "bg-white"
                          : "bg-gray-100"
                  } hover:bg-gray-50 transition-colors duration-150`}
                >
                  <TableCell className="border-b border-gray-200">
                    {user.nombre}
                    {user._isPending && (
                      <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="border-b border-gray-200">{user.username}</TableCell>
                  <TableCell className="border-b border-gray-200">{user.rol}</TableCell>
                  <TableCell className="border-b border-gray-200">
                    {user.bloqueado ? (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        Activo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="border-b border-gray-200">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 border-blue-300 font-medium"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>

                      <RFIDCardManager
                        userId={user.id}
                        userName={user.nombre}
                        currentCardNumber={user.numeroTarjetaRFID}
                        onSave={(cardNumber) => handleUpdateRFIDCard(user.id, cardNumber)}
                        isOnline={isOnline}
                      />

                      <UserBlockManager
                        userId={user.id}
                        userName={user.nombre}
                        isBlocked={user.bloqueado}
                        blockReason={user.motivoBloqueo}
                        blockDate={user.fechaBloqueo}
                        onBlockStatusChange={(blocked, reason) => handleBlockStatusChange(user.id, blocked, reason)}
                        isOnline={isOnline}
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 border-green-300 font-medium"
                        onClick={() => handleConsultas(user)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Consultas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 border-amber-300 font-medium"
                        onClick={() => handlePagos(user)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pago
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 border-b border-gray-200">
                  No se encontraron clientes con los filtros seleccionados
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

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent aria-describedby="details-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-blue-700">Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4" id="details-dialog-description">
              {Object.entries(selectedUser).map(([key, value]) => (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <span className="font-medium text-right">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                  <span className="col-span-3">{key === "bloqueado" ? (value ? "Sí" : "No") : value || "N/A"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
