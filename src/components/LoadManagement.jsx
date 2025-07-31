import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { loadOperations, customerOperations, inventoryOperations } from '../data/supabaseOperations';

const { FiTruck, FiPlus, FiTrash2, FiSave, FiPackage, FiDroplet, FiSun, FiUser, FiCalendar, FiFileText } = FiIcons;

// Constants for plank dimensions
const PLANK_SIZES = [
  { width: 38, height: 38, label: '38×38mm' },
  { width: 76, height: 50, label: '76×50mm' },
  { width: 114, height: 38, label: '114×38mm' },
  { width: 152, height: 38, label: '152×38mm' },
  { width: 228, height: 38, label: '228×38mm' }
];

const PLANK_LENGTHS = [
  { value: 2.1, label: 'Under 2.4m' },
  { value: 2.4, label: '2.4m' },
  { value: 3.0, label: '3.0m' },
  { value: 3.3, label: '3.3m' },
  { value: 3.6, label: '3.6m' },
  { value: 3.9, label: '3.9m' },
  { value: 4.2, label: '4.2m' },
  { value: 4.5, label: '4.5m' },
  { value: 4.8, label: '4.8m' },
  { value: 5.1, label: '5.1m' },
  { value: 5.4, label: '5.4m' },
  { value: 5.7, label: '5.7m' },
  { value: 6.0, label: '6.0m' },
  { value: 6.6, label: '6.6m' }
];

// Function to calculate plank volume
const calculatePlankVolume = (width, height, length, quantity) => {
  const widthM = width / 1000;
  const heightM = height / 1000;
  return widthM * heightM * length * quantity;
};

