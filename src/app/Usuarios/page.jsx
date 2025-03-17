"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus, Filter, Eye, WifiOff } from "lucide-react"

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
import { Checkbox } from "../../components/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Badge } from "../../components/components/ui/badge"
// Corregir la importación del Toaster
import { Toaster } from "../../components/components/ui/toaster"
import { toast } from "../../components/hooks/use-toast";

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(6)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    username: "",
    correo: "",
    rol: "",
    ci: "",
    password: "",
    numeroTarjetaRFID: "",
    propietarioId: "",
  })
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [propietarios, setPropietarios] = useState([])
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isOnline, setIsOnline] = useState(true)
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
      // El service worker se encargará de la sincronización
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

    // Verificar si hay solicitudes pendientes en el service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      // Esta es una forma simplificada de verificar las solicitudes pendientes
      // En una implementación real, podrías usar la API de IndexedDB para verificar las colas
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
      // En una implementación real, accederías a IndexedDB para verificar las colas
      // Esta es una simulación simplificada
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

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      fetchData()
      fetchPropietarios()
    }
  }, [router])

  const fetchData = async () => {
    try {
      const response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (response.ok) {
        let jsonData = await response.json()
        jsonData.sort((a, b) => {
          const rolesOrden = { admin: 1, propietario: 2, conductor: 3 }
          return rolesOrden[a.rol] - rolesOrden[b.rol]
        })

        // Guardar en localStorage para acceso offline
        localStorage.setItem("cachedUsers", JSON.stringify(jsonData))

        if (selectedFilters.length > 0) {
          jsonData = jsonData.filter((user) => selectedFilters.includes(user.rol))
        }

        setUsers(jsonData)
      } else if (response.status === 401) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)

      // En caso de error (probablemente offline), usar datos en caché
      const cachedData = localStorage.getItem("cachedUsers")
      if (cachedData) {
        let jsonData = JSON.parse(cachedData)
        if (selectedFilters.length > 0) {
          jsonData = jsonData.filter((user) => selectedFilters.includes(user.rol))
        }
        setUsers(jsonData)

        if (!navigator.onLine) {
          toast({
            title: "Usando datos en caché",
            description: "Estás viendo datos almacenados localmente.",
          })
        }
      }
    }
  }

  const fetchPropietarios = async () => {
    try {
      const response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/propietarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const jsonData = await response.json()
        setPropietarios(jsonData)
        localStorage.setItem("cachedPropietarios", JSON.stringify(jsonData))
      } else {
        console.error("Error al obtener propietarios desde el servidor.")
      }
    } catch (error) {
      console.error("Error al obtener propietarios:", error)
      // En caso de error, intentar usar datos en caché
      const cachedData = localStorage.getItem("cachedPropietarios")
      if (cachedData) {
        setPropietarios(JSON.parse(cachedData))
      }
    }
  }

  // Modificar la función handleInputChange para manejar correctamente los valores nulos
  const handleInputChange = (key, value) => {
    // Si el campo es propietarioId y el valor está vacío, establecerlo como null
    if (key === "propietarioId" && (value === "" || value === undefined)) {
      setFormData((prev) => ({ ...prev, [key]: null }))
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }))
    }
  }

  // Modificar la función handleCreateUser para inicializar correctamente el formulario
  const handleCreateUser = () => {
    setSelectedUser(null)
    setFormData({
      nombre: "",
      username: "",
      correo: "",
      rol: "",
      ci: "",
      password: "",
      numeroTarjetaRFID: "",
      propietarioId: null, // Asegurarnos de que sea null y no string vacío
    })
    setShowModal(true)
    setEditMode(false)
    setViewMode(false)
  }

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setFormData({ ...user })
    setShowModal(true)
    setEditMode(false)
    setViewMode(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setFormData({ ...user })
    setShowModal(true)
    setEditMode(true)
    setViewMode(false)
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  // Modificar la función handleSaveUser para asegurarnos de que el formato de los datos sea correcto
  const handleSaveUser = async (e) => {
    e.preventDefault()

    if (formData.rol === "conductor" && !formData.propietarioId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un propietario para el conductor.",
        variant: "destructive",
      })
      return
    }

    // Asegurarnos de que propietarioId sea null cuando no es conductor
    const dataToSend = {
      ...formData,
      propietarioId: formData.rol === "conductor" ? formData.propietarioId : null,
    }

    try {
      const url = editMode
        ? `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios/${selectedUser.id}`
        : "https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios"

      // Si estamos offline, actualizar la UI optimistamente
      if (!navigator.onLine) {
        updatePendingRequestsCount(true)

        // Actualizar la UI optimistamente
        if (editMode) {
          // Actualizar usuario existente en la UI
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === selectedUser.id ? { ...dataToSend, id: selectedUser.id, _isPending: true } : user,
            ),
          )
        } else {
          // Agregar nuevo usuario a la UI con ID temporal
          const tempId = `temp_${Date.now()}`
          setUsers((prevUsers) => [...prevUsers, { ...dataToSend, id: tempId, _isPending: true }])
        }

        toast({
          title: "Guardado pendiente",
          description: `El usuario será ${editMode ? "actualizado" : "creado"} cuando se restaure la conexión.`,
        })
      }

      // Realizar la solicitud (el service worker la pondrá en cola si estamos offline)
      const response = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        // Si estamos online, la solicitud se completó correctamente
        if (navigator.onLine) {
          fetchData() // Actualizar datos desde el servidor
        }

        setShowModal(false)

        toast({
          title: "Éxito",
          description: editMode ? "Usuario actualizado con éxito" : "Usuario creado con éxito",
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("Error al guardar el usuario:", errorData)
        toast({
          title: "Error",
          description: errorData.message || "No se pudo guardar el usuario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al guardar el usuario:", error)

      // Si hay un error de red, probablemente estamos offline
      // El service worker debería haber puesto la solicitud en cola
      if (!navigator.onLine) {
        setShowModal(false)
        // No hacemos nada más aquí, ya que la UI ya se actualizó optimistamente
      } else {
        toast({
          title: "Error",
          description: "Ocurrió un error al guardar el usuario.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      // Si estamos offline, actualizar la UI optimistamente
      if (!navigator.onLine) {
        updatePendingRequestsCount(true)

        // Eliminar usuario de la UI
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id))

        toast({
          title: "Eliminación pendiente",
          description: "El usuario será eliminado cuando se restaure la conexión.",
        })
      }

      const response = await fetch(
        `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios/${selectedUser.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )

      if (response.ok) {
        // Si estamos online, la solicitud se completó correctamente
        if (navigator.onLine) {
          fetchData() // Actualizar datos desde el servidor
        }

        setShowDeleteModal(false)

        toast({
          title: "Éxito",
          description: "Usuario eliminado con éxito",
        })
      } else {
        console.error("Error al eliminar el usuario.")
        toast({
          title: "Error",
          description: "No se pudo eliminar el usuario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar el usuario:", error)

      // Si hay un error de red, probablemente estamos offline
      // El service worker debería haber puesto la solicitud en cola
      if (!navigator.onLine) {
        setShowDeleteModal(false)
        // No hacemos nada más aquí, ya que la UI ya se actualizó optimistamente
      } else {
        toast({
          title: "Error",
          description: "Ocurrió un error al eliminar el usuario.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFilterChange = (value) => {
    setSelectedFilters((prev) => (prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]))
  }

  const applyFilters = () => {
    setShowFilterMenu(false)
    fetchData()
  }

  const filteredUsers = users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.rol.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        {!isOnline && (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
            <WifiOff className="h-3 w-3" /> Modo Offline
          </Badge>
        )}
      </div>

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

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button onClick={() => setShowFilterMenu(!showFilterMenu)}>
            <Filter className="mr-2 h-4 w-4" /> Filtros
          </Button>
          <Input
            type="text"
            placeholder="Buscar usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Button onClick={handleCreateUser} className="bg-green-700 hover:bg-green-800 text-white">
          <Plus className="mr-2 h-4 w-4" /> Crear Usuario
        </Button>
      </div>

      {showFilterMenu && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="font-semibold mb-2">Filtrar por Rol</h2>
          <div className="space-y-2">
            {["admin", "propietario", "conductor"].map((rol) => (
              <div key={rol} className="flex items-center">
                <Checkbox
                  id={rol}
                  checked={selectedFilters.includes(rol)}
                  onCheckedChange={() => handleFilterChange(rol)}
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

      <Card className="mb-6 border border-gray-300 shadow-sm">
        <CardHeader>
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-gray-200 border-b-2 border-gray-300 shadow-md">
              <TableRow>
                <TableHead className="font-bold text-gray-700 border-r border-gray-300">Nombre</TableHead>
                <TableHead className="font-bold text-gray-700 border-r border-gray-300">Username</TableHead>
                <TableHead className="font-bold text-gray-700 border-r border-gray-300">Rol</TableHead>
                <TableHead className="font-bold text-gray-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user) => (
                <TableRow key={user.id} className={user._isPending ? "bg-yellow-50" : ""}>
                  <TableCell>
                    {user.nombre}
                    {user._isPending && (
                      <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.rol}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewUser(user)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user)}
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
        </CardContent>
      </Card>

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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Editar Usuario" : viewMode ? "Detalles del Usuario" : "Crear Usuario"}
            </DialogTitle>
          </DialogHeader>
          {viewMode ? (
            <div className="grid gap-4 py-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <span className="font-medium text-right">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                  <span className="col-span-3">
                    {key === "propietarioId" && value
                      ? propietarios.find((p) => p.id === value)?.nombre || value
                      : value || "N/A"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSaveUser}>
              <div className="grid gap-4 py-4">
                {Object.keys(formData).map((key) => (
                  <div key={key} className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor={key} className="text-right">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </label>
                    {key === "rol" ? (
                      <Select value={formData[key]} onValueChange={(value) => handleInputChange(key, value)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="propietario">Propietario</SelectItem>
                          <SelectItem value="conductor">Conductor</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : key === "propietarioId" && formData.rol === "conductor" ? (
                      <Select value={formData[key]} onValueChange={(value) => handleInputChange(key, value)}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Seleccione un propietario" />
                        </SelectTrigger>
                        <SelectContent>
                          {propietarios.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id}>
                              {prop.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={key}
                        type={key === "password" ? "password" : "text"}
                        value={formData[key]}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        className="col-span-3"
                      />
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="submit">{editMode ? "Guardar Cambios" : "Crear Usuario"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>¿Está seguro que desea eliminar al usuario "{selectedUser?.nombre}"?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

