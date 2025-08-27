import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart2, Home } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

const ReportesPage = () => {
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [stockResumen, setStockResumen] = useState({ green: 0, roasted: 0, blended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    // Fetch Sales Data for Monthly Sales Chart
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('sale_date, quantity_kg, unit_price');

    if (salesError) {
      console.error('Error fetching sales data for reports:', salesError);
      setError('Error al cargar datos de ventas para reportes.');
    } else {
      const monthlySales = salesData.reduce((acc, sale) => {
        const date = new Date(sale.sale_date);
        const monthYear = `${date.toLocaleString('es-ES', { month: 'short' })}-${date.getFullYear().toString().slice(2)}`;
        const totalSale = sale.quantity_kg * sale.unit_price;
        acc[monthYear] = (acc[monthYear] || 0) + totalSale;
        return acc;
      }, {});

      const formattedMonthlySales = Object.keys(monthlySales).map(key => ({
        name: key,
        ventas: parseFloat(monthlySales[key].toFixed(2))
      })).sort((a, b) => {
        // Simple sort, for real app would need proper date parsing
        const [monthA, yearA] = a.name.split('-');
        const [monthB, yearB] = b.name.split('-');
        const dateA = new Date(`01-${monthA}-20${yearA}`);
        const dateB = new Date(`01-${monthB}-20${yearB}`);
        return dateA - dateB;
      });
      setVentasMensuales(formattedMonthlySales);

      // Data for Most Sold Products Chart
      const productSales = salesData.reduce((acc, sale) => {
        const productName = sale.batch_code_sold; // Using batch_code_sold as product identifier for simplicity
        acc[productName] = (acc[productName] || 0) + sale.quantity_kg;
        return acc;
      }, {});

      const formattedProductSales = Object.keys(productSales).map(key => ({
        name: key,
        value: parseFloat(productSales[key].toFixed(2))
      })).sort((a, b) => b.value - a.value); // Sort by value descending
      setProductosMasVendidos(formattedProductSales.slice(0, 5)); // Top 5 products
    }

    // Fetch Stock Summary
    const { data: greenStock, error: greenError } = await supabase
      .from('green_coffee')
      .select('quantity_kg');
    const { data: roastedStock, error: roastedError } = await supabase
      .from('roasted_coffee')
      .select('resultant_kg');
    const { data: blendedStock, error: blendedError } = await supabase
      .from('blended_coffee')
      .select('total_quantity_kg');

    if (greenError || roastedError || blendedError) {
      console.error('Error fetching stock data:', greenError, roastedError, blendedError);
      setError('Error al cargar el resumen de stock.');
    } else {
      const totalGreen = greenStock.reduce((sum, item) => sum + item.quantity_kg, 0);
      const totalRoasted = roastedStock.reduce((sum, item) => sum + item.resultant_kg, 0);
      const totalBlended = blendedStock.reduce((sum, item) => sum + item.total_quantity_kg, 0);
      setStockResumen({
        green: totalGreen.toFixed(2),
        roasted: totalRoasted.toFixed(2),
        blended: totalBlended.toFixed(2)
      });
    }

    setLoading(false);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <p className="text-gray-600 text-lg">Generando reportes...</p>
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
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.h1
          className="text-4xl font-extrabold text-center mb-8 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <BarChart2 className="inline-block w-10 h-10 mr-3 text-blue-600" />
          Reportes y Estadísticas
        </motion.h1>

        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/')} className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
            <Home className="w-5 h-5 mr-2" />
            Inicio
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ventas Mensuales</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventasMensuales} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="ventas" fill="#8884d8" name="Ventas ($)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Productos Más Vendidos (Kg)</h2>
            {productosMasVendidos.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productosMasVendidos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {productosMasVendidos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toFixed(2)} Kg`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-600 text-center py-4">No hay datos de productos vendidos.</p>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen de Stock (Kg)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Café Verde</p>
                <p className="text-3xl font-bold text-blue-800 mt-1">{stockResumen.green} Kg</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-sm text-green-600 font-medium">Café Tostado</p>
                <p className="text-3xl font-bold text-green-800 mt-1">{stockResumen.roasted} Kg</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-600 font-medium">Café Mezcla</p>
                <p className="text-3xl font-bold text-purple-800 mt-1">{stockResumen.blended} Kg</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportesPage;