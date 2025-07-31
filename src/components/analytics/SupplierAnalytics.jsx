import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, subDays, startOfYear } from 'date-fns';
import { supplierOperations } from '../../data/supabaseOperations';

const { FiTruck, FiCalendar, FiDownload, FiPackage, FiBarChart3, FiTrendingUp } = FiIcons;

const SupplierAnalytics = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [dateFrom, setDateFrom] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      generateAnalytics();
    }
  }, [selectedSupplier, dateFrom, dateTo]);

  const loadSuppliers = async () => {
    try {
      const data = await supplierOperations.getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      const data = await supplierOperations.getSupplierAnalytics(
        dateFrom + 'T00:00:00.000Z',
        dateTo + 'T23:59:59.999Z'
      );

      // Filter by selected supplier if specified
      const filteredData = selectedSupplier 
        ? data.filter(supplier => supplier.supplier === selectedSupplier)
        : data;

      setAnalytics(filteredData);
    } catch (error) {
      console.error('Error generating analytics:', error);
      alert('Error generating supplier analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (analytics.length === 0) return;

    const csvContent = [
      ['Supplier Analytics Report'],
      ['Period:', `${dateFrom} to ${dateTo}`],
      [''],
      ['Supplier', 'Total Logs', 'Total Volume (m³)', 'Number of Deliveries', 'Average Volume per Delivery'],
      ...analytics.map(supplier => [
        supplier.supplier,
        supplier.total_logs,
        supplier.total_volume.toFixed(4),
        supplier.deliveries.length,
        (supplier.total_volume / supplier.deliveries.length).toFixed(4)
      ]),
      [''],
      ['Detailed Delivery Information'],
      ['Supplier', 'Delivery Date', 'Volume (m³)'],
      ...analytics.flatMap(supplier =>
        supplier.deliveries.map(delivery => [
          supplier.supplier,
          format(new Date(delivery.date), 'yyyy-MM-dd HH:mm'),
          parseFloat(delivery.volume).toFixed(4)
        ])
      )
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-analytics-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setQuickDateRange = (days) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    setDateFrom(format(startDate, 'yyyy-MM-dd'));
    setDateTo(format(endDate, 'yyyy-MM-dd'));
  };

  const totalStats = analytics.reduce(
    (acc, supplier) => ({
      totalLogs: acc.totalLogs + supplier.total_logs,
      totalVolume: acc.totalVolume + supplier.total_volume,
      totalDeliveries: acc.totalDeliveries + supplier.deliveries.length
    }),
    { totalLogs: 0, totalVolume: 0, totalDeliveries: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SafeIcon icon={FiTruck} className="text-2xl text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Supplier Analytics</h2>
              <p className="text-gray-600">Analyze supplier deliveries and performance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={analytics.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              <SafeIcon icon={FiDownload} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier (All if none selected)
            </label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.name}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Ranges
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setQuickDateRange(30)}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                30d
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                90d
              </button>
              <button
                onClick={() => setQuickDateRange(365)}
                className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                1yr
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        {analytics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-600 mb-1">Total Logs</h4>
              <p className="text-2xl font-bold text-green-800">{totalStats.totalLogs}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600 mb-1">Total Volume</h4>
              <p className="text-2xl font-bold text-blue-800">{totalStats.totalVolume.toFixed(4)} m³</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-600 mb-1">Total Deliveries</h4>
              <p className="text-2xl font-bold text-purple-800">{totalStats.totalDeliveries}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="text-sm font-medium text-orange-600 mb-1">Avg Volume/Delivery</h4>
              <p className="text-2xl font-bold text-orange-800">
                {totalStats.totalDeliveries > 0 
                  ? (totalStats.totalVolume / totalStats.totalDeliveries).toFixed(4) 
                  : '0.0000'} m³
              </p>
            </div>
          </div>
        )}

        {/* Analytics Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-green-600"
            >
              <SafeIcon icon={FiBarChart3} className="text-3xl" />
            </motion.div>
            <span className="ml-3 text-lg text-gray-600">Generating analytics...</span>
          </div>
        ) : analytics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Logs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Volume (m³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deliveries
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Volume/Delivery
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map((supplier, index) => {
                  const avgVolumePerDelivery = supplier.deliveries.length > 0 
                    ? supplier.total_volume / supplier.deliveries.length 
                    : 0;
                  
                  const performance = supplier.total_volume > 50 ? 'High' : 
                                    supplier.total_volume > 20 ? 'Medium' : 'Low';
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <SafeIcon icon={FiTruck} className="text-green-600 mr-2" />
                          <div className="text-sm font-medium text-gray-900">{supplier.supplier}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <SafeIcon icon={FiPackage} className="text-gray-400" />
                          <span className="text-sm text-gray-900">{supplier.total_logs}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.total_volume.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.deliveries.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{avgVolumePerDelivery.toFixed(4)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          performance === 'High' ? 'bg-green-100 text-green-800' :
                          performance === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          <SafeIcon icon={FiTrendingUp} />
                          {performance}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <SafeIcon icon={FiTruck} className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-500">No supplier deliveries found for the selected period</p>
            <p className="text-sm text-gray-400">Try adjusting your date range or supplier filter</p>
          </div>
        )}

        {/* Detailed Deliveries for Selected Supplier */}
        {selectedSupplier && analytics.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detailed Deliveries for {selectedSupplier}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volume (m³)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day of Week</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics[0]?.deliveries
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((delivery, index) => {
                      const deliveryDate = new Date(delivery.date);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {format(deliveryDate, 'MMM dd, yyyy')}
                          </td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {parseFloat(delivery.volume).toFixed(4)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {format(deliveryDate, 'EEEE')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {format(deliveryDate, 'HH:mm')}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Chart Placeholder */}
        {analytics.length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {analytics.length}
                </div>
                <div className="text-sm text-gray-600">Active Suppliers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Math.max(...analytics.map(s => s.total_logs))}
                </div>
                <div className="text-sm text-gray-600">Max Logs by Single Supplier</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.max(...analytics.map(s => s.total_volume)).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Max Volume by Single Supplier (m³)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SupplierAnalytics;