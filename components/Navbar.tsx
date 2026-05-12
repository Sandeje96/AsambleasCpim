"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();

  return (
    <header className="bg-cpim-blue shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Nombre */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-cpim-blue font-black text-lg leading-none">CP</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-white font-bold text-sm leading-tight">CPIM</p>
              <p className="text-blue-300 text-xs leading-tight">Gestión de Asambleas</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                path === "/"
                  ? "bg-white/20 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/asamblea/nueva"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                path === "/asamblea/nueva"
                  ? "bg-white/20 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              + Nueva Asamblea
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
