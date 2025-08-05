import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { shavingsBagsOperations, shavingsCustomerOperations } from '../../data/supabaseOperations';

const { FiPackage, FiPlus, FiSave, FiX, FiUser, FiCalendar, FiTruck, FiBox, FiClipboard, FiSearch } = FiIcons;

const BagsInventory = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inventorySummary, setInventorySummary] = useState([]);
  const [bagsDelivered, setBagsDelivered] = useState([]);
  const [bagsPacked, setBagsPacked] = useState([]);

  // Bags delivery form state
  const [showBagsDeliveryForm, setShowBagsDeliveryForm] = useState(false);
  const [bagsDeliveryForm, setDeliveryBagsForm] = useState({
    customer_id: '',
    quantity_delivered: 1,
    notes: ''
  });

  // Bags packing form state
  const [showPackingForm, setShowPackingForm] = useState(false);
  const [packingForm, setPackingForm] = useState({
    customer_id: '',
    quantity_packed: 1,
    packed_by: '',
    customer_packed: false,
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
    loadInventorySummary();
    if (activeTab === 'delivered') {
      loadBagsDelivered();
    } else if (activeTab === 'packed') {
      loadBagsPacked();
    }
  }, [activeTab]);

  const loadCustomers = async () => {
    try {
      const data = await shavingsCustomerOperations.getShavingsCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      alert('Error loading shavings customers');
    }
  };

  const loadInventorySummary = async () => {
    setLoading(true);
    try {
      const data = await shavingsBagsOperations.getBagsInventorySummary();
      setInventorySummary(data);
    } catch (error) {
      console.error('Error loading inventory summary:', error);
      alert('Error loading inventory summary');
    } finally {
      setLoading(false);
    }
  };

  const loadBagsDelivered = async () => {
    setLoading(true);
    try {
      const data = await shavingsBagsOperations.getBagsByCustomer();
      setBagsDelivered(data);
    } catch (error) {
      console.error('Error loading bags delivered:', error);
      alert('Error loading bags delivered');
    } finally {
      setLoading(false);
    }
  };

  const loadBagsPacked = async () => {
    setLoading(true);
    try {
      const data = await shavingsBagsOperations.getPackedBagsByCustomer();
      setBagsPacked(data);
    } catch (error) {
      console.error('Error loading packed bags:', error);
      alert('Error loading packed bags');
    } finally {
      setLoading(false);
    }
  };

  const handleBagsDeliverySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await shavingsBagsOperations.recordBagsDelivered(bagsDeliveryForm);
      alert('Bags delivery recorded successfully!');
      resetBagsDeliveryForm();
      loadInventorySummary();
      loadBagsDelivered();
    } catch (error) {
      console.error('Error recording bags delivery:', error);
      alert('Error recording bags delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePackingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Check if enough empty bags are available
      const customerSummary = inventorySummary.find(item => item.customer_id === packingForm.customer_id);
      if (!customerSummary || customerSummary.available_empty < packingForm.quantity_packed) {
        alert(`Not enough empty bags available. Only ${customerSummary?.available_empty || 0} bags available.`);
        setLoading(false);
        return;
      }

      await shavingsBagsOperations.recordPackedBags(packingForm);
      alert('Bags packing recorded successfully!');
      resetPackingForm();
      loadInventorySummary();
      loadBagsPacked();
    } catch (error) {
      console.error('Error recording bags packing:', error);
      alert('Error recording bags packing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBagsDeliveryForm = () => {
    setDeliveryBagsForm({
      customer_id: '',
      quantity_delivered: 1,
      notes: ''
    });
    setShowBagsDeliveryForm(false);
  };

  const resetPackingForm = () => {
    setPackingForm({
      customer_id: '',
      quantity_packed: 1,
      packed_by: '',
      customer_packed: false,
      notes: ''
    });
    setShowPackingForm(false);
  };

  // Filter functions
  const filterInventorySummary = () => {
    if (!searchQuery) return inventorySummary;
    return inventorySummary.filter(item => 
      (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filterBagsDelivered = () => {
    if (!searchQuery) return bagsDelivered;
    return bagsDelivered.filter(item => 
      (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const filterBagsPacked = () => {
    if (!searchQuery) return bagsPacked;
    return bagsPacked.filter(item => 
      (item.customer_name && item.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.packed_by && item.packed_by.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SafeIcon icon={FiPackage} className="text-2xl text-amber-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Shavings Bags Inventory</h2>
              <p className="text-gray-600">Track empty bags, packed bags, and inventory</p>
            </div>
          </div>
          <div className="flex gap-3">
            {activeTab === 'inventory' && (
              <button
                onClick={() => setShowBagsDeliveryForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <SafeIcon icon={FiTruck} />
                <span>Record Bags Delivery</span>
              </button>
            )}
            {activeTab === 'inventory' && (
              <button
                onClick={() => setShowPackingForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <SafeIcon icon={FiBox} />
                <span>Record Bags Packing</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-amber-600 text-white' : 'hover:bg-gray-200'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiPackage} />
              <span>Inventory Summary</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('delivered')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${activeTab === 'delivered' ? 'bg-amber-600 text-white' : 'hover:bg-gray-200'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiTruck} />
              <span>Bags Delivered</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('packed')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${activeTab === 'packed' ? 'bg-amber-600 text-white' : 'hover:bg-gray-200'}`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiBox} />
              <span>Packed Bags</span>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered Bags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Packed Bags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered to Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Empty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Packed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mr-2"></div>
                        <span>Loading inventory data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filterInventorySummary().length > 0 ? (
                  filterInventorySummary().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.customer_name || 'Unknown Customer'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.delivered}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.packed}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.delivered_to_customers}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.available_empty > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.available_empty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.available_packed > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.available_packed}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No inventory data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'delivered' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Delivered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mr-2"></div>
                        <span>Loading bags delivered data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filterBagsDelivered().length > 0 ? (
                  filterBagsDelivered().map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity_delivered}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(item.date_delivered), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{item.notes || '-'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No bags delivered found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Packed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Packed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mr-2"></div>
                        <span>Loading packed bags data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filterBagsPacked().length > 0 ? (
                  filterBagsPacked().map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.quantity_packed}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${item.customer_packed ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {item.customer_packed ? 'Customer' : item.packed_by}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(item.date_packed), 'MMM dd, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{item.notes || '-'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No packed bags found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bags Delivery Form Modal */}
      {showBagsDeliveryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Record Bags Delivery</h3>
                <button
                  onClick={resetBagsDeliveryForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              <form onSubmit={handleBagsDeliverySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bagsDeliveryForm.customer_id}
                    onChange={(e) => setDeliveryBagsForm({ ...bagsDeliveryForm, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bagsDeliveryForm.quantity_delivered}
                    onChange={(e) => setDeliveryBagsForm({ ...bagsDeliveryForm, quantity_delivered: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={bagsDeliveryForm.notes}
                    onChange={(e) => setDeliveryBagsForm({ ...bagsDeliveryForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows="2"
                    placeholder="Any notes about this delivery"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetBagsDeliveryForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-amber-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading ? 'Saving...' : 'Record Delivery'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bags Packing Form Modal */}
      {showPackingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Record Bags Packing</h3>
                <button
                  onClick={resetPackingForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              <form onSubmit={handlePackingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={packingForm.customer_id}
                    onChange={(e) => setPackingForm({ ...packingForm, customer_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select customer</option>
                    {customers.map(customer => {
                      const customerSummary = inventorySummary.find(item => item.customer_id === customer.id);
                      const availableEmpty = customerSummary ? customerSummary.available_empty : 0;
                      return (
                        <option key={customer.id} value={customer.id} disabled={availableEmpty <= 0}>
                          {customer.name} {availableEmpty > 0 ? `(${availableEmpty} bags available)` : '(No bags available)'}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={packingForm.quantity_packed}
                    onChange={(e) => setPackingForm({ ...packingForm, quantity_packed: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                  {packingForm.customer_id && (
                    <div className="text-sm text-gray-500 mt-1">
                      {(() => {
                        const customerSummary = inventorySummary.find(item => item.customer_id === packingForm.customer_id);
                        const availableEmpty = customerSummary ? customerSummary.available_empty : 0;
                        if (packingForm.quantity_packed > availableEmpty) {
                          return <span className="text-red-600">Not enough empty bags available</span>;
                        }
                        return `${availableEmpty} empty bags available`;
                      })()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="customer-packed"
                    checked={packingForm.customer_packed}
                    onChange={(e) => setPackingForm({ 
                      ...packingForm, 
                      customer_packed: e.target.checked,
                      packed_by: e.target.checked ? '' : packingForm.packed_by
                    })}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="customer-packed" className="text-sm font-medium text-gray-700">
                    Packed by customer
                  </label>
                </div>
                {!packingForm.customer_packed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Packed By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={packingForm.packed_by}
                      onChange={(e) => setPackingForm({ ...packingForm, packed_by: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter worker name"
                      required={!packingForm.customer_packed}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={packingForm.notes}
                    onChange={(e) => setPackingForm({ ...packingForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    rows="2"
                    placeholder="Any notes about this packing"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetPackingForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:bg-amber-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading ? 'Saving...' : 'Record Packing'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default BagsInventory;