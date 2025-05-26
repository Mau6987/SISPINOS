"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus, Filter, Eye, XCircle } from "lucide-react"

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
} from "@/components/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Badge } from "../../components/components/ui/badge"
import { Checkbox } from "../../components/components/ui/checkbox"

export default function PagoCargaAgua() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)
  const [fechaHora, setFechaHora] = useState("")
  const [usuarioId, setUsuarioId] = useState("")
  const [usuarios, setUsuarios] = useState([])
  const [cargasDeuda, setCargasDeuda] = useState([])
  const [selectedCargas, setSelectedCargas] = useState([])
  const [monto, setMonto] = useState("0")
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pagos, setPagos] = useState([])
  const [selectedPago, setSelectedPago] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [fechaInicio, setFechaInicio] = useState(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split("T")[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split("T")[0])

  const router = useRouter()
  const itemsPerPage = 6
  const isMobile = windowWidth < 768

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      fetchUsuarios()
      fetchPagos()
    }
  }, [router])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch("https://mi-backendsecond.onrender.com/usuariosrol", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      }
    } catch (error) {
      console.error("Error al obtener los usuarios:", error)
    }
  }

  const fetchPagos = async () => {
    try {
      const response = await fetch("https://mi-backendsecond.onrender.com/pagoscargagua", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setPagos(data)
      }
    } catch (error) {
      console.error("Error al obtener los pagos:", error)
    }
  }

  const fetchCargasDeuda = async (usuarioId) => {
    try {
      const response = await fetch(`https://mi-backendsecond.onrender.com/cargasPropietarioDeuda/${usuarioId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setCargasDeuda(data)
      }
    } catch (error) {
      console.error("Error al obtener las cargas de agua con deuda:", error)
    }
  }

  const handleUsuarioChange = (value) => {
    setUsuarioId(value)
    fetchCargasDeuda(value)
    setSelectedCargas([])
    setMonto("0")
  }

  // Función para manejar la selección/deselección de una carga
  const handleCargaToggle = (cargaId) => {
    setSelectedCargas((prev) => {
      // Convertir a string para comparación consistente
      const cargaIdStr = cargaId.toString()

      // Si ya está seleccionada, la quitamos
      if (prev.includes(cargaIdStr)) {
        const newSelected = prev.filter((id) => id !== cargaIdStr)
        // Actualizar el monto total
        const montoTotal = calcularMontoTotal(newSelected)
        setMonto(montoTotal.toString())
        return newSelected
      }
      // Si no está seleccionada, la añadimos
      else {
        const newSelected = [...prev, cargaIdStr]
        // Actualizar el monto total
        const montoTotal = calcularMontoTotal(newSelected)
        setMonto(montoTotal.toString())
        return newSelected
      }
    })
  }

  // Función para calcular el monto total basado en las cargas seleccionadas
  const calcularMontoTotal = (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) return 0

    // Filtrar las cargas seleccionadas y sumar sus costos
    return cargasDeuda
      .filter((carga) => selectedIds.includes(carga.id.toString()))
      .reduce((total, carga) => total + (carga.costo || 30), 0)
  }

  const handleVerPago = async (pago) => {
    try {
      const response = await fetch(`https://mi-backendsecond.onrender.com/pagoscargagua/${pago.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedPago(data)
        setShowModal(true)
        setEditMode(false)
      }
    } catch (error) {
      console.error("Error al obtener la información del pago:", error)
    }
  }

  const handleEditPago = async (pago) => {
    try {
      const response = await fetch(`https://mi-backendsecond.onrender.com/pagoscargagua/${pago.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedPago(data)
        setFechaHora(new Date(data.fechaHora).toISOString().substring(0, 16))
        setMonto(data.monto.toString())
        setUsuarioId(data.usuarioId)
        // Convertir los IDs a string para consistencia
        setSelectedCargas(data.cargaAguaIds.map((id) => id.toString()))
        setShowModal(true)
        setEditMode(true)
      }
    } catch (error) {
      console.error("Error al cargar los datos para editar el pago:", error)
    }
  }

  const handleDeletePago = async (pagoId) => {
    try {
      const response = await fetch(`https://mi-backendsecond.onrender.com/pagoscargagua/${pagoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        setPagos(pagos.filter((pago) => pago.id !== pagoId))
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error("Error al eliminar el pago:", error)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!fechaHora || !usuarioId || selectedCargas.length === 0 || !monto) {
      return
    }

    const nuevoPago = {
      usuarioId: Number.parseInt(usuarioId),
      monto: Number.parseFloat(monto),
      cargaAguaIds: selectedCargas.map((id) => Number.parseInt(id)),
      fechaHora: new Date(fechaHora).toISOString(),
    }

    try {
      const url = editMode
        ? `https://mi-backendsecond.onrender.com/pagoscargagua/${selectedPago.id}`
        : "https://mi-backendsecond.onrender.com/pagoscargagua"

      const method = editMode ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(nuevoPago),
      })

      if (response.ok) {
        const data = await response.json()
        if (editMode) {
          setPagos(pagos.map((pago) => (pago.id === selectedPago.id ? data : pago)))
        } else {
          setPagos([...pagos, data])
        }
        setShowModal(false)
        setFechaHora("")
        setUsuarioId("")
        setMonto("0")
        setSelectedCargas([])
        setEditMode(false)
      }
    } catch (error) {
      console.error("Error al registrar el pago de carga de agua:", error)
    }
  }

  const filtrarPagos = () => {
    return pagos.filter((pago) => {
      const fechaPago = new Date(pago.fechaHora)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999) // Set to end of day
      return fechaPago >= inicio && fechaPago <= fin
    })
  }

  const pagosFiltrados = filtrarPagos()
  const totalPages = Math.ceil(pagosFiltrados.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPagos = pagosFiltrados.slice(indexOfFirstItem, indexOfLastItem)

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-2xl font-bold mb-6">Gestión de Pagos de Carga de Agua</h1>

      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => setShowFilterModal(true)}>
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
        <Button
          onClick={() => {
            setShowModal(true)
            setEditMode(false)
            setSelectedPago(null)
            setFechaHora("")
            setUsuarioId("")
            setMonto("0")
            setSelectedCargas([])
          }}
          className="bg-green-700 hover:bg-green-800 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Registrar Pago
        </Button>
      </div>

      <Card className="mb-6 border border-gray-300 shadow-sm">
        <CardHeader>
          <CardTitle>Listado de Pagos de Carga de Agua</CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <div className="space-y-4">
              {currentPagos.map((pago) => (
                <Card key={pago.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <p>
                      <strong>ID:</strong> {pago.id}
                    </p>
                    <p>
                      <strong>Usuario:</strong> {pago.usuario?.nombre || pago.usuario?.username || "N/A"}
                    </p>
                    <p>
                      <strong>Monto:</strong> Bs {pago.monto}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {new Date(pago.fechaHora).toLocaleString()}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerPago(pago)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPago(pago)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPago(pago)
                        setShowDeleteModal(true)
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-800 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-200 border-b-2 border-gray-300 shadow-md">
                <TableRow>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">ID</TableHead>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">Usuario</TableHead>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">Monto</TableHead>
                  <TableHead className="font-bold text-gray-700 border-r border-gray-300">Fecha</TableHead>
                  <TableHead className="font-bold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>{pago.id}</TableCell>
                    <TableCell>{pago.usuario?.nombre || pago.usuario?.username || "N/A"}</TableCell>
                    <TableCell>Bs {pago.monto}</TableCell>
                    <TableCell>{new Date(pago.fechaHora).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerPago(pago)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPago(pago)}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPago(pago)
                            setShowDeleteModal(true)
                          }}
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
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mt-4">
        <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <span>
          Página {currentPage} de {totalPages}
        </span>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Siguiente <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Editar Pago" : selectedPago ? "Detalles del Pago" : "Registrar Pago"}
            </DialogTitle>
          </DialogHeader>
          {selectedPago && !editMode ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Fecha y Hora:</span>
                <span className="col-span-3">{new Date(selectedPago.fechaHora).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Monto:</span>
                <span className="col-span-3">Bs {selectedPago.monto}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Usuario:</span>
                <span className="col-span-3">
                  {selectedPago.usuario?.nombre || selectedPago.usuario?.username || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Cargas:</span>
                <span className="col-span-3">{selectedPago.cargaAguaIds?.join(", ") || "N/A"}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="fechaHora" className="text-right">
                    Fecha y Hora:
                  </label>
                  <Input
                    id="fechaHora"
                    type="datetime-local"
                    value={fechaHora}
                    onChange={(e) => setFechaHora(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="usuario" className="text-right">
                    Usuario:
                  </label>
                  <Select value={usuarioId} onValueChange={handleUsuarioChange}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id.toString()}>
                          {usuario.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right">Cargas de Agua con Deuda:</label>
                  <div className="col-span-3">
                    <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                      {cargasDeuda.length === 0 ? (
                        <p className="text-center text-gray-500 py-2">No hay cargas con deuda para este usuario</p>
                      ) : (
                        cargasDeuda.map((carga) => (
                          <div key={carga.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded">
                            <Checkbox
                              id={`carga-${carga.id}`}
                              checked={selectedCargas.includes(carga.id.toString())}
                              onCheckedChange={() => handleCargaToggle(carga.id)}
                            />
                            <label htmlFor={`carga-${carga.id}`} className="flex-1 cursor-pointer text-sm">
                              Carga #{carga.id} - Costo: Bs {carga.costo || 30} - Fecha:{" "}
                              {new Date(carga.fechaHora).toLocaleDateString()}
                            </label>
                          </div>
                        ))
                      )}
                    </div>

                    {selectedCargas.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Cargas seleccionadas: {selectedCargas.length}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCargas.map((id) => {
                            const carga = cargasDeuda.find((c) => c.id.toString() === id)
                            return (
                              <Badge key={id} variant="outline" className="px-2 py-1 flex items-center gap-1">
                                <span>
                                  Carga #{id} - Bs {carga?.costo || 30}
                                </span>
                                <button
                                  type="button"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleCargaToggle(id)}
                                >
                                  <span className="sr-only">Eliminar</span>
                                  <XCircle className="h-3 w-3" />
                                </button>
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="monto" className="text-right">
                    Monto Total:
                  </label>
                  <div className="col-span-3 flex items-center">
                    <Input
                      id="monto"
                      type="number"
                      step="0.01"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="mr-2"
                      readOnly
                    />
                    <Badge className="bg-green-600">Calculado automáticamente</Badge>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={selectedCargas.length === 0}>
                  {editMode ? "Guardar Cambios" : "Registrar Pago"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>¿Está seguro que desea eliminar este pago?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => handleDeletePago(selectedPago.id)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtrar Pagos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="fechaInicio" className="text-right">
                Fecha Inicio:
              </label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="fechaFin" className="text-right">
                Fecha Fin:
              </label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setCurrentPage(1)
                setShowFilterModal(false)
              }}
            >
              Aplicar Filtros
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
