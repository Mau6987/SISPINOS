'use client';
import { useState } from "react";
import { useRouter } from "next/navigation"; 

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const rol = localStorage.getItem("rol");

  const handleCerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    router.push("/");
  };

  const handleTableSelect = (table) => {
    router.push(`/${table}`);
  };

  return (
    <div
      className={`lg:flex flex-col fixed top-0 left-0 h-full w-64 bg-gray-800 text-white p-4 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 transition-transform duration-300`}
    >
      <div className="flex items-center justify-between">
        <h2
          className="text-2xl font-semibold cursor-pointer"
          onClick={() => router.push("/Home")}
        >
          Los Pinos
        </h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden text-white text-2xl"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      <ul className="mt-8 space-y-4">
        <li>
          <a
            className="block px-4 py-2 hover:bg-purple-600 rounded"
            onClick={() => router.push(rol === "admin" ? "/Home" : "/HomePro")}
          >
            Inicio
          </a>
        </li>

        {rol === "admin" && (
          <>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("usuarios2")}
              >
                Gestión de Usuarios
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("tiposDeCamion")}
              >
                Gestión Tipo de Camión
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("cargagua2")}
              >
                Gestión de Carga de Agua
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("pagos2")}
              >
                Gestión de Pagos
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("consultas")}
              >
                Consultas de cargas y pagos
              </a>
            </li>
          </>
        )}

        {rol === "propietario" && (
          <>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("editarperfil")}
              >
                Editar Perfil
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("cargaguaCliente")}
              >
                Cargas de Agua
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("pagosCliente")}
              >
                Pagos realizados
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("conductores")}
              >
                Conductores
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("cargasconductores")}
              >
                Cargas realizadas tus conductores
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("pagosconductores")}
              >
                Pagos realizados tus conductores
              </a>
            </li>
          </>
        )}

        {rol === "conductor" && (
          <>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("editarperfil")}
              >
                Editar Perfil
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("cargaguaCliente")}
              >
                Cargas de Agua
              </a>
            </li>
            <li>
              <a
                className="block px-4 py-2 hover:bg-purple-600 rounded"
                onClick={() => handleTableSelect("pagosCliente")}
              >
                Pagos realizados
              </a>
            </li>
          </>
        )}

        <li>
          <button
            className="block px-4 py-2 hover:bg-purple-600 rounded"
            onClick={handleCerrarSesion}
          >
            Cerrar Sesión
          </button>
        </li>
      </ul>
    </div>
  );
}
