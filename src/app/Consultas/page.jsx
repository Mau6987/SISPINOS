"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronDown, FileDown, RefreshCw } from "lucide-react"

import { Button } from "../../../components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/components/ui/card"
import { Checkbox } from "../../../components/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/components/ui/table"
import { Input } from "../../../components/components/ui/input"
import { Label } from "../../../components/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "../../../components/components/ui/popover"
import { Badge } from "../../../components/components/ui/badge"
import { ScrollArea } from "../../../components/components/ui/scroll-area"

const URL = "https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/"

export default function TableConsultas() {
  const params = useParams()
  const userId = params.id ? Number.parseInt(params.id.toString(), 10) : null

  const [usuarios, setUsuarios] = useState([])
  const [conductores, setConductores] = useState([])
  const [selectedUsuarioDetails, setSelectedUsuarioDetails] = useState(null)
  const [selectedConductores, setSelectedConductores] = useState([])
  const [usuarioEsPropietario, setUsuarioEsPropietario] = useState(false)
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [selectedEstados, setSelectedEstados] = useState([])
  const [includeCargas, setIncludeCargas] = useState(true) // Por defecto activado
  const [includePagos, setIncludePagos] = useState(true) // Por defecto activado
  const [cargas, setCargas] = useState([])
  const [pagos, setPagos] = useState([])
  const [showForm, setShowForm] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Cargar usuarios y obtener detalles del usuario seleccionado
  useEffect(() => {
    fetchUsuarios()
  }, [])

  // Cuando se carga la lista de usuarios y tenemos un userId, seleccionar automáticamente
  useEffect(() => {
    if (usuarios.length > 0 && userId) {
      handleUsuarioSelect(userId)
    }
  }, [usuarios, userId])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${URL}usuarios`)
      const users = await response.json()
      setUsuarios(users)
    } catch (error) {
      console.error("Error al obtener usuarios:", error)
    }
  }

  const handleUsuarioSelect = async (id) => {
    if (!id) return

    const user = usuarios.find((u) => u.id === id)
    setSelectedUsuarioDetails(user)

    if (user?.rol === "propietario") {
      setUsuarioEsPropietario(true)
      try {
        const response = await fetch(`${URL}conductores/${user.id}`)
        const conductoresData = await response.json()
        setConductores(conductoresData)
      } catch (error) {
        console.error("Error al obtener conductores:", error)
      }
    } else {
      setUsuarioEsPropietario(false)
      setConductores([])
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
    if (!userId) {
      console.error("No se ha seleccionado un usuario")
      return
    }

    setIsLoading(true)
    try {
      setShowForm(false)

      // Crear el cuerpo de la solicitud según el formato requerido
      const body = {
        usuarioId: userId,
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
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    const currentDate = format(new Date(), "dd/MM/yyyy", { locale: es })

    // Colores
    const titleColor = [80, 80, 80] // Gris oscuro para títulos
    const borderColor = [76, 175, 80] // Verde para bordes
    const textColor = [60, 60, 60] // Gris para texto
    const bgColor = [250, 250, 250] // Gris muy claro para fondos

    // Configuración inicial
    doc.setFillColor(...bgColor)
    doc.rect(0, 0, pageWidth, pageHeight, "F")

    // Título principal
    doc.setFontSize(24)
    doc.setTextColor(...titleColor)
    doc.setFont("helvetica", "bold")
    doc.text("REPORTE DE CONSULTA", pageWidth / 2, margin + 10, { align: "center" })

    // Subtítulo
    doc.setFontSize(14)
    doc.setFont("helvetica", "normal")
    doc.text("Sistema de Gestión de Cargas de Agua", pageWidth / 2, margin + 20, { align: "center" })

    // Función para dibujar un recuadro con borde verde
    const drawBox = (x, y, width, height, title = "") => {
      // Borde verde
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.5)
      doc.rect(x, y, width, height, "S")

      if (title) {
        // Título del recuadro
        doc.setFontSize(12)
        doc.setTextColor(...titleColor)
        doc.setFont("helvetica", "bold")
        doc.text(title, x + 5, y + 10)
      }
    }

    // Información básica - Dos columnas
    const boxHeight = 40
    const boxWidth = (contentWidth - 10) / 2
    const startY = margin + 35

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
      startY + 20,
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
      startY + 20,
    )

    // Resumen de datos
    const summaryY = startY + boxHeight + 20
    const summaryHeight = 50
    drawBox(margin, summaryY, contentWidth, summaryHeight, "RESUMEN DE DATOS")

    // Datos en tres columnas
    const colWidth = (contentWidth - 20) / 3
    const totalCargas = Array.isArray(cargas) ? cargas.length : 0
    const totalDeuda = Array.isArray(cargas)
      ? cargas.filter((c) => c.estado === "deuda").reduce((sum, c) => sum + (c.costo || 30), 0)
      : 0
    const montoPagado = Array.isArray(pagos) ? pagos.reduce((sum, p) => sum + (p.monto || 0), 0) : 0

    // Columnas de resumen
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    ;[
      [`Total Cargas: ${totalCargas}`, margin + 5],
      [`Total Deuda: $${totalDeuda}`, margin + colWidth + 5],
      [`Monto Pagado: $${montoPagado}`, margin + colWidth * 2 + 5],
    ].forEach(([text, x]) => {
      doc.text(text, x, summaryY + 30)
    })

    let currentY = summaryY + summaryHeight + 20

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
      drawBox(margin, currentY, contentWidth, 10, "CONDUCTORES CON MAYOR DEUDA")

      autoTable(doc, {
        startY: currentY + 15,
        head: [["Conductor", "Cantidad Cargas", "Deuda Total"]],
        body: conductoresDeuda.map((c) => [c.nombre, c.cantidadCargas, `$${c.deuda}`]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 5,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })

      currentY = doc.lastAutoTable.finalY + 20
    }

    // Tabla de cargas
    if (cargas.length > 0) {
      drawBox(margin, currentY, contentWidth, 10, "DETALLE DE CARGAS")

      autoTable(doc, {
        startY: currentY + 15,
        head: [["Usuario", "Fecha y Hora", "Estado", "Costo"]],
        body: cargas.map((c) => [c.usuario?.nombre || "", formatDateTime(c.fechaHora), c.estado, `$${c.costo || 30}`]),
        theme: "grid",
        headStyles: {
          fillColor: borderColor,
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 5,
          lineColor: borderColor,
        },
        margin: { left: margin, right: margin },
      })

      currentY = doc.lastAutoTable.finalY + 20
    }

    // Tabla de pagos
    if (pagos.length > 0) {
      // Verificar si necesitamos una nueva página
      if (currentY > pageHeight - 100) {
        doc.addPage()
        currentY = margin
      }

      drawBox(margin, currentY, contentWidth, 10, "DETALLE DE PAGOS")

      autoTable(doc, {
        startY: currentY + 15,
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
          cellPadding: 5,
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
    setShowForm(true)
    setCargas([])
    setPagos([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Sistema de Consultas</h1>

      {showForm ? (
        <Card className="max-w-4xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl">Consulta de Cargas y Pagos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del usuario seleccionado */}
            {selectedUsuarioDetails && (
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <h3 className="font-semibold text-blue-800 mb-2">Usuario seleccionado:</h3>
                <p>
                  <span className="font-medium">Nombre:</span> {selectedUsuarioDetails.nombre}
                </p>
                <p>
                  <span className="font-medium">Rol:</span> {selectedUsuarioDetails.rol}
                </p>
              </div>
            )}

            {usuarioEsPropietario && conductores.length > 0 && (
              <div className="space-y-2">
                <Label>Seleccionar Conductores Asociados</Label>
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
            )}

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

            <Button
              onClick={fetchData}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || !userId}
            >
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex justify-center gap-4 mb-6">
            <Button
              onClick={exportToPDF}
              className="bg-green-200 hover:bg-green-300 text-green-800"
              disabled={cargas.length === 0 && pagos.length === 0}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button onClick={handleNuevaConsulta} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Nueva Consulta
            </Button>
          </div>

          {/* Información del usuario */}
          <Card className="mb-6 shadow-md">
            <CardHeader className="bg-purple-200">
              <CardTitle className="text-purple-800">Información del Usuario</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </CardContent>
          </Card>

          {/* Resumen de datos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="shadow-md">
              <CardHeader className="pb-2 bg-blue-200">
                <CardTitle className="text-lg text-blue-800">Total de Cargas</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold">{cargas.length}</p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-2 bg-red-200">
                <CardTitle className="text-lg text-red-800">Total Deuda</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold">
                  Bs
                  {Array.isArray(cargas)
                    ? cargas.filter((c) => c.estado === "deuda").reduce((sum, c) => sum + (c.costo || 30), 0)
                    : 0}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-2 bg-green-200">
                <CardTitle className="text-lg text-green-800">Monto Pagado</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold">Bs {pagos.reduce((sum, p) => sum + (p.monto || 0), 0)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Conductores con más deuda (solo si es propietario) */}
          {usuarioEsPropietario && conductores.length > 0 && (
            <Card className="mb-6 shadow-md">
              <CardHeader className="bg-purple-200">
                <CardTitle className="text-purple-800">Conductores con Mayor Deuda</CardTitle>
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
                        <TableRow>
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
                            <TableCell className="text-right">${conductor.deuda}</TableCell>
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-purple-200">
                    <TableRow>
                      <TableHead className="font-bold text-purple-800">Nombre</TableHead>
                      <TableHead className="font-bold text-purple-800">Fecha y Hora</TableHead>
                      <TableHead className="font-bold text-purple-800">Estado</TableHead>
                      <TableHead className="font-bold text-purple-800">Costo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargas.map((carga) => (
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
              </div>
            </div>
          )}

          {pagos.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Tabla de Pagos</h2>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-purple-200">
                    <TableRow>
                      <TableHead className="font-bold text-purple-800">Nombre</TableHead>
                      <TableHead className="font-bold text-purple-800">Fecha y Hora</TableHead>
                      <TableHead className="font-bold text-purple-800">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>{pago?.usuario?.nombre}</TableCell>
                        <TableCell>{formatDateTime(pago.fechaHora)}</TableCell>
                        <TableCell>Bs {pago.monto || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

