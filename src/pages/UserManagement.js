import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { UserPlus, UserX, Edit, CheckCircle, X, Users, Home } from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom'; // Importar useNavigate

// Mock de usuarios (en una aplicación real, esto vendría de Supabase)
const initialUsers = [
  { id: '1', username: 'admin', password: 'Claudio1976+', role: 'administrador', fullName: 'Administrador Kaawa' },
  { id: '2', username: 'carlos', password: 'robusta25', role: 'tecnico', fullName: 'Carlos Hernandez Valencia' },
  { id: '3', username: 'jonathan', password: 'arabica25', role: 'administrador', fullName: 'Jonathan Valencia Quintal' },
];

const UserManagementPage = () => {
  const [users, setUsers] = useState(initialUsers);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'tecnico', fullName: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const navigate = useNavigate(); // Inicializar useNavigate

  // Obtener el usuario logueado del contexto (pasado desde App.js)
  const { user: loggedInUser } = useOutletContext() || {}; // Asegúrate de que useOutletContext devuelva un objeto

  const canEdit = loggedInUser && loggedInUser.role === 'administrador';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const showConfirm = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleAddOrUpdateUser = () => {
    if (!canEdit) {
      alert('No tienes permisos para realizar esta acción.');
      return;
    }
    if (!newUser.username || !newUser.password || !newUser.fullName) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    if (editingUser) {
      setUsers(users.map(user => (user.id === editingUser.id ? { ...newUser, id: editingUser.id } : user)));
      showConfirm('Usuario actualizado con éxito.');
      setEditingUser(null);
    } else {
      const id = (users.length + 1).toString(); // Generar un ID simple
      setUsers([...users, { ...newUser, id }]);
      showConfirm('Usuario agregado con éxito.');
    }
    setNewUser({ username: '', password: '', role: 'tecnico', fullName: '' });
  };

  const handleEditUser = (user) => {
    if (!canEdit) {
      alert('No tienes permisos para realizar esta acción.');
      return;
    }
    setNewUser({ ...user });
    setEditingUser(user);
  };

  const handleDeleteUser = (id) => {
    if (!canEdit) {
      alert('No tienes permisos para realizar esta acción.');
      return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setUsers(users.filter(user => user.id !== id));
      showConfirm('Usuario eliminado con éxito.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h1
          className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Users className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Gestión de Usuarios
        </motion.h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/')} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            <Home className="w-5 h-5 mr-2" />
            Inicio
          </Button>
        </div>

        {canEdit && (
          <Card className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre de Usuario"
                id="username"
                name="username"
                value={newUser.username}
                onChange={handleInputChange}
                placeholder="Ej: miusuario"
              />
              <Input
                label="Contraseña"
                id="password"
                name="password"
                type="password"
                value={newUser.password}
                onChange={handleInputChange}
                placeholder="Contraseña segura"
              />
              <Input
                label="Nombre Completo"
                id="fullName"
                name="fullName"
                value={newUser.fullName}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
              />
              <div className="mb-4">
                <label htmlFor="role" className="block text-gray-700 text-sm font-bold mb-2">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  value={newUser.role}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="administrador">Administrador</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAddOrUpdateUser} className="mt-6 w-full">
              {editingUser ? <Edit className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
              {editingUser ? 'Actualizar Usuario' : 'Agregar Usuario'}
            </Button>
          </Card>
        )}

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Usuarios Registrados</h2>
          {users.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay usuarios registrados. ¡Es hora de invitar a tu equipo!
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Usuario</th>
                    <th className="py-3 px-6 text-left">Nombre Completo</th>
                    <th className="py-3 px-6 text-left">Rol</th>
                    {canEdit && <th className="py-3 px-6 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {users.map((user) => (
                      <motion.tr
                        key={user.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="py-3 px-6 text-left whitespace-nowrap">{user.username}</td>
                        <td className="py-3 px-6 text-left">{user.fullName}</td>
                        <td className="py-3 px-6 text-left">{user.role}</td>
                        {canEdit && (
                          <td className="py-3 px-6 text-center">
                            <div className="flex item-center justify-center">
                              <motion.button
                                onClick={() => handleEditUser(user)}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 transform hover:scale-110 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteUser(user.id)}
                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center transform hover:scale-110 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <UserX className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <AnimatePresence>
          {showConfirmation && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 z-50"
            >
              <CheckCircle className="w-6 h-6" />
              <span>{confirmationMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserManagementPage;