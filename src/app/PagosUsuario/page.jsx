"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Filter, Calendar, DollarSign, CreditCard, ChevronLeft, ChevronRight, Download, Receipt } from "lucide-react"
import Swal from "sweetalert2"
import { jsPDF } from "jspdf"
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
import LogoWithText from '@/components/logo'; // ajusta la ruta si está en otra carpeta

// Importar componentes PWA
import OfflineIndicator from "@/components/pwa-features/offline-indicator"
import NetworkStatusHandler from "@/components/pwa-features/network-status-handler"
import InstallPrompt from "@/components/pwa-features/install-prompt"
import CacheIndicator from "@/components/pwa-features/cache-indicator"
import SyncManagerEnhanced from "@/components/pwa-features/sync-manager"
import BackgroundSyncEnhanced from "@/components/pwa-features/background-sync"

// Importar utilidades PWA
import { usePWAFeatures } from "../../hooks/use-pwa-features"
import {
  saveToIndexedDB,
  getFromIndexedDB,
  registerSyncRequest,
  initializeBackgroundSync,
} from "../../utils/pwa-helpers"

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
  const [mostrarSelect, setMostrarSelect] = useState(false)
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
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [pagoRealizado, setPagoRealizado] = useState(null)

  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState("")
  const [fechaInicio, setFechaInicio] = useState(() => {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    return lastMonth.toISOString().split("T")[0]
  })
  const [fechaFin, setFechaFin] = useState(() => new Date().toISOString().split("T")[0])
  const [showFilterDialog, setShowFilterDialog] = useState(false)

  // Estados adicionales
  const [showChargeDetailsDialog, setShowChargeDetailsDialog] = useState(false)
  const [selectedCharge, setSelectedCharge] = useState(null)
  const [filtrosActivos, setFiltrosActivos] = useState(false)
  const [todasLasCargas, setTodasLasCargas] = useState([])
  const [todasLasCargasDeuda, setTodasLasCargasDeuda] = useState([])
  const [totalTodasCargas, setTotalTodasCargas] = useState(0)
  const [totalTodasDeuda, setTotalTodasDeuda] = useState(0)

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const { isOnline, updatePendingSyncCount } = usePWAFeatures()

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      // Inicializar background sync
      initializeBackgroundSync()
      fetchUsuarios()

      const selectedUserId = localStorage.getItem("selectedUserId")
      if (selectedUserId) {
        setAutoLoadUserId(selectedUserId)
      } else {
        setMostrarSelect(true)
      }
    }
  }, [router])

  useEffect(() => {
    if (autoLoadUserId && usuarios.length > 0) {
      const user = usuarios.find((u) => u.id.toString() === autoLoadUserId.toString())
      if (user) {
        handleUsuarioChange(user.id.toString())
        setAutoLoadUserId(null)
      }
    }
  }, [usuarios, autoLoadUserId])

  useEffect(() => {
    setCurrentPage(1)
  }, [cargas, filtroEstado, fechaInicio, fechaFin, filtrosActivos])

  const fetchUsuarios = async () => {
    try {
      if (!isOnline) {
        const cachedData = await getFromIndexedDB("cache", "usuarios")
        if (cachedData) {
          const filteredUsers = cachedData.data.filter((user) => user.rol === "propietario" || user.rol === "conductor")
          setUsuarios(filteredUsers)
          return
        }
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        const filteredUsers = data.filter((user) => user.rol === "propietario" || user.rol === "conductor")
        setUsuarios(filteredUsers)

        // Guardar en caché
        await saveToIndexedDB("cache", { id: "usuarios", data, timestamp: Date.now() })
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error)

      // Cargar desde caché en caso de error
      const cachedData = await getFromIndexedDB("cache", "usuarios")
      if (cachedData) {
        const filteredUsers = cachedData.data.filter((user) => user.rol === "propietario" || user.rol === "conductor")
        setUsuarios(filteredUsers)
      }
    }
  }

  const fetchConductores = async (propietarioId) => {
    try {
      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
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
      let endpoint = ""

      if (esPropio) {
        endpoint =
          usuarioSeleccionado?.rol === "propietario"
            ? `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargasPropietario/${usuarioId}`
            : `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${usuarioId}`
      } else {
        endpoint = `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${usuarioId}`
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      if (response.ok) {
        const data = await response.json()
        data.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
        setCargas(data)
        setTotalCargas(data.length)

        const deudas = data.filter((carga) => carga.estado === "deuda")
        setCargasDeuda(deudas)

        const totalDeudaCalculado = deudas.reduce((total, carga) => total + (carga.costo || 30), 0)
        setTotalDeuda(totalDeudaCalculado)
      }
    } catch (error) {
      console.error("Error al obtener cargas del usuario:", error)
    }
  }

  const handleUsuarioChange = async (id) => {
    const usuario = usuarios.find((u) => u.id.toString() === id)
    setUsuarioSeleccionado(usuario)
    setMostrarSelect(false)

    if (usuario.rol === "propietario") {
      await fetchConductores(usuario.id)
      setActiveTab("propietario")
      await fetchTodasLasCargas(usuario.id)
    } else {
      await fetchCargasUsuario(id)
    }
  }

  const fetchTodasLasCargas = async (propietarioId) => {
    try {
      const responsePropietario = await fetch(
        `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargasPropietario/${propietarioId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )

      const cargasMap = new Map()

      if (responsePropietario.ok) {
        const cargasPropietario = await responsePropietario.json()
        cargasPropietario.forEach((carga) => {
          cargasMap.set(carga.id, {
            ...carga,
            tipoCuenta: "propietario",
          })
        })
      }

      const responseConductores = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/usuarios", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })

      if (responseConductores.ok) {
        const data = await responseConductores.json()
        const conductoresFiltrados = data.filter(
          (user) => user.rol === "conductor" && user.propietarioId === propietarioId,
        )

        for (const conductor of conductoresFiltrados) {
          const responseConductor = await fetch(
            `https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${conductor.id}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            },
          )

          if (responseConductor.ok) {
            const cargasConductor = await responseConductor.json()
            cargasConductor.forEach((carga) => {
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

      const todasCargas = Array.from(cargasMap.values())
      todasCargas.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))

      setTodasLasCargas(todasCargas)
      setTotalTodasCargas(todasCargas.length)
      setCargas(todasCargas)
      setTotalCargas(todasCargas.length)

      const deudas = todasCargas.filter((carga) => carga.estado === "deuda")
      setTodasLasCargasDeuda(deudas)
      setCargasDeuda(deudas)

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

  const handleTabChange = async (value) => {
    setActiveTab(value)

    if (value === "propietario") {
      setConductorSeleccionado(null)
      setCargas(todasLasCargas)
      setTotalCargas(totalTodasCargas)
      setCargasDeuda(todasLasCargasDeuda)
      setTotalDeuda(totalTodasDeuda)
    } else if (value === "conductores" && conductorSeleccionado) {
      await fetchCargasUsuario(conductorSeleccionado.id, false)
    }
  }

  const handleCambiarUsuario = () => {
    router.push("/UsuariosCliente")
  }

  const handleNumeroCargasChange = (e) => {
    const num = Number.parseInt(e.target.value)
    if (num > 0 && num <= cargasDeuda.length) {
      setNumeroCargasAPagar(num)
      const cargasAPagar = cargasDeuda.slice(0, num)
      const monto = cargasAPagar.reduce((total, carga) => total + (carga.costo || 30), 0)
      setMontoTotal(monto)
    }
  }

  // Función para generar número de recibo
  const generarNumeroRecibo = (pagoId, usuarioCI) => {
    const ci = usuarioCI || "000000"
    return `R${ci}${pagoId}`
  }

  // Función para generar PDF del recibo - Versión 3 corregida
  const generarPDFRecibo = (datosRecibo) => {
    // Create a half-letter sized PDF (5.5" x 8.5")
    const doc = new jsPDF({
      format: [139.7, 215.9], // Half letter size in mm
      orientation: "portrait",
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 8

    // Colores
    const azulOscuro = [0, 51, 102]
    const grisClaro = [240, 240, 240]
    const negro = [0, 0, 0]

    // Encabezado con logo y título
    doc.setFillColor(...grisClaro)
    doc.rect(0, 0, pageWidth, 22, "F")

    // Logo/Título de la empresa
    doc.setFontSize(10)
    doc.setTextColor(...azulOscuro)
    doc.setFont("helvetica", "bold")
    doc.text("DISTRIBUIDORA DE AGUA", pageWidth / 2, 7, { align: "center" })
    doc.text("LOS PINOS", pageWidth / 2, 13, { align: "center" })

    doc.setFontSize(6)
    doc.setFont("helvetica", "normal")
    doc.text("Servicio de distribución de agua potable", pageWidth / 2, 18, { align: "center" })

    // Línea separadora
    doc.setDrawColor(...azulOscuro)
    doc.setLineWidth(0.3)
    doc.line(margin, 24, pageWidth - margin, 24)

    // Título del recibo
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...negro)
    doc.text("COMPROBANTE DE PAGO", pageWidth / 2, 30, { align: "center" })

    // Información del recibo en doble columna
    let yPos = 38
    const lineHeight = 4
    const colWidth = (pageWidth - 2 * margin) / 2

    // Dibujar recuadro para la información
    doc.setDrawColor(...azulOscuro)
    doc.setLineWidth(0.3)
    doc.rect(margin, yPos - 2, pageWidth - 2 * margin, 16)

    // Primera columna de información
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)

    // Columna izquierda
    doc.text("Número:", margin + 2, yPos + 2)
    doc.setFont("helvetica", "normal")
    doc.text(datosRecibo.numeroRecibo, margin + 18, yPos + 2)

    doc.setFont("helvetica", "bold")
    doc.text("Fecha:", margin + 2, yPos + 6)
    doc.setFont("helvetica", "normal")
    doc.text(datosRecibo.fechaHora, margin + 18, yPos + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Cliente:", margin + 2, yPos + 10)
    doc.setFont("helvetica", "normal")
    // Truncar el nombre del cliente si es muy largo
    const clienteText =
      datosRecibo.cliente.length > 20 ? datosRecibo.cliente.substring(0, 20) + "..." : datosRecibo.cliente
    doc.text(clienteText, margin + 18, yPos + 10)

    // Columna derecha
    const col2X = pageWidth / 2 + 2

    doc.setFont("helvetica", "bold")
    doc.text("Tipo:", col2X, yPos + 2)
    doc.setFont("helvetica", "normal")
    doc.text(datosRecibo.tipoCliente, col2X + 16, yPos + 2)

    doc.setFont("helvetica", "bold")
    doc.text("Cargas:", col2X, yPos + 6)
    doc.setFont("helvetica", "normal")
    doc.text(datosRecibo.numeroCargas.toString(), col2X + 16, yPos + 6)

    doc.setFont("helvetica", "bold")
    doc.text("Total:", col2X, yPos + 10)
    doc.setFont("helvetica", "normal")
    doc.text(`Bs ${datosRecibo.montoTotal.toFixed(2)}`, col2X + 16, yPos + 10)

    // Detalle de cargas pagadas en tabla
    yPos = 58
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text("DETALLE DE CARGAS PAGADAS:", margin, yPos)

    yPos += 5

    // Configuración de la tabla
    const tableWidth = pageWidth - 2 * margin
    const colWidths = [22, 30, 42, 18] // Fecha, Hora, Usuario, Costo
    const rowHeight = 7

    // Encabezados de la tabla
    doc.setFillColor(...grisClaro)
    doc.rect(margin, yPos, tableWidth, rowHeight, "F")

    doc.setDrawColor(...azulOscuro)
    doc.setLineWidth(0.3)
    doc.rect(margin, yPos, tableWidth, rowHeight)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(5)
    doc.setTextColor(...negro)

    let xPos = margin + 1
    doc.text("FECHA", xPos, yPos + 4)
    xPos += colWidths[0]
    doc.text("HORA", xPos, yPos + 4)
    xPos += colWidths[1]
    doc.text("USUARIO", xPos, yPos + 4)
    xPos += colWidths[2]
    doc.text("COSTO", xPos, yPos + 4)

    yPos += rowHeight

    // Filas de datos
    doc.setFont("helvetica", "normal")
    doc.setFontSize(5)

    // Limitar el número de cargas mostradas
    const maxCargasToShow = Math.min(datosRecibo.cargasDetalle.length, 12)
    const cargasToShow = datosRecibo.cargasDetalle.slice(0, maxCargasToShow)

    cargasToShow.forEach((carga, index) => {
      const fechaCarga = new Date(carga.fechaHora).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
      const horaCarga = new Date(carga.fechaHora).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
      const usuarioCarga = (carga.usuario?.nombre || carga.usuario?.username || "N/A").substring(0, 15)

      // Dibujar bordes de la fila
      doc.setDrawColor(...azulOscuro)
      doc.setLineWidth(0.2)
      doc.rect(margin, yPos, tableWidth, rowHeight)

      // Líneas verticales
      let currentX = margin
      for (let i = 0; i < colWidths.length - 1; i++) {
        currentX += colWidths[i]
        doc.line(currentX, yPos, currentX, yPos + rowHeight)
      }

      // Contenido de la fila
      xPos = margin + 1
      doc.text(fechaCarga, xPos, yPos + 4)
      xPos += colWidths[0]
      doc.text(horaCarga, xPos, yPos + 4)
      xPos += colWidths[1]
      doc.text(usuarioCarga, xPos, yPos + 4)
      xPos += colWidths[2]
      doc.text(`Bs ${carga.costo}`, xPos, yPos + 4)

      yPos += rowHeight
    })

    // Si hay más cargas de las que se muestran, indicarlo
    if (datosRecibo.cargasDetalle.length > maxCargasToShow) {
      yPos += 2
      doc.setFont("helvetica", "italic")
      doc.setFontSize(4)
      doc.text(`... y ${datosRecibo.cargasDetalle.length - maxCargasToShow} cargas más`, margin, yPos)
      yPos += 3
    }

    // Pie del recibo
    yPos += 5
    doc.setDrawColor(...azulOscuro)
    doc.line(margin, yPos, pageWidth - margin, yPos)

    yPos += 4
    doc.setFont("helvetica", "italic")
    doc.setFontSize(4)
    doc.text("Este comprobante es válido como constancia de pago.", pageWidth / 2, yPos, { align: "center" })
    doc.text("Distribuidora de Agua Los Pinos", pageWidth / 2, yPos + 3, { align: "center" })
    doc.text(`Generado: ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 6, { align: "center" })

    // Guardar PDF
    doc.save(`recibo_${datosRecibo.numeroRecibo}.pdf`)
  }

  const handlePagar = async () => {
    if (numeroCargasAPagar <= 0 || numeroCargasAPagar > cargasDeuda.length) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Número de cargas a pagar inválido",
      })
      return
    }

    const cargasAPagar = cargasDeuda.slice(0, numeroCargasAPagar)
    const cargaIds = cargasAPagar.map((carga) => carga.id)
    const montoCalculado = cargasAPagar.reduce((total, carga) => total + (carga.costo || 30), 0)

    let usuarioIdPago
    if (activeTab === "conductores" && conductorSeleccionado) {
      usuarioIdPago = conductorSeleccionado.id
    } else {
      usuarioIdPago = usuarioSeleccionado.id
    }

    const datosPago = {
      usuarioId: usuarioIdPago,
      monto: montoCalculado,
      cargaAguaIds: cargaIds,
      fechaHora: new Date().toISOString(),
    }

    try {
      if (!isOnline) {
        // Registrar para sincronización offline
        await registerSyncRequest(
          "https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua",
          "POST",
          datosPago,
        )

        // Simular resultado del pago para generar recibo
        const resultado = { id: `temp_${Date.now()}` }

        // Preparar datos del recibo
        const datosRecibo = {
          numeroRecibo: generarNumeroRecibo(resultado.id, usuarioSeleccionado.ci),
          fechaHora: new Date().toLocaleString(),
          cliente:
            activeTab === "conductores" && conductorSeleccionado
              ? conductorSeleccionado.nombre
              : usuarioSeleccionado.nombre,
          tipoCliente: activeTab === "conductores" && conductorSeleccionado ? "Conductor" : usuarioSeleccionado.rol,
          numeroCargas: numeroCargasAPagar,
          montoTotal: montoCalculado,
          cargasDetalle: cargasAPagar,
          pagoId: resultado.id,
        }

        setPagoRealizado(datosRecibo)
        setShowPaymentDialog(false)
        setShowReceiptDialog(true)

        updatePendingSyncCount(true)

        Swal.fire({
          icon: "success",
          title: "Pago registrado",
          text: "El pago se procesará cuando vuelva la conexión",
          timer: 3000,
          showConfirmButton: false,
        })

        setNumeroCargasAPagar(1)
        setMontoTotal(0)
        return
      }

      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/pagoscargagua", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(datosPago),
      })

      if (response.ok) {
        const resultado = await response.json()

        // Preparar datos del recibo
        const datosRecibo = {
          numeroRecibo: generarNumeroRecibo(resultado.id, usuarioSeleccionado.ci),
          fechaHora: new Date().toLocaleString(),
          cliente:
            activeTab === "conductores" && conductorSeleccionado
              ? conductorSeleccionado.nombre
              : usuarioSeleccionado.nombre,
          tipoCliente: activeTab === "conductores" && conductorSeleccionado ? "Conductor" : usuarioSeleccionado.rol,
          numeroCargas: numeroCargasAPagar,
          montoTotal: montoCalculado,
          cargasDetalle: cargasAPagar,
          pagoId: resultado.id,
        }

        setPagoRealizado(datosRecibo)
        setShowPaymentDialog(false)
        setShowReceiptDialog(true)

        // Actualizar datos
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

  const filtrarCargas = () => {
    if (!filtrosActivos) {
      return cargas
    }

    return cargas.filter((carga) => {
      const fechaCarga = new Date(carga.fechaHora)
      const inicio = new Date(fechaInicio)
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999)

      const cumpleFecha = fechaCarga >= inicio && fechaCarga <= fin
      const cumpleEstado = filtroEstado ? carga.estado === filtroEstado : true

      return cumpleFecha && cumpleEstado
    })
  }

  const cargasFiltradas = filtrarCargas()

  const getPaginatedData = (data, page, itemsPerPage) => {
    const startIndex = (page - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems, itemsPerPage) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const paginatedCargas = getPaginatedData(cargasFiltradas, currentPage, itemsPerPage)
  const totalPages = getTotalPages(cargasFiltradas.length, itemsPerPage)

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
      const response = await fetch(`https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/cargagua/${chargeId}`, {
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
    <NetworkStatusHandler onOffline={() => console.log("Modo offline activado")} onOnline={() => fetchUsuarios()}>
      <div className="container mx-auto px-4 py-8 mt-16 max-w-5xl">
       <div className="bg-white rounded-lg shadow-md border border-gray-300 mb-6 overflow-hidden">
    <div className="px-6 py-4">
      <div className="flex items-center gap-3 justify-center">
        <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-full flex items-center justify-center shadow-lg border border-gray-300">
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 8V6M12 6V4M12 6H10M12 6H14" strokeWidth="2"/>
            <path d="M17 10H19C20.1046 10 21 10.8954 21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V12C3 10.8954 3.89543 10 5 10H7" strokeWidth="1.5"/>
            <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" strokeWidth="1.5"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-black tracking-tight">Pago por usuario</h1>
      </div>
    </div>
    <div className="h-1 bg-gradient-to-r from-green-600 to-green-800"></div>
  </div>
<LogoWithText logoSize="h-20 w-20" textSize="text-1l" />


        <InstallPrompt />
        <SyncManagerEnhanced
          onSync={() => {
            fetchUsuarios()
            if (usuarioSeleccionado) {
              if (activeTab === "conductores" && conductorSeleccionado) {
                fetchCargasUsuario(conductorSeleccionado.id, false)
              } else {
                fetchCargasUsuario(usuarioSeleccionado.id)
              }
            }
          }}
        />
        <CacheIndicator />
        <BackgroundSyncEnhanced
          syncTag="usuario-detalles-sync"
          onSyncRegistered={() => console.log("Sync registrado para usuario detalles")}
          onSyncError={(error) => console.error("Error en Background Sync:", error)}
        />

        <>
          <Card className="mb-6 shadow-md border-2 border-gray-300 rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Información del Usuario</CardTitle>
              <Button variant="outline" onClick={handleCambiarUsuario}>
                Cambiar Usuario
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="lg:w-1/2">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="/placeholder.svg?height=80&width=80" alt={usuarioSeleccionado?.nombre} />
                      <AvatarFallback className="text-xl bg-gray-100">
                        {getInitials(usuarioSeleccionado?.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                        <p className="text-base">{usuarioSeleccionado?.nombre}</p>
                      </div>
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-500">Correo</h3>
                        <p className="text-base">{usuarioSeleccionado?.correo || "No disponible"}</p>
                      </div>
                      <div className="mb-3">
                        <h3 className="text-sm font-medium text-gray-500">CI</h3>
                        <p className="text-base">{usuarioSeleccionado?.ci || "No disponible"}</p>
                      </div>
                      <Badge className="mt-1">{usuarioSeleccionado?.rol}</Badge>
                    </div>
                  </div>
                </div>

                <div className="lg:w-1/2">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500">Total de Cargas</h4>
                      <div className="flex items-center mt-2">
                        <Calendar className="h-5 w-5 mr-2 text-gray-900" />
                        <span className="text-xl font-bold">{totalCargas}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500">Cargas con Deuda</h4>
                      <div className="flex items-center mt-2">
                        <CreditCard className="h-5 w-5 mr-2 text-amber-600" />
                        <span className="text-xl font-bold">{cargasDeuda.length}</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500">Total Deuda</h4>
                      <div className="flex items-center mt-2">
                        <DollarSign className="h-5 w-5 mr-2 text-red-600" />
                        <span className="text-xl font-bold">Bs{totalDeuda}</span>
                      </div>
                      <Button
                        className="w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => {
                          setNumeroCargasAPagar(Math.min(cargasDeuda.length, 1))
                          setMontoTotal(cargasDeuda.length > 0 ? cargasDeuda[0].costo || 30 : 0)
                          setShowPaymentDialog(true)
                        }}
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
              <TabsList className="grid w-full grid-cols-2 border-2 border-gray-300">
                <TabsTrigger value="propietario">Cargas del Propietario</TabsTrigger>
                <TabsTrigger value="conductores">Cargas de Conductores</TabsTrigger>
              </TabsList>

              <TabsContent value="propietario">
                {/* Contenido vacío ya que el resumen ahora está en la tarjeta de información del usuario */}
              </TabsContent>

              <TabsContent value="conductores">
                <Card className="mb-6 shadow-md border-2 border-gray-300 rounded-lg">
                  <CardHeader>
                    <CardTitle>Seleccionar Conductor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {conductores.length === 0 ? (
                      <p className="text-center py-4 text-gray-500">No hay conductores asociados a este propietario.</p>
                    ) : (
                      <Select onValueChange={handleConductorChange} value={conductorSeleccionado?.id?.toString()}>
                        <SelectTrigger className="border-2 border-gray-300">
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
                  <Card className="shadow-md mb-6 border-2 border-gray-300 rounded-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Resumen de Cargas - {conductorSeleccionado.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-gray-200">
                          <h4 className="text-sm font-medium text-gray-500">Total de Cargas</h4>
                          <div className="flex items-center mt-2">
                            <Calendar className="h-5 w-5 mr-2 text-gray-900" />
                            <span className="text-xl font-bold">{totalCargas}</span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-gray-200">
                          <h4 className="text-sm font-medium text-gray-500">Cargas con Deuda</h4>
                          <div className="flex items-center mt-2">
                            <CreditCard className="h-5 w-5 mr-2 text-amber-600" />
                            <span className="text-xl font-bold">{cargasDeuda.length}</span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg shadow-sm border-2 border-gray-200">
                          <h4 className="text-sm font-medium text-gray-500">Total Deuda</h4>
                          <div className="flex items-center mt-2">
                            <DollarSign className="h-5 w-5 mr-2 text-red-600" />
                            <span className="text-xl font-bold">Bs{totalDeuda}</span>
                          </div>
                          <Button
                            className="w-full mt-3 bg-gray-900 hover:bg-gray-800 text-white"
                            onClick={() => {
                              setNumeroCargasAPagar(Math.min(cargasDeuda.length, 1))
                              setMontoTotal(cargasDeuda.length > 0 ? cargasDeuda[0].costo || 30 : 0)
                              setShowPaymentDialog(true)
                            }}
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

          <Card className="mb-6 shadow-md border-2 border-gray-300 rounded-lg">
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
                <div className="space-y-4">
                  {paginatedCargas.map((carga) => (
                    <Card
                      key={carga.id}
                      className="shadow-sm hover:shadow-md transition-shadow duration-200 border-2 border-gray-200"
                    >
                      <CardContent className="p-4">
                        <p>
                          <strong>Fecha y Hora:</strong>{" "}
                          {new Date(carga.fechaHora).toLocaleDateString("es-ES", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          {new Date(carga.fechaHora).toLocaleTimeString("es-ES")}
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
                          <strong>Usuario:</strong>{" "}
                          {carga.usuario?.nombre || carga.usuario?.username || carga.conductorNombre || "N/A"}
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
                      </CardFooter>
                    </Card>
                  ))}

                  <div className="flex justify-between items-center mt-4">
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      className="border-2 border-gray-300"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                    <span>
                      Página {currentPage} de {totalPages || 1}
                    </span>
                    <Button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      variant="outline"
                      className="border-2 border-gray-300"
                    >
                      Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-[3px] border-gray-600 rounded-lg overflow-hidden shadow-xl">
                  <Table className="w-full border-collapse">
                    <TableHeader className="bg-gray-700">
                      <TableRow className="border-b-0">
                        <TableHead className="font-bold text-white py-4 border-0">Fecha y Hora</TableHead>
                        <TableHead className="font-bold text-white py-4 border-0">Estado</TableHead>
                        <TableHead className="font-bold text-white py-4 border-0">Costo</TableHead>
                        <TableHead className="font-bold text-white py-4 border-0">Usuario</TableHead>
                        <TableHead className="font-bold text-white py-4 border-0">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCargas.map((carga) => (
                        <TableRow key={carga.id} className="border-0 hover:bg-gray-50">
                          <TableCell className="border-0 py-3">
                            {new Date(carga.fechaHora).toLocaleDateString("es-ES", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}{" "}
                            {new Date(carga.fechaHora).toLocaleTimeString("es-ES")}
                          </TableCell>
                          <TableCell className="border-0 py-3">
                            <Badge className={carga.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>
                              {carga.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="border-0 py-3">Bs{carga.costo || 30}</TableCell>
                          <TableCell className="border-0 py-3">
                            {carga.usuario?.nombre || carga.usuario?.username || carga.conductorNombre || "N/A"}
                          </TableCell>
                          <TableCell className="border-0 py-3">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchChargeDetails(carga.id)}
                                className="bg-gray-900 hover:bg-gray-800 text-white border-gray-700"
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!isMobile && cargasFiltradas.length > 0 && (
                <div className="flex justify-between items-center mt-6">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="border-2 border-gray-300"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                  </Button>
                  <span>
                    Página {currentPage} de {totalPages || 1}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    variant="outline"
                    className="border-2 border-gray-300"
                  >
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>

        {/* Diálogo de Pago Simplificado */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="border-2 border-gray-300 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Receipt className="mr-2 h-5 w-5" />
                Realizar Pago
              </DialogTitle>
              <DialogDescription>
                Seleccione el número de cargas a pagar. Se pagarán las cargas más antiguas primero.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {!isOnline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span className="text-sm">Sin conexión - El pago se procesará cuando vuelva la conexión</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="numeroCargasAPagar">Número de Cargas a Pagar:</Label>
                <Input
                  id="numeroCargasAPagar"
                  type="number"
                  min="1"
                  max={cargasDeuda.length}
                  value={numeroCargasAPagar}
                  onChange={handleNumeroCargasChange}
                  className="border-2 border-gray-300"
                />
                <p className="text-sm text-gray-500">Máximo: {cargasDeuda.length} cargas pendientes</p>
              </div>

              <div className="space-y-2">
                <Label>Monto Total a Pagar:</Label>
                <div className="text-2xl font-bold text-green-600">Bs {montoTotal.toFixed(2)}</div>
              </div>

              {numeroCargasAPagar > 0 && (
                <div className="space-y-2">
                  <Label>Cargas que se pagarán:</Label>
                  <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-gray-50">
                    {cargasDeuda.slice(0, numeroCargasAPagar).map((carga, index) => (
                      <div key={carga.id} className="flex justify-between text-sm py-1">
                        <span>
                          #{carga.id} - {new Date(carga.fechaHora).toLocaleDateString()}
                        </span>
                        <span className="font-medium">Bs {carga.costo || 30}</span>
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
              <Button onClick={handlePagar} className="bg-green-600 hover:bg-green-700 text-white">
                <Receipt className="mr-2 h-4 w-4" />
                Confirmar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Recibo */}
        <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
          <DialogContent className="border-2 border-gray-300 max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center text-green-600">
                <Receipt className="mr-2 h-5 w-5" />
                ¡Pago Realizado con Éxito!
              </DialogTitle>
            </DialogHeader>
            {pagoRealizado && (
              <div className="space-y-4">
                {/* Encabezado del recibo */}
                <div className="text-center border-b pb-4">
                  <h3 className="text-lg font-bold text-blue-900">DISTRIBUIDORA DE AGUA LOS PINOS</h3>
                  <p className="text-sm text-gray-600">Comprobante de Pago</p>
                </div>

                {/* Información del recibo */}
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Número de Recibo:</span>
                      <p className="text-blue-600 font-mono">{pagoRealizado.numeroRecibo}</p>
                    </div>
                    <div>
                      <span className="font-medium">Fecha y hora:</span>
                      <p>{pagoRealizado.fechaHora}</p>
                    </div>
                    <div>
                      <span className="font-medium">Cliente:</span>
                      <p>{pagoRealizado.cliente}</p>
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span>
                      <p>{pagoRealizado.tipoCliente}</p>
                    </div>
                    <div>
                      <span className="font-medium">Cargas pagadas:</span>
                      <p className="font-bold">{pagoRealizado.numeroCargas}</p>
                    </div>
                    <div>
                      <span className="font-medium">Importe total:</span>
                      <p className="text-green-600 font-bold text-lg">Bs {pagoRealizado.montoTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Detalle de cargas */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Detalle de cargas pagadas:</h4>
                  <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs space-y-2">
                    {pagoRealizado.cargasDetalle.map((carga, index) => (
                      <div key={carga.id} className="p-2 bg-gray-50 rounded border-l-2 border-blue-500">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">Carga #{carga.id}</p>
                            <p className="text-gray-600">
                              {new Date(carga.fechaHora).toLocaleDateString("es-ES", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              -{" "}
                              {new Date(carga.fechaHora).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-gray-600">
                              Usuario: {carga.usuario?.nombre || carga.usuario?.username || "N/A"}
                            </p>
                          </div>
                          <span className="font-bold text-green-600">Bs {carga.costo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pie del recibo */}
                <div className="text-center text-xs text-gray-500 border-t pt-2">
                  <p>Este comprobante es válido como constancia de pago</p>
                  <p>Sistema de Gestión - Los Pinos</p>
                </div>
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => pagoRealizado && generarPDFRecibo(pagoRealizado)}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
              <Button onClick={() => setShowReceiptDialog(false)} className="bg-green-600 hover:bg-green-700">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Filtros */}
        <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
          <DialogContent className="border-2 border-gray-300">
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
                    <SelectTrigger className="col-span-3 border-2 border-gray-300">
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
                    className="col-span-3 border-2 border-gray-300"
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
                    className="col-span-3 border-2 border-gray-300"
                    disabled={!filtrosActivos}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowFilterDialog(false)} className="border-2 border-gray-300">
                {filtrosActivos ? "Aplicar Filtros" : "Cerrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Detalles de Carga */}
        <Dialog open={showChargeDetailsDialog} onOpenChange={setShowChargeDetailsDialog}>
          <DialogContent className="border-2 border-gray-300">
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
              <Button onClick={() => setShowChargeDetailsDialog(false)} className="border-2 border-gray-300">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </NetworkStatusHandler>
  )
}
