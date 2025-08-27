import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Bean, Blend, ShoppingCart, BarChart2, Home, Globe, Settings } from 'lucide-react';

const navItems = [
  { name: 'Inicio', path: '/', icon: Home },
  { name: 'Orígenes', path: '/cafe-origen', icon: Globe },
  { name: 'Café Verde', path: '/cafe-verde', icon: Bean },
  { name: 'Café Tostado', path: '/cafe-tostado', icon: Coffee },
  { name: 'Café Mezcla', path: '/cafe-mezcla', icon: Blend },
  { name: 'Ventas', path: '/ventas', icon: ShoppingCart },
  { name: 'Reportes', path: '/reportes', icon: BarChart2 },
  { name: 'Configuración', path: '/configuracion', icon: Settings },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <motion.nav
      className="bg-white/90 backdrop-blur-xl shadow-lg rounded-full px-6 py-3 fixed bottom-4 left-1/2 -translate-x-1/2 z-50 border border-gray-200"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.5 }}
    >
      <ul className="flex space-x-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <li key={item.name}>
              <Link to={item.path}>
                <motion.div
                  className={`flex items-center px-4 py-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  <span className="font-medium text-sm hidden sm:block">{item.name}</span>
                </motion.div>
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
};

export default Navbar;