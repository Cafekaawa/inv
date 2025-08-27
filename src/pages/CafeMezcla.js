import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { PlusCircle, Edit, Trash2, Blend, CheckCircle, X, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const CafeMezclaPage = () => {
  const [cafeTostadoDisponible, setCafeTostadoDisponible] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [origenesDisponibles, setOrigenesDisponibles] = useState([]);
  const [inventarioMezcla, setInventarioMezcla] = useState([]);
  const [nuevaMezcla, setNuevaMezcla] = useState({
    name: '',
    total_quantity_kg: '',
    components: [], // components now store { origin_id, percentage, selected_roasted_batches: [{id, quantity_used}] }
    creation_date: '',
    batch_code: '',
    recipe_id: ''
  });
  const [editandoId, setEditandoId] = useState(null);
  const [componenteAdicional, setComponenteAdicional] = useState({ origin_id: '', percentage: '' }); // Para agregar componentes adicionales
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
      .select('*');
    if (originsError) {
      console.error('Error fetching origins:', originsError);
      setError('Error al cargar los orígenes.');
      setLoading(false);
      return;
    }
    setOrigenesDisponibles(originsData);

    const { data: recetasData, error: recetasError } = await supabase
      .from('blended_coffee_recipes')
      .select('*')
      .order('name', { ascending: true });

    if (recetasError) {
      console.error('Error fetching recipes:', recetasError);
      setError('Error al cargar las recetas.');
      setLoading(false);
      return;
    }
    setRecetasDisponibles(recetasData);

    const { data: roastedCoffeeData, error: roastedCoffeeError } = await supabase
      .from('roasted_coffee')
      .select(`
        *,
        green_coffee (origin_id)
      `)
      .order('batch_code', { ascending: true });

    if (roastedCoffeeError) {
      console.error('Error fetching roasted coffee for recipes:', roastedCoffeeError);
      setError('Error al cargar el café tostado para componentes.');
      setLoading(false);
      return;
    }
    setCafeTostadoDisponible(roastedCoffeeData);

    const { data: blendedCoffeeData, error: blendedCoffeeError } = await supabase
      .from('blended_coffee')
      .select('*')
      .order('creation_date', { ascending: false });

    if (blendedCoffeeError) {
      console.error('Error fetching blended coffee:', blendedCoffeeError);
      setError('Error al cargar las mezclas de café.');
    } else {
      setInventarioMezcla(blendedCoffeeData);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'recipe_id') {
      const selectedRecipe = recetasDisponibles.find(r => r.id === value);
      if (selectedRecipe) {
        setNuevaMezcla(prev => ({
          ...prev,
          recipe_id: value,
          name: selectedRecipe.name,
          components: selectedRecipe.components.map(comp => {
            const origin = origenesDisponibles.find(o => o.id === comp.origin_id);
            return {
              ...comp,
              name: origin ? `${origin.name} (${origin.description})` : 'Desconocido',
              selected_roasted_batches: [], // Initialize selected batches array
            };
          })
        }));
      } else {
        setNuevaMezcla(prev => ({ ...prev, recipe_id: value, name: '', components: [] }));
      }
    } else if (name === 'total_quantity_kg') {
      setNuevaMezcla(prev => ({ ...prev, total_quantity_kg: value }));
    } else {
      setNuevaMezcla({ ...nuevaMezcla, [name]: value });
    }
  };

  const handleComponenteAdicionalChange = (e) => {
    const { name, value } = e.target;
    setComponenteAdicional({ ...componenteAdicional, [name]: value });
  };

  const handleAddSelectedRoastedBatch = (index, batchId) => {
    setNuevaMezcla(prev => {
      const updatedComponents = [...prev.components];
      const batch = cafeTostadoDisponible.find(b => b.id === batchId);
      if (batch && !updatedComponents[index].selected_roasted_batches.some(b => b.id === batchId)) {
        updatedComponents[index].selected_roasted_batches.push({ id: batch.id, quantity_used: 0, batch_code: batch.batch_code, resultant_kg: batch.resultant_kg });
      }
      return { ...prev, components: updatedComponents };
    });
  };

  const handleRemoveSelectedRoastedBatch = (compIndex, batchIndex) => {
    setNuevaMezcla(prev => {
      const updatedComponents = [...prev.components];
      updatedComponents[compIndex].selected_roasted_batches.splice(batchIndex, 1);
      return { ...prev, components: updatedComponents };
    });
  };

  const handleQuantityUsedChange = (compIndex, batchIndex, value) => {
    setNuevaMezcla(prev => {
      const updatedComponents = [...prev.components];
      updatedComponents[compIndex].selected_roasted_batches[batchIndex].quantity_used = parseFloat(value) || 0;
      return { ...prev, components: updatedComponents };
    });
  };

  const showConfirm = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleAddAditionalComponent = () => {
    if (!componenteAdicional.origin_id || !componenteAdicional.percentage || parseFloat(componenteAdicional.percentage) <= 0) {
      alert('Por favor, selecciona un origen y un porcentaje válido para el componente adicional.');
      return;
    }
    const originSeleccionado = origenesDisponibles.find(o => o.id === componenteAdicional.origin_id);
    if (!originSeleccionado) {
      alert('Origen seleccionado no válido para componente adicional.');
      return;
    }

    const newComp = {
      origin_id: originSeleccionado.id,
      name: `Adicional: ${originSeleccionado.name} (${originSeleccionado.description})`,
      percentage: parseFloat(componenteAdicional.percentage),
      selected_roasted_batches: [] // Initialize empty for selection later
    };

    setNuevaMezcla(prev => ({
      ...prev,
      components: [...prev.components, newComp]
    }));
    setComponenteAdicional({ origin_id: '', percentage: '' });
  };

  const handleRemoveComponente = (index) => {
    setNuevaMezcla(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleComponentPercentageChange = (index, value) => {
    setNuevaMezcla(prev => {
      const updatedComponents = [...prev.components];
      updatedComponents[index].percentage = parseFloat(value) || 0;
      return { ...prev, components: updatedComponents };
    });
  };

  // Función para generar el lote de mezcla automáticamente
  const generateBatchCode = () => {
    if (!nuevaMezcla.recipe_id || !nuevaMezcla.creation_date) {
      alert('Por favor, selecciona una Receta y una Fecha de Creación para generar el lote.');
      return;
    }

    const selectedRecipe = recetasDisponibles.find(r => r.id === nuevaMezcla.recipe_id);
    if (!selectedRecipe) {
      alert('Receta seleccionada no válida.');
      return;
    }

    const recipePrefix = selectedRecipe.name.substring(0, 2).toUpperCase();
    const date = new Date(nuevaMezcla.creation_date);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const randomRef = Math.floor(1000 + Math.random() * 9000); // 4 dígitos aleatorios

    const newBatchCode = `${recipePrefix}-MZ-${day}${month}${year}-${randomRef}`;
    setNuevaMezcla(prev => ({ ...prev, batch_code: newBatchCode }));
  };

  const handleAddOrUpdateMezcla = async () => {
    if (!nuevaMezcla.name || !nuevaMezcla.total_quantity_kg || !nuevaMezcla.creation_date || nuevaMezcla.components.length === 0 || !nuevaMezcla.batch_code) {
      alert('Por favor, completa todos los campos y añade al menos un componente.');
      return;
    }

    const totalPorcentaje = nuevaMezcla.components.reduce((sum, comp) => sum + comp.percentage, 0);
    if (totalPorcentaje !== 100) {
      alert(`Los porcentajes de los componentes deben sumar 100%. Actualmente suman ${totalPorcentaje}%.`);
      return;
    }

    const totalQuantityKg = parseFloat(nuevaMezcla.total_quantity_kg);
    let stockSuficiente = true;
    const updatedRoastedCoffeeQuantities = {}; // Para rastrear cambios de stock

    // Validate and calculate quantities for each component
    for (const comp of nuevaMezcla.components) {
      const requiredKgForComponent = (totalQuantityKg * comp.percentage) / 100;
      const totalUsedFromBatches = comp.selected_roasted_batches.reduce((sum, batch) => sum + batch.quantity_used, 0);

      if (totalUsedFromBatches !== requiredKgForComponent) {
        alert(`Para el componente "${comp.name}", la cantidad total usada de los lotes (${totalUsedFromBatches.toFixed(2)} Kg) no coincide con la cantidad requerida (${requiredKgForComponent.toFixed(2)} Kg).`);
        stockSuficiente = false;
        break;
      }

      for (const selectedBatch of comp.selected_roasted_batches) {
        const batchInStock = cafeTostadoDisponible.find(b => b.id === selectedBatch.id);
        if (!batchInStock || batchInStock.resultant_kg < selectedBatch.quantity_used) {
          alert(`No hay suficiente stock en el lote ${selectedBatch.batch_code}. Disponible: ${batchInStock ? batchInStock.resultant_kg.toFixed(2) : 'N/A'} Kg, Necesario: ${selectedBatch.quantity_used.toFixed(2)} Kg.`);
          stockSuficiente = false;
          break;
        }
        updatedRoastedCoffeeQuantities[selectedBatch.id] = (updatedRoastedCoffeeQuantities[selectedBatch.id] || batchInStock.resultant_kg) - selectedBatch.quantity_used;
      }
      if (!stockSuficiente) break;
    }

    if (!stockSuficiente) {
      return;
    }

    // Apply stock updates
    for (const id in updatedRoastedCoffeeQuantities) {
      const { error: updateError } = await supabase
        .from('roasted_coffee')
        .update({ resultant_kg: updatedRoastedCoffeeQuantities[id] })
        .eq('id', id);
      if (updateError) {
        console.error('Error updating roasted coffee quantity:', updateError);
        setError('Error al actualizar el stock de café tostado.');
        return;
      }
    }

    const payload = {
      name: nuevaMezcla.name,
      total_quantity_kg: totalQuantityKg,
      components: nuevaMezcla.components.map(c => ({
        origin_id: c.origin_id, // Keep origin_id from recipe
        percentage: c.percentage,
        selected_roasted_batches: c.selected_roasted_batches.map(b => ({ id: b.id, quantity_used: b.quantity_used }))
      })),
      creation_date: nuevaMezcla.creation_date,
      batch_code: nuevaMezcla.batch_code,
      recipe_id: nuevaMezcla.recipe_id || null,
    };

    if (editandoId) {
      const { data, error } = await supabase
        .from('blended_coffee')
        .update(payload)
        .eq('id', editandoId)
        .select();
      
      if (error) {
        console.error('Error updating blended coffee:', error);
        setError('Error al actualizar la mezcla de café.');
      } else {
        showConfirm('Mezcla de café actualizada con éxito.');
        setEditandoId(null);
        setNuevaMezcla({ name: '', total_quantity_kg: '', components: [], creation_date: '', batch_code: '', recipe_id: '' });
        fetchData();
      }
    } else {
      const { data, error } = await supabase
        .from('blended_coffee')
        .insert([payload])
        .select();
      
      if (error) {
        console.error('Error adding blended coffee:', error);
        setError('Error al agregar la mezcla de café.');
      } else {
        showConfirm('Mezcla de café agregada con éxito.');
        setNuevaMezcla({ name: '', total_quantity_kg: '', components: [], creation_date: '', batch_code: '', recipe_id: '' });
        fetchData();
      }
    }
  };

  const handleEditMezcla = (mezcla) => {
    setNuevaMezcla({
      ...mezcla,
      total_quantity_kg: mezcla.total_quantity_kg.toString(),
      components: mezcla.components.map(comp => {
        const origin = origenesDisponibles.find(o => o.id === comp.origin_id);
        return {
          ...comp,
          name: origin ? `${origin.name} (${origin.description})` : 'Desconocido',
          selected_roasted_batches: comp.selected_roasted_batches.map(b => {
            const batch = cafeTostadoDisponible.find(cb => cb.id === b.id);
            return { ...b, batch_code: batch ? batch.batch_code : 'Desconocido', resultant_kg: batch ? batch.resultant_kg : 0 };
          }),
        };
      }),
      recipe_id: mezcla.recipe_id || ''
    });
    setEditandoId(mezcla.id);
  };

  const handleDeleteMezcla = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta mezcla de café? Esto devolverá el café tostado a tu inventario.')) {
      const mezclaEliminada = inventarioMezcla.find(mezcla => mezcla.id === id);
      
      for (const comp of mezclaEliminada.components) {
        for (const usedBatch of comp.selected_roasted_batches) {
          const cafeTostado = cafeTostadoDisponible.find(c => c.id === usedBatch.id);
          if (cafeTostado) {
            const { error: updateError } = await supabase
              .from('roasted_coffee')
              .update({ resultant_kg: cafeTostado.resultant_kg + usedBatch.quantity_used })
              .eq('id', cafeTostado.id);
            if (updateError) {
              console.error('Error returning roasted coffee quantity:', updateError);
              setError('Error al devolver la cantidad de café tostado.');
              return;
            }
          }
        }
      }

      const { error } = await supabase
        .from('blended_coffee')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting blended coffee:', error);
        setError('Error al eliminar la mezcla de café. Asegúrate de que no esté asociada a ventas.');
      } else {
        showConfirm('Mezcla de café eliminada con éxito.');
        fetchData();
      }
    }
  };

  // Calcular cantidades necesarias para la mezcla
  const calculateRequiredQuantities = () => {
    const totalKg = parseFloat(nuevaMezcla.total_quantity_kg);
    if (isNaN(totalKg) || totalKg <= 0 || nuevaMezcla.components.length === 0) {
      return [];
    }

    return nuevaMezcla.components.map(comp => {
      const requiredKg = (totalKg * comp.percentage) / 100;
      return {
        name: comp.name,
        requiredKg: requiredKg.toFixed(2)
      };
    });
  };

  const requiredQuantities = calculateRequiredQuantities();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600 text-lg">Cargando mezclas de café...</p>
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
          <Blend className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Inventario de Café Mezcla
        </motion.h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/')} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            <Home className="w-5 h-5 mr-2" />
            Inicio
          </Button>
        </div>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? 'Editar Mezcla de Café' : 'Agregar Nueva Mezcla de Café'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="recipe_id" className="block text-gray-700 text-sm font-bold mb-2">
                Seleccionar Receta (Opcional)
              </label>
              <select
                id="recipe_id"
                name="recipe_id"
                value={nuevaMezcla.recipe_id}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">-- Crear nueva o seleccionar existente --</option>
                {recetasDisponibles.map(receta => (
                  <option key={receta.id} value={receta.id}>
                    {receta.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Nombre de la Mezcla"
              id="name"
              name="name"
              value={nuevaMezcla.name}
              onChange={handleInputChange}
              placeholder="Ej: Mezcla Despertar"
              readOnly={!!nuevaMezcla.recipe_id} // Si hay receta, el nombre es de la receta
              className={!!nuevaMezcla.recipe_id ? 'bg-gray-100 cursor-not-allowed' : ''}
            />
            <Input
              label="Cantidad Total de la Mezcla (Kg)"
              id="total_quantity_kg"
              name="total_quantity_kg"
              type="number"
              value={nuevaMezcla.total_quantity_kg}
              onChange={handleInputChange}
              placeholder="Ej: 100"
            />
            <Input
              label="Fecha de Creación"
              id="creation_date"
              name="creation_date"
              type="date"
              value={nuevaMezcla.creation_date}
              onChange={handleInputChange}
            />
            <div className="md:col-span-2 flex items-end gap-2">
              <Input
                label="Lote de Mezcla (Automático)"
                id="batch_code"
                name="batch_code"
                value={nuevaMezcla.batch_code}
                onChange={handleInputChange}
                placeholder="Ej: DE-MZ-010124-1234"
                readOnly
                className="bg-gray-100 cursor-not-allowed flex-grow"
              />
              <Button onClick={generateBatchCode} type="button" className="flex-shrink-0 px-4 py-2">
                Generar Lote
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Componentes de la Mezcla</h3>
            {/* Sección para añadir componentes adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4">
              <div className="md:col-span-2">
                <label htmlFor="componenteAdicional_origin_id" className="block text-gray-700 text-sm font-bold mb-2">
                  Origen (Adicional)
                </label>
                <select
                  id="componenteAdicional_origin_id"
                  name="origin_id"
                  value={componenteAdicional.origin_id}
                  onChange={handleComponenteAdicionalChange}
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
                id="componenteAdicional_percentage"
                name="percentage"
                type="number"
                value={componenteAdicional.percentage}
                onChange={handleComponenteAdicionalChange}
                placeholder="Ej: 10"
                className="w-full"
              />
              <div className="md:col-span-3">
                <Button onClick={handleAddAditionalComponent} className="w-full bg-blue-500 hover:bg-blue-600">
                  Añadir Componente Adicional
                </Button>
              </div>
            </div>

            {nuevaMezcla.components.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Componentes Añadidos:</h4>
                <ul className="space-y-2">
                  {nuevaMezcla.components.map((comp, index) => {
                    const availableRoastedBatches = cafeTostadoDisponible.filter(
                      roasted => roasted.green_coffee && roasted.green_coffee.origin_id === comp.origin_id
                    );
                    return (
                      <li key={index} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100 gap-2">
                        <div className="flex-grow">
                          <span className="font-medium">{comp.name}</span>
                          <Input
                            label="Porcentaje (%)"
                            id={`comp-percentage-${index}`}
                            name="percentage"
                            type="number"
                            value={comp.percentage}
                            onChange={(e) => handleComponentPercentageChange(index, e.target.value)}
                            placeholder="%"
                            className="w-20 py-0.5 px-1 text-xs ml-2 inline-block"
                          />
                        </div>
                        {/* Sección para seleccionar lotes */}
                        <div className="flex-grow md:flex-grow-0 w-full md:w-auto">
                          <label htmlFor={`batch-select-${index}`} className="block text-gray-700 text-sm font-bold mb-1">
                            Lotes a usar:
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <select
                              id={`batch-select-${index}`}
                              value="" // Controlled by adding to array
                              onChange={(e) => handleAddSelectedRoastedBatch(index, e.target.value)}
                              className="shadow appearance-none border rounded-xl py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 text-sm"
                            >
                              <option value="">Añadir lote...</option>
                              {availableRoastedBatches.length > 0 ? (
                                availableRoastedBatches.map(batch => (
                                  <option key={batch.id} value={batch.id}>
                                    Lote: {batch.batch_code} ({batch.resultant_kg.toFixed(2)} Kg)
                                  </option>
                                ))
                              ) : (
                                <option disabled>No hay lotes disponibles de este origen</option>
                              )}
                            </select>
                          </div>
                          {comp.selected_roasted_batches.length > 0 && (
                            <ul className="space-y-1 text-xs">
                              {comp.selected_roasted_batches.map((selectedBatch, batchIdx) => (
                                <li key={selectedBatch.id} className="flex items-center gap-1 bg-gray-100 p-1 rounded">
                                  <span>{selectedBatch.batch_code}</span>
                                  <Input
                                    type="number"
                                    value={selectedBatch.quantity_used}
                                    onChange={(e) => handleQuantityUsedChange(index, batchIdx, e.target.value)}
                                    className="w-20 py-0.5 px-1 text-xs"
                                    placeholder="Kg"
                                  />
                                  <motion.button
                                    onClick={() => handleRemoveSelectedRoastedBatch(index, batchIdx)}
                                    className="text-red-500 hover:text-red-700"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <X className="w-3 h-3" />
                                  </motion.button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <motion.button
                          onClick={() => handleRemoveComponente(index)}
                          className="text-red-500 hover:text-red-700"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-right font-bold text-gray-800">
                  Total Porcentaje: {nuevaMezcla.components.reduce((sum, comp) => sum + comp.percentage, 0)}%
                </p>
              </div>
            )}

            {requiredQuantities.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="text-md font-semibold text-blue-800 mb-2">Cantidades Necesarias para {nuevaMezcla.total_quantity_kg} Kg:</h4>
                <ul className="list-disc list-inside text-blue-700">
                  {requiredQuantities.map((item, index) => (
                    <li key={index}>{item.name}: {item.requiredKg} Kg</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Button onClick={handleAddOrUpdateMezcla} className="mt-6 w-full">
            <PlusCircle className="w-5 h-5 mr-2" />
            {editandoId ? 'Actualizar Mezcla' : 'Agregar Mezcla'}
          </Button>
        </Card>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Stock de Café Tostado Disponible</h2>
          {cafeTostadoDisponible.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ¡No hay café tostado! No podrás crear mezclas.
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Lote</th>
                    <th className="py-3 px-6 text-left">Kg Resultante</th>
                    <th className="py-3 px-6 text-left">Tipo Tostado</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {cafeTostadoDisponible.map((cafe) => (
                      <motion.tr
                        key={cafe.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <td className="py-3 px-6 text-left whitespace-nowrap">{cafe.batch_code}</td>
                        <td className="py-3 px-6 text-left">{cafe.resultant_kg.toFixed(2)}</td>
                        <td className="py-3 px-6 text-left">{cafe.roast_type}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mezclas Actuales</h2>
          {inventarioMezcla.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay mezclas de café en el inventario. ¡A experimentar se ha dicho!
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Lote</th>
                    <th className="py-3 px-6 text-left">Nombre</th>
                    <th className="py-3 px-6 text-left">Cantidad (Kg)</th>
                    <th className="py-3 px-6 text-left">Componentes</th>
                    <th className="py-3 px-6 text-left">Fecha Creación</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {inventarioMezcla.map((mezcla) => {
                      return (
                        <motion.tr
                          key={mezcla.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="py-3 px-6 text-left whitespace-nowrap">{mezcla.batch_code}</td>
                          <td className="py-3 px-6 text-left whitespace-nowrap">{mezcla.name}</td>
                          <td className="py-3 px-6 text-left">{mezcla.total_quantity_kg.toFixed(2)}</td>
                          <td className="py-3 px-6 text-left">
                            {mezcla.components.map(comp => {
                              const origin = origenesDisponibles.find(o => o.id === comp.origin_id);
                              return origin ? `${origin.name} (${comp.percentage}%)` : `Desconocido (${comp.percentage}%)`;
                            }).join(', ')}
                          </td>
                          <td className="py-3 px-6 text-left">{mezcla.creation_date}</td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex item-center justify-center">
                              <motion.button
                                onClick={() => handleEditMezcla(mezcla)}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 transform hover:scale-110 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteMezcla(mezcla.id)}
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

export default CafeMezclaPage;