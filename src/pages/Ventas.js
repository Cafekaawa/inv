import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { PlusCircle, Edit, Trash2, ShoppingCart, CheckCircle, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

const VentasPage = () => {
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [nuevaVenta, setNuevaVenta] = useState({ product_id: '', product_type: '', quantity_kg: '', unit_price: '', sale_date: '', batch_code_sold: '' });
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

    // Fetch Roasted Coffee
    const { data: roastedData, error: roastedError } = await supabase
      .from('roasted_coffee')
      .select('*');
    if (roastedError) {
      console.error('Error fetching roasted coffee:', roastedError);
      setError('Error al cargar café tostado.');
      setLoading(false);
      return;
    }
    const mappedRoasted = roastedData.map(p => ({
      id: p.id,
      type: 'tostado',
      name: `Café Tostado - Lote: ${p.batch_code} (${p.roast_type})`,
      quantity_kg: p.resultant_kg,
      batch_code: p.batch_code,
      unit_price: 15.00 // Precio de ejemplo para tostado
    }));

    // Fetch Blended Coffee
    const { data: blendedData, error: blendedError } = await supabase
      .from('blended_coffee')
      .select('*');
    if (blendedError) {
      console.error('Error fetching blended coffee:', blendedError);
      setError('Error al cargar café mezcla.');
      setLoading(false);
      return;
    }
    const mappedBlended = blendedData.map(p => ({
      id: p.id,
      type: 'mezcla',
      name: `Mezcla - ${p.name} (Lote: ${p.batch_code})`,
      quantity_kg: p.total_quantity_kg,
      batch_code: p.batch_code,
      unit_price: 25.00 // Precio de ejemplo para mezcla
    }));

    setProductosDisponibles([...mappedRoasted, ...mappedBlended].sort((a, b) => a.name.localeCompare(b.name)));

    // Fetch Sales
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false });

    if (salesError) {
      console.error('Error fetching sales:', salesError);
      setError('Error al cargar las ventas.');
    } else {
      setVentas(salesData);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "product_id") {
      const selectedProduct = productosDisponibles.find(p => p.id === value);
      setNuevaVenta({
        ...nuevaVenta,
        [name]: value,
        product_type: selectedProduct ? selectedProduct.type : '',
        batch_code_sold: selectedProduct ? selectedProduct.batch_code : '',
        unit_price: selectedProduct ? selectedProduct.unit_price.toString() : ''
      });
    } else {
      setNuevaVenta({ ...nuevaVenta, [name]: value });
    }
  };

  const showConfirm = (message) => {
    setConfirmationMessage(message);
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);
  };

  const handleAddOrUpdateVenta = async () => {
    if (!nuevaVenta.product_id || !nuevaVenta.quantity_kg || !nuevaVenta.sale_date || !nuevaVenta.batch_code_sold || !nuevaVenta.product_type) {
      alert('Por favor, selecciona un producto, la cantidad, la fecha de venta y asegúrate de que el lote esté registrado.');
      return;
    }

    const productoSeleccionado = productosDisponibles.find(p => p.id === nuevaVenta.product_id);
    if (!productoSeleccionado) {
      alert('Producto seleccionado no válido.');
      return;
    }

    const quantityToSell = parseFloat(nuevaVenta.quantity_kg);
    const unitPrice = parseFloat(nuevaVenta.unit_price);

    if (quantityToSell <= 0) {
      alert('La cantidad a vender debe ser mayor que cero.');
      return;
    }

    let currentProductStock = productoSeleccionado.quantity_kg;

    // Si estamos editando, primero "devolvemos" la cantidad anterior al stock
    if (editandoId) {
      const oldSale = ventas.find(v => v.id === editandoId);
      if (oldSale) {
        const oldProduct = productosDisponibles.find(p => p.id === oldSale.product_id);
        if (oldProduct) {
          currentProductStock = oldProduct.quantity_kg + oldSale.quantity_kg;
        }
      }
    }

    if (currentProductStock < quantityToSell) {
      alert(`No hay suficiente ${productoSeleccionado.name} disponible. Solo tienes ${currentProductStock.toFixed(2)} Kg.`);
      return;
    }

    // Actualizar stock en la base de datos
    const newStock = currentProductStock - quantityToSell;
    const tableToUpdate = productoSeleccionado.type === 'tostado' ? 'roasted_coffee' : 'blended_coffee';
    const stockColumn = productoSeleccionado.type === 'tostado' ? 'resultant_kg' : 'total_quantity_kg';

    const { error: updateStockError } = await supabase
      .from(tableToUpdate)
      .update({ [stockColumn]: newStock })
      .eq('id', productoSeleccionado.id);

    if (updateStockError) {
      console.error('Error updating product stock:', updateStockError);
      setError('Error al actualizar el stock del producto.');
      return;
    }

    const payload = {
      product_id: nuevaVenta.product_id,
      product_type: nuevaVenta.product_type,
      quantity_kg: quantityToSell,
      unit_price: unitPrice,
      sale_date: nuevaVenta.sale_date,
      batch_code_sold: nuevaVenta.batch_code_sold,
    };

    if (editandoId) {
      const { data, error } = await supabase
        .from('sales')
        .update(payload)
        .eq('id', editandoId)
        .select();
      
      if (error) {
        console.error('Error updating sale:', error);
        setError('Error al actualizar la venta.');
      } else {
        showConfirm('Venta actualizada con éxito.');
        setEditandoId(null);
        setNuevaVenta({ product_id: '', product_type: '', quantity_kg: '', unit_price: '', sale_date: '', batch_code_sold: '' });
        fetchData();
      }
    } else {
      const { data, error } = await supabase
        .from('sales')
        .insert([payload])
        .select();
      
      if (error) {
        console.error('Error adding sale:', error);
        setError('Error al registrar la venta.');
      } else {
        showConfirm('Venta registrada con éxito.');
        setNuevaVenta({ product_id: '', product_type: '', quantity_kg: '', unit_price: '', sale_date: '', batch_code_sold: '' });
        fetchData();
      }
    }
  };

  const handleEditVenta = (venta) => {
    setNuevaVenta({
      ...venta,
      product_id: venta.product_id,
      quantity_kg: venta.quantity_kg.toString(),
      unit_price: venta.unit_price.toString(),
    });
    setEditandoId(venta.id);
  };

  const handleDeleteVenta = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esto devolverá el producto al inventario.')) {
      const ventaEliminada = ventas.find(venta => venta.id === id);
      const productoAfectado = productosDisponibles.find(p => p.id === ventaEliminada.product_id);

      if (productoAfectado) {
        const tableToUpdate = productoAfectado.type === 'tostado' ? 'roasted_coffee' : 'blended_coffee';
        const stockColumn = productoAfectado.type === 'tostado' ? 'resultant_kg' : 'total_quantity_kg';

        const { error: updateStockError } = await supabase
          .from(tableToUpdate)
          .update({ [stockColumn]: productoAfectado.quantity_kg + ventaEliminada.quantity_kg })
          .eq('id', productoAfectado.id);

        if (updateStockError) {
          console.error('Error returning product stock:', updateStockError);
          setError('Error al devolver el stock del producto.');
          return;
        }
      }

      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting sale:', error);
        setError('Error al eliminar la venta.');
      } else {
        showConfirm('Venta eliminada con éxito.');
        fetchData();
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600 text-lg">Cargando ventas...</p>
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
          <ShoppingCart className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Registro de Ventas
        </motion.h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/')} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            <Home className="w-5 h-5 mr-2" />
            Inicio
          </Button>
        </div>

        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editandoId ? 'Editar Venta' : 'Registrar Nueva Venta'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label htmlFor="product_id" className="block text-gray-700 text-sm font-bold mb-2">
                Producto a Vender
              </label>
              <select
                id="product_id"
                name="product_id"
                value={nuevaVenta.product_id}
                onChange={handleInputChange}
                className="shadow appearance-none border rounded-xl w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Selecciona un producto</option>
                {productosDisponibles.map(producto => (
                  <option key={producto.id} value={producto.id}>
                    {producto.name} ({producto.quantity_kg.toFixed(2)} Kg disponibles)
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Cantidad a Vender (Kg)"
              id="quantity_kg"
              name="quantity_kg"
              type="number"
              step="0.01"
              value={nuevaVenta.quantity_kg}
              onChange={handleInputChange}
              placeholder="Ej: 0.5"
            />
            <Input
              label="Precio Unitario ($/Kg)"
              id="unit_price"
              name="unit_price"
              type="number"
              step="0.01"
              value={nuevaVenta.unit_price}
              onChange={handleInputChange}
              placeholder="Ej: 15.00"
              readOnly
            />
            <Input
              label="Fecha de Venta"
              id="sale_date"
              name="sale_date"
              type="date"
              value={nuevaVenta.sale_date}
              onChange={handleInputChange}
            />
            <Input
              label="Lote Vendido"
              id="batch_code_sold"
              name="batch_code_sold"
              value={nuevaVenta.batch_code_sold}
              onChange={handleInputChange}
              placeholder="Lote del producto seleccionado"
              readOnly
            />
          </div>
          <Button onClick={handleAddOrUpdateVenta} className="mt-6 w-full">
            <PlusCircle className="w-5 h-5 mr-2" />
            {editandoId ? 'Actualizar Venta' : 'Registrar Venta'}
          </Button>
        </Card>
        
        <Card>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial de Ventas</h2>
          {ventas.length === 0 ? (
            <motion.p
              className="text-gray-600 text-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              No hay ventas registradas. ¡A vender café se ha dicho!
            </motion.p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Producto</th>
                    <th className="py-3 px-6 text-left">Lote Vendido</th>
                    <th className="py-3 px-6 text-left">Cantidad (Kg)</th>
                    <th className="py-3 px-6 text-left">Precio Unitario ($/Kg)</th>
                    <th className="py-3 px-6 text-left">Total ($)</th>
                    <th className="py-3 px-6 text-left">Fecha Venta</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  <AnimatePresence>
                    {ventas.map((venta) => {
                      const productoVendido = productosDisponibles.find(p => p.id === venta.product_id);
                      const nombreProducto = productoVendido ? productoVendido.name : 'Producto Desconocido';
                      const totalVenta = venta.quantity_kg * venta.unit_price;
                      return (
                        <motion.tr
                          key={venta.id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="py-3 px-6 text-left whitespace-nowrap">{nombreProducto}</td>
                          <td className="py-3 px-6 text-left">{venta.batch_code_sold}</td>
                          <td className="py-3 px-6 text-left">{venta.quantity_kg.toFixed(2)}</td>
                          <td className="py-3 px-6 text-left">${venta.unit_price.toFixed(2)}</td>
                          <td className="py-3 px-6 text-left">${totalVenta.toFixed(2)}</td>
                          <td className="py-3 px-6 text-left">{venta.sale_date}</td>
                          <td className="py-3 px-6 text-center">
                            <div className="flex item-center justify-center">
                              <motion.button
                                onClick={() => handleEditVenta(venta)}
                                className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 transform hover:scale-110 transition-all duration-200"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={() => handleDeleteVenta(venta.id)}
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

export default VentasPage;