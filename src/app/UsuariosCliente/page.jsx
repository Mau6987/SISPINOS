"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Eye, FileText, CreditCard, Filter } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"
import { Checkbox } from "../../components/components/ui/checkbox"
import { Toaster } from "../../components/components/ui/toaster"
import { toast } from "../../components/hooks/use-toast"

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

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

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
      const response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
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

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-8 text-center">Gestión de Clientes</h1>

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
          <TableHeader className="bg-gray-200">
            <TableRow>
              <TableHead className="text-gray-800 font-semibold">Nombre</TableHead>
              <TableHead className="text-gray-800 font-semibold">Username</TableHead>
              <TableHead className="text-gray-800 font-semibold">Rol</TableHead>
              <TableHead className="text-gray-800 font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.nombre}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.rol}</TableCell>
                  <TableCell>
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
                <TableCell colSpan={4} className="text-center py-4">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-700">Detalles del Cliente</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              {Object.entries(selectedUser).map(([key, value]) => (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <span className="font-medium text-right">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                  <span className="col-span-3">{value || "N/A"}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
