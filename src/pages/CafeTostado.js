import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { PlusCircle, Edit, Trash2, Coffee, CheckCircle, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const CafeTostadoPage = () => {
  const [cafeVerdeDisponible, setCafeVerdeDisponible] = useState([]);
  const [inventarioTostado, setInventarioTostado] = useState([]);
  const [nuevoCafeTostado, setNuevoCafeTostado] = useState({
    quantity_green_kg: '',
    resultant_kg: '',
    shrinkage_kg: '',
    roast_type: '',
    roast_date: '',
    green_coffee_origin_id: '', // Ahora es el ID del registro de green_coffee
    batch_code: ''
  });
  const [editandoId, setEditandoId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // Inicializar useNavigate

  // Estado para el origen seleccionado en el formulario de tostado
  const [selectedGreenCoffeeOriginId, setSelectedGreenCoffeeOriginId] = useState('');
  const [lotesDisponiblesPorOrigen, setLotesDisponiblesPorOrigen] = useState([]);
  const [allOrigins, setAllOrigins] = useState([]); // Para tener la lista completa de orígenes

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    // Fetch all origins first
    const { data: originsData, error: originsError } = await supabase
      .from('coffee_origins')
      .select('*');
    if (originsError) {
      console.error('Error fetching all origins:', originsError);
      setError('Error al cargar todos los orígenes.');
      setLoading(false);
      return;
    }
    setAllOrigins(originsData);

    // Fetch Green Coffee (all of it, to filter by origin later)
    const { data: greenCoffeeData, error: greenCoffeeError } = await supabase
      .from('green_coffee')
      .select(`
        *,
        origin:coffee_origins (name, description)
      `) // Fetch related origin data
      .order('batch_code', { ascending: true });

    if (greenCoffeeError) {
      console.error('Error fetching green coffee:', greenCoffeeError);
      setError('Error al cargar el café verde disponible.');
      setLoading(false);
      return;
    }
    setCafeVerdeDisponible(greenCoffeeData);

    // Fetch Roasted Coffee
    const { data: roastedCoffeeData, error: roastedCoffeeError } = await supabase
      .from('roasted_coffee')
      .select(`
        *,
        green_coffee (batch_code)
      `)
      .order('roast_date', { ascending: false });

    if (roastedCoffeeError) {
      console.error('Error fetching roasted coffee:', roastedCoffeeError);
      setError('Error al cargar el café tostado.');
    } else {
      setInventarioTostado(roastedCoffeeData);
    }
    setLoading(false);
  };

  // Efecto para filtrar lotes de café verde por el origen seleccionado
  useEffect(() => {
    if (selectedGreenCoffeeOriginId) {
      const filteredLotes = cafeVerdeDisponible.filter(cafe => cafe.origin_id === selectedGreenCoffeeOriginId);
      setLotesDisponiblesPorOrigen(filteredLotes);
    } else {
      setLotesDisponiblesPorOrigen([]);
    }
  }, [selectedGreenCoffeeOriginId, cafeVerdeDisponible]);


  // Efecto para calcular Kilos Merma automáticamente
  useEffect(() => {
    const quantityGreen = parseFloat(nuevoCafeTostado.quantity_green_kg);
    const resultant = parseFloat(nuevoCafeTostado.resultant_kg);
    if (!isNaN(quantityGreen) && !isNaN(resultant)) {
      setNuevoCafeTostado(prev => ({
        ...prev,
        shrinkage_kg: (quantityGreen - resultant).toFixed(2)
      }));
    } else {
      setNuevoCafeTostado(prev => ({
        ...prev,
        shrinkage_kg: ''
      }));
    }
  }, [nuevoCafeTostado.quantity_green_kg, nuevoCafeTostado.resultant_kg]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "green_coffee_origin_id") { // Este es el ID del registro de green_coffee
      setNuevoCafeTostado({ ...nuevoCafeTostado, [name]: value });
    } else if (name === "selectedGreenCoffeeOriginId") { // Este es el ID del origen (de coffee_origins)
      setSelectedGreenCoffeeOriginId(value);
      setNuevoCafeTostado(prev => ({ ...prev, green_coffee_origin_id: '' })); // Resetear el lote de café verde
    } else {
      setNuevoCafeTostado({ ...nuevoCafeTostado, [name]: value });
    }
  };

  const showConfirm = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  // Función para generar el lote automáticamente
  const generateBatchCode = () => {
    if (!selectedGreenCoffeeOriginId || !nuevoCafeTostado.roast_date) {
      alert('Por favor, selecciona un Origen del Café Verde y una Fecha de Tostado para generar el lote.');
      return;
    }

    const selectedOriginData = allOrigins.find(o => o.id === selectedGreenCoffeeOriginId);
    if (!selectedOriginData) {
      alert('Origen del café verde no encontrado.');
      return;
    }

    const originPrefix = selectedOriginData.name.substring(0, 2).toUpperCase();
    const date = new Date(nuevoCafeTostado.roast_date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const randomRef = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios

    const newBatchCode = `${originPrefix}-${day}${month}${year}-${randomRef}`;
    setNuevoCafeTostado(prev => ({ ...prev, batch_code: newBatchCode }));
  };

  const handleAddOrUpdateCafe = async () => {
    if (!nuevoCafeTostado.quantity_green_kg || !nuevoCafeTostado.resultant_kg || !nuevoCafeTostado.roast_type || !nuevoCafeTostado.roast_date || !nuevoCafeTostado.green_coffee_origin_id || !nuevoCafeTostado.batch_code) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    const quantityGreenInput = parseFloat(nuevoCafeTostado.quantity_green_kg);
    const resultantKgInput = parseFloat(nuevoCafeTostado.resultant_kg);
    const shrinkageKgCalculated = parseFloat(nuevoCafeTostado.shrinkage_kg);

    if (shrinkageKgCalculated < 0) {
      alert('Los Kilos Resultantes no pueden ser mayores que la Cantidad de Café Verde.');
      return;
    }

    const cafeVerdeSeleccionado = cafeVerdeDisponible.find(c => c.id === nuevoCafeTostado.green_coffee_origin_id);

    if (!cafeVerdeSeleccionado) {
      alert('El lote de café verde seleccionado no es válido.');
      return;
    }

    const payload = {
      green_coffee_origin_id: nuevoCafeTostado.green_coffee_origin_id,
      quantity_green_kg: quantityGreenInput,
      resultant_kg: resultantKgInput,
      shrinkage_kg: shrinkageKgCalculated,
      roast_type: nuevoCafeTostado.roast_type,
      roast_date: nuevoCafeTostado.roast_date,
      batch_code: nuevoCafeTostado.batch_code,
    };

    if (editandoId) {
      // Lógica de actualización de stock de café verde
      const oldTostado = inventarioTostado.find(c => c.id === editandoId);
      const oldCafeVerde = cafeVerdeDisponible.find(c => c.id === oldTostado.green_coffee_origin_id);
      
      if (oldCafeVerde) {
        const { error: updateGreenError } = await supabase
          .from('green_coffee')
          .update({ quantity_kg: oldCafeVerde.quantity_kg + oldTostado.quantity_green_kg })
          .eq('id', oldCafeVerde.id);
        if (updateGreenError) {
          console.error('Error returning old green coffee quantity:', updateGreenError);
          setError('Error al devolver la cantidad anterior de café verde.');
          return;
        }
      }

      // Re-fetch the updated green coffee quantity to ensure accuracy
      const { data: updatedGreenCoffee, error: fetchUpdatedGreenError } = await supabase
        .from('green_coffee')
        .select('quantity_kg')
        .eq('id', cafeVerdeSeleccionado.id)
        .single();

      if (fetchUpdatedGreenError) {
        console.error('Error fetching updated green coffee quantity:', fetchUpdatedGreenError);
        setError('Error al verificar la cantidad actualizada de café verde.');
        return;
      }

      if (updatedGreenCoffee.quantity_kg < quantityGreenInput) {
        alert('No hay suficiente café verde disponible para tostar esta cantidad.');
        return;
      }

      const { error: deductGreenError } = await supabase
        .from('green_coffee')
        .update({ quantity_kg: updatedGreenCoffee.quantity_kg - quantityGreenInput })
        .eq('id', cafeVerdeSeleccionado.id);
      if (deductGreenError) {
        console.error('Error deducting new green coffee quantity:', deductGreenError);
        setError('Error al deducir la nueva cantidad de café verde.');
        return;
      }

      const { data, error } = await supabase
        .from('roasted_coffee')
        .update(payload)
        .eq('id', editandoId)
        .select();
      
      if (error) {
        console.error('Error updating roasted coffee:', error);
        setError('Error al actualizar el café tostado.');
      } else {
        showConfirm('Café tostado actualizado con éxito.');
        setEditandoId(null);
        setNuevoCafeTostado({ quantity_green_kg: '', resultant_kg: '', shrinkage_kg: '', roast_type: '', roast_date: '', green_coffee_origin_id: '', batch_code: '' });
        setSelectedGreenCoffeeOriginId(''); // Resetear el origen seleccionado
        fetchData();
      }
    } else {
      if (cafeVerdeSeleccionado.quantity_kg < quantityGreenInput) {
        alert('No hay suficiente café verde disponible para tostar esta cantidad.');
        return;
      }

      const { error: deductGreenError } = await supabase
        .from('green_coffee')
        .update({ quantity_kg: cafeVerdeSeleccionado.quantity_kg - quantityGreenInput })
        .eq('id', cafeVerdeSeleccionado.id);
      if (deductGreenError) {
        console.error('Error deducting green coffee quantity:', deductGreenError);
        setError('Error al deducir la cantidad de café verde.');
        return;
      }

      const { data, error } = await supabase
        .from('roasted_coffee')
        .insert([payload])
        .select();
      
      if (error) {
        console.error('Error adding roasted coffee:', error);
        setError('Error al agregar el café tostado.');
      } else {
        showConfirm('Café tostado agregado con éxito.');
        setNuevoCafeTostado({ quantity_green_kg: '', resultant_kg: '', shrinkage_kg: '', roast_type: '', roast_date: '', green_coffee_origin_id: '', batch_code: '' });
        setSelectedGreenCoffeeOriginId(''); // Resetear el origen seleccionado
        fetchData();
      }
    }
  };

  const handleEditCafe = (cafe) => {
    setNuevoCafeTostado({
      ...cafe,
      quantity_green_kg: cafe.quantity_green_kg.toString(),
      resultant_kg: cafe.resultant_kg.toString(),
      shrinkage_kg: cafe.shrinkage_kg.toString(),
      green_coffee_origin_id: cafe.green_coffee_origin_id,
    });
    // Al editar, también necesitamos establecer el origen del café verde para que el dropdown de lotes funcione
    const originalGreenCoffee = cafeVerdeDisponible.find(gc => gc.id === cafe.green_coffee_origin_id);
    if (originalGreenCoffee) {
      setSelectedGreenCoffeeOriginId(originalGreenCoffee.origin_id);
    }
    setEditandoId(cafe.id);
  };

  const handleDeleteCafe = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este café tostado?')) {
      const cafeEliminado = inventarioTostado.find(cafe => cafe.id === id);
      const cafeVerdeOrigen = cafeVerdeDisponible.find(c => c.id === cafeEliminado.green_coffee_origin_id);
      
      if (cafeVerdeOrigen) {
        const { error: updateGreenError } = await supabase
          .from('green_coffee')
          .update({ quantity_kg: cafeVerdeOrigen.quantity_kg + cafeEliminado.quantity_green_kg })
          .eq('id', cafeVerdeOrigen.id);
        if (updateGreenError) {
          console.error('Error returning green coffee quantity:', updateGreenError);
          setError('Error al devolver la cantidad de café verde.');
          return;
        }
      }

      const { error } = await supabase
        .from('roasted_coffee')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting roasted coffee:', error);
        setError('Error al eliminar el café tostado. Asegúrate de que no esté asociado a mezclas o ventas.');
      } else {
        showConfirm('Café tostado eliminado con éxito.');
        fetchData();
      }
    }
  };

  // Obtener la lista de IDs de origen únicos de cafeVerdeDisponible
  // Mapear a objetos de origen completos usando allOrigins
  const originsWithGreenCoffee = allOrigins.filter(origin => 
    cafeVerdeDisponible.some(green => green.origin_id === origin.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600 text-lg">Cargando café tostado...</p>
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
          <Coffee className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Inventario de Café Tostado
        </motion.h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/')} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            <Home className="w-5 h-5 mr-2" />
            Inicio
          </Button>
        </div>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? 'Editar Café Tostado' : 'Agregar Nuevo Café Tostado'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="selectedGreenCoffeeOriginId" className="block text-gray-700 text-sm font-bold mb-2">
                Origen del Café Verde
              </label>
              <select
                id="selectedGreenCoffeeOriginId"
                name="selectedGreenCoffeeOriginId"
                value={selectedGreenCoffeeOriginId}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Selecciona un origen</option>
                {originsWithGreenCoffee.map(origin => (
                  <option key={origin.id} value={origin.id}>
                    {origin.name} ({origin.description})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="green_coffee_origin_id" className="block text-gray-700 text-sm font-bold mb-2">
                Lote de Café Verde
              </label>
              <select
                id="green_coffee_origin_id"
                name="green_coffee_origin_id"
                value={nuevoCafeTostado.green_coffee_origin_id}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
                disabled={!selectedGreenCoffeeOriginId || lotesDisponiblesPorOrigen.length === 0}
              >
                <option value="">Selecciona un lote</option>
                {lotesDisponiblesPorOrigen.map(cafe => (
                  <option key={cafe.id} value={cafe.id}>
                    Lote: {cafe.batch_code} ({cafe.quantity_kg} Kg disponibles)
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Cantidad de Café Verde a Tostar (Kg)"
              id="quantity_green_kg"
              name="quantity_green_kg"
              type="number"
              value={nuevoCafeTostado.quantity_green_kg}
              onChange={handleInputChange}
              placeholder="Ej: 300"
            />
            <Input
              label="Kg Resultante (Café Tostado)"
              id="resultant_kg"
              name="resultant_kg"
              type="number"
              value={nuevoCafeTostado.resultant_kg}
              onChange={handleInputChange}
              placeholder="Ej: 250"
            />
            <Input
              label="Kilos Merma (Automático)"
              id="shrinkage_kg"
              name="shrinkage_kg"
              type="number"
              value={nuevoCafeTostado.shrinkage_kg}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
            />
            <div className="mb-4">
              <label htmlFor="roast_type" className="block text-gray-700 text-sm font-bold mb-2">
                Tipo de Tostado
              </label>
              <select
                id="roast_type"
                name="roast_type"
                value={nuevoCafeTostado.roast_type}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Selecciona un tipo</option>
                <option value="Claro">Claro</option>
                <option value="Medio">Medio</option>
                <option value="Oscuro">Oscuro</option>
              </select>
            </div>
            <Input
              label="Fecha de Tostado"
              id="roast_date"
              name="roast_date"
              type="date"
              value={nuevoCafeTostado.roast_date}
              onChange={handleInputChange}
            />
            <div className="md:col-span-2 flex items-end gap-2">
              <Input
                label="Lote de Café Tostado (Automático)"
                id="batch_code"
                name="batch_code"
                value={nuevoCafeTostado.batch_code}
                onChange={handleInputChange}
                placeholder="Ej: CO-010124-1234"
                readOnly
                className="bg-gray-100 cursor-not-allowed flex-grow"
              />
              <Button onClick={generateBatchCode} type="button" className="flex-shrink-0 px-4 py-2">
                Generar Lote
              </Button>
            </div>
          </div>
          <Button onClick={handleAddOrUpdateCafe} className="mt-6 w-full">
            <PlusCircle className="w-5 h-5 mr-2" />
            {editandoId ? 'Actualizar Café Tostado' : 'Agregar Café Tostado'}
          </Button>
        </Card>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Stock de Café Verde Disponible</h2>
          {cafeVerdeDisponible.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ¡No hay café verde! No podrás tostar nada.
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
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {cafeVerdeDisponible.map((cafe) => (
                      <motion.tr
                        key={cafe.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="py-3 px-6 text-left whitespace-nowrap">{cafe.batch_code}</td>
                        <td className="py-3 px-6 text-left">{cafe.origin ? `${cafe.origin.name} (${cafe.origin.description})` : 'Desconocido'}</td>
                        <td className="py-3 px-6 text-left">{cafe.supplier_finca}</td>
                        <td className="py-3 px-6 text-left">{cafe.quantity_kg}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Stock Actual de Café Tostado</h2>
          {inventarioTostado.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay café tostado en el inventario. ¡A tostar se ha dicho!
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Lote</th>
                    <th className="py-3 px-6 text-left">Kg Verde</th>
                    <th className="py-3 px-6 text-left">Kg Resultante</th>
                    <th className="py-3 px-6 text-left">Merma (Kg)</th>
                    <th className="py-3 px-6 text-left">Tipo Tostado</th>
                    <th className="py-3 px-6 text-left">Fecha Tostado</th>
                    <th className="py-3 px-6 text-left">Lote Verde Origen</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {inventarioTostado.map((cafe) => {
                      const loteCafeVerde = cafe.green_coffee ? cafe.green_coffee.batch_code : 'Desconocido';
                      return (
                        <motion.tr
                          key={cafe.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="py-3 px-6 text-left whitespace-nowrap">{cafe.batch_code}</td>
                          <td className="py-3 px-6 text-left">{cafe.quantity_green_kg}</td>
                          <td className="py-3 px-6 text-left">{cafe.resultant_kg}</td>
                          <td className="py-3 px-6 text-left">{cafe.shrinkage_kg}</td>
                          <td className="py-3 px-6 text-left">{cafe.roast_type}</td>
                          <td className="py-3 px-6 text-left">{cafe.roast_date}</td>
                          <td className="py-3 px-6 text-left">{loteCafeVerde}</td>
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

export default CafeTostadoPage;