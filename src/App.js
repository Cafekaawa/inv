import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'; // Importa Outlet
import Navbar from './components/Navbar';
import HomePage from './pages/Home';
import CafeOrigenPage from './pages/CafeOrigen';
import CafeVerdePage from './pages/CafeVerde';
import CafeTostadoPage from './pages/CafeTostado';
import CafeMezclaPage from './pages/CafeMezcla';
import VentasPage from './pages/Ventas';
import ReportesPage from './pages/Reportes';
import ConfiguracionPage from './pages/Configuracion';
import LoginPage from './pages/Login';
import Button from './components/Button';
import UserManagementPage from './pages/UserManagement';

export default function App() {
  const [user, setUser] = useState(null); // Estado para el usuario logueado

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="relative pb-20">
        {/* Aquí podrías mostrar un encabezado con el nombre del usuario y un botón de logout */}
        <header className="bg-white/90 backdrop-blur-xl shadow-md py-4 px-6 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Bienvenido, {user.fullName} ({user.role})</h1>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg">
            Cerrar Sesión
          </Button>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cafe-origen" element={<CafeOrigenPage />} />
          <Route path="/cafe-verde" element={<CafeVerdePage />} />
          <Route path="/cafe-tostado" element={<CafeTostadoPage />} />
          <Route path="/cafe-mezcla" element={<CafeMezclaPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          
          {/* Rutas protegidas por rol */}
          {/* Usamos un Outlet para pasar el contexto del usuario a las rutas anidadas */}
          <Route element={<Outlet context={{ user }} />}>
            {user.role === 'administrador' && (
              <>
                <Route path="/configuracion" element={<ConfiguracionPage />} />
                <Route path="/gestion-usuarios" element={<UserManagementPage />} />
              </>
            )}
            {user.role !== 'administrador' && (
              <>
                <Route path="/configuracion" element={<Navigate to="/" replace />} />
                <Route path="/gestion-usuarios" element={<Navigate to="/" replace />} />
              </>
            )}
          </Route>
        </Routes>
        <Navbar />
      </div>
    </Router>
  );
}