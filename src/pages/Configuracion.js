import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { PlusCircle, Edit, Trash2, Settings, CheckCircle, X, Users } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Link, useOutletContext } from 'react-router-dom'; // Importar useOutletContext

const ConfiguracionPage = () => {
  const [recetas, setRecetas] = useState([]);
  const [origenesDisponibles, setOrigenesDisponibles] = useState([]); // Ahora para orígenes
  const [nuevaReceta, setNuevaReceta] = useState({ name: '', components: [] });
  const [editandoId, setEditandoId] = useState(null);
  const [componenteActual, setComponenteActual] = useState({ origin_id: '', percentage: '' }); // Cambiado a origin_id
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener el usuario logueado del contexto (pasado desde App.js)
  const { user: loggedInUser } = useOutletContext() || {}; // Asegúrate de que useOutletContext devuelva un objeto

  const isAdmin = loggedInUser && loggedInUser.role === 'administrador';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    // Fetch Recetas
    const { data: recetasData, error: recetasError } = await supabase
      .from('blended_coffee_recipes')
      .select('*')
      .order('name', { ascending: true });

    if (recetasError) {
      console.error('Error fetching recipes:', recetasError);
      setError('Error al cargar las recetas.');
    } else {
      setRecetas(recetasData);
    }

    // Fetch Coffee Origins for components selection
    const { data: originsData, error: originsError } = await supabase
      .from('coffee_origins')
      .select('*')
      .order('name', { ascending: true });

    if (originsError) {
      console.error('Error fetching coffee origins for recipes:', originsError);
      setError('Error al cargar los orígenes de café.');
    } else {
      setOrigenesDisponibles(originsData);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaReceta({ ...nuevaReceta, [name]: value });
  };

  const handleComponenteChange = (e) => {
    const { name, value } = e.target;
    setComponenteActual({ ...componenteActual, [name]: value });
  };

  const showConfirm = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleAddComponente = () => {
    if (!componenteActual.origin_id || !componenteActual.percentage || parseFloat(componenteActual.percentage) <= 0) {
      alert('Por favor, selecciona un origen de café y un porcentaje válido para el componente.');
      return;
    }
    const origenSeleccionado = origenesDisponibles.find(o => o.id === componenteActual.origin_id);
    if (!origenSeleccionado) {
      alert('Origen de café seleccionado no válido.');
      return;
    }

    const nuevoComp = {
      origin_id: origenSeleccionado.id,
      name: `${origenSeleccionado.name} (${origenSeleccionado.description})`, // Nombre del origen y descripción
      percentage: parseFloat(componenteActual.percentage)
    };

    setNuevaReceta(prev => ({
      ...prev,
      components: [...prev.components, nuevoComp]
    }));
    setComponenteActual({ origin_id: '', percentage: '' });
  };

  const handleRemoveComponente = (index) => {
    setNuevaReceta(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleAddOrUpdateReceta = async () => {
    if (!nuevaReceta.name || nuevaReceta.components.length === 0) {
      alert('Por favor, completa el nombre de la receta y añade al menos un componente.');
      return;
    }

    const totalPorcentaje = nuevaReceta.components.reduce((sum, comp) => sum + comp.percentage, 0);
    if (totalPorcentaje !== 100) {
      alert(`Los porcentajes de los componentes deben sumar 100%. Actualmente suman ${totalPorcentaje}%.`);
      return;
    }

    const payload = {
      name: nuevaReceta.name,
      components: nuevaReceta.components.map(c => ({ origin_id: c.origin_id, percentage: c.percentage })), // Guardar origin_id
    };

    if (editandoId) {
      const { data, error } = await supabase
        .from('blended_coffee_recipes')
        .update(payload)
        .eq('id', editandoId)
        .select();
      
      if (error) {
        console.error('Error updating recipe:', error);
        setError('Error al actualizar la receta.');
      } else {
        showConfirm('Receta actualizada con éxito.');
        setEditandoId(null);
        setNuevaReceta({ name: '', components: [] });
        fetchData();
      }
    } else {
      const { data, error } = await supabase
        .from('blended_coffee_recipes')
        .insert([payload])
        .select();
      
      if (error) {
        console.error('Error adding recipe:', error);
        setError('Error al agregar la receta.');
      } else {
        showConfirm('Receta agregada con éxito.');
        setNuevaReceta({ name: '', components: [] });
        fetchData();
      }
    }
  };

  const handleEditReceta = (receta) => {
    setNuevaReceta({
      ...receta,
      components: receta.components.map(comp => {
        const origin = origenesDisponibles.find(o => o.id === comp.origin_id); // Buscar en orígenes
        return {
          ...comp,
          name: origin ? `${origin.name} (${origin.description})` : 'Desconocido'
        };
      }),
    });
    setEditandoId(receta.id);
  };

  const handleDeleteReceta = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      const { error } = await supabase
        .from('blended_coffee_recipes')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting recipe:', error);
        setError('Error al eliminar la receta.');
      } else {
        showConfirm('Receta eliminada con éxito.');
        fetchData();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600 text-lg">Cargando configuración...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-red-600 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.h1
          className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Settings className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Configuración de Recetas de Mezcla
        </motion.h1>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? 'Editar Receta' : 'Crear Nueva Receta'}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Nombre de la Receta"
              id="name"
              name="name"
              value={nuevaReceta.name}
              onChange={handleInputChange}
              placeholder="Ej: Receta Espresso Clásico"
            />
          </div>

          <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Componentes de la Receta</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label htmlFor="origin_id" className="block text-gray-700 text-sm font-bold mb-2">
                  Origen de Café
                </label>
                <select
                  id="origin_id"
                  name="origin_id"
                  value={componenteActual.origin_id}
                  onChange={handleComponenteChange}
                  className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">Selecciona un origen</option>
                  {origenesDisponibles.map(origen => (
                    <option key={origen.id} value={origen.id}>
                      {origen.name} ({origen.description})
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Porcentaje (%)"
                id="percentage"
                name="percentage"
                type="number"
                value={componenteActual.percentage}
                onChange={handleComponenteChange}
                placeholder="Ej: 60"
                className="w-full"
              />
              <div className="md:col-span-3">
                <Button onClick={handleAddComponente} className="w-full bg-green-500 hover:bg-green-600">
                  Añadir Componente
                </Button>
              </div>
            </div>

            {nuevaReceta.components.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Componentes Añadidos:</h4>
                <ul className="space-y-2">
                  {nuevaReceta.components.map((comp, index) => (
                    <li key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <span>{comp.name}: {comp.percentage}%</span>
                      <motion.button
                        onClick={() => handleRemoveComponente(index)}
                        className="text-red-500 hover:text-red-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-right font-bold text-gray-800">
                  Total Porcentaje: {nuevaReceta.components.reduce((sum, comp) => sum + comp.percentage, 0)}%
                </p>
              </div>
            )}
          </div>

          <Button onClick={handleAddOrUpdateReceta} className="mt-6 w-full">
            <PlusCircle className="w-5 h-5 mr-2" />
            {editandoId ? 'Actualizar Receta' : 'Crear Receta'}
          </Button>
        </Card>

        {isAdmin && ( // Solo muestra el botón si el usuario es administrador
          <Card className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Opciones de Administración</h2>
            <Link to="/gestion-usuarios">
              <Button className="w-full bg-purple-500 hover:bg-purple-600">
                <Users className="w-5 h-5 mr-2" />
                Gestionar Usuarios
              </Button>
            </Link>
          </Card>
        )}

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recetas Existentes</h2>
          {recetas.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay recetas de mezcla registradas. ¡Es hora de crear algunas!
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Nombre de la Receta</th>
                    <th className="py-3 px-6 text-left">Componentes</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {recetas.map((receta) => (
                      <motion.tr
                        key={receta.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="py-3 px-6 text-left whitespace-nowrap">{receta.name}</td>
                        <td className="py-3 px-6 text-left">
                          {receta.components.map(comp => {
                            const origin = origenesDisponibles.find(o => o.id === comp.origin_id);
                            return origin ? `${origin.name} (${comp.percentage}%)` : `Desconocido (${comp.percentage}%)`;
                          }).join(', ')}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex item-center justify-center">
                            <motion.button
                              onClick={() => handleEditReceta(receta)}
                              className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 transform hover:scale-110 transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteReceta(receta.id)}
                              className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center transform hover:scale-110 transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
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

export default ConfiguracionPage;