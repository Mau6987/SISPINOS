"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Page() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correo, username, password }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const { token, rol, idUser } = data;

        localStorage.setItem("token", token);
        localStorage.setItem("rol", rol);
        localStorage.setItem("idUser", idUser);

        if (rol === "admin" || rol === "propietario" ||rol === "conductor" ) router.push("/Home");
      } else {
        setLoginError(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setLoginError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/logo3.png" alt="Logo" width={120} height={120} />
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 font-inter">
          Inicio de sesión
        </h1>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Usuario */}
          <input
            type="text"
            placeholder="Nombre de usuario o correo"
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username !== "" ? username : correo}
            onChange={(e) => {
              setUsername(e.target.value);
              setCorreo(e.target.value);
            }}
          />

          {/* Contraseña con botón "Ver" */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Botón para mostrar contraseña con icono SVG */}
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                // Icono de "Ojo Cerrado"1
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.783A10.99 10.99 0 0112 4c3.727 0 7.024 1.975 8.999 4.783M9.603 14.397A4 4 0 0012 16c2.209 0 4-1.791 4-4 0-.906-.3-1.74-.803-2.397m-2.41 5.814L4.98 19m14.06-14.06l1.414-1.414M5.98 4.98L4.566 3.566m13.858 13.858l-1.414 1.414M12 8c-2.209 0-4 1.791-4 4 0 .906.3 1.74.803 2.397"
                  />
                </svg>
              ) : (
                // Icono de "Ojo Abierto"
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4c3.727 0 7.024 1.975 8.999 4.783a10.99 10.99 0 01-17.998 0A10.99 10.99 0 0112 4zm0 0a3.992 3.992 0 00-4 4c0 2.209 1.791 4 4 4s4-1.791 4-4a3.992 3.992 0 00-4-4z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {loginError && (
          <p className="text-red-600 text-sm mt-3 text-center">
             Credenciales incorrectas. Inténtalo nuevamente.
          </p>
        )}

        {/* Botón de Iniciar Sesión */}
        <button
          onClick={handleLogin}
          disabled={!username || !password}
          className={`w-full mt-5 p-3 text-lg font-medium rounded-lg transition-colors ${
            !username || !password
              ? "bg-gray-400 cursor-not-allowed text-gray-200"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}
