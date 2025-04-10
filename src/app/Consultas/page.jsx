"use client"

import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronDown, FileDown, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "../../components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/components/ui/card"
import { Checkbox } from "../../components/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Input } from "../../components/components/ui/input"
import { Label } from "../../components/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/components/ui/popover"
import { Badge } from "../../components/components/ui/badge"
import { ScrollArea } from "../../components/components/ui/scroll-area"

const URL = "https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/"

export default function TableConsultas() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState([])
  const [conductores, setConductores] = useState([])
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const [selectedUsuarioDetails, setSelectedUsuarioDetails] = useState(null)
  const [selectedConductores, setSelectedConductores] = useState([])
  const [usuarioEsPropietario, setUsuarioEsPropietario] = useState(false)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [selectedEstados, setSelectedEstados] = useState([])
  const [includeCargas, setIncludeCargas] = useState(false)
  const [includePagos, setIncludePagos] = useState(false)
  const [cargas, setCargas] = useState([])
  const [pagos, setPagos] = useState([])
  const [showForm, setShowForm] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [autoLoadUserId, setAutoLoadUserId] = useState(null)

  // Estados para paginación
  const [currentPageCargas, setCurrentPageCargas] = useState(1)
  const [currentPagePagos, setCurrentPagePagos] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchUsuarios()

    // Obtener el ID del usuario desde localStorage
    const selectedUserId = localStorage.getItem("selectedUserId")

    // Si hay un ID de usuario en localStorage, cargarlo automáticamente
    if (selectedUserId) {
      setAutoLoadUserId(selectedUserId)
    } else {
      // Si no hay ID en localStorage, redirigir a la página de selección de usuario
      router.push("/UsuariosCliente")
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

  // Resetear la paginación cuando cambian los datos
  useEffect(() => {
    setCurrentPageCargas(1)
  }, [cargas])

  useEffect(() => {
    setCurrentPagePagos(1)
  }, [pagos])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${URL}usuarios`)
      const users = await response.json()
      console.log("Usuarios fetched:", users)
      setUsuarios(users)
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
    }
  }

  const fetchConductores = async (propietarioId) => {
    try {
      console.log("Fetching conductores for propietario ID:", propietarioId)

      // Get all users - EXACTLY as in usuario-detalles.tsx
      const response = await fetch(`${URL}usuarios`)
      const allUsers = await response.json()
      console.log("All users:", allUsers)

      // Convert propietarioId to string for comparison
      const propietarioIdStr = propietarioId.toString()

      // Filter conductores that belong to this propietario - with string comparison
      const conductoresFiltrados = allUsers.filter(
        (user) =>
          user.rol &&
          user.rol.toLowerCase() === "conductor" &&
          user.propietarioId &&
          user.propietarioId.toString() === propietarioIdStr,
      )

      console.log("Found conductores:", conductoresFiltrados)
      setConductores(conductoresFiltrados)
    } catch (error) {
      console.error("Error al obtener conductores:", error)
      setConductores([])
    }
  }

  const handleUsuarioChange = async (value) => {
    console.log("Usuario selected with value:", value)
    // Convertir el valor a número
    const userId = Number.parseInt(value, 10)
    setSelectedUsuario(userId)
    setConductores([])
    setSelectedConductores([])
    setUsuarioEsPropietario(false)

    if (!userId) {
      setSelectedUsuarioDetails(null)
      return
    }

    try {
      // Find the user in the usuarios array - EXACTLY as in usuario-detalles.tsx
      const user = usuarios.find((u) => u.id.toString() === value)
      console.log("Selected user:", user)

      if (user) {
        setSelectedUsuarioDetails(user)

        // Check if user is a propietario - EXACTLY as in usuario-detalles.tsx
        if (user.rol && user.rol.toLowerCase() === "propietario") {
          console.log("User is a propietario")
          setUsuarioEsPropietario(true)
          await fetchConductores(userId)
        } else {
          console.log("User is not a propietario, rol:", user.rol)
        }
      } else {
        console.error("User not found in usuarios array")
      }
    } catch (error) {
      console.error("Error al procesar el usuario:", error)
    }
  }

  const toggleConductor = (conductorId) => {
    // Convertir a número
    const id = Number.parseInt(conductorId, 10)
    setSelectedConductores((prev) => {
      if (prev.includes(id)) {
        return prev.filter((prevId) => prevId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const toggleEstado = (estado) => {
    setSelectedEstados((prev) => {
      if (prev.includes(estado)) {
        return prev.filter((e) => e !== estado)
      } else {
        return [...prev, estado]
      }
    })
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      setShowForm(false)

      // Crear el cuerpo de la solicitud según el formato requerido
      const body = {
        usuarioId: selectedUsuario,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
        estado: selectedEstados.length > 0 ? selectedEstados : undefined,
        conductoresIds: usuarioEsPropietario && selectedConductores.length > 0 ? selectedConductores : undefined,
      }

      console.log("Request body:", body)

      const headers = { "Content-Type": "application/json" }

      if (includeCargas) {
        try {
          const responseCargas = await fetch(`${URL}consultacargas2`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          })
          const dataCargas = await responseCargas.json()
          console.log("Cargas response:", dataCargas)

          // Asegurarse de que dataCargas sea un array y manejarlo correctamente
          if (Array.isArray(dataCargas)) {
            setCargas(dataCargas)
          } else {
            console.error("La respuesta de cargas no es un array:", dataCargas)
            setCargas([])
          }
        } catch (error) {
          console.error("Error al obtener cargas:", error)
          setCargas([])
        }
      } else {
        setCargas([])
      }

      if (includePagos) {
        try {
          // Usar el nuevo endpoint consultapagos2
          const responsePagos = await fetch(`${URL}consultapagos2`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
          })
          const dataPagos = await responsePagos.json()
          console.log("Pagos response:", dataPagos)

          // Asegurarse de que dataPagos sea un array y manejarlo correctamente
          if (Array.isArray(dataPagos)) {
            setPagos(dataPagos)
          } else {
            console.error("La respuesta de pagos no es un array:", dataPagos)
            setPagos([])
          }
        } catch (error) {
          console.error("Error al obtener pagos:", error)
          setPagos([])
        }
      } else {
        setPagos([])
      }
    } catch (error) {
      console.error("Error al obtener datos:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones para paginación
  const getPaginatedData = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems, itemsPerPage) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  // Datos paginados
  const paginatedCargas = getPaginatedData(cargas, currentPageCargas, itemsPerPage)
  const totalPagesCargas = getTotalPages(cargas.length, itemsPerPage)

  const paginatedPagos = getPaginatedData(pagos, currentPagePagos, itemsPerPage)
  const totalPagesPagos = getTotalPages(pagos.length, itemsPerPage)

  const formatDate = (fechaISO) => {
    if (!fechaISO) return ""
    try {
      return format(new Date(fechaISO), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return ""
    }
  }

  const formatDateTime = (fechaISO) => {
    if (!fechaISO) return ""
    try {
      return format(new Date(fechaISO), "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return ""
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - 2 * margin
    const currentDate = format(new Date(), "dd/MM/yyyy", { locale: es })

    // Colores
    const titleColor = [30, 50, 80] // Azul oscuro para títulos
    const borderColor = [0, 51, 102] // Azul formal para bordes
    const textColor = [40, 40, 40] // Gris oscuro para texto
    const bgColor = [250, 250, 250] // Gris muy claro para fondos

    // Configuración inicial
    doc.setFillColor(...bgColor)
    doc.rect(0, 0, pageWidth, pageHeight, "F")

    // Título principal
    doc.setFontSize(24)
    doc.setTextColor(...titleColor)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DE CONSULTA", pageWidth / 2, margin + 8, { align: "center" })

    // Subtítulo
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("DISTRIBUIDORA DE AGUA LOS PINOS", pageWidth / 2, margin + 16, { align: "center" })

    // Función para dibujar un recuadro con borde azul
    const drawBox = (x, y, width, height, title = "", isTableTitle = false) => {
      // Borde azul
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.5)
      doc.rect(x, y, width, height, "S")

      if (title) {
        // Título del recuadro
        doc.setFontSize(isTableTitle ? 14 : 12)
        doc.setTextColor(...titleColor)
        doc.setFont("helvetica", "bold")
        doc.text(title, x + 5, y + (isTableTitle ? 6 : 8))
      }
    }

    // Información básica - Dos columnas
    const boxHeight = 35
    const boxWidth = (contentWidth - 10) / 2
    const startY = margin + 24

    // Recuadro izquierdo - Información del Usuario
    drawBox(margin, startY, boxWidth, boxHeight, "INFORMACIÓN DEL USUARIO")
    doc.setFontSize(10)
    doc.setTextColor(...textColor)
    doc.setFont("helvetica", "normal")
    doc.text(
      [
        `Nombre: ${selectedUsuarioDetails?.nombre || ""}`,
        `CI: ${selectedUsuarioDetails?.ci || ""}`,
        `Correo: ${selectedUsuarioDetails?.correo || ""}`,
      ],
      margin + 5,
      startY + 16,
    )

    // Recuadro derecho - Información de la Consulta
    drawBox(margin + boxWidth + 10, startY, boxWidth, boxHeight, "DETALLES DE LA CONSULTA")
    doc.text(
      [
        `Fecha del reporte: ${currentDate}`,
        `Período: ${fechaInicio || "Todas"} - ${fechaFin || "Todas"}`,
        `Estados: ${selectedEstados.length > 0 ? selectedEstados.join(", ") : "Todos"}`,
      ],
      margin + boxWidth + 15,
      startY + 16,
    )

    // Resumen de datos - Reducido en altura
    const summaryY = startY + boxHeight + 6
    const summaryHeight = 25 // Reducido de 30 a 25
    drawBox(margin, summaryY, contentWidth, summaryHeight, "RESUMEN DE DATOS")

    // Datos en tres columnas
    const colWidth = (contentWidth - 20) / 3
    const totalCargas = Array.isArray(cargas) ? cargas.length : 0
    const totalDeuda = Array.isArray(cargas)
      ? cargas.filter((c) => c.estado === "deuda").reduce((sum, c) => sum + (c.costo || 30), 0)
      : 0
    const montoPagado = Array.isArray(pagos) ? pagos.reduce((sum, p) => sum + (p.monto || 0), 0) : 0

    // Columnas de resumen - Texto más compacto
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    ;[
      [`Total Cargas: ${totalCargas}`, margin + 5],
      [`Total Deuda: Bs ${totalDeuda}`, margin + colWidth + 5],
      [`Monto Pagado: Bs ${montoPagado}`, margin + colWidth * 2 + 5],
    ].forEach(([text, x]) => {
      doc.text(text, x, summaryY + 16) // Ajustado para centrar mejor en el espacio reducido
    })

    let currentY = summaryY + summaryHeight + 6

    // Tabla de conductores con deuda (si aplica)
    // Agrupar deudas por conductor
    const deudasPorConductor = (Array.isArray(cargas) ? cargas : [])
      .filter((c) => c.estado === "deuda")
      .reduce((acc, carga) => {
        if (!carga.usuario) return acc
        const conductorId = carga.usuario.id
        const conductorNombre = carga.usuario.nombre || "Sin nombre"
        if (!acc[conductorId]) {
          acc[conductorId] = {
            nombre: conductorNombre,
            deuda: 0,
            cantidadCargas: 0,
          }
        }
        acc[conductorId].deuda += carga.costo || 30
        acc[conductorId].cantidadCargas++
        return acc
      }, {})

    // Convertir a array y ordenar por deuda
    const conductoresDeuda = Object.values(deudasPorConductor)
      .sort((a, b) => b.deuda - a.deuda)
      .slice(0, 5) // Top 5 conductores con más deuda

    // Solo mostrar la sección de conductores con deuda si hay conductores y el usuario es propietario
    if (usuarioEsPropietario && conductoresDeuda.length > 0) {
      // Título de la tabla con más prominencia
      drawBox(margin, currentY, contentWidth, 15, "CONDUCTORES CON MAYOR DEUDA", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Conductor", "Cantidad Cargas", "Deuda Total"]],
        body: conductoresDeuda.map((c) => [c.nombre, c.cantidadCargas, `Bs ${c.deuda}`]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })

      currentY = doc.lastAutoTable.finalY + 5
    }

    // Tabla de cargas
    if (cargas.length > 0) {
      // Título de la tabla con más prominencia
      drawBox(margin, currentY, contentWidth, 15, "DETALLE DE CARGAS", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Usuario", "Fecha y Hora", "Estado", "Costo"]],
        body: cargas.map((c) => [
          c.usuario?.nombre || "",
          formatDateTime(c.fechaHora),
          c.estado,
          `Bs ${c.costo || 30}`,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })

      currentY = doc.lastAutoTable.finalY + 5
    }

    // Tabla de pagos
    if (pagos.length > 0) {
      // Verificar si necesitamos una nueva página
      if (currentY > pageHeight - 100) {
        doc.addPage()
        currentY = margin
      }

      // Título de la tabla con más prominencia
      drawBox(margin, currentY, contentWidth, 15, "DETALLE DE PAGOS", true)

      autoTable(doc, {
        startY: currentY + 10,
        head: [["Usuario", "Fecha y Hora", "Monto"]],
        body: pagos.map((p) => [p.usuario?.nombre || "", formatDateTime(p.fechaHora), `Bs ${p.monto || 0}`]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })
    }

    // Pie de página
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...textColor)
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - margin, { align: "right" })
    }

    // Guardar PDF
    doc.save(`reporte_consultas_${selectedUsuarioDetails?.nombre || "usuario"}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const handleNuevaConsulta = () => {
    // Mantener el mismo usuario, solo volver al formulario
    setShowForm(true)
    setCargas([])
    setPagos([])
    // Reiniciar los filtros pero mantener el usuario
    setSelectedConductores([])
    setSelectedEstados([])
    setFechaInicio("")
    setFechaFin("")
    setIncludeCargas(false)
    setIncludePagos(false)
  }

  const handleCambiarUsuario = () => {
    // Redirigir a la página de selección de usuarios
    router.push("/UsuariosCliente")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Sistema de Consultas</h1>

      {showForm ? (
        <Card className="max-w-4xl mx-auto shadow-lg border-2 border-gray-300 rounded-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Consulta de Cargas y Pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del usuario seleccionado */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium text-lg">Usuario seleccionado: {selectedUsuarioDetails?.nombre}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedUsuarioDetails?.rol} - {selectedUsuarioDetails?.correo}
                </p>
              </div>
              <Button variant="outline" onClick={handleCambiarUsuario}>
                Cambiar Usuario
              </Button>
            </div>

            {usuarioEsPropietario && conductores.length > 0 ? (
              <div className="space-y-2">
                <Label>Seleccionar Conductores Asociados ({conductores.length} disponibles)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedConductores.length > 0
                        ? `${selectedConductores.length} conductores seleccionados`
                        : "Seleccione conductores"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <ScrollArea className="h-60 p-4">
                      <div className="space-y-4">
                        {conductores.map((conductor) => (
                          <div key={conductor.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`conductor-${conductor.id}`}
                              checked={selectedConductores.includes(conductor.id)}
                              onCheckedChange={() => toggleConductor(conductor.id)}
                            />
                            <Label htmlFor={`conductor-${conductor.id}`} className="flex-1 cursor-pointer">
                              {conductor.nombre}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                {selectedConductores.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedConductores.map((conductorId) => {
                      const conductor = conductores.find((c) => c.id === conductorId)
                      return (
                        <Badge
                          key={conductorId}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleConductor(conductorId)}
                        >
                          {conductor?.nombre || conductorId}
                          <span className="ml-1">×</span>
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : usuarioEsPropietario ? (
              <div className="p-4 text-amber-600 bg-amber-50 rounded-md">
                No hay conductores asociados a este propietario.
              </div>
            ) : null}

            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="includeCargas" checked={includeCargas} onCheckedChange={setIncludeCargas} />
                <Label htmlFor="includeCargas">Cargas de Agua</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="includePagos" checked={includePagos} onCheckedChange={setIncludePagos} />
                <Label htmlFor="includePagos">Pagos de Cargas de Agua</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estado de Carga</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedEstados.length > 0
                      ? `${selectedEstados.length} estados seleccionados`
                      : "Seleccione estados"}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="estado-deuda"
                        checked={selectedEstados.includes("deuda")}
                        onCheckedChange={() => toggleEstado("deuda")}
                      />
                      <Label htmlFor="estado-deuda" className="flex-1 cursor-pointer">
                        Deuda
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="estado-pagado"
                        checked={selectedEstados.includes("pagado")}
                        onCheckedChange={() => toggleEstado("pagado")}
                      />
                      <Label htmlFor="estado-pagado" className="flex-1 cursor-pointer">
                        Pagado
                      </Label>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {selectedEstados.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedEstados.map((estado) => (
                    <Badge
                      key={estado}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => toggleEstado(estado)}
                    >
                      {estado}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input id="fechaFin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              </div>
            </div>

            <Button onClick={fetchData} className="w-full bg-slate-800 hover:bg-slate-900" disabled={isLoading}>
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-center gap-4 mb-6">
            <Button
              onClick={exportToPDF}
              className="bg-slate-900 hover:bg-slate-950 text-white"
              disabled={cargas.length === 0 && pagos.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button onClick={handleNuevaConsulta} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Nueva Consulta
            </Button>
            <Button onClick={handleCambiarUsuario} variant="outline">
              Cambiar Usuario
            </Button>
          </div>

          {/* Información del usuario y resumen de datos en un solo card */}
          <Card className="mb-6 shadow-md border-2 border-gray-300 rounded-lg">
            <CardHeader className="bg-blue-900 text-white">
              <CardTitle className="text-white">Información del Usuario y Resumen</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                {/* Información del usuario - 3 columns */}
                <div className="md:col-span-3 grid grid-cols-3 gap-4 border-r border-gray-200 pr-4">
                  <div>
                    <p className="font-semibold">Nombre:</p>
                    <p>{selectedUsuarioDetails?.nombre || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">CI:</p>
                    <p>{selectedUsuarioDetails?.ci || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Correo:</p>
                    <p>{selectedUsuarioDetails?.correo || "N/A"}</p>
                  </div>
                </div>

                {/* Resumen de datos - 3 columns */}
                <div className="md:col-span-1 text-center">
                  <div className="bg-blue-100 p-2 rounded-t-md">
                    <p className="font-semibold text-blue-800">Total de Cargas</p>
                  </div>
                  <p className="text-2xl font-bold py-2">{cargas.length}</p>
                </div>

                <div className="md:col-span-1 text-center">
                  <div className="bg-red-100 p-2 rounded-t-md">
                    <p className="font-semibold text-red-800">Total Deuda</p>
                  </div>
                  <p className="text-2xl font-bold py-2">
                    Bs{" "}
                    {Array.isArray(cargas)
                      ? cargas.filter((c) => c.estado === "deuda").reduce((sum, c) => sum + (c.costo || 30), 0)
                      : 0}
                  </p>
                </div>

                <div className="md:col-span-1 text-center">
                  <div className="bg-green-100 p-2 rounded-t-md">
                    <p className="font-semibold text-green-800">Monto Pagado</p>
                  </div>
                  <p className="text-2xl font-bold py-2">Bs {pagos.reduce((sum, p) => sum + (p.monto || 0), 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conductores con más deuda (solo si es propietario) */}
          {usuarioEsPropietario && conductores.length > 0 && (
            <Card className="mb-6 shadow-md border-2 border-gray-300 rounded-lg">
              <CardHeader className="bg-emerald-800 text-white">
                <CardTitle className="text-white">Conductores con Mayor Deuda</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  // Calcular deudas por conductor
                  const deudasPorConductor = (Array.isArray(cargas) ? cargas : [])
                    .filter((c) => c.estado === "deuda")
                    .reduce((acc, carga) => {
                      if (!carga.usuario) return acc
                      const conductorId = carga.usuario.id
                      const conductorNombre = carga.usuario.nombre || "Sin nombre"
                      if (!acc[conductorId]) {
                        acc[conductorId] = {
                          nombre: conductorNombre,
                          deuda: 0,
                          cantidadCargas: 0,
                        }
                      }
                      acc[conductorId].deuda += carga.costo || 30
                      acc[conductorId].cantidadCargas++
                      return acc
                    }, {})

                  const conductoresDeuda = Object.values(deudasPorConductor)
                    .sort((a, b) => b.deuda - a.deuda)
                    .slice(0, 5)

                  if (conductoresDeuda.length === 0) {
                    return (
                      <div className="p-6 text-center text-gray-500">No hay conductores con deudas pendientes.</div>
                    )
                  }

                  return (
                    <Table>
                      <TableHeader>
                        <TableRow key="header">
                          <TableHead>Conductor</TableHead>
                          <TableHead>Cantidad Cargas</TableHead>
                          <TableHead>Deuda Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conductoresDeuda.map((conductor, index) => (
                          <TableRow key={index}>
                            <TableCell>{conductor.nombre}</TableCell>
                            <TableCell className="text-center">{conductor.cantidadCargas}</TableCell>
                            <TableCell className="text-right">Bs {conductor.deuda}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {cargas.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Tabla de Cargas</h2>
              <Card className="border-2 border-gray-300 rounded-lg">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-700 text-white">
                      <TableRow>
                        <TableHead className="font-bold text-white">Nombre</TableHead>
                        <TableHead className="font-bold text-white">Fecha y Hora</TableHead>
                        <TableHead className="font-bold text-white">Estado</TableHead>
                        <TableHead className="font-bold text-white">Costo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCargas.map((carga) => (
                        <TableRow key={carga.id}>
                          <TableCell>{carga?.usuario?.nombre}</TableCell>
                          <TableCell>{formatDateTime(carga.fechaHora)}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                carga.estado === "deuda" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                              }`}
                            >
                              {carga.estado}
                            </span>
                          </TableCell>
                          <TableCell>Bs {carga.costo || 30}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {Math.min(cargas.length, (currentPageCargas - 1) * itemsPerPage + 1)}-
                    {Math.min(currentPageCargas * itemsPerPage, cargas.length)} de {cargas.length} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageCargas(currentPageCargas - 1)}
                      disabled={currentPageCargas === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Página {currentPageCargas} de {totalPagesCargas || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPageCargas(currentPageCargas + 1)}
                      disabled={currentPageCargas >= totalPagesCargas}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}

          {pagos.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Tabla de Pagos</h2>
              <Card className="border-2 border-gray-300 rounded-lg">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-700 text-white">
                      <TableRow>
                        <TableHead className="font-bold text-white">Nombre</TableHead>
                        <TableHead className="font-bold text-white">Fecha y Hora</TableHead>
                        <TableHead className="font-bold text-white">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPagos.map((pago) => (
                        <TableRow key={pago.id}>
                          <TableCell>{pago?.usuario?.nombre}</TableCell>
                          <TableCell>{formatDateTime(pago.fechaHora)}</TableCell>
                          <TableCell>Bs {pago.monto || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {Math.min(pagos.length, (currentPagePagos - 1) * itemsPerPage + 1)}-
                    {Math.min(currentPagePagos * itemsPerPage, pagos.length)} de {pagos.length} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPagePagos(currentPagePagos - 1)}
                      disabled={currentPagePagos === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Página {currentPagePagos} de {totalPagesPagos || 1}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPagePagos(currentPagePagos + 1)}
                      disabled={currentPagePagos >= totalPagesPagos}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
