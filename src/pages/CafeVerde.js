import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { PlusCircle, Edit, Trash2, Bean, CheckCircle, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const CafeVerdePage = () => {
  const [origenesDisponibles, setOrigenesDisponibles] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [nuevoCafe, setNuevoCafe] = useState({ origin_id: '', supplier_finca: '', quantity_kg: '', unit_price: '', entry_date: '', batch_code: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // Inicializar useNavigate

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const { data: originsData, error: originsError } = await supabase
      .from('coffee_origins')
      .select('*')
      .order('name', { ascending: true });

    if (originsError) {
      console.error('Error fetching origins:', originsError);
      setError('Error al cargar los orígenes.');
      setLoading(false);
      return;
    }
    setOrigenesDisponibles(originsData);

    const { data: greenCoffeeData, error: greenCoffeeError } = await supabase
      .from('green_coffee')
      .select(`
        *,
        origin:coffee_origins (name, description)
      `)
      .order('entry_date', { ascending: false });

    if (greenCoffeeError) {
      console.error('Error fetching green coffee:', greenCoffeeError);
      setError('Error al cargar el café verde.');
    } else {
      setInventario(greenCoffeeData);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "origin_id") {
      const selectedOrigin = origenesDisponibles.find(o => o.id === value);
      setNuevoCafe({
        ...nuevoCafe,
        [name]: value,
        supplier_finca: selectedOrigin && selectedOrigin.suppliers_fincas.length > 0 ? selectedOrigin.suppliers_fincas[0] : '', // Autoselecciona el primer proveedor/finca
      });
    } else {
      setNuevoCafe({ ...nuevoCafe, [name]: value });
    }
  };

  const showConfirm = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleAddOrUpdateCafe = async () => {
    if (!nuevoCafe.origin_id || !nuevoCafe.supplier_finca || !nuevoCafe.quantity_kg || !nuevoCafe.unit_price || !nuevoCafe.entry_date || !nuevoCafe.batch_code) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    const origenSeleccionado = origenesDisponibles.find(o => o.id === nuevoCafe.origin_id);
    if (origenSeleccionado && !origenSeleccionado.suppliers_fincas.includes(nuevoCafe.supplier_finca)) {
      alert('El proveedor/finca seleccionado no pertenece al origen elegido.');
      return;
    }

    const payload = {
      origin_id: nuevoCafe.origin_id,
      supplier_finca: nuevoCafe.supplier_finca,
      quantity_kg: parseFloat(nuevoCafe.quantity_kg),
      unit_price: parseFloat(nuevoCafe.unit_price),
      entry_date: nuevoCafe.entry_date,
      batch_code: nuevoCafe.batch_code,
    };

    if (editandoId) {
      const { data, error } = await supabase
        .from('green_coffee')
        .update(payload)
        .eq('id', editandoId)
        .select();
      
      if (error) {
        console.error('Error updating green coffee:', error);
        setError('Error al actualizar el café verde.');
      } else {
        showConfirm('Café verde actualizado con éxito.');
        setEditandoId(null);
        setNuevoCafe({ origin_id: '', supplier_finca: '', quantity_kg: '', unit_price: '', entry_date: '', batch_code: '' });
        fetchData();
      }
    } else {
      // Verificar si ya existe un lote con el mismo batch_code Y el mismo origin_id
      const { data: existingBatch, error: checkError } = await supabase
        .from('green_coffee')
        .select('id')
        .eq('batch_code', nuevoCafe.batch_code)
        .eq('origin_id', nuevoCafe.origin_id);

      if (checkError) {
        console.error('Error checking existing batch:', checkError);
        setError('Error al verificar el lote existente.');
        return;
      }

      if (existingBatch && existingBatch.length > 0) {
        alert('Ya existe un lote con este código para el origen seleccionado. Por favor, usa un lote diferente o edita el existente.');
        return;
      }

      const { data, error } = await supabase
        .from('green_coffee')
        .insert([payload])
        .select();
      
      if (error) {
        console.error('Error adding green coffee:', error);
        setError('Error al agregar el café verde.');
      } else {
        showConfirm('Café verde agregado con éxito.');
        setNuevoCafe({ origin_id: '', supplier_finca: '', quantity_kg: '', unit_price: '', entry_date: '', batch_code: '' });
        fetchData();
      }
    }
  };

  const handleEditCafe = (cafe) => {
    setNuevoCafe({
      ...cafe,
      origin_id: cafe.origin_id,
      quantity_kg: cafe.quantity_kg.toString(),
      unit_price: cafe.unit_price.toString(),
    });
    setEditandoId(cafe.id);
  };

  const handleDeleteCafe = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este café verde?')) {
      const { error } = await supabase
        .from('green_coffee')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting green coffee:', error);
        setError('Error al eliminar el café verde. Asegúrate de que no esté asociado a café tostado.');
      } else {
        showConfirm('Café verde eliminado con éxito.');
        fetchData();
      }
    }
  };

  const selectedOrigen = origenesDisponibles.find(o => o.id === nuevoCafe.origin_id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600 text-lg">Cargando café verde...</p>
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
          <Bean className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Inventario de Café Verde
        </motion.h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/')} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            <Home className="w-5 h-5 mr-2" />
            Inicio
          </Button>
        </div>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? 'Editar Café Verde' : 'Agregar Nuevo Café Verde'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="origin_id" className="block text-gray-700 text-sm font-bold mb-2">
                Origen del Café
              </label>
              <select
                id="origin_id"
                name="origin_id"
                value={nuevoCafe.origin_id}
                onChange={handleInputChange}
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
            <div className="mb-4">
              <label htmlFor="supplier_finca" className="block text-gray-700 text-sm font-bold mb-2">
                Proveedor o Finca
              </label>
              <select
                id="supplier_finca"
                name="supplier_finca"
                value={nuevoCafe.supplier_finca}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                disabled={!selectedOrigen || selectedOrigen.suppliers_fincas.length === 0}
              >
                <option value="">Selecciona un proveedor/finca</option>
                {selectedOrigen && selectedOrigen.suppliers_fincas.map((pf, index) => (
                  <option key={index} value={pf}>
                    {pf}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Cantidad (Kg)"
              id="quantity_kg"
              name="quantity_kg"
              type="number"
              value={nuevoCafe.quantity_kg}
              onChange={handleInputChange}
              placeholder="Ej: 500"
            />
            <Input
              label="Precio Unitario ($/Kg)"
              id="unit_price"
              name="unit_price"
              type="number"
              step="0.01"
              value={nuevoCafe.unit_price}
              onChange={handleInputChange}
              placeholder="Ej: 8.50"
            />
            <Input
              label="Fecha de Entrada"
              id="entry_date"
              name="entry_date"
              type="date"
              value={nuevoCafe.entry_date}
              onChange={handleInputChange}
            />
            <Input
              label="Lote (DD-MM-AA)"
              id="batch_code"
              name="batch_code"
              value={nuevoCafe.batch_code}
              onChange={handleInputChange}
              placeholder="Ej: 01-01-24"
            />
          </div>
          <Button onClick={handleAddOrUpdateCafe} className="mt-6 w-full">
            <PlusCircle className="w-5 h-5 mr-2" />
            {editandoId ? 'Actualizar Café' : 'Agregar Café'}
          </Button>
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Stock Actual</h2>
          {inventario.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay café verde en el inventario. ¡Es hora de comprar más granos!
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Lote</th>
                    <th className="py-3 px-6 text-left">Origen</th>
                    <th className="py-3 px-6 text-left">Proveedor/Finca</th>
                    <th className="py-3 px-6 text-left">Cantidad (Kg)</th>
                    <th className="py-3 px-6 text-left">Precio Unitario ($/Kg)</th>
                    <th className="py-3 px-6 text-left">Fecha Entrada</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {inventario.map((cafe) => {
                      const origenNombre = cafe.origin ? `${cafe.origin.name} (${cafe.origin.description})` : 'Desconocido';
                      return (
                        <motion.tr
                          key={cafe.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="py-3 px-6 text-left">{cafe.batch_code}</td>
                          <td className="py-3 px-6 text-left whitespace-nowrap">{origenNombre}</td>
                          <td className="py-3 px-6 text-left whitespace-nowrap">{cafe.supplier_finca}</td>
                          <td className="py-3 px-6 text-left">{cafe.quantity_kg}</td>
                          <td className="py-3 px-6 text-left">${cafe.unit_price.toFixed(2)}</td>
                          <td className="py-3 px-6 text-left">{cafe.entry_date}</td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex item-center justify-center">
                              <motion.button
                                onClick={() => handleEditCafe(cafe)}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 transform hover:scale-110 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteCafe(cafe.id)}
                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center transform hover:scale-110 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
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

export default CafeVerdePage;