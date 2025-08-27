import React from 'react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import { Coffee, Bean, Blend, ShoppingCart, BarChart2, Globe, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const modules = [
    { name: 'Orígenes', description: 'Gestiona los países y regiones de origen de tu café.', icon: Globe, path: '/cafe-origen' },
    { name: 'Café Verde', description: 'Gestiona tu inventario de café en grano sin tostar.', icon: Bean, path: '/cafe-verde' },
    { name: 'Café Tostado', description: 'Controla el stock de café ya tostado y listo para moler.', icon: Coffee, path: '/cafe-tostado' },
    { name: 'Café Mezcla', description: 'Administra tus mezclas especiales de café.', icon: Blend, path: '/cafe-mezcla' },
    { name: 'Ventas', description: 'Registra y sigue todas tus transacciones de café.', icon: ShoppingCart, path: '/ventas' },
    { name: 'Reportes', description: 'Genera informes detallados sobre tu inventario y ventas.', icon: BarChart2, path: '/reportes' },
    { name: 'Configuración', description: 'Define recetas de mezcla y otros ajustes del sistema.', icon: Settings, path: '/configuracion' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.h1
          className="text-5xl font-extrabold text-center mb-12 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Sistema de Gestión de Café
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => (
            <Link to={module.path} key={module.name}>
              <Card
                className="text-center hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex justify-center mb-4">
                  <motion.div
                    className="p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <module.icon className="w-12 h-12 text-blue-600" />
                  </motion.div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">{module.name}</h2>
                <p className="text-gray-600">{module.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;