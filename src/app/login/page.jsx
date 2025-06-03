"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Page() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [correo, setCorreo] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState(false)

  const handleLogin = async () => {
    try {
      const response = await fetch("https://zneeyt2ar7.execute-api.us-east-1.amazonaws.com/dev/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        const { token, rol, idUser } = data

        localStorage.setItem("token", token)
        localStorage.setItem("rol", rol)
        localStorage.setItem("idUser", idUser)

        if (rol === "admin") router.push("/Home")
        else if (rol === "propietario") router.push("/HomePro")
        else if (rol === "conductor") router.push("/ClienteHome")
      } else {
        setLoginError(true)
      }
    } catch (error) {
      console.error("Error:", error)
      setLoginError(true)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1a3a5f]">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-6">
          <Image src="/logo2.png" alt="Logo" width={100} height={100} />
        </div>

        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">Inicio de sesión</h1>

        <input
          type="text"
          placeholder="Nombre de usuario o correo"
          className="w-full p-3 border rounded-md text-black focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          value={username !== "" ? username : correo}
          onChange={(e) => {
            setUsername(e.target.value)
            setCorreo(e.target.value)
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {loginError && <p className="text-red-500 text-sm mt-2">Credenciales incorrectas. Inténtalo nuevamente.</p>}

        <button
          onClick={handleLogin}
          disabled={!username || !password}
          className={`w-full mt-6 p-3 text-white rounded-md ${
            !username || !password ? "bg-gray-400 cursor-not-allowed" : "bg-[#2c7be5] hover:bg-[#1a68d1]"
          }`}
        >
          
          LOS PINOS Iniciar sesión
        </button>
      </div>
    </div>
  )
}
