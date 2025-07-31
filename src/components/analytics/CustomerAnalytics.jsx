import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, subDays, startOfYear } from 'date-fns';
import { customerOperations } from '../../data/supabaseOperations';

const { FiUsers, FiCalendar, FiDownload, FiPackage, FiTruck, FiDroplet, FiSun, FiBarChart3 } = FiIcons;

const CustomerAnalytics = () => {
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [dateFrom, setDateFrom] = useState(format(startOfYear(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (dateFrom && dateTo) {
      generateAnalytics();
    }
  }, [selectedCustomer, dateFrom, dateTo]);

  const loadCustomers = async () => {
    try {
      const data = await customerOperations.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const generateAnalytics = async () => {
    setLoading(true);
    try {
      const customerId = selectedCustomer || null;
      const data = await customerOperations.getCustomerAnalytics(
        customerId,
        dateFrom + 'T00:00:00.000Z',
        dateTo + 'T23:59:59.999Z'
      );
      setAnalytics(data);
    } catch (error) {
      console.error('Error generating analytics:', error);
      alert('Error generating customer analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (analytics.length === 0) return;

    const csvContent = [
      ['Customer Analytics Report'],
      ['Period:', `${dateFrom} to ${dateTo}`],
      [''],
      ['Customer', 'Total Loads', 'Total Quantity', 'Total Volume (m³)', 'Wet Loads', 'Dry Loads', 'Email'],
      ...analytics.map(customer => [
        customer.customer_name,
        customer.total_loads,
        customer.total_quantity,
        customer.total_volume.toFixed(4),
        customer.wet_loads,
        customer.dry_loads,
        customer.customer_email
      ]),
      [''],
      ['Detailed Load Information'],
      ['Customer', 'Load Number', 'Date', 'Truck Registration', 'Type', 'Quantity', 'Volume (m³)', 'Status'],
      ...analytics.flatMap(customer =>
        customer.loads.map(load => [
          customer.customer_name,
          load.load_number,
          format(new Date(load.date), 'yyyy-MM-dd'),
          load.truck_registration,
          load.inventory_type,
          load.quantity,
          parseFloat(load.volume).toFixed(4),
          load.status
        ])
      )
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-analytics-${dateFrom}-to-${dateTo}.csv`;
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
    (acc, customer) => ({
      totalLoads: acc.totalLoads + customer.total_loads,
      totalQuantity: acc.totalQuantity + customer.total_quantity,
      totalVolume: acc.totalVolume + customer.total_volume,
      wetLoads: acc.wetLoads + customer.wet_loads,
      dryLoads: acc.dryLoads + customer.dry_loads
    }),
    { totalLoads: 0, totalQuantity: 0, totalVolume: 0, wetLoads: 0, dryLoads: 0 }
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
            <SafeIcon icon={FiUsers} className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Customer Analytics</h2>
              <p className="text-gray-600">Analyze customer deliveries and performance</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={analytics.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
              Customer (All if none selected)
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Ranges
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setQuickDateRange(30)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                30d
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                90d
              </button>
              <button
                onClick={() => setQuickDateRange(365)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                1yr
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        {analytics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600 mb-1">Total Loads</h4>
              <p className="text-2xl font-bold text-blue-800">{totalStats.totalLoads}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-600 mb-1">Total Quantity</h4>
              <p className="text-2xl font-bold text-green-800">{totalStats.totalQuantity.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-600 mb-1">Total Volume</h4>
              <p className="text-2xl font-bold text-purple-800">{totalStats.totalVolume.toFixed(4)} m³</p>
            </div>
            <div className="p-4 bg-cyan-50 rounded-lg">
              <h4 className="text-sm font-medium text-cyan-600 mb-1">Wet Loads</h4>
              <p className="text-2xl font-bold text-cyan-800">{totalStats.wetLoads}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="text-sm font-medium text-orange-600 mb-1">Dry Loads</h4>
              <p className="text-2xl font-bold text-orange-800">{totalStats.dryLoads}</p>
            </div>
          </div>
        )}

        {/* Analytics Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-blue-600"
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
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Loads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Volume (m³)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Load Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map((customer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <SafeIcon icon={FiTruck} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{customer.total_loads}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <SafeIcon icon={FiPackage} className="text-gray-400" />
                        <span className="text-sm text-gray-900">{customer.total_quantity.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.total_volume.toFixed(4)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {customer.wet_loads > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            <SafeIcon icon={FiDroplet} />
                            {customer.wet_loads} Wet
                          </span>
                        )}
                        {customer.dry_loads > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            <SafeIcon icon={FiSun} />
                            {customer.dry_loads} Dry
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.customer_email || 'No email'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <SafeIcon icon={FiUsers} className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-500">No customer deliveries found for the selected period</p>
            <p className="text-sm text-gray-400">Try adjusting your date range or customer filter</p>
          </div>
        )}

        {/* Detailed Loads for Selected Customer */}
        {selectedCustomer && analytics.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detailed Loads for {analytics[0]?.customer_name}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Load Number</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Truck Reg</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volume (m³)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics[0]?.loads.map((load, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{load.load_number}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {format(new Date(load.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{load.truck_registration}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          load.inventory_type === 'wet' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          <SafeIcon icon={load.inventory_type === 'wet' ? FiDroplet : FiSun} />
                          {load.inventory_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{load.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{parseFloat(load.volume).toFixed(4)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          load.status === 'delivered' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {load.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CustomerAnalytics;