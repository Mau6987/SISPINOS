import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google"
import ClientLayout from "./ClientLayout"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  manifest: "/manifest.json",
  title: "Sistema LOS PINOS",
  description: "Sistema de gestión de cargas y pagos de agua"
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width"
}
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

