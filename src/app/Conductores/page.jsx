"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, Truck, DollarSign } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/components/ui/dialog"
import { Card, CardContent, CardFooter } from "../../components/components/ui/card"

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

  const router = useRouter()

  useEffect(() => {
    const fetchDrivers = async () => {
      const token = localStorage.getItem("token")
      const ownerId = localStorage.getItem("idUser")
      const url = `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/conductores/${ownerId}`

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
      }
    }

    fetchDrivers()
  }, [router])

  const handleViewDriver = (driver) => {
    setSelectedDriver(driver)
    setShowDetailsDialog(true)
  }

  const handleViewCharges = async (driverId) => {
    const token = localStorage.getItem("token")
    const url = `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/cargascliente/${driverId}`

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
    }
  }

  const handleViewPayments = async (driverId) => {
    const token = localStorage.getItem("token")
    const url = `https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/pagoscliente/${driverId}`

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
    <Table className="border border-gray-200">
      <TableHeader className="bg-gray-300">
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>CI</TableHead>
          <TableHead>Ver</TableHead>
          <TableHead>Cargas Realizadas</TableHead>
          <TableHead>Pagos Realizados</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drivers.map((driver) => (
          <TableRow key={driver.id}>
            <TableCell>{driver.nombre}</TableCell>
            <TableCell>{driver.ci}</TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                onClick={() => handleViewDriver(driver)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="outline"
                className="text-green-500 hover:text-green-700 hover:bg-green-50 border-green-200"
                onClick={() => handleViewCharges(driver.id)}
              >
                <Truck className="h-4 w-4" />
              </Button>
            </TableCell>
            <TableCell>
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
  )

  const renderCards = () => (
    <div className="space-y-4">
      {drivers.map((driver) => (
        <Card key={driver.id} className="border border-gray-200">
          <CardContent className="p-4 bg-gray-300">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">Nombre:</span>
              <span>{driver.nombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">CI:</span>
              <span>{driver.ci}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-around">
            <Button
              size="sm"
              variant="outline"
              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
              onClick={() => handleViewDriver(driver)}
            >
              <Eye className="h-4 w-4 mr-2" /> Ver
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-green-500 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => handleViewCharges(driver.id)}
            >
              <Truck className="h-4 w-4 mr-2" /> Cargas
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
              onClick={() => handleViewPayments(driver.id)}
            >
              <DollarSign className="h-4 w-4 mr-2" /> Pagos
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 pt-20 pb-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Conductores Asociados</h1>

      {isMobile ? renderCards() : renderTable()}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Conductor</DialogTitle>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargas Realizadas</DialogTitle>
          </DialogHeader>
          {charges.length === 0 ? (
            <p>No hay cargas realizadas por este usuario.</p>
          ) : (
            <Table className="border border-gray-200">
              <TableHeader className="bg-gray-300">
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nombre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {charges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{formatDate(charge.fechaHora)}</TableCell>
                    <TableCell>{charge.estado}</TableCell>
                    <TableCell>{charge.usuario.nombre}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentsDialog} onOpenChange={setShowPaymentsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagos Realizados</DialogTitle>
          </DialogHeader>
          {payments.length === 0 ? (
            <p>No hay pagos realizados por este usuario.</p>
          ) : (
            <Table className="border border-gray-200">
              <TableHeader className="bg-gray-300">
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Nombre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.fechaHora)}</TableCell>
                    <TableCell>{payment.monto}</TableCell>
                    <TableCell>{payment.usuario.nombre}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

