"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, CreditCard, UserCircle, Edit, Save, X, Loader2, Calendar, Shield, Clock } from "lucide-react"

import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/components/ui/tabs"
import { Badge } from "@/components/components/ui/badge"
import { Separator } from "@/components/components/ui/separator"
import { Alert, AlertDescription } from "@/components/components/ui/alert"
import { toast } from "@/components/hooks/use-toast"

export default function ProfilePage() {
  const [profile, setProfile] = useState({ nombre: "", username: "", correo: "", ci: "", rol: "" })
  const [editMode, setEditMode] = useState(false)
  const [userId, setUserId] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Solo ejecutamos este código en el cliente (browser)
    const idUser = localStorage.getItem("idUser")
    const userToken = localStorage.getItem("token")
    const userRole = localStorage.getItem("rol")

    if (!idUser || !userToken) {
      router.push("/")
      return
    }

    setUserId(idUser)
    setToken(userToken)
    setProfile((prev) => ({ ...prev, rol: userRole || "" }))
  }, [router])

  const apiUrl = userId ? `https://mi-backendsecond.onrender.com/perfil/${userId}` : ""

  useEffect(() => {
    if (userId && token) {
      fetchProfile()
    }
  }, [userId, token])

  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setProfile((prev) => ({ ...data, rol: prev.rol }))
      } else {
        setError("No se pudo cargar el perfil. Por favor, inicie sesión nuevamente.")
        setTimeout(() => router.push("/"), 2000)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      setError("Error de conexión. Verifique su conexión a internet.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setEditMode(true)
  }

  const handleCancel = () => {
    setEditMode(false)
    fetchProfile()
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setEditMode(false)
        fetchProfile()
        toast({
          title: "Perfil actualizado",
          description: "Los cambios han sido guardados correctamente.",
          duration: 3000,
        })
      } else {
        toast({
          title: "Error al guardar",
          description: "No se pudieron guardar los cambios. Inténtelo de nuevo.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error de conexión",
        description: "Verifique su conexión a internet e inténtelo de nuevo.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "propietario":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "conductor":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleLabel = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "Administrador"
      case "propietario":
        return "Propietario"
      case "conductor":
        return "Conductor"
      default:
        return "Usuario"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-600 text-lg">Cargando perfil...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const lastLogin = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - Información de perfil */}
          <div className="lg:col-span-1">
            <Card className="shadow-md border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 h-24 relative"></div>
              <div className="px-6 pb-6">
                <div className="flex justify-center -mt-12">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarFallback className="bg-blue-100 text-blue-800 text-xl">
                      {getInitials(profile.nombre)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold text-gray-800">{profile.nombre}</h2>
                  <p className="text-gray-500">@{profile.username}</p>
                  <div className="mt-2">
                    <Badge className={`${getRoleColor(profile.rol)}`}>{getRoleLabel(profile.rol)}</Badge>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{profile.correo}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <CreditCard className="h-4 w-4 mr-2" />
                    <span className="text-sm">CI: {profile.ci || "No especificado"}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">Último acceso: {lastLogin}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="shadow-md border-gray-200 mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Información de Cuenta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Shield className="h-4 w-4 mr-2" />
                      <span className="text-sm">Estado de cuenta</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Activa</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">Miembro desde</span>
                    </div>
                    <span className="text-sm text-gray-700">Enero 2023</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Edición de perfil y pestañas */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="shadow-md border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>Actualiza tus datos personales</CardDescription>
                      </div>
                      {!editMode && (
                        <Button variant="outline" size="sm" onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="nombre" className="text-sm font-medium text-gray-700">
                          Nombre Completo
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input
                            id="nombre"
                            name="nombre"
                            value={profile.nombre}
                            onChange={handleChange}
                            className={`pl-10 ${!editMode ? "bg-gray-50" : ""}`}
                            placeholder="Tu nombre completo"
                            readOnly={!editMode}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium text-gray-700">
                          Nombre de Usuario
                        </label>
                        <div className="relative">
                          <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input
                            id="username"
                            name="username"
                            value={profile.username}
                            onChange={handleChange}
                            className={`pl-10 ${!editMode ? "bg-gray-50" : ""}`}
                            placeholder="Tu nombre de usuario"
                            readOnly={!editMode}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="correo" className="text-sm font-medium text-gray-700">
                          Correo Electrónico
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input
                            id="correo"
                            name="correo"
                            type="email"
                            value={profile.correo}
                            onChange={handleChange}
                            className={`pl-10 ${!editMode ? "bg-gray-50" : ""}`}
                            placeholder="Tu correo electrónico"
                            readOnly={!editMode}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="ci" className="text-sm font-medium text-gray-700">
                          Cédula de Identidad
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                          <Input
                            id="ci"
                            name="ci"
                            value={profile.ci}
                            onChange={handleChange}
                            className={`pl-10 ${!editMode ? "bg-gray-50" : ""}`}
                            placeholder="Tu cédula de identidad"
                            readOnly={!editMode}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {editMode && (
                    <CardFooter className="flex justify-end space-x-4 pt-4 border-t">
                      <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                        <X className="h-4 w-4 mr-2" /> Cancelar
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" /> Guardar Cambios
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card className="shadow-md border-gray-200">
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>Historial de actividades en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Actualización de perfil</p>
                          <p className="text-xs text-gray-500">Actualizaste tu información personal</p>
                          <p className="text-xs text-gray-400 mt-1">Hace 2 días</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Inicio de sesión exitoso</p>
                          <p className="text-xs text-gray-500">Accediste a tu cuenta desde un nuevo dispositivo</p>
                          <p className="text-xs text-gray-400 mt-1">Hace 5 días</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Mail className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Correo electrónico verificado</p>
                          <p className="text-xs text-gray-500">Verificaste tu dirección de correo electrónico</p>
                          <p className="text-xs text-gray-400 mt-1">Hace 2 semanas</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
