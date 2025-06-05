"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  WifiOff,
} from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/components/ui/card"
import { Input } from "@/components/components/ui/input"
import { Label } from "@/components/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/components/ui/dialog"
import { Badge } from "@/components/components/ui/badge"
import { Checkbox } from "@/components/components/ui/checkbox"
import { Textarea } from "@/components/components/ui/textarea"
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

// URL de la API
const API_URL = "https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev"

export default function PreciosOffline() {
  const router = useRouter()
  const [precios, setPrecios] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notification, setNotification] = useState(null)

  // Estados para formularios
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState("create") // create, edit, view
  const [selectedPrecio, setSelectedPrecio] = useState(null)

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState("")
  const [includeInactive, setIncludeInactive] = useState(false)

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados para PWA
  const { isOnline, updatePendingSyncCount } = usePWAFeatures()
  const [usingCachedData, setUsingCachedData] = useState(false)

  // Estados para formulario
  const [formData, setFormData] = useState({
    valor: "",
    descripcion: "",
    activo: true,
  })

  // Cargar datos iniciales
  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      // Inicializar background sync
      initializeBackgroundSync()
      fetchPrecios()
      fetchUsuarios()
    }
  }, [includeInactive, router])

  // Mostrar notificación
  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // Obtener precios
  const fetchPrecios = async () => {
    try {
      setLoading(true)

      if (!isOnline) {
        // Cargar desde IndexedDB cuando está offline
        const cachedData = await getFromIndexedDB("precios", "all")
        if (cachedData && cachedData.data) {
          setPrecios(cachedData.data)
          setUsingCachedData(true)
          setError("")
          return
        }
      }

      const response = await fetch(`${API_URL}/precios?includeInactive=${includeInactive}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPrecios(data)
        setError("")
        setUsingCachedData(false)

        // Guardar en caché
        await saveToIndexedDB("precios", { id: "all", data, timestamp: Date.now() })
      } else if (response.status === 404) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      } else {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error:", error)
      setError(`Error al cargar los precios: ${error.message}`)

      // Cargar desde caché en caso de error
      try {
        const cachedData = await getFromIndexedDB("precios", "all")
        if (cachedData && cachedData.data) {
          setPrecios(cachedData.data)
          setUsingCachedData(true)
          toast({
            title: "Usando datos en caché",
            description: "Estás viendo datos almacenados localmente.",
          })
        }
      } catch (cacheError) {
        console.error("Error loading from cache:", cacheError)
      }
    } finally {
      setLoading(false)
    }
  }

  // Obtener usuarios
  const fetchUsuarios = async () => {
    try {
      if (!isOnline) {
        // Cargar desde IndexedDB cuando está offline
        const cachedData = await getFromIndexedDB("cache", "usuarios")
        if (cachedData) {
          setUsuarios(cachedData.data)
          return
        }
      }

      const response = await fetch(`${API_URL}/usuarios`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)

        // Guardar en caché
        await saveToIndexedDB("cache", { id: "usuarios", data, timestamp: Date.now() })
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error)

      // Cargar desde caché en caso de error
      const cachedData = await getFromIndexedDB("cache", "usuarios")
      if (cachedData) {
        setUsuarios(cachedData.data)
      }
    }
  }

  // Filtrar precios
  const filteredPrecios = precios.filter((precio) => {
    const matchesSearch =
      precio.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      precio.valor?.toString().includes(searchQuery)

    return matchesSearch
  })

  // Paginación
  const totalPages = Math.ceil(filteredPrecios.length / itemsPerPage)
  const paginatedPrecios = filteredPrecios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  // Abrir formulario
  const openForm = (mode, precio = null) => {
    setFormMode(mode)
    setSelectedPrecio(precio)

    if (mode === "create") {
      setFormData({
        valor: "",
        descripcion: "",
        activo: true,
      })
    } else if (precio) {
      setFormData({
        valor: precio.valor || "",
        descripcion: precio.descripcion || "",
        activo: precio.activo !== undefined ? precio.activo : true,
      })
    }

    setShowForm(true)
  }

  // Cerrar formulario
  const closeForm = () => {
    setShowForm(false)
    setSelectedPrecio(null)
    setFormData({
      valor: "",
      descripcion: "",
      activo: true,
    })
  }

  // Guardar precio
  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userId = localStorage.getItem("idUser")

      if (!userId) {
        throw new Error("Usuario no identificado")
      }

      const body = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
      }

      if (!isOnline) {
        // Registrar para sincronización offline
        const url = formMode === "create" ? `${API_URL}/precios` : `${API_URL}/precios/${selectedPrecio.id}`
        const method = formMode === "create" ? "POST" : "PUT"

        if (formMode === "create") {
          body.usuarioCreacionId = userId
        } else {
          body.usuarioModificacionId = userId
        }

        await registerSyncRequest(url, method, body)

        // Actualizar estado local
        if (formMode === "create") {
          const newPrecio = {
            ...body,
            id: `temp_${Date.now()}`,
            fechaCreacion: new Date().toISOString(),
            usuarioCreacion: usuarios.find((u) => u.id.toString() === userId.toString()),
            _isPending: true,
            _isNew: true,
          }
          setPrecios([newPrecio, ...precios])
        } else {
          setPrecios((prevPrecios) =>
            prevPrecios.map((p) => (p.id === selectedPrecio.id ? { ...p, ...body, _isPending: true } : p)),
          )
        }

        updatePendingSyncCount(true)
        closeForm()
        showNotification(
          "success",
          `Precio ${formMode === "create" ? "creado" : "actualizado"} (pendiente de sincronización)`,
        )
        return
      }

      let response
      if (formMode === "create") {
        body.usuarioCreacionId = userId
        response = await fetch(`${API_URL}/precios`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        })
      } else if (formMode === "edit") {
        body.usuarioModificacionId = userId
        response = await fetch(`${API_URL}/precios/${selectedPrecio.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(body),
        })
      }

      if (response.ok) {
        await fetchPrecios()
        closeForm()
        showNotification("success", `Precio ${formMode === "create" ? "creado" : "actualizado"} exitosamente`)
      } else {
        const errorText = await response.text()
        console.error("Error response:", errorText)
        throw new Error(`Error ${response.status}: No se pudo guardar el precio`)
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("error", error.message || "Error al guardar el precio")
    } finally {
      setLoading(false)
    }
  }

  // Eliminar precio
  const handleDelete = async (precio) => {
    if (!window.confirm("¿Está seguro de que desea desactivar este precio?")) {
      return
    }

    setLoading(true)
    try {
      const userId = localStorage.getItem("idUser")

      if (!isOnline) {
        // Registrar para sincronización offline
        await registerSyncRequest(`${API_URL}/precios/${precio.id}`, "DELETE", { usuarioModificacionId: userId })

        // Actualizar estado local
        setPrecios((prevPrecios) =>
          prevPrecios.map((p) => (p.id === precio.id ? { ...p, activo: false, _isPendingDelete: true } : p)),
        )

        updatePendingSyncCount(true)
        showNotification("success", "Precio desactivado (pendiente de sincronización)")
        return
      }

      const response = await fetch(`${API_URL}/precios/${precio.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ usuarioModificacionId: userId }),
      })

      if (response.ok) {
        await fetchPrecios()
        showNotification("success", "Precio desactivado exitosamente")
      } else {
        throw new Error(`Error ${response.status}: No se pudo desactivar el precio`)
      }
    } catch (error) {
      console.error("Error:", error)
      showNotification("error", "Error al desactivar el precio")
    } finally {
      setLoading(false)
    }
  }

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(amount)
  }

  // Formatear fecha
  const formatDateTime = (dateString) => {
    if (!dateString) return ""
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return ""
    }
  }

  // Exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    const currentDate = format(new Date(), "dd/MM/yyyy", { locale: es })

    // Título
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("GESTIÓN DE PRECIOS", pageWidth / 2, margin + 10, { align: "center" })

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Fecha de generación: ${currentDate}`, margin, margin + 25)

    // Tabla
    autoTable(doc, {
      startY: margin + 35,
      head: [["Precio", "Estado", "Descripción", "Fecha Creación"]],
      body: filteredPrecios.map((precio) => [
        formatCurrency(precio.valor),
        precio.activo ? "Activo" : "Inactivo",
        precio.descripcion || "",
        formatDateTime(precio.fechaCreacion),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      margin: { left: margin, right: margin },
    })

    doc.save(`precios_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  return (
    <NetworkStatusHandler onOffline={() => console.log("Modo offline activado")} onOnline={() => fetchPrecios()}>
      <div className="min-h-screen bg-gray-100">
        <Toaster />

        {/* Notificación emergente */}
        {notification && (
          <div className="fixed top-20 right-4 z-50 animate-fade-in">
            <div
              className={`rounded-lg shadow-lg p-4 flex items-center ${
                notification.type === "success"
                  ? "bg-green-100 border-l-4 border-green-500"
                  : "bg-red-100 border-l-4 border-red-500"
              }`}
            >
              {notification.type === "success" ? (
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
              )}
              <span className="text-black font-medium">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-4 text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-center">Gestión de Precios de Carga de Agua</h1>
            <OfflineIndicator />
          </div>

          <InstallPrompt />
          <SyncManagerEnhanced onSync={fetchPrecios} />
          <CacheIndicator />
          <BackgroundSyncEnhanced
            syncTag="precios-sync"
            onSyncRegistered={() => console.log("Sync registrado para precios")}
            onSyncError={(error) => console.error("Error en Background Sync:", error)}
          />

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Indicador de datos en caché */}
          {usingCachedData && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Estás viendo datos almacenados localmente. Algunos cambios podrían no estar sincronizados.
            </div>
          )}

          {/* Controles superiores */}
          <Card className="mb-6 shadow-md border-2 border-gray-300 rounded-lg">
            <CardHeader className="bg-blue-900 text-white">
              <CardTitle className="text-white flex items-center">
                <Filter className="mr-2 h-5 w-5" />
                Filtros y Acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* Búsqueda */}
                <div className="space-y-2">
                  <Label>Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por precio o descripción..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Incluir inactivos */}
                <div className="space-y-2">
                  <Label>Opciones</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="includeInactive" checked={includeInactive} onCheckedChange={setIncludeInactive} />
                    <Label htmlFor="includeInactive" className="text-sm">
                      Incluir inactivos
                    </Label>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-2">
                  <Button onClick={() => openForm("create")} className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Precio
                  </Button>
                  <Button onClick={exportToPDF} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de precios */}
          <Card className="border-2 border-gray-300 rounded-lg">
            <CardHeader className="bg-gray-700 text-white">
              <CardTitle className="text-white">Lista de Precios</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#1E3A8A] mr-4" />
                  <span className="text-black">Cargando precios...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-700 text-white">
                    <TableRow>
                      <TableHead className="font-bold text-white">Precio</TableHead>
                      <TableHead className="font-bold text-white">Estado</TableHead>
                      <TableHead className="font-bold text-white">Descripción</TableHead>
                      <TableHead className="font-bold text-white">Fecha Creación</TableHead>
                      <TableHead className="font-bold text-white">Creado Por</TableHead>
                      <TableHead className="font-bold text-white">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPrecios.length > 0 ? (
                      paginatedPrecios.map((precio) => (
                        <TableRow
                          key={precio.id}
                          className={`hover:bg-gray-50 ${
                            precio._isPending || precio._isPendingDelete || precio._isNew
                              ? "bg-yellow-50 border-l-4 border-yellow-400"
                              : ""
                          }`}
                        >
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(precio.valor)}
                            {(precio._isPending || precio._isPendingDelete || precio._isNew) && (
                              <Badge
                                variant="outline"
                                className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
                              >
                                {precio._isPendingDelete ? "Eliminar" : precio._isNew ? "Nuevo" : "Pendiente"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={precio.activo ? "default" : "secondary"}>
                              {precio.activo ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{precio.descripcion || "Sin descripción"}</TableCell>
                          <TableCell>{formatDateTime(precio.fechaCreacion)}</TableCell>
                          <TableCell>{precio.usuarioCreacion?.nombre || "N/A"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openForm("view", precio)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openForm("edit", precio)}
                                className="text-green-600 hover:text-green-800"
                                disabled={precio._isPendingDelete}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {precio.activo && !precio._isPendingDelete && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(precio)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No se encontraron precios
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {Math.min(filteredPrecios.length, (currentPage - 1) * itemsPerPage + 1)}-
                {Math.min(currentPage * itemsPerPage, filteredPrecios.length)} de {filteredPrecios.length} registros
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Página {currentPage} de {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Modal de formulario */}
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="max-w-md" aria-describedby="form-dialog-description">
              <DialogHeader>
                <DialogTitle>
                  {formMode === "create" ? "Nuevo Precio" : formMode === "edit" ? "Editar Precio" : "Ver Precio"}
                </DialogTitle>
              </DialogHeader>
              <div id="form-dialog-description">
                <form onSubmit={handleSave} className="space-y-4">
                  {!isOnline && formMode !== "view" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <WifiOff className="h-4 w-4" />
                        <span className="text-sm">Sin conexión - Se guardará para sincronizar después</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="valor">Precio (Bs)</Label>
                    <Input
                      id="valor"
                      name="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                      disabled={formMode === "view"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleInputChange}
                      placeholder="Descripción opcional del precio..."
                      rows={3}
                      disabled={formMode === "view"}
                    />
                  </div>

                  {formMode === "edit" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="activo"
                        name="activo"
                        checked={formData.activo}
                        onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                      />
                      <Label htmlFor="activo">Precio activo</Label>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={closeForm}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    {formMode !== "view" && (
                      <Button type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {formMode === "create" ? "Crear" : "Actualizar"}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </NetworkStatusHandler>
  )
}
