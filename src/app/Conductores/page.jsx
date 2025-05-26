"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, Truck, DollarSign } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Badge } from "../../components/components/ui/badge"

const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  return windowWidth
}

export default function OwnerDriversTable() {
  const windowWidth = useWindowWidth()
  const isMobile = windowWidth < 768
  const [drivers, setDrivers] = useState([])
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showChargesDialog, setShowChargesDialog] = useState(false)
  const [showPaymentsDialog, setShowPaymentsDialog] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  const [charges, setCharges] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const router = useRouter()

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true)
      const token = localStorage.getItem("token")
      const ownerId = localStorage.getItem("idUser")
      const url = `https://mi-backendsecond.onrender.com/conductores/${ownerId}`

      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          setDrivers(data)
        } else if (response.status === 401) {
          router.push("/")
        }
      } catch (error) {
        console.error("Error fetching drivers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDrivers()
  }, [router])

  const handleViewDriver = (driver) => {
    setSelectedDriver(driver)
    setShowDetailsDialog(true)
  }

  const handleViewCharges = async (driverId) => {
    setLoading(true)
    const token = localStorage.getItem("token")
    const url = `https://mi-backendsecond.onrender.com/cargascliente/${driverId}`

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCharges(data)
        setShowChargesDialog(true)
      }
    } catch (error) {
      console.error("Error fetching charges:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPayments = async (driverId) => {
    setLoading(true)
    const token = localStorage.getItem("token")
    const url = `https://mi-backendsecond.onrender.com/pagoscliente/${driverId}`

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPayments(data)
        setShowPaymentsDialog(true)
      }
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderTable = () => (
    <div className="border-[3px] border-gray-600 rounded-lg overflow-hidden shadow-xl">
      <Table className="w-full border-collapse">
        <TableHeader className="bg-gray-700">
          <TableRow className="border-b-0">
            <TableHead className="font-bold text-white py-4 border-0">Nombre</TableHead>
            <TableHead className="font-bold text-white py-4 border-0">CI</TableHead>
            <TableHead className="font-bold text-white py-4 border-0">Ver</TableHead>
            <TableHead className="font-bold text-white py-4 border-0">Cargas Realizadas</TableHead>
            <TableHead className="font-bold text-white py-4 border-0">Pagos Realizados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver.id} className="border-0 hover:bg-gray-50">
              <TableCell className="border-0 py-3">{driver.nombre}</TableCell>
              <TableCell className="border-0 py-3">{driver.ci}</TableCell>
              <TableCell className="border-0 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  onClick={() => handleViewDriver(driver)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="border-0 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-500 hover:text-green-700 hover:bg-green-50 border-green-200"
                  onClick={() => handleViewCharges(driver.id)}
                >
                  <Truck className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="border-0 py-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                  onClick={() => handleViewPayments(driver.id)}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  const renderCards = () => (
    <div className="space-y-4">
      {drivers.map((driver) => (
        <Card key={driver.id} className="border-2 border-gray-300 shadow-md">
          <CardHeader className="bg-gray-700 text-white p-3">
            <CardTitle className="text-lg">{driver.nombre}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">CI:</span>
              <span>{driver.ci}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-around p-3 bg-gray-100">
            <Button
              size="sm"
              variant="outline"
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => handleViewDriver(driver)}
            >
              <Eye className="h-4 w-4 mr-1" /> Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-green-500 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => handleViewCharges(driver.id)}
            >
              <Truck className="h-4 w-4 mr-1" /> Cargas
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
              onClick={() => handleViewPayments(driver.id)}
            >
              <DollarSign className="h-4 w-4 mr-1" /> Pagos
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Conductores Asociados</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>{isMobile ? renderCards() : renderTable()}</>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-blue-700">Detalles del Conductor</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Nombre:</span>
                <span className="col-span-3">{selectedDriver.nombre}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">CI:</span>
                <span className="col-span-3">{selectedDriver.ci}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Username:</span>
                <span className="col-span-3">{selectedDriver.username}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showChargesDialog} onOpenChange={setShowChargesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-green-700">Cargas Realizadas</DialogTitle>
          </DialogHeader>
          {charges.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No hay cargas realizadas por este usuario.</p>
          ) : (
            <div className="border-[2px] border-gray-600 rounded-lg overflow-hidden shadow-md">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-gray-700">
                  <TableRow className="border-b-0">
                    <TableHead className="font-bold text-white py-3 border-0">Fecha y Hora</TableHead>
                    <TableHead className="font-bold text-white py-3 border-0">Estado</TableHead>
                    <TableHead className="font-bold text-white py-3 border-0">Nombre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.map((charge) => (
                    <TableRow key={charge.id} className="border-0 hover:bg-gray-50">
                      <TableCell className="border-0 py-2">{formatDate(charge.fechaHora)}</TableCell>
                      <TableCell className="border-0 py-2">
                        <Badge className={charge.estado === "deuda" ? "bg-red-500" : "bg-green-500"}>
                          {charge.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-0 py-2">{charge.usuario.nombre}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentsDialog} onOpenChange={setShowPaymentsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-amber-700">Pagos Realizados</DialogTitle>
          </DialogHeader>
          {payments.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No hay pagos realizados por este usuario.</p>
          ) : (
            <div className="border-[2px] border-gray-600 rounded-lg overflow-hidden shadow-md">
              <Table className="w-full border-collapse">
                <TableHeader className="bg-gray-700">
                  <TableRow className="border-b-0">
                    <TableHead className="font-bold text-white py-3 border-0">Fecha y Hora</TableHead>
                    <TableHead className="font-bold text-white py-3 border-0">Monto</TableHead>
                    <TableHead className="font-bold text-white py-3 border-0">Nombre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="border-0 hover:bg-gray-50">
                      <TableCell className="border-0 py-2">{formatDate(payment.fechaHora)}</TableCell>
                      <TableCell className="border-0 py-2">Bs {payment.monto}</TableCell>
                      <TableCell className="border-0 py-2">{payment.usuario.nombre}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
