import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-800 shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold tracking-wide text-indigo-400">
          FraudAI
        </Link>

        {/* Menu */}
        <div className="flex items-center gap-6">
          {/* Dropdown Graficos */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="hover:text-indigo-400 transition flex items-center gap-1"
            >
              Gráficos
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg">
                <Link to="/graficos/lineas" className="block px-4 py-2 hover:bg-gray-600">
                  Gráfico de Líneas
                </Link>
                <Link to="/graficos/barras" className="block px-4 py-2 hover:bg-gray-600">
                  Gráfico de Barras
                </Link>
                <Link to="/graficos/dispersion" className="block px-4 py-2 hover:bg-gray-600">
                  Gráfico de Dispersión
                </Link>
              </div>
            )}
          </div>

          <Link to="/contacto" className="hover:text-indigo-400 transition">
            Contacto
          </Link>
          <Link to="/about" className="hover:text-indigo-400 transition">
            About Us
          </Link>
        </div>
      </div>
    </nav>
  );
}