const LoadManagement = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [truckRegistration, setTruckRegistration] = useState('');
  const [inventoryType, setInventoryType] = useState('wet'); // wet or dry
  const [loadedPlanks, setLoadedPlanks] = useState([
    { id: Date.now(), size: '', length: '', quantity: 1 }
  ]);
  const [customers, setCustomers] = useState([]);
  const [availableInventory, setAvailableInventory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    if (activeTab === 'view') {
      loadSentLoads();
    }
  }, [activeTab]);

  useEffect(() => {
    if (inventoryType) {
      loadAvailableInventory();
    }
  }, [inventoryType]);

  const loadCustomers = async () => {
    try {
      const data = await customerOperations.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadAvailableInventory = async () => {
    try {
      const data = await inventoryOperations.getAvailableInventory(inventoryType);
      setAvailableInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  };

  const loadSentLoads = async () => {
    setLoading(true);
    try {
      const data = await loadOperations.getLoads();
      setLoads(data);
    } catch (error) {
      console.error('Error loading loads:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLoadedPlank = () => {
    setLoadedPlanks([...loadedPlanks, { id: Date.now(), size: '', length: '', quantity: 1 }]);
  };

  const removeLoadedPlank = (id) => {
    if (loadedPlanks.length > 1) {
      setLoadedPlanks(loadedPlanks.filter(plank => plank.id !== id));
    }
  };

  const updateLoadedPlank = (id, field, value) => {
    setLoadedPlanks(loadedPlanks.map(plank =>
      plank.id === id ? { ...plank, [field]: value } : plank
    ));
  };

  const getAvailableQuantity = (size, length) => {
    if (!size || !length) return 0;
    const [width, height] = size.split('x').map(Number);
    const lengthNum = parseFloat(length);
    
    const available = availableInventory.find(plank =>
      plank.width === width &&
      plank.height === height &&
      plank.length === lengthNum
    );
    return available ? available.available_quantity : 0;
  };

  const calculateTotalQuantity = () => {
    return loadedPlanks.reduce((total, plank) => {
      if (plank.quantity) {
        return total + parseInt(plank.quantity);
      }
      return total;
    }, 0);
  };

  const calculateTotalVolume = () => {
    return loadedPlanks.reduce((total, plank) => {
      if (plank.size && plank.length && plank.quantity) {
        const [width, height] = plank.size.split('x').map(Number);
        const length = parseFloat(plank.length);
        const volume = calculatePlankVolume(width, height, length, parseInt(plank.quantity));
        return total + volume;
      }
      return total;
    }, 0);
  };

  const saveLoad = async () => {
    if (!selectedCustomer || !truckRegistration) {
      alert('Please select customer and enter truck registration');
      return;
    }

    const validPlanks = loadedPlanks.filter(plank =>
      plank.size && plank.length && plank.quantity > 0
    );

    if (validPlanks.length === 0) {
      alert('Please add at least one valid plank entry');
      return;
    }

    // Check availability
    for (const plank of validPlanks) {
      const available = getAvailableQuantity(plank.size, plank.length);
      if (plank.quantity > available) {
        alert(`Not enough ${inventoryType} planks available. You need ${plank.quantity} but only ${available} are available for ${plank.size} - ${plank.length}m`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Create load entry
      const loadData = {
        date: selectedDate,
        customer_id: selectedCustomer,
        truck_registration: truckRegistration,
        inventory_type: inventoryType,
        total_quantity: calculateTotalQuantity(),
        total_volume: calculateTotalVolume(),
        status: 'loaded'
      };

      const load = await loadOperations.createLoad(loadData);

      // Create load items
      const loadItems = [];
      validPlanks.forEach(plank => {
        const [width, height] = plank.size.split('x').map(Number);
        const length = parseFloat(plank.length);
        const volume = calculatePlankVolume(width, height, length, plank.quantity);

        loadItems.push({
          load_id: load.id,
          width,
          height,
          length,
          quantity: parseInt(plank.quantity),
          volume,
          inventory_type: inventoryType
        });
      });

      await loadOperations.createLoadItems(loadItems);

      // Update inventory
      await inventoryOperations.deductInventory(loadItems, inventoryType);

      // Reset form
      setSelectedCustomer('');
      setTruckRegistration('');
      setLoadedPlanks([{ id: Date.now(), size: '', length: '', quantity: 1 }]);
      
      // Reload inventory
      await loadAvailableInventory();

      alert(`Load successfully created! Load ID: ${load.load_number}`);
    } catch (error) {
      console.error('Error saving load:', error);
      alert('Error saving load. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateDeliveryNote = (load) => {
    // This will navigate to the delivery note component
    // For now, we'll show an alert
    alert(`Generating delivery note for Load ${load.load_number}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <SafeIcon icon={FiTruck} className="text-2xl text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Load Management</h2>
        <div className="ml-auto text-sm text-green-600">
          Database Connected
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'create' ? 'bg-green-600 text-white' : 'hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SafeIcon icon={FiPlus} />
            <span>Create Load</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'view' ? 'bg-green-600 text-white' : 'hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SafeIcon icon={FiFileText} />
            <span>View Loads</span>
          </div>
        </button>
      </div>

      {activeTab === 'create' ? (
        <>
          {/* Load Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <SafeIcon icon={FiCalendar} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                Truck Registration <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={truckRegistration}
                onChange={(e) => setTruckRegistration(e.target.value)}
                placeholder="Enter truck registration"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inventory Type <span className="text-red-500">*</span>
              </label>
              <select
                value={inventoryType}
                onChange={(e) => setInventoryType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="wet">
                  <SafeIcon icon={FiDroplet} className="inline mr-2" />
                  Wet Inventory
                </option>
                <option value="dry">
                  <SafeIcon icon={FiSun} className="inline mr-2" />
                  Dry Inventory
                </option>
              </select>
            </div>
          </div>

          {/* Inventory Type Indicator */}
          <div className={`p-3 rounded-lg mb-6 ${
            inventoryType === 'wet' ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className="flex items-center gap-2">
              <SafeIcon 
                icon={inventoryType === 'wet' ? FiDroplet : FiSun} 
                className={`text-xl ${inventoryType === 'wet' ? 'text-blue-600' : 'text-orange-600'}`} 
              />
              <h3 className={`text-lg font-semibold ${
                inventoryType === 'wet' ? 'text-blue-800' : 'text-orange-800'
              }`}>
                {inventoryType === 'wet' ? 'Wet Inventory' : 'Dry Inventory'} - {availableInventory.length} items available
              </h3>
            </div>
            <p className={`text-sm mt-1 ${
              inventoryType === 'wet' ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {inventoryType === 'wet' 
                ? 'Planks directly from cutting station (not planed)'
                : 'Planed planks ready for delivery'
              }
            </p>
          </div>

          {/* Loaded Planks */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Loaded Planks</h3>
              <button
                onClick={addLoadedPlank}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} />
                Add Plank
              </button>
            </div>

            <div className="space-y-3">
              {loadedPlanks.map((plank) => {
                const availableQty = getAvailableQuantity(plank.size, plank.length);
                const volume = plank.size && plank.length && plank.quantity
                  ? calculatePlankVolume(
                      ...plank.size.split('x').map(Number),
                      parseFloat(plank.length),
                      parseInt(plank.quantity)
                    )
                  : 0;

                return (
                  <motion.div
                    key={plank.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Size
                      </label>
                      <select
                        value={plank.size}
                        onChange={(e) => updateLoadedPlank(plank.id, 'size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        {PLANK_SIZES.map((size) => (
                          <option key={size.label} value={`${size.width}x${size.height}`}>
                            {size.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Length
                      </label>
                      <select
                        value={plank.length}
                        onChange={(e) => updateLoadedPlank(plank.id, 'length', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Select</option>
                        {PLANK_LENGTHS.map((length) => (
                          <option key={length.label} value={length.value}>
                            {length.label}
                          </option>
                        ))}
                      </select>
                      {plank.size && plank.length && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {availableQty}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={availableQty}
                        value={plank.quantity}
                        onChange={(e) => updateLoadedPlank(plank.id, 'quantity', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          plank.quantity > availableQty ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {plank.quantity > availableQty && (
                        <p className="text-xs text-red-500 mt-1">
                          Exceeds available quantity
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Volume (m³)
                      </label>
                      <div className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-medium">
                        {volume.toFixed(4)}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => removeLoadedPlank(plank.id)}
                        disabled={loadedPlanks.length === 1}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Load Summary */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-green-800">Total Planks</h4>
                <p className="text-2xl font-bold text-green-900">{calculateTotalQuantity()}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-800">Total Volume</h4>
                <p className="text-2xl font-bold text-green-900">{calculateTotalVolume().toFixed(4)} m³</p>
              </div>
            </div>
            <button
              onClick={saveLoad}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
            >
              <SafeIcon icon={FiSave} />
              {isSubmitting ? 'Saving...' : 'Create Load'}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* View Loads */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Sent Loads</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-green-600"
                >
                  <SafeIcon icon={FiTruck} className="text-3xl" />
                </motion.div>
                <span className="ml-3 text-lg text-gray-600">Loading loads...</span>
              </div>
            ) : loads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Load Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Truck Reg
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loads.map((load) => (
                      <tr key={load.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {load.load_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(load.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {load.customer_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {load.truck_registration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                            load.inventory_type === 'wet' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            <SafeIcon icon={load.inventory_type === 'wet' ? FiDroplet : FiSun} />
                            {load.inventory_type === 'wet' ? 'Wet' : 'Dry'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {load.total_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(load.total_volume).toFixed(4)} m³
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            load.status === 'loaded' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : load.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {load.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => generateDeliveryNote(load)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Delivery Note
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <SafeIcon icon={FiTruck} className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-500">No loads found</p>
                <p className="text-sm text-gray-400">Create your first load to get started</p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default LoadManagement;