"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Home, Package, Users, CreditCard, User, LogOut, Menu, ChevronDown, BarChart3, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "../components/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/components/ui/dropdown-menu"

import { Sheet, SheetContent, SheetTrigger } from "../components/components/ui/sheet"

export default function Navbar() {
  const [rol, setRol] = useState("")
  const router = useRouter()

  useEffect(() => {
    setRol(localStorage.getItem("rol") || "")
  }, [])

  const handleCerrarSesion = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("rol")
    router.push("/")
  }

  const NavLink = ({ href, icon: Icon, children }) => (
    <Link
      href={href}
      className="flex items-center p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
    >
      <Icon className="w-4 h-4 mr-2" />
      <span>{children}</span>
    </Link>
  )

  const SubMenu = ({ title, icon: Icon, items }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200"
        >
          <Icon className="w-4 h-4 mr-2" />
          <span>{title}</span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 text-white">
        {items.map((item, index) => (
          <DropdownMenuItem key={index} asChild>
            <Link href={item.href} className="flex items-center p-2 hover:bg-gray-700 transition-colors duration-200">
              <item.icon className="w-4 h-4 mr-2" />
              <span>{item.title}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const NavItems = () => (
    <>
      <NavLink href="/Home" icon={Home}>
        Inicio
      </NavLink>
      {rol === "admin" && (
        <>
          <SubMenu
            title="Gestión de Usuarios"
            icon={Users}
            items={[
              { href: "/Usuarios", icon: Users, title: "Gestión de Usuarios" },
              { href: "/UsuariosCliente", icon: User, title: "Gestión de Clientes" },
            ]}
          />
          <SubMenu
            title="Cargas de agua"
            icon={CreditCard}
            items={[
              { href: "/Cargas", icon: CreditCard, title: "Gestion de cargas" },
              { href: "/PrecioCarga", icon: CreditCard, title: "Precio de cargas" },
            ]}
          />
          <NavLink href="/Pagos" icon={CreditCard}>
            Gestión de Pagos
          </NavLink>
          <SubMenu
            title="Reportes y Estadísticas"
            icon={BarChart3}
            items={[
              { href: "/Reportes2", icon: BarChart3, title: "Reportes" },
              { href: "/Dashboard", icon: TrendingUp, title: "Estadísticas del Sistema" },
            ]}
          />
        </>
      )}
      {rol === "propietario" && (
        <>
          <SubMenu
            title="Cargas"
            icon={Package}
            items={[
              { href: "/CargasCliente", icon: Package, title: "Cargas propias" },
              { href: "/CargasPropietario", icon: Package, title: "Cargas de conductores" },
            ]}
          />
          <SubMenu
            title="Pagos"
            icon={CreditCard}
            items={[
              { href: "/PagosCliente", icon: CreditCard, title: "Pagos propios" },
              { href: "/PagosPropietario", icon: CreditCard, title: "Pagos de conductores" },
            ]}
          />
          <NavLink href="/Conductores" icon={Users}>
            Conductores
          </NavLink>
        </>
      )}
      {rol === "conductor" && (
        <>
          <NavLink href="/CargasCliente" icon={Package}>
            Cargas de Agua
          </NavLink>
          <NavLink href="/PagosCliente" icon={CreditCard}>
            Pagos realizados
          </NavLink>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-300 hover:bg-gray-700 hover:text-white"
        onClick={handleCerrarSesion}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar Sesión
      </Button>
    </>
  )

  return (
    <nav className="bg-gray-900 text-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link
              href="/Home"
              className="text-xl font-semibold text-white hover:text-gray-300 transition-colors duration-200"
            >
              Los Pinos
            </Link>
          </div>

          <div className="hidden md:flex space-x-1">
            <NavItems />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gray-900 text-white">
              <nav className="flex flex-col space-y-4 mt-8">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
