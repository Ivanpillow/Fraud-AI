import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Landing from "./pages/Landing";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Lineas from "./pages/graficos/Lineas";
import Barras from "./pages/graficos/Barras";
import Dispersion from "./pages/graficos/Dispersion";

export default function App() {
  return (
   <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Navbar />
      <div className="flex-grow pt-20">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/graficos/lineas" element={<Lineas />} />
          <Route path="/graficos/barras" element={<Barras />} />
          <Route path="/graficos/dispersion" element={<Dispersion />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}