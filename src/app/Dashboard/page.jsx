"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Search } from "lucide-react"

import { Button } from "../../components/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/components/ui/card"
import { Input } from "../../components/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/components/ui/table"
import "jspdf-autotable"

import { CustomProgress } from "../../components/components/ui/custom-progress"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const Dashboard = () => {
  const [cargas, setCargas] = useState([])
  const [pagos, setPagos] = useState([])

  const defaultDates = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      start: firstDay.toISOString().split("T")[0],
      end: lastDay.toISOString().split("T")[0],
    }
  }

  const [dates, setDates] = useState({
    distribucionCargas: defaultDates(),
    topUsuarios: defaultDates(),
    cargasPorDia: defaultDates(),
    topPagadores: defaultDates(),
  })

  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("rol")
    if (role !== "admin") {
      router.push("/")
    } else {
      fetchAllData()
    }
  }, [router])

  const fetchAllData = () => {
    Object.keys(dates).forEach((key) => fetchData(key))
  }

  const fetchData = async (key) => {
    const { start, end } = dates[key]
    try {
      let response
      switch (key) {
        case "distribucionCargas":
        case "topUsuarios":
        case "cargasPorDia":
          response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/consultacargas", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ fechaInicio: start, fechaFin: end }),
          })
          if (response.ok) {
            const data = await response.json()
            setCargas(data)
          }
          break
        case "topPagadores":
          response = await fetch("https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/consultapagos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ fechaInicio: start, fechaFin: end }),
          })
          if (response.ok) {
            const data = await response.json()
            setPagos(data)
          }
          break
      }
    } catch (error) {
      console.error(`Error fetching ${key} data:`, error)
    }
  }

  const handleDateChange = (key, field, value) => {
    setDates((prevDates) => ({
      ...prevDates,
      [key]: {
        ...prevDates[key],
        [field]: value,
      },
    }))
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleString("es-ES", { month: "long" })
    const year = date.getFullYear()
    return `${day} de ${month} del ${year}`
  }

  const formatDateRange = (start, end) => {
    return `${formatDate(start)} al ${formatDate(end)}`
  }
  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <h1 className="text-3xl font-bold mb-6 text-center">Estadisticas del sistema</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="border-2 border-gray-200 shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>{`Distribución de Cargas del ${formatDateRange(dates.distribucionCargas.start, dates.distribucionCargas.end)}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                type="date"
                value={dates.distribucionCargas.start}
                onChange={(e) => handleDateChange("distribucionCargas", "start", e.target.value)}
                className="w-1/3"
              />
              <Input
                type="date"
                value={dates.distribucionCargas.end}
                onChange={(e) => handleDateChange("distribucionCargas", "end", e.target.value)}
                className="w-1/3"
              />
              <Button onClick={() => fetchData("distribucionCargas")}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Deudas</span>
                  <span>{cargas.filter((c) => c.estado === "deuda").length}</span>
                </div>
                <CustomProgress
                  value={(cargas.filter((c) => c.estado === "deuda").length / cargas.length) * 100}
                  bgColor="bg-white"
                  indicatorColor="bg-orange-500"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Pagados</span>
                  <span>{cargas.filter((c) => c.estado === "pagado").length}</span>
                </div>
                <CustomProgress
                  value={(cargas.filter((c) => c.estado === "pagado").length / cargas.length) * 100}
                  bgColor="bg-white"
                  indicatorColor="bg-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 text-center">
              <p>Número de cargas total: {cargas.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-gray-200 shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>{`Usuarios con cargas del  ${formatDateRange(dates.topUsuarios.start, dates.topUsuarios.end)}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                type="date"
                value={dates.topUsuarios.start}
                onChange={(e) => handleDateChange("topUsuarios", "start", e.target.value)}
                className="w-1/3"
              />
              <Input
                type="date"
                value={dates.topUsuarios.end}
                onChange={(e) => handleDateChange("topUsuarios", "end", e.target.value)}
                className="w-1/3"
              />
              <Button onClick={() => fetchData("topUsuarios")}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {Object.entries(
                cargas.reduce((acc, carga) => {
                  acc[carga.usuario.username] = (acc[carga.usuario.username] || 0) + 1
                  return acc
                }, {}),
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([username, count], index, arr) => (
                  <div key={username}>
                    <div className="flex justify-between mb-1">
                      <span>{username}</span>
                      <span>{count}</span>
                    </div>
                    <CustomProgress value={(count / arr[0][1]) * 100} bgColor="bg-white" indicatorColor="bg-teal-500" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <Card className="border-2 border-gray-200 shadow-md rounded-lg">
          <CardHeader>
            <CardTitle>{`Cargas por Día del ${formatDateRange(dates.cargasPorDia.start, dates.cargasPorDia.end)}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 mb-4">
              <Input
                type="date"
                value={dates.cargasPorDia.start}
                onChange={(e) => handleDateChange("cargasPorDia", "start", e.target.value)}
                className="w-1/3"
              />
              <Input
                type="date"
                value={dates.cargasPorDia.end}
                onChange={(e) => handleDateChange("cargasPorDia", "end", e.target.value)}
                className="w-1/3"
              />
              <Button onClick={() => fetchData("cargasPorDia")}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {Object.entries(
                cargas.reduce((acc, carga) => {
                  const fecha = formatDate(carga.fechaHora)
                  acc[fecha] = (acc[fecha] || 0) + 1
                  return acc
                }, {}),
              )
                .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                .map(([fecha, count]) => (
                  <div key={fecha}>
                    <div className="flex justify-between mb-1">
                      <span>{fecha}</span>
                      <span>{count}</span>
                    </div>
                    <CustomProgress value={(count / 100) * 100} bgColor="bg-white" indicatorColor="bg-teal-500" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-2 border-gray-200 shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>Usuarios con Deudas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Deudas</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(
                cargas
                  .filter((c) => c.estado === "deuda")
                  .reduce((acc, carga) => {
                    acc[carga.usuario.username] = (acc[carga.usuario.username] || 0) + 1
                    return acc
                  }, {}),
              ).map(([username, deudas]) => (
                <TableRow key={username}>
                  <TableCell>{username}</TableCell>
                  <TableCell>{deudas}</TableCell>
                  <TableCell>
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                      Bloquear
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard


