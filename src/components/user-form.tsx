"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/components/ui/button"
import { Input } from "@/components/components/ui/input"
import { Label } from "@/components/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/components/ui/select"
import { Alert, AlertDescription } from "@/components/components/ui/alert"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

interface FormErrors {
  nombre?: string[]
  correo?: string[]
  ci?: string[]
  username?: string[]
  password?: string[]
  rol?: string[]
  numeroTarjetaRFID?: string[]
  propietarioId?: string[]
  general?: string[]
}

interface UserFormProps {
  formData: any
  onInputChange: (key: string, value: any) => void
  onSubmit: (e: React.FormEvent) => void
  editMode: boolean
  propietarios: any[]
  errors: FormErrors
  isSubmitting?: boolean
}

export default function UserForm({
  formData,
  onInputChange,
  onSubmit,
  editMode,
  propietarios,
  errors,
  isSubmitting = false,
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const getFieldError = (fieldName: string) => {
    return errors[fieldName as keyof FormErrors]?.[0]
  }

  const hasFieldError = (fieldName: string) => {
    return Boolean(errors[fieldName as keyof FormErrors]?.length)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Errores generales */}
      {errors.general && errors.general.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {errors.general.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 py-4">
        {/* Nombre */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nombre" className="text-right">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <div className="col-span-3">
            <Input
              id="nombre"
              type="text"
              value={formData.nombre || ""}
              onChange={(e) => onInputChange("nombre", e.target.value)}
              className={hasFieldError("nombre") ? "border-red-500" : ""}
              placeholder="Ingrese el nombre completo"
            />
            {hasFieldError("nombre") && <p className="text-red-500 text-sm mt-1">{getFieldError("nombre")}</p>}
          </div>
        </div>

        {/* Username */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="username" className="text-right">
            Username <span className="text-red-500">*</span>
          </Label>
          <div className="col-span-3">
            <Input
              id="username"
              type="text"
              value={formData.username || ""}
              onChange={(e) => onInputChange("username", e.target.value)}
              className={hasFieldError("username") ? "border-red-500" : ""}
              placeholder="Ingrese el nombre de usuario"
            />
            {hasFieldError("username") && <p className="text-red-500 text-sm mt-1">{getFieldError("username")}</p>}
          </div>
        </div>

        {/* Correo */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="correo" className="text-right">
            Correo <span className="text-red-500">*</span>
          </Label>
          <div className="col-span-3">
            <Input
              id="correo"
              type="email"
              value={formData.correo || ""}
              onChange={(e) => onInputChange("correo", e.target.value)}
              className={hasFieldError("correo") ? "border-red-500" : ""}
              placeholder="ejemplo@correo.com"
            />
            {hasFieldError("correo") && <p className="text-red-500 text-sm mt-1">{getFieldError("correo")}</p>}
          </div>
        </div>

        {/* CI */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="ci" className="text-right">
            Cédula <span className="text-red-500">*</span>
          </Label>
          <div className="col-span-3">
            <Input
              id="ci"
              type="text"
              value={formData.ci || ""}
              onChange={(e) => onInputChange("ci", e.target.value)}
              className={hasFieldError("ci") ? "border-red-500" : ""}
              placeholder="Ingrese la cédula de identidad"
            />
            {hasFieldError("ci") && <p className="text-red-500 text-sm mt-1">{getFieldError("ci")}</p>}
          </div>
        </div>

        {/* Password */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            Contraseña {!editMode && <span className="text-red-500">*</span>}
          </Label>
          <div className="col-span-3">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password || ""}
                onChange={(e) => onInputChange("password", e.target.value)}
                className={hasFieldError("password") ? "border-red-500 pr-10" : "pr-10"}
                placeholder={editMode ? "Dejar vacío para mantener actual" : "Ingrese la contraseña"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {hasFieldError("password") && (
              <div className="text-red-500 text-sm mt-1">
                <p>La contraseña debe:</p>
                <ul className="list-disc list-inside ml-2">
                  {errors.password?.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Rol */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="rol" className="text-right">
            Rol <span className="text-red-500">*</span>
          </Label>
          <div className="col-span-3">
            <Select value={formData.rol || ""} onValueChange={(value) => onInputChange("rol", value)}>
              <SelectTrigger className={hasFieldError("rol") ? "border-red-500" : ""}>
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="propietario">Propietario</SelectItem>
                <SelectItem value="conductor">Conductor</SelectItem>
              </SelectContent>
            </Select>
            {hasFieldError("rol") && <p className="text-red-500 text-sm mt-1">{getFieldError("rol")}</p>}
          </div>
        </div>

        {/* Propietario (solo para conductores) */}
        {formData.rol === "conductor" && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="propietarioId" className="text-right">
              Propietario <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              <Select
                value={formData.propietarioId?.toString() || ""}
                onValueChange={(value) => onInputChange("propietarioId", Number.parseInt(value))}
              >
                <SelectTrigger className={hasFieldError("propietarioId") ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccione un propietario" />
                </SelectTrigger>
                <SelectContent>
                  {propietarios.map((prop) => (
                    <SelectItem key={prop.id} value={prop.id.toString()}>
                      {prop.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFieldError("propietarioId") && (
                <p className="text-red-500 text-sm mt-1">{getFieldError("propietarioId")}</p>
              )}
            </div>
          </div>
        )}

        {/* Tarjeta RFID */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="numeroTarjetaRFID" className="text-right">
            Tarjeta RFID
          </Label>
          <div className="col-span-3">
            <Input
              id="numeroTarjetaRFID"
              type="text"
              value={formData.numeroTarjetaRFID || ""}
              onChange={(e) => onInputChange("numeroTarjetaRFID", e.target.value)}
              className={hasFieldError("numeroTarjetaRFID") ? "border-red-500" : ""}
              placeholder="Número de tarjeta RFID (opcional)"
            />
            {hasFieldError("numeroTarjetaRFID") && (
              <p className="text-red-500 text-sm mt-1">{getFieldError("numeroTarjetaRFID")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          {isSubmitting ? "Guardando..." : editMode ? "Actualizar Usuario" : "Crear Usuario"}
        </Button>
      </div>
    </form>
  )
}
