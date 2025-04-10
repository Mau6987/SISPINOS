"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Filter, Calendar, DollarSign, CreditCard } from "lucide-react"
import Swal from "sweetalert2"
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/components/ui/card"
import { Badge } from "../../components/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/components/ui/avatar"
import { Label } from "../../components/components/ui/label"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/components/ui/tabs"
import { Checkbox } from "../../components/components/ui/checkbox"
const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return windowWidth
}

export default function UsuarioDetalles() {
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const router = useRouter()

  // Estados para el usuario
  const [usuarios, setUsuarios] = useState([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [mostrarSelect, setMostrarSelect] = useState(false) // Cambiado a false por defecto
  const [conductores, setConductores] = useState([])
  const [conductorSeleccionado, setConductorSeleccionado] = useState(null)
  const [activeTab, setActiveTab] = useState("propietario")
  const [autoLoadUserId, setAutoLoadUserId] = useState(null)

  // Estados para las cargas
  const [cargas, setCargas] = useState([])
  const [cargasDeuda, setCargasDeuda] = useState([])
  const [totalCargas, setTotalCargas] = useState(0)
  const [totalDeuda, setTotalDeuda] = useState(0)
  const [montoTotal, setMontoTotal] = useState(0)

  // Estados para el pago
  const [numeroCargasAPagar, setNumeroCargasAPagar] = useState(1)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState("")
  const [fechaInicio, setFechaInicio] = useState(() => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    return lastMonth.toISOString().split("T")[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split("T")[0])
  const [showFilterDialog, setShowFilterDialog] = useState(false)

  // Añadir después de los otros estados
  const [showChargeDetailsDialog, setShowChargeDetailsDialog] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState(null)

  // Añadir un nuevo estado para controlar si los filtros están activos
  const [filtrosActivos, setFiltrosActivos] = useState(false)

  // Añadir un nuevo estado para almacenar todas las cargas combinadas
  const [todasLasCargas, setTodasLasCargas] = useState([])
  const [todasLasCargasDeuda, setTodasLasCargasDeuda] = useState([])
  const [totalTodasCargas, setTotalTodasCargas] = useState(0)
  const [totalTodasDeuda, setTotalTodasDeuda] = useState(0)

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      fetchUsuarios()

      // Obtener el ID del usuario desde localStorage
      const selectedUserId = localStorage.getItem("selectedUserId")

      // Si hay un ID de usuario en localStorage, cargarlo automáticamente
      if (selectedUserId) {
        setAutoLoadUserId(selectedUserId)
        // No eliminamos el ID para mantener la selección entre visitas
      } else {
        // Si no hay ID en localStorage, mostrar el select
        setMostrarSelect(true)
      }
    }
  }, [router])

  useEffect(() => {
    if (autoLoadUserId && usuarios.length > 0) {
      const user = usuarios.find((u) => u.id.toString() === autoLoadUserId.toString())
      if (user) {
        handleUsuarioChange(user.id.toString())
        setAutoLoadUserId(null) // Clear it after use
      }
    }
  }, [usuarios, autoLoadUserId])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrar solo propietarios y conductores
        const filteredUsers = data.filter((user) => user.rol === "propietario" || user.rol === "conductor")
        setUsuarios(filteredUsers)
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
    }
  }

  const fetchConductores = async (propietarioId) => {
    try {
      const response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrar conductores que pertenecen al propietario seleccionado
        const conductoresFiltrados = data.filter(
          (user) => user.rol === "conductor" && user.propietarioId === propietarioId,
        )
        setConductores(conductoresFiltrados)
      }
    } catch (error) {
      console.error("Error al obtener conductores:", error)
    }
  }

  const fetchCargasUsuario = async (usuarioId, esPropio = true) => {
    try {
      // Determinar el endpoint según el rol del usuario
      let endpoint = ""

      if (esPropio) {
        // Si estamos consultando las cargas del propietario
        endpoint =
          usuarioSeleccionado?.rol === "propietario"
            ? `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargasPropietario/${usuarioId}`
            : `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${usuarioId}`
      } else {
        // Si estamos consultando las cargas de un conductor específico
        endpoint = `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${usuarioId}`
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        // Ordenar por fecha (más antiguas primero)
        data.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
        setCargas(data)
        setTotalCargas(data.length)

        // Filtrar cargas con deuda
        const deudas = data.filter((carga) => carga.estado === "deuda")
        setCargasDeuda(deudas)

        // Calcular total de deuda
        const totalDeudaCalculado = deudas.reduce((total, carga) => total + (carga.costo || 30), 0)
        setTotalDeuda(totalDeudaCalculado)
      }
    } catch (error) {
      console.error("Error al obtener cargas del usuario:", error)
    }
  }

  // Modificar la función handleUsuarioChange para cargar todas las cargas cuando es propietario
  const handleUsuarioChange = async (id) => {
    const usuario = usuarios.find((u) => u.id.toString() === id)
    setUsuarioSeleccionado(usuario)
    setMostrarSelect(false)

    // If it's a property owner, load their drivers
    if (usuario.rol === "propietario") {
      await fetchConductores(usuario.id)
      setActiveTab("propietario")

      // Load all charges (owner + drivers) - this single call will update all necessary states
      await fetchTodasLasCargas(usuario.id)

      // Don't call fetchCargasUsuario since fetchTodasLasCargas already updates the states
    } else {
      // For non-owners, just fetch their charges directly
      await fetchCargasUsuario(id)
    }
  }

  // Añadir una nueva función para cargar todas las cargas
  const fetchTodasLasCargas = async (propietarioId) => {
    try {
      // Primero obtenemos las cargas del propietario
      const responsePropietario = await fetch(
        `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargasPropietario/${propietarioId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )

      // Usar un Map para evitar duplicados, usando el ID como clave
      const cargasMap = new Map()

      if (responsePropietario.ok) {
        const cargasPropietario = await responsePropietario.json()
        // Añadir información para identificar que estas cargas son del propietario
        cargasPropietario.forEach((carga) => {
          cargasMap.set(carga.id, {
            ...carga,
            tipoCuenta: "propietario",
          })
        })
      }

      // Luego obtenemos los conductores del propietario
      const responseConductores = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (responseConductores.ok) {
        const data = await responseConductores.json()
        const conductoresFiltrados = data.filter(
          (user) => user.rol === "conductor" && user.propietarioId === propietarioId,
        )

        // Para cada conductor, obtenemos sus cargas
        for (const conductor of conductoresFiltrados) {
          const responseConductor = await fetch(
            `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${conductor.id}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            },
          )

          if (responseConductor.ok) {
            const cargasConductor = await responseConductor.json()
            // Añadir información del conductor a cada carga
            cargasConductor.forEach((carga) => {
              // Solo añadir si no existe ya en el Map
              if (!cargasMap.has(carga.id)) {
                cargasMap.set(carga.id, {
                  ...carga,
                  tipoCuenta: "conductor",
                  conductorNombre: conductor.nombre,
                  conductorId: conductor.id,
                })
              }
            })
          }
        }
      }

      // Convertir el Map a un array y ordenar por fecha
      const todasCargas = Array.from(cargasMap.values())
      todasCargas.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))

      // Actualizar los estados con todas las cargas combinadas
      setTodasLasCargas(todasCargas)
      setTotalTodasCargas(todasCargas.length)

      // Actualizar también los estados principales para mostrar en la interfaz
      setCargas(todasCargas)
      setTotalCargas(todasCargas.length)

      // Filtrar cargas con deuda
      const deudas = todasCargas.filter((carga) => carga.estado === "deuda")
      setTodasLasCargasDeuda(deudas)
      setCargasDeuda(deudas)

      // Calcular total de deuda
      const totalDeudaCalculado = deudas.reduce((total, carga) => total + (carga.costo || 30), 0)
      setTotalTodasDeuda(totalDeudaCalculado)
      setTotalDeuda(totalDeudaCalculado)

      return todasCargas
    } catch (error) {
      console.error("Error al obtener todas las cargas:", error)
      return []
    }
  }

  const handleConductorChange = async (id) => {
    const conductor = conductores.find((c) => c.id.toString() === id)
    setConductorSeleccionado(conductor)
    await fetchCargasUsuario(id, false)
  }

  // Modificar la función handleTabChange para incluir la pestaña "todas"
  const handleTabChange = async (value) => {
    setActiveTab(value)

    if (value === "propietario") {
      setConductorSeleccionado(null)
      // Use the already loaded data instead of fetching again
      setCargas(todasLasCargas)
      setTotalCargas(totalTodasCargas)
      setCargasDeuda(todasLasCargasDeuda)
      setTotalDeuda(totalTodasDeuda)
    } else if (value === "conductores" && conductorSeleccionado) {
      await fetchCargasUsuario(conductorSeleccionado.id, false)
    }
  }

  // Modificar la función handleCambiarUsuario para redirigir a /UsuariosCliente
  const handleCambiarUsuario = () => {
    router.push("/UsuariosCliente")
  }

  const handleNumeroCargasChange = (e) => {
    const num = Number.parseInt(e.target.value)
    if (num > 0 && num <= cargasDeuda.length) {
      setNumeroCargasAPagar(num)

      // Calcular monto total basado en las cargas más antiguas
      const cargasAPagar = cargasDeuda.slice(0, num)
      const monto = cargasAPagar.reduce((total, carga) => total + (carga.costo || 30), 0)
      setMontoTotal(monto)
    }
  }

  // Modificar la función handlePagar para manejar pagos desde la vista "todas"
  const handlePagar = async () => {
    if (numeroCargasAPagar <= 0 || numeroCargasAPagar > cargasDeuda.length) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Número de cargas a pagar inválido",
      })
      return
    }

    // Obtener las cargas más antiguas según el número seleccionado
    const cargasAPagar = cargasDeuda.slice(0, numeroCargasAPagar)
    const cargaIds = cargasAPagar.map((carga) => carga.id)

    // Calcular el monto total
    const montoCalculado = cargasAPagar.reduce((total, carga) => total + (carga.costo || 30), 0)

    // Determinar el ID de usuario para el pago
    let usuarioIdPago

    if (activeTab === "conductores" && conductorSeleccionado) {
      usuarioIdPago = conductorSeleccionado.id
    } else {
      usuarioIdPago = usuarioSeleccionado.id
    }

    // Crear el objeto de datos para la API según su estructura original
    const datosPago = {
      usuarioId: usuarioIdPago,
      monto: montoCalculado,
      cargaAguaIds: cargaIds,
      fechaHora: new Date().toISOString(),
    }

    try {
      const response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(datosPago),
      })

      if (response.ok) {
        const resultado = await response.json()
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Pago realizado con éxito",
        })
        setShowPaymentDialog(false)

        // Actualizar datos según la pestaña activa
        if (activeTab === "conductores" && conductorSeleccionado) {
          await fetchCargasUsuario(conductorSeleccionado.id, false)
        } else {
          await fetchCargasUsuario(usuarioSeleccionado.id)
        }

        setNumeroCargasAPagar(1)
        setMontoTotal(0)
      } else {
        const error = await response.json()
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Error al realizar el pago: ${error.message || "Error desconocido"}`,
        })
      }
    } catch (error) {
      console.error("Error al realizar el pago:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al realizar el pago",
      })
    }
  }

  // Modificar la función filtrarCargas para que devuelva todas las cargas cuando los filtros no estén activos
  const filtrarCargas = () => {
    if (!filtrosActivos) {
      return cargas
    }

    return cargas.filter((carga) => {
      const fechaCarga = new Date(carga.fechaHora)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999) // Ajustar al final del día

      const cumpleFecha = fechaCarga >= inicio && fechaCarga <= fin
      const cumpleEstado = filtroEstado ? carga.estado === filtroEstado : true

      return cumpleFecha && cumpleEstado
    })
  }

  const cargasFiltradas = filtrarCargas()

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const fetchChargeDetails = async (chargeId) => {
    try {
      const response = await fetch(`https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargagua/${chargeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedCharge(data)
        setShowChargeDetailsDialog(true)
      }
    } catch (error) {
      console.error("Error al obtener detalles de la carga:", error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-2xl font-bold mb-6">Pago por usuario</h1>

      <>
        <Card className="mb-6 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Información del Usuario</CardTitle>
            <Button variant="outline" onClick={handleCambiarUsuario}>
              Cambiar Usuario
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Columna izquierda: Información del usuario */}
              <div className="md:w-1/2">
                <div className="flex items-start gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/placeholder.svg?height=96&width=96" alt={usuarioSeleccionado?.nombre} />
                    <AvatarFallback className="text-2xl bg-gray-100">
                      {getInitials(usuarioSeleccionado?.nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                      <p className="text-lg">{usuarioSeleccionado?.nombre}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500">Correo</h3>
                      <p className="text-lg">{usuarioSeleccionado?.correo || "No disponible"}</p>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500">CI</h3>
                      <p className="text-lg">{usuarioSeleccionado?.ci || "No disponible"}</p>
                    </div>
                   
                    <Badge className="mt-1">{usuarioSeleccionado?.rol}</Badge>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Resumen de cargas */}
              <div className="md:w-1/2">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-500">Total de Cargas</h4>
                    <div className="flex items-center mt-2">
                      <Calendar className="h-5 w-5 mr-2 text-gray-900" />
                      <span className="text-2xl font-bold">{totalCargas}</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-500">Cargas con Deuda</h4>
                    <div className="flex items-center mt-2">
                      <CreditCard className="h-5 w-5 mr-2 text-amber-600" />
                      <span className="text-2xl font-bold">{cargasDeuda.length}</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-500">Total Deuda</h4>
                    <div className="flex items-center mt-2">
                      <DollarSign className="h-5 w-5 mr-2 text-red-600" />
                      <span className="text-2xl font-bold">Bs{totalDeuda}</span>
                    </div>
                    <Button
                      className="w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white"
                      onClick={() => setShowPaymentDialog(true)}
                      disabled={cargasDeuda.length === 0}
                    >
                      Pagar Deudas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {usuarioSeleccionado?.rol === "propietario" && (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="propietario">Cargas del Propietario</TabsTrigger>
              <TabsTrigger value="conductores">Cargas de Conductores</TabsTrigger>
            </TabsList>

            <TabsContent value="propietario">
              {/* Contenido vacío ya que el resumen ahora está en la tarjeta de información del usuario */}
            </TabsContent>

            <TabsContent value="conductores">
              {/* Selector de conductor y sus cargas */}
              <Card className="mb-6 shadow-md">
                <CardHeader>
                  <CardTitle>Seleccionar Conductor</CardTitle>
                </CardHeader>
                <CardContent>
                  {conductores.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">No hay conductores asociados a este propietario.</p>
                  ) : (
                    <Select onValueChange={handleConductorChange} value={conductorSeleccionado?.id?.toString()}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un conductor" />
                      </SelectTrigger>
                      <SelectContent>
                        {conductores.map((conductor) => (
                          <SelectItem key={conductor.id} value={conductor.id.toString()}>
                            {conductor.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              {conductorSeleccionado && (
                <Card className="shadow-md mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Resumen de Cargas - {conductorSeleccionado.nombre}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Total de Cargas</h4>
                        <div className="flex items-center mt-2">
                          <Calendar className="h-5 w-5 mr-2 text-gray-900" />
                          <span className="text-2xl font-bold">{totalCargas}</span>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Cargas con Deuda</h4>
                        <div className="flex items-center mt-2">
                          <CreditCard className="h-5 w-5 mr-2 text-amber-600" />
                          <span className="text-2xl font-bold">{cargasDeuda.length}</span>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h4 className="text-sm font-medium text-gray-500">Total Deuda</h4>
                        <div className="flex items-center mt-2">
                          <DollarSign className="h-5 w-5 mr-2 text-red-600" />
                          <span className="text-2xl font-bold">Bs{totalDeuda}</span>
                        </div>
                        <Button
                          className="w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white"
                          onClick={() => setShowPaymentDialog(true)}
                          disabled={cargasDeuda.length === 0}
                        >
                          Pagar Deudas
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        <Card className="mb-6 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {usuarioSeleccionado?.rol === "propietario" && activeTab === "conductores" && conductorSeleccionado
                ? `Historial de Cargas - ${conductorSeleccionado.nombre}`
                : usuarioSeleccionado?.rol === "propietario" && activeTab === "propietario"
                  ? "Historial de Cargas (Propietario + Conductores)"
                  : "Historial de Cargas"}
            </CardTitle>
            <Button variant="outline" onClick={() => setShowFilterDialog(true)}>
              <Filter className="h-4 w-4 mr-2" /> {filtrosActivos ? "Filtros Activos" : "Filtros"}
            </Button>
          </CardHeader>
          <CardContent>
            {cargasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay cargas para mostrar con los filtros seleccionados.
              </div>
            ) : isMobile ? (
              // Modificar la vista móvil para incluir el botón de pago y mostrar el usuario
              <div className="space-y-4">
                {cargasFiltradas.map((carga) => (
                  <Card key={carga.id} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-4">
                      <p>
                        <strong>ID:</strong> {carga.id}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {new Date(carga.fechaHora).toLocaleString()}
                      </p>
                      <p>
                        <strong>Estado:</strong>{" "}
                        <Badge className={carga.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>
                          {carga.estado}
                        </Badge>
                      </p>
                      <p>
                        <strong>Costo:</strong> Bs{carga.costo || 30}
                      </p>
                      <p>
                        <strong>Usuario:</strong> {carga.usuario?.nombre || carga.conductorNombre || "N/A"}
                      </p>
                      <p>
                        <strong>Tipo:</strong>{" "}
                        <Badge
                          variant="outline"
                          className={carga.tipoCuenta === "propietario" ? "bg-blue-100" : "bg-green-100"}
                        >
                          {carga.tipoCuenta === "propietario" ? "Propietario" : "Conductor"}
                        </Badge>
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchChargeDetails(carga.id)}
                        className="bg-gray-900 hover:bg-gray-800 text-white border-gray-700"
                      >
                        Ver Detalles
                      </Button>
                      {carga.estado === "deuda" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Configurar para pagar esta carga específica
                            const usuarioIdPago =
                              carga.tipoCuenta === "conductor" ? carga.conductorId : usuarioSeleccionado.id

                            // Configurar los estados para el pago
                            setCargasDeuda([carga])
                            setNumeroCargasAPagar(1)
                            setMontoTotal(carga.costo || 30)

                            // Si es un conductor, actualizar temporalmente el conductorSeleccionado
                            if (carga.tipoCuenta === "conductor" && carga.conductorId) {
                              const conductor = conductores.find((c) => c.id === carga.conductorId)
                              if (conductor) {
                                setConductorSeleccionado(conductor)
                              }
                            }

                            setShowPaymentDialog(true)
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white border-red-500"
                        >
                          Pagar
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-900 border-b-2 border-gray-700 shadow-md">
                  <TableRow>
                    <TableHead className="font-bold text-gray-300 border-r border-gray-700">ID</TableHead>
                    <TableHead className="font-bold text-gray-300 border-r border-gray-700">Fecha y Hora</TableHead>
                    <TableHead className="font-bold text-gray-300 border-r border-gray-700">Estado</TableHead>
                    <TableHead className="font-bold text-gray-300 border-r border-gray-700">Costo</TableHead>
                    <TableHead className="font-bold text-gray-300 border-r border-gray-700">Usuario</TableHead>
                    <TableHead className="font-bold text-gray-300">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargasFiltradas.map((carga) => (
                    <TableRow key={carga.id}>
                      <TableCell>{carga.id}</TableCell>
                      <TableCell>{new Date(carga.fechaHora).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={carga.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>
                          {carga.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>Bs{carga.costo || 30}</TableCell>
                      <TableCell>{carga.usuario?.nombre || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchChargeDetails(carga.id)}
                            className="bg-gray-900 hover:bg-gray-800 text-white border-gray-700"
                          >
                            Ver Detalles
                          </Button>
                          {carga.estado === "deuda" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Configurar para pagar solo esta carga específica
                                setCargasDeuda([carga])
                                setNumeroCargasAPagar(1)
                                setMontoTotal(carga.costo || 30)
                                setShowPaymentDialog(true)
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white border-red-500"
                            >
                              Pagar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </>

      {/* Diálogo de Pago */}

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {cargasDeuda.length === 1
                ? `Pagar Carga #${cargasDeuda[0].id} - ${cargasDeuda[0].usuario?.nombre || "N/A"}`
                : usuarioSeleccionado?.rol === "propietario" && activeTab === "conductores" && conductorSeleccionado
                  ? `Realizar Pago - ${conductorSeleccionado.nombre}`
                  : "Realizar Pago"}
            </DialogTitle>
            <DialogDescription>
              {cargasDeuda.length === 1
                ? "Confirme el pago de esta carga."
                : "Seleccione el número de cargas a pagar. Se pagarán las cargas más antiguas primero."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {cargasDeuda.length > 1 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numeroCargasAPagar" className="text-right">
                  Número de Cargas:
                </Label>
                <Input
                  id="numeroCargasAPagar"
                  type="number"
                  min="1"
                  max={cargasDeuda.length}
                  value={numeroCargasAPagar}
                  onChange={handleNumeroCargasChange}
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Monto Total:</Label>
              <div className="col-span-3 flex items-center">
                <Input value={`Bs${montoTotal}`} readOnly className="bg-gray-50" />
              </div>
            </div>
            {numeroCargasAPagar > 0 && (
              <div className="mt-2">
                <h4 className="font-medium mb-2">Cargas a pagar:</h4>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {cargasDeuda.slice(0, numeroCargasAPagar).map((carga) => (
                    <div key={carga.id} className="flex justify-between py-1 border-b last:border-0">
                      <span>
                        Carga #{carga.id} - {new Date(carga.fechaHora).toLocaleDateString()} -{" "}
                        {carga.usuario?.nombre || "N/A"}
                      </span>
                      <span>Bs{carga.costo || 30}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePagar} className="bg-gray-900 hover:bg-gray-800 text-white">
              Confirmar Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Filtros */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar Cargas</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="activarFiltros"
                checked={filtrosActivos}
                onCheckedChange={(checked) => setFiltrosActivos(checked === true)}
              />
              <Label htmlFor="activarFiltros">Activar filtros</Label>
            </div>

            <div className={`grid gap-4 ${!filtrosActivos ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="filtroEstado" className="text-right">
                  Estado:
                </Label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado} disabled={!filtrosActivos}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="deuda">Deuda</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fechaInicio" className="text-right">
                  Fecha Inicio:
                </Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="col-span-3"
                  disabled={!filtrosActivos}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fechaFin" className="text-right">
                  Fecha Fin:
                </Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="col-span-3"
                  disabled={!filtrosActivos}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowFilterDialog(false)}>{filtrosActivos ? "Aplicar Filtros" : "Cerrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Detalles de Carga */}
      <Dialog open={showChargeDetailsDialog} onOpenChange={setShowChargeDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de la Carga #{selectedCharge?.id}</DialogTitle>
          </DialogHeader>
          {selectedCharge && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium text-right">Fecha y Hora:</span>
                <span className="col-span-3">{new Date(selectedCharge.fechaHora).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium text-right">Estado:</span>
                <span className="col-span-3">
                  <Badge className={selectedCharge.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>
                    {selectedCharge.estado}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium text-right">Usuario:</span>
                <span className="col-span-3">{selectedCharge.usuario?.nombre || "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium text-right">Tipo de Camión:</span>
                <span className="col-span-3">{selectedCharge.tiposDeCamion?.descripcion || "N/A"}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium text-right">Costo:</span>
                <span className="col-span-3">Bs{selectedCharge.costo || 30}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowChargeDetailsDialog(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
