"use client"

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
  AlertCircle,
  EyeOff,
  AlertTriangle,
  User,
  CreditCard,
} from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Label } from "@/components/components/ui/label"
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
import { Checkbox } from "@/components/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Badge } from "@/components/components/ui/badge"
import { Alert, AlertDescription } from "@/components/components/ui/alert"
import { Toaster } from "@/components/components/ui/toaster"
import { toast } from "@/components/hooks/use-toast"

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

export default function UserManagementEnhanced() {
  const [users, setUsers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(8)
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
    propietarioId: null,
    numeroTarjetaRFID: "",
    bloqueado: false,
    motivoBloqueo: "",
  })
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState(false)
  const [propietarios, setPropietarios] = useState([])
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()
  const { isOnline, updatePendingSyncCount } = usePWAFeatures()

  // Función para validar el formulario en el cliente
  const validateForm = () => {
    const errors = {}

    if (!formData.nombre?.trim()) {
      errors.nombre = ["El nombre es requerido"]
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = ["El nombre debe tener al menos 2 caracteres"]
    }

    if (!formData.username?.trim()) {
      errors.username = ["El username es requerido"]
    } else if (formData.username.trim().length < 3) {
      errors.username = ["El username debe tener al menos 3 caracteres"]
    }

    if (!formData.correo?.trim()) {
      errors.correo = ["El correo es requerido"]
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.correo.trim())) {
        errors.correo = ["Ingrese un correo electrónico válido"]
      }
    }

    if (!formData.ci?.toString().trim()) {
      errors.ci = ["La cédula es requerida"]
    } else if (!/^\d+$/.test(formData.ci.toString().trim())) {
      errors.ci = ["La cédula solo debe contener números"]
    }

    if (!editMode || formData.password?.trim()) {
      if (!editMode && !formData.password?.trim()) {
        errors.password = ["La contraseña es requerida"]
      } else if (formData.password?.trim() && formData.password.trim().length < 8) {
        errors.password = ["La contraseña debe tener al menos 8 caracteres"]
      }
    }

    if (!formData.rol) {
      errors.rol = ["El rol es requerido"]
    }

    if (formData.rol === "conductor" && !formData.propietarioId) {
      errors.propietarioId = ["Debe seleccionar un propietario para el conductor"]
    }

    return errors
  }

  const getFieldError = (fieldName) => {
    return formErrors[fieldName]?.[0]
  }

  const hasFieldError = (fieldName) => {
    return Boolean(formErrors[fieldName]?.length)
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
      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (response.ok) {
        let jsonData = await response.json()
        jsonData.sort((a, b) => {
          const rolesOrden = { admin: 1, propietario: 2, conductor: 3 }
          return rolesOrden[a.rol] - rolesOrden[b.rol]
        })

        // Guardar en caché local y IndexedDB
        localStorage.setItem("cachedUsers", JSON.stringify(jsonData))
        await saveToIndexedDB("users", { id: "all", data: jsonData, timestamp: Date.now() })

        if (selectedFilters.length > 0) {
          jsonData = jsonData.filter((user) => selectedFilters.includes(user.rol))
        }

        setUsers(jsonData)
        localStorage.setItem("usingCachedData", "false")
      } else if (response.status === 401) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)

      // Intentar cargar desde IndexedDB primero
      try {
        const cachedData = await getFromIndexedDB("users", "all")
        if (cachedData && cachedData.data) {
          let jsonData = cachedData.data
          if (selectedFilters.length > 0) {
            jsonData = jsonData.filter((user) => selectedFilters.includes(user.rol))
          }
          setUsers(jsonData)
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
        if (selectedFilters.length > 0) {
          jsonData = jsonData.filter((user) => selectedFilters.includes(user.rol))
        }
        setUsers(jsonData)
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

  const fetchPropietarios = async () => {
    try {
      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/propietarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const jsonData = await response.json()
        setPropietarios(jsonData)
        localStorage.setItem("cachedPropietarios", JSON.stringify(jsonData))
        await saveToIndexedDB("propietarios", { id: "all", data: jsonData, timestamp: Date.now() })
      } else {
        console.error("Error al obtener propietarios desde el servidor.")
      }
    } catch (error) {
      console.error("Error al obtener propietarios:", error)

      // Intentar cargar desde IndexedDB
      try {
        const cachedData = await getFromIndexedDB("propietarios", "all")
        if (cachedData && cachedData.data) {
          setPropietarios(cachedData.data)
          return
        }
      } catch (indexedDBError) {
        console.error("Error al cargar propietarios desde IndexedDB:", indexedDBError)
      }

      // Fallback a localStorage
      const cachedData = localStorage.getItem("cachedPropietarios")
      if (cachedData) {
        setPropietarios(JSON.parse(cachedData))
      }
    }
  }

  const handleInputChange = (key, value) => {
    if (formErrors[key]) {
      setFormErrors((prev) => ({
        ...prev,
        [key]: undefined,
      }))
    }

    if (key === "propietarioId" && (value === "" || value === undefined)) {
      setFormData((prev) => ({ ...prev, [key]: null }))
    } else {
      setFormData((prev) => ({ ...prev, [key]: value }))
    }
  }

  const handleCreateUser = () => {
    setSelectedUser(null)
    setFormData({
      nombre: "",
      username: "",
      correo: "",
      rol: "",
      ci: "",
      password: "",
      propietarioId: null,
      numeroTarjetaRFID: "",
      bloqueado: false,
      motivoBloqueo: "",
    })
    setFormErrors({})
    setShowModal(true)
    setEditMode(false)
    setViewMode(false)
  }

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setFormData({ ...user })
    setFormErrors({})
    setShowModal(true)
    setEditMode(false)
    setViewMode(true)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setFormData({ ...user, password: "" })
    setFormErrors({})
    setShowModal(true)
    setEditMode(true)
    setViewMode(false)
  }

  const handleDeleteUser = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleSaveUser = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormErrors({})

    const clientErrors = validateForm()
    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors)
      setIsSubmitting(false)
      return
    }

    const dataToSend = {
      ...formData,
      propietarioId:
        formData.rol === "conductor"
          ? formData.propietarioId
            ? Number.parseInt(formData.propietarioId.toString(), 10)
            : null
          : null,
    }

    if (editMode) {
      if (!dataToSend.password) {
        delete dataToSend.password
      }
      delete dataToSend.bloqueado
      delete dataToSend.motivoBloqueo
      delete dataToSend.fechaBloqueo
    }

    try {
      const url = editMode
        ? `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/${selectedUser.id}`
        : "https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev"

      if (!navigator.onLine) {
        // Registrar para sincronización en segundo plano
        await registerSyncRequest(url, editMode ? "PUT" : "POST", dataToSend)
        updatePendingSyncCount(true)

        if (editMode) {
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === selectedUser.id ? { ...dataToSend, id: selectedUser.id, _isPending: true } : user,
            ),
          )
        } else {
          const tempId = `temp_${Date.now()}`
          setUsers((prevUsers) => [...prevUsers, { ...dataToSend, id: tempId, _isPending: true }])
        }

        setShowModal(false)
        toast({
          title: "Guardado pendiente",
          description: `El usuario será ${editMode ? "actualizado" : "creado"} cuando se restaure la conexión.`,
        })
        return
      }

      const response = await fetch(url, {
        method: editMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(dataToSend),
      })

      const responseData = await response.json()

      if (response.ok) {
        fetchData()
        setShowModal(false)
        setFormErrors({})

        toast({
          title: "Éxito",
          description:
            responseData.message || (editMode ? "Usuario actualizado con éxito" : "Usuario creado con éxito"),
        })
      } else {
        if (responseData.errors) {
          setFormErrors(responseData.errors)
        } else {
          setFormErrors({
            general: [responseData.message || "Error al guardar el usuario"],
          })
        }

        toast({
          title: "Error de validación",
          description: responseData.message || "Por favor, corrija los errores en el formulario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al guardar el usuario:", error)
      setFormErrors({
        general: ["Error de conexión. Por favor, intente nuevamente."],
      })

      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el usuario.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      if (!navigator.onLine) {
        // Registrar para sincronización en segundo plano
        await registerSyncRequest(`https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios/${selectedUser.id}`, "DELETE", {})
        updatePendingSyncCount(true)
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== selectedUser.id))

        setShowDeleteModal(false)
        toast({
          title: "Eliminación pendiente",
          description: "El usuario será eliminado cuando se restaure la conexión.",
        })
        return
      }

      const response = await fetch(`https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/${selectedUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (response.ok) {
        fetchData()
        setShowDeleteModal(false)

        toast({
          title: "Éxito",
          description: "Usuario eliminado con éxito",
        })
      } else {
        const errorData = await response.json()
        console.error("Error al eliminar el usuario:", errorData)
        toast({
          title: "Error",
          description: errorData.message || "No se pudo eliminar el usuario.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al eliminar el usuario:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el usuario.",
        variant: "destructive",
      })
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
    <NetworkStatusHandler onOffline={() => console.log("Modo offline activado")} onOnline={() => fetchData()}>
      <ResponsiveContainer className="max-w-6xl mx-auto mt-12">
        <Toaster />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
          <h1 className="text-xl font-bold">Gestión de Usuarios</h1>
          <OfflineIndicator />
        </div>

        <InstallPrompt />
        <SyncManager onSync={fetchData} />
        <CacheIndicator />
        <BackgroundSync syncTag="user-sync" onSyncRegistered={() => console.log("Sync registrado para usuarios")} />

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
          <Button
            size="sm"
            onClick={handleCreateUser}
            className="bg-green-700 hover:bg-green-800 text-white w-full sm:w-auto"
          >
            <Plus className="mr-1 h-3 w-3" /> Crear
          </Button>
        </div>

        {showFilterMenu && (
          <div className="bg-white p-3 rounded-lg shadow-md mb-4 border text-sm">
            <h2 className="font-semibold mb-2">Filtrar por Rol</h2>
            <div className="space-y-1">
              {["admin", "propietario", "conductor"].map((rol) => (
                <div key={rol} className="flex items-center">
                  <Checkbox
                    id={rol}
                    checked={selectedFilters.includes(rol)}
                    onCheckedChange={() => handleFilterChange(rol)}
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
                  {currentUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className={`${
                        user._isPending
                          ? "bg-yellow-50"
                          : user.bloqueado
                            ? "bg-red-50"
                            : currentUsers.indexOf(user) % 2 === 0
                              ? "bg-white"
                              : "bg-gray-50"
                      } hover:bg-gray-100 transition-colors text-sm`}
                    >
                      <TableCell className="py-2">
                        <div className="max-w-[120px] truncate">{user.nombre}</div>
                        {user._isPending && (
                          <Badge variant="outline" className="ml-1 bg-yellow-100 text-yellow-800 text-xs">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="max-w-[100px] truncate">{user.username}</div>
                      </TableCell>
                      <TableCell className="py-2 hidden sm:table-cell">{user.rol}</TableCell>
                      <TableCell className="py-2 hidden sm:table-cell">
                        {user.bloqueado ? (
                          <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">
                            Bloqueado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                            Activo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(user)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200 px-2 py-1 text-xs w-full sm:w-auto"
                          >
                            <Eye className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200 px-2 py-1 text-xs w-full sm:w-auto"
                          >
                            <Pencil className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user)}
                            className="bg-red-100 hover:bg-red-200 text-red-800 border-red-200 px-2 py-1 text-xs w-full sm:w-auto"
                          >
                            <Trash2 className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" aria-describedby="dialog-description">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {editMode ? "Editar Usuario" : viewMode ? "Detalles del Usuario" : "Crear Usuario"}
              </DialogTitle>
            </DialogHeader>
            {viewMode ? (
              <div className="space-y-6" id="dialog-description">
                {/* Header with user avatar and basic info */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {formData.nombre?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{formData.nombre || "N/A"}</h3>
                      <p className="text-gray-600">@{formData.username || "N/A"}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`${
                            formData.rol === "admin"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : formData.rol === "propietario"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {formData.rol?.charAt(0).toUpperCase() + formData.rol?.slice(1) || "N/A"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${
                            formData.bloqueado
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {formData.bloqueado ? "Bloqueado" : "Activo"}
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
                        <div className="font-medium text-gray-900">{formData.nombre || "No disponible"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Nombre de Usuario</Label>
                        <div className="font-medium text-gray-900">@{formData.username || "No disponible"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Cédula de Identidad</Label>
                        <div className="font-mono text-gray-900">{formData.ci || "No disponible"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Correo Electrónico</Label>
                        <div className="text-blue-600">{formData.correo || "No disponible"}</div>
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
                        <div className="font-mono text-gray-500">#{formData.id || "N/A"}</div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Rol del Sistema</Label>
                        <Badge
                          variant="outline"
                          className={`${
                            formData.rol === "admin"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : formData.rol === "propietario"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {formData.rol?.charAt(0).toUpperCase() + formData.rol?.slice(1) || "No asignado"}
                        </Badge>
                      </div>

                      {formData.numeroTarjetaRFID && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">Tarjeta RFID</Label>
                          <div className="font-mono bg-gray-100 px-3 py-2 rounded border">
                            {formData.numeroTarjetaRFID}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Estado de la Cuenta</Label>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant="outline"
                            className={`${
                              formData.bloqueado
                                ? "bg-red-100 text-red-800 border-red-200"
                                : "bg-green-100 text-green-800 border-green-200"
                            }`}
                          >
                            {formData.bloqueado ? "Cuenta Bloqueada" : "Cuenta Activa"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Propietario Information (for conductors) */}
                {formData.rol === "conductor" && formData.propietarioId && (
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
                        <div className="font-medium text-gray-900">
                          {propietarios.find((p) => p.id === formData.propietarioId)?.nombre ||
                            `ID: ${formData.propietarioId}`}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Block Information (if blocked) */}
                {formData.bloqueado && (
                  <Card className="border-red-200">
                    <CardHeader className="bg-red-50">
                      <CardTitle className="flex items-center text-red-800">
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        Información de Bloqueo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {formData.motivoBloqueo && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Motivo del Bloqueo</Label>
                            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
                              {formData.motivoBloqueo}
                            </div>
                          </div>
                        )}

                        {formData.fechaBloqueo && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">Fecha de Bloqueo</Label>
                            <div className="font-medium text-gray-900">
                              {new Date(formData.fechaBloqueo).toLocaleString("es-ES", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveUser} className="space-y-3">
                <div id="dialog-description">
                  {formErrors.general && formErrors.general.length > 0 && (
                    <Alert variant="destructive" className="mb-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {formErrors.general.map((error, index) => (
                          <div key={index}>{error}</div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-3 py-3">
                    {/* Nombre */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                      <Label htmlFor="nombre" className="text-left sm:text-right text-sm">
                        Nombre <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-1 sm:col-span-2">
                        <Input
                          id="nombre"
                          type="text"
                          value={formData.nombre || ""}
                          onChange={(e) => handleInputChange("nombre", e.target.value)}
                          className={`text-sm ${hasFieldError("nombre") ? "border-red-500" : ""}`}
                          placeholder="Nombre completo"
                        />
                        {hasFieldError("nombre") && (
                          <p className="text-red-500 text-xs mt-1">{getFieldError("nombre")}</p>
                        )}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                      <Label htmlFor="username" className="text-left sm:text-right text-sm">
                        Username <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-1 sm:col-span-2">
                        <Input
                          id="username"
                          type="text"
                          value={formData.username || ""}
                          onChange={(e) => handleInputChange("username", e.target.value)}
                          className={`text-sm ${hasFieldError("username") ? "border-red-500" : ""}`}
                          placeholder="Nombre de usuario"
                        />
                        {hasFieldError("username") && (
                          <p className="text-red-500 text-xs mt-1">{getFieldError("username")}</p>
                        )}
                      </div>
                    </div>

                    {/* Correo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                      <Label htmlFor="correo" className="text-left sm:text-right text-sm">
                        Correo <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-1 sm:col-span-2">
                        <Input
                          id="correo"
                          type="email"
                          value={formData.correo || ""}
                          onChange={(e) => handleInputChange("correo", e.target.value)}
                          className={`text-sm ${hasFieldError("correo") ? "border-red-500" : ""}`}
                          placeholder="ejemplo@correo.com"
                        />
                        {hasFieldError("correo") && (
                          <p className="text-red-500 text-xs mt-1">{getFieldError("correo")}</p>
                        )}
                      </div>
                    </div>

                    {/* CI */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                      <Label htmlFor="ci" className="text-left sm:text-right text-sm">
                        Cédula <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-1 sm:col-span-2">
                        <Input
                          id="ci"
                          type="text"
                          value={formData.ci || ""}
                          onChange={(e) => handleInputChange("ci", e.target.value)}
                          className={`text-sm ${hasFieldError("ci") ? "border-red-500" : ""}`}
                          placeholder="Cédula de identidad"
                        />
                        {hasFieldError("ci") && <p className="text-red-500 text-xs mt-1">{getFieldError("ci")}</p>}
                      </div>
                    </div>

                    {/* Password */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                      <Label htmlFor="password" className="text-left sm:text-right text-sm">
                        Contraseña {!editMode && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="col-span-1 sm:col-span-2">
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password || ""}
                            onChange={(e) => handleInputChange("password", e.target.value)}
                            className={`text-sm pr-8 ${hasFieldError("password") ? "border-red-500" : ""}`}
                            placeholder={editMode ? "Dejar vacío para mantener" : "Contraseña"}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                        {hasFieldError("password") && (
                          <div className="text-red-500 text-xs mt-1">
                            {formErrors.password?.map((error, index) => (
                              <div key={index}>• {error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rol */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                      <Label htmlFor="rol" className="text-left sm:text-right text-sm">
                        Rol <span className="text-red-500">*</span>
                      </Label>
                      <div className="col-span-1 sm:col-span-2">
                        <Select value={formData.rol || ""} onValueChange={(value) => handleInputChange("rol", value)}>
                          <SelectTrigger className={`text-sm ${hasFieldError("rol") ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Seleccione rol" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="propietario">Propietario</SelectItem>
                            <SelectItem value="conductor">Conductor</SelectItem>
                          </SelectContent>
                        </Select>
                        {hasFieldError("rol") && <p className="text-red-500 text-xs mt-1">{getFieldError("rol")}</p>}
                      </div>
                    </div>

                    {/* Propietario (solo para conductores) */}
                    {formData.rol === "conductor" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                        <Label htmlFor="propietarioId" className="text-left sm:text-right text-sm">
                          Propietario <span className="text-red-500">*</span>
                        </Label>
                        <div className="col-span-1 sm:col-span-2">
                          <Select
                            value={formData.propietarioId?.toString() || ""}
                            onValueChange={(value) => handleInputChange("propietarioId", Number.parseInt(value))}
                          >
                            <SelectTrigger
                              className={`text-sm ${hasFieldError("propietarioId") ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Seleccione propietario" />
                            </SelectTrigger>
                            <SelectContent>
                              {propietarios.map((prop) => (
                                <SelectItem key={prop.id} value={prop.id.toString()}>
                                  {prop.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {hasFieldError("propietarioId") && (
                            <p className="text-red-500 text-xs mt-1">{getFieldError("propietarioId")}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tarjeta RFID */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
                      <Label htmlFor="numeroTarjetaRFID" className="text-left sm:text-right text-sm">
                        Tarjeta RFID
                      </Label>
                      <div className="col-span-1 sm:col-span-2">
                        <Input
                          id="numeroTarjetaRFID"
                          type="text"
                          value={formData.numeroTarjetaRFID || ""}
                          onChange={(e) => handleInputChange("numeroTarjetaRFID", e.target.value)}
                          className={`text-sm ${hasFieldError("numeroTarjetaRFID") ? "border-red-500" : ""}`}
                          placeholder="Número RFID (opcional)"
                        />
                        {hasFieldError("numeroTarjetaRFID") && (
                          <p className="text-red-500 text-xs mt-1">{getFieldError("numeroTarjetaRFID")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-sm w-full sm:w-auto"
                  >
                    {isSubmitting ? "Guardando..." : editMode ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md" aria-describedby="delete-dialog-description">
            <DialogHeader>
              <DialogTitle className="text-lg">Confirmar Eliminación</DialogTitle>
              <DialogDescription id="delete-dialog-description" className="text-sm">
                ¿Está seguro que desea eliminar al usuario "{selectedUser?.nombre}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDeleteConfirm} className="w-full sm:w-auto">
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ResponsiveContainer>
    </NetworkStatusHandler>
  )
}
