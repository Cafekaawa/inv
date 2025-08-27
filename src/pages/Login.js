import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { LogIn, Coffee } from 'lucide-react';

const users = [
  { username: 'admin', password: 'Claudio1976+', role: 'administrador', fullName: 'Administrador Kaawa' },
  { username: 'isael ', password: 'robusta25', role: 'tecnico', fullName: 'Isael Lopez Dominguez' },
  { username: 'jonathan', password: 'arabica25', role: 'administrador', fullName: 'Jonathan Valencia Quintal' },
];

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = users.find(
      (user) => user.username === username && user.password === password
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Usuario o contraseña incorrectos. ¡Intenta de nuevo, campeón!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <div className="text-center mb-8">
            <Coffee className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Bienvenido a Sistema de Control de Inventario</h1>
            <p className="text-gray-500">Inicia sesión para gestionar tu inventario de café</p>
          </div>
          <form onSubmit={handleLogin}>
            <Input
              label="Usuario"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre de usuario"
            />
            <Input
              label="Contraseña"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña secreta"
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mb-4 text-center"
              >
                {error}
              </motion.p>
            )}
            <Button type="submit" className="w-full">
              <LogIn className="w-5 h-5 mr-2" />
              Iniciar Sesión
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};

export default LoginPage;
