import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "CPIM – Gestión de Asambleas",
  description:
    "Sistema de gestión de asambleas ordinarias del Consejo Profesional de Ingeniería de Misiones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="mt-12 py-6 text-center text-xs text-gray-400 border-t border-gray-200">
          Consejo Profesional de Ingeniería de Misiones – Sistema de Gestión de Asambleas
        </footer>
      </body>
    </html>
  );
}
