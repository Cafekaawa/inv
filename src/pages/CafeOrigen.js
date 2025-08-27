import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { PlusCircle, Edit, Trash2, Globe, CheckCircle, X, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const CafeOrigenPage = () => {
  const [origenes, setOrigenes] = useState([]);
  const [nuevoOrigen, setNuevoOrigen] = useState({ name: '', kilos_per_bag: '', suppliers_fincas: [], description: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [nuevoProveedorFinca, setNuevoProveedorFinca] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // Inicializar useNavigate

  useEffect(() => {
    fetchOrigenes();
  }, []);

  const fetchOrigenes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coffee_origins')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching origins:', error);
      setError('Error al cargar los orígenes.');
    } else {
      setOrigenes(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoOrigen({ ...nuevoOrigen, [name]: value });
  };

  const showConfirm = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleAddProveedorFinca = () => {
    if (nuevoProveedorFinca.trim() !== '') {
      setNuevoOrigen(prev => ({
        ...prev,
        suppliers_fincas: [...prev.suppliers_fincas, nuevoProveedorFinca.trim()]
      }));
      setNuevoProveedorFinca('');
    }
  };

  const handleRemoveProveedorFinca = (index) => {
    setNuevoOrigen(prev => ({
      ...prev,
      suppliers_fincas: prev.suppliers_fincas.filter((_, i) => i !== index)
    }));
  };

  const handleAddOrUpdateOrigen = async () => {
    if (!nuevoOrigen.name || !nuevoOrigen.kilos_per_bag || nuevoOrigen.suppliers_fincas.length === 0) {
      alert('Por favor, completa el nombre, los kilos por saco y añade al menos un proveedor/finca.');
      return;
    }

    const payload = {
      name: nuevoOrigen.name,
      kilos_per_bag: parseFloat(nuevoOrigen.kilos_per_bag),
      suppliers_fincas: nuevoOrigen.suppliers_fincas,
      description: nuevoOrigen.description || null,
    };

    if (editandoId) {
      const { data, error } = await supabase
        .from('coffee_origins')
        .update(payload)
        .eq('id', editandoId)
        .select();
      
      if (error) {
        console.error('Error updating origin:', error);
        setError('Error al actualizar el origen.');
      } else {
        showConfirm('Origen actualizado con éxito.');
        setEditandoId(null);
        setNuevoOrigen({ name: '', kilos_per_bag: '', suppliers_fincas: [], description: '' });
        setNuevoProveedorFinca('');
        fetchOrigenes();
      }
    } else {
      const { data, error } = await supabase
        .from('coffee_origins')
        .insert([payload])
        .select();
      
      if (error) {
        console.error('Error adding origin:', error);
        setError('Error al agregar el origen.');
      } else {
        showConfirm('Origen agregado con éxito.');
        setNuevoOrigen({ name: '', kilos_per_bag: '', suppliers_fincas: [], description: '' });
        setNuevoProveedorFinca('');
        fetchOrigenes();
      }
    }
  };

  const handleEditOrigen = (origen) => {
    setNuevoOrigen({ ...origen, kilos_per_bag: origen.kilos_per_bag.toString() });
    setEditandoId(origen.id);
  };

  const handleDeleteOrigen = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este origen?')) {
      const { error } = await supabase
        .from('coffee_origins')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting origin:', error);
        setError('Error al eliminar el origen. Asegúrate de que no haya café verde asociado.');
      } else {
        showConfirm('Origen eliminado con éxito.');
        fetchOrigenes();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600 text-lg">Cargando orígenes...</p>
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
          <Globe className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Gestión de Orígenes de Café
        </motion.h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/')} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            <Home className="w-5 h-5 mr-2" />
            Inicio
          </Button>
        </div>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? 'Editar Origen' : 'Agregar Nuevo Origen'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Origen"
              id="name"
              name="name"
              value={nuevoOrigen.name}
              onChange={handleInputChange}
              placeholder="Ej: Colombia"
            />
            <Input
              label="Kilos por Saco"
              id="kilos_per_bag"
              name="kilos_per_bag"
              type="number"
              value={nuevoOrigen.kilos_per_bag}
              onChange={handleInputChange}
              placeholder="Ej: 60"
            />
            <div className="md:col-span-2">
              <label htmlFor="proveedorFinca" className="block text-gray-700 text-sm font-bold mb-2">
                Proveedores / Fincas
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  id="nuevoProveedorFinca"
                  name="nuevoProveedorFinca"
                  value={nuevoProveedorFinca}
                  onChange={(e) => setNuevoProveedorFinca(e.target.value)}
                  placeholder="Añadir proveedor o finca"
                  className="flex-grow"
                />
                <Button onClick={handleAddProveedorFinca} className="flex-shrink-0 px-4 py-2">
                  <PlusCircle className="w-5 h-5" />
                </Button>
              </div>
              {nuevoOrigen.suppliers_fincas.length > 0 && (
                <ul className="bg-gray-100 p-3 rounded-xl space-y-2">
                  {nuevoOrigen.suppliers_fincas.map((pf, index) => (
                    <li key={index} className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm">
                      <span>{pf}</span>
                      <motion.button
                        onClick={() => handleRemoveProveedorFinca(index)}
                        className="text-red-500 hover:text-red-700"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="md:col-span-2">
              <Input
                label="Descripción (Opcional)"
                id="description"
                name="description"
                value={nuevoOrigen.description}
                onChange={handleInputChange}
                placeholder="Ej: Famoso por sus cafés suaves y aromáticos."
              />
            </div>
          </div>
          <Button onClick={handleAddOrUpdateOrigen} className="mt-6 w-full">
            <PlusCircle className="w-5 h-5 mr-2" />
            {editandoId ? 'Actualizar Origen' : 'Agregar Origen'}
          </Button>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Orígenes Registrados</h2>
          {origenes.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay orígenes de café registrados. ¡Es hora de explorar el mundo!
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Nombre</th>
                    <th className="py-3 px-6 text-left">Kilos/Saco</th>
                    <th className="py-3 px-6 text-left">Proveedores/Fincas</th>
                    <th className="py-3 px-6 text-left">Descripción</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {origenes.map((origen) => (
                      <motion.tr
                        key={origen.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="py-3 px-6 text-left whitespace-nowrap">{origen.name}</td>
                        <td className="py-3 px-6 text-left">{origen.kilos_per_bag}</td>
                        <td className="py-3 px-6 text-left">
                          {origen.suppliers_fincas.join(', ')}
                        </td>
                        <td className="py-3 px-6 text-left">{origen.description}</td>
                        <td className="py-3 px-6 text-center">
                          <div className="flex item-center justify-center">
                            <motion.button
                              onClick={() => handleEditOrigen(origen)}
                              className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 transform hover:scale-110 transition-all duration-200"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteOrigen(origen.id)}
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

export default CafeOrigenPage;