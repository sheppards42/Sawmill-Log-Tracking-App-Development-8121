import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { spareOperations, machineOperations } from '../../data/supabaseOperations';

const { 
  FiPackage, FiPlus, FiTrash2, FiSave, FiEdit3, FiX, FiSearch, 
  FiAlertTriangle, FiTruck, FiClipboard, FiCheck, FiShoppingCart
} = FiIcons;

const SpareManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [spares, setSpares] = useState([]);
  const [machines, setMachines] = useState([]);
  const [spareUsage, setSpareUsage] = useState([]);
  const [spareRequests, setSpareRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Spare form state
  const [showSpareForm, setShowSpareForm] = useState(false);
  const [editingSpare, setEditingSpare] = useState(null);
  const [spareForm, setSpareForm] = useState({
    name: '',
    description: '',
    quantity: 0,
    min_quantity: 1
  });
  
  // Spare usage form state
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [usageForm, setUsageForm] = useState({
    spare_id: '',
    machine_id: '',
    quantity: 1,
    notes: ''
  });
  
  // Spare request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    spare_id: '',
    spare_name: '',
    description: '',
    machine_id: '',
    quantity: 1,
    notes: ''
  });
  
  useEffect(() => {
    loadSpares();
    loadMachines();
    
    if (activeTab === 'usage') {
      loadSpareUsage();
    } else if (activeTab === 'requests') {
      loadSpareRequests();
    }
  }, [activeTab]);
  
  const loadSpares = async () => {
    setLoading(true);
    try {
      const sparesData = await spareOperations.getSpares();
      setSpares(sparesData);
    } catch (error) {
      console.error('Error loading spares:', error);
      alert('Error loading spares');
    } finally {
      setLoading(false);
    }
  };
  
  const loadMachines = async () => {
    try {
      const machinesData = await machineOperations.getMachines();
      setMachines(machinesData);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };
  
  const loadSpareUsage = async () => {
    setLoading(true);
    try {
      const usageData = await spareOperations.getSpareUsage();
      setSpareUsage(usageData);
    } catch (error) {
      console.error('Error loading spare usage:', error);
      alert('Error loading spare usage data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadSpareRequests = async () => {
    setLoading(true);
    try {
      const requestsData = await spareOperations.getSpareRequests();
      setSpareRequests(requestsData);
    } catch (error) {
      console.error('Error loading spare requests:', error);
      alert('Error loading spare request data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSpareSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingSpare) {
        await spareOperations.updateSpare(editingSpare.id, spareForm);
        alert('Spare part updated successfully!');
      } else {
        await spareOperations.createSpare(spareForm);
        alert('Spare part added successfully!');
      }
      resetSpareForm();
      loadSpares();
    } catch (error) {
      console.error('Error saving spare part:', error);
      alert('Error saving spare part. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Find selected spare to check quantity
      const selectedSpare = spares.find(spare => spare.id === usageForm.spare_id);
      
      if (!selectedSpare) {
        throw new Error('Selected spare part not found');
      }
      
      if (usageForm.quantity > selectedSpare.quantity) {
        alert(`Not enough spare parts available. You requested ${usageForm.quantity} but only ${selectedSpare.quantity} are available.`);
        setLoading(false);
        return;
      }
      
      await spareOperations.recordSpareUsage(usageForm);
      alert('Spare part usage recorded successfully!');
      resetUsageForm();
      loadSpares();
      loadSpareUsage();
    } catch (error) {
      console.error('Error recording spare usage:', error);
      alert('Error recording spare usage. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await spareOperations.createSpareRequest(requestForm);
      alert('Spare part request submitted successfully!');
      resetRequestForm();
      loadSpareRequests();
    } catch (error) {
      console.error('Error submitting spare request:', error);
      alert('Error submitting spare request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFulfillRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to mark this request as fulfilled? This will add the requested quantity to inventory.')) {
      setLoading(true);
      try {
        await spareOperations.fulfillSpareRequest(requestId);
        alert('Request fulfilled successfully!');
        loadSpares();
        loadSpareRequests();
      } catch (error) {
        console.error('Error fulfilling request:', error);
        alert('Error fulfilling request. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const editSpare = (spare) => {
    setSpareForm({
      name: spare.name,
      description: spare.description || '',
      quantity: spare.quantity,
      min_quantity: spare.min_quantity
    });
    setEditingSpare(spare);
    setShowSpareForm(true);
  };
  
  const deleteSpare = async (spareId) => {
    if (window.confirm('Are you sure you want to delete this spare part? This action cannot be undone.')) {
      setLoading(true);
      try {
        await spareOperations.deleteSpare(spareId);
        alert('Spare part deleted successfully!');
        loadSpares();
      } catch (error) {
        console.error('Error deleting spare part:', error);
        alert('Error deleting spare part. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const requestSpare = (spare = null) => {
    if (spare) {
      setRequestForm({
        spare_id: spare.id,
        spare_name: spare.name,
        description: spare.description || '',
        machine_id: '',
        quantity: 1,
        notes: `Low stock: ${spare.quantity} remaining`
      });
    } else {
      setRequestForm({
        spare_id: '',
        spare_name: '',
        description: '',
        machine_id: '',
        quantity: 1,
        notes: ''
      });
    }
    setShowRequestForm(true);
  };
  
  const resetSpareForm = () => {
    setSpareForm({
      name: '',
      description: '',
      quantity: 0,
      min_quantity: 1
    });
    setEditingSpare(null);
    setShowSpareForm(false);
  };
  
  const resetUsageForm = () => {
    setUsageForm({
      spare_id: '',
      machine_id: '',
      quantity: 1,
      notes: ''
    });
    setShowUsageForm(false);
  };
  
  const resetRequestForm = () => {
    setRequestForm({
      spare_id: '',
      spare_name: '',
      description: '',
      machine_id: '',
      quantity: 1,
      notes: ''
    });
    setShowRequestForm(false);
  };
  
  const filteredSpares = spares.filter(spare => 
    spare.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (spare.description && spare.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <SafeIcon icon={FiPackage} className="text-2xl text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Spare Parts Management</h2>
              <p className="text-gray-600">Manage spare parts, usage, and requests</p>
            </div>
          </div>
          <div className="flex gap-3">
            {activeTab === 'inventory' && (
              <button 
                onClick={() => setShowSpareForm(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add Spare</span>
              </button>
            )}
            {activeTab === 'usage' && (
              <button 
                onClick={() => setShowUsageForm(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <SafeIcon icon={FiTruck} />
                <span>Use Spare</span>
              </button>
            )}
            <button 
              onClick={() => requestSpare()} 
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <SafeIcon icon={FiShoppingCart} />
              <span>Request Spare</span>
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'inventory' ? 'bg-green-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiPackage} />
              <span>Inventory</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'usage' ? 'bg-green-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiTruck} />
              <span>Usage History</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'requests' ? 'bg-green-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiClipboard} />
              <span>Requests</span>
              {spareRequests.filter(req => req.status === 'pending').length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {spareRequests.filter(req => req.status === 'pending').length}
                </span>
              )}
            </div>
          </button>
        </div>
        
        {/* Search Bar */}
        {activeTab !== 'requests' && (
          <div className="mb-6">
            <div className="relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search spare parts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
        
        {activeTab === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spare Part
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Level
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
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                        <span>Loading spare parts...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredSpares.length > 0 ? (
                  filteredSpares.map((spare) => (
                    <tr key={spare.id} className={`hover:bg-gray-50 ${spare.quantity < spare.min_quantity ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{spare.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{spare.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{spare.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{spare.min_quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {spare.quantity < spare.min_quantity ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <SafeIcon icon={FiAlertTriangle} className="mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <SafeIcon icon={FiCheck} className="mr-1" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editSpare(spare)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                            onClick={() => deleteSpare(spare.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                          {spare.quantity < spare.min_quantity && (
                            <button
                              onClick={() => requestSpare(spare)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Request More"
                            >
                              <SafeIcon icon={FiShoppingCart} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No spare parts found. Add your first spare part to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'usage' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spare Part
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                        <span>Loading usage history...</span>
                      </div>
                    </td>
                  </tr>
                ) : spareUsage.length > 0 ? (
                  spareUsage.map((usage) => (
                    <tr key={usage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{usage.spare_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{usage.machine_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{usage.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(usage.usage_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{usage.notes || '-'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No usage history found.
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
                    Spare Part
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested On
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
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                        <span>Loading spare part requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : spareRequests.length > 0 ? (
                  spareRequests.map((request) => (
                    <tr 
                      key={request.id} 
                      className={`hover:bg-gray-50 ${request.status === 'pending' ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.spare_name}</div>
                        <div className="text-xs text-gray-500">{request.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.machine_name || 'General'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(request.request_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {request.status === 'pending' ? 'Pending' : 'Fulfilled'}
                          {request.status === 'fulfilled' && (
                            <span className="ml-1 text-xs">
                              ({new Date(request.fulfilled_date).toLocaleDateString()})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleFulfillRequest(request.id)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-900"
                          >
                            <SafeIcon icon={FiCheck} />
                            <span>Fulfill</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No spare part requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Show low stock warning if applicable */}
        {activeTab === 'inventory' && filteredSpares.some(spare => spare.quantity < spare.min_quantity) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <SafeIcon icon={FiAlertTriangle} className="text-xl text-red-600 mt-1" />
              <div>
                <h4 className="text-md font-semibold text-red-800">Low Stock Warning</h4>
                <p className="text-sm text-red-700 mt-1">
                  {filteredSpares.filter(spare => spare.quantity < spare.min_quantity).length} spare part(s) are below minimum stock level.
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => requestSpare(filteredSpares.find(spare => spare.quantity < spare.min_quantity))}
                    className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    <SafeIcon icon={FiShoppingCart} className="mr-1" />
                    Request Restock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Spare Form Modal */}
      {showSpareForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingSpare ? 'Edit Spare Part' : 'Add New Spare Part'}
                </h3>
                <button onClick={resetSpareForm} className="text-gray-400 hover:text-gray-600">
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleSpareSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spare Part Name *
                  </label>
                  <input
                    type="text"
                    value={spareForm.name}
                    onChange={(e) => setSpareForm({ ...spareForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={spareForm.description}
                    onChange={(e) => setSpareForm({ ...spareForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={spareForm.quantity}
                      onChange={(e) => setSpareForm({ ...spareForm, quantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={spareForm.min_quantity}
                      onChange={(e) => setSpareForm({ ...spareForm, min_quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetSpareForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading 
                      ? 'Saving...' 
                      : (editingSpare ? 'Update Spare Part' : 'Add Spare Part')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Spare Usage Form Modal */}
      {showUsageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Use Spare Part
                </h3>
                <button onClick={resetUsageForm} className="text-gray-400 hover:text-gray-600">
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleUsageSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Spare Part *
                  </label>
                  <select
                    value={usageForm.spare_id}
                    onChange={(e) => setUsageForm({ ...usageForm, spare_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a spare part</option>
                    {spares
                      .filter(spare => spare.quantity > 0)
                      .map((spare) => (
                        <option key={spare.id} value={spare.id}>
                          {spare.name} (Available: {spare.quantity})
                        </option>
                      ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Machine *
                  </label>
                  <select
                    value={usageForm.machine_id}
                    onChange={(e) => setUsageForm({ ...usageForm, machine_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a machine</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageForm.quantity}
                    onChange={(e) => setUsageForm({ ...usageForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={usageForm.notes}
                    onChange={(e) => setUsageForm({ ...usageForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="2"
                    placeholder="Optional notes about this spare part usage"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetUsageForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                  >
                    <SafeIcon icon={FiTruck} />
                    {loading ? 'Processing...' : 'Use Spare Part'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Spare Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Request Spare Part
                </h3>
                <button onClick={resetRequestForm} className="text-gray-400 hover:text-gray-600">
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                {!requestForm.spare_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spare Part Name *
                    </label>
                    <input
                      type="text"
                      value={requestForm.spare_name}
                      onChange={(e) => setRequestForm({ ...requestForm, spare_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
                
                {requestForm.spare_id && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">
                      Requesting: <span className="font-bold">{requestForm.spare_name}</span>
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={requestForm.description}
                    onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="2"
                    placeholder="Describe the spare part (model number, specifications, etc.)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    For Machine
                  </label>
                  <select
                    value={requestForm.machine_id}
                    onChange={(e) => setRequestForm({ ...requestForm, machine_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a machine (optional)</option>
                    {machines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Needed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={requestForm.quantity}
                    onChange={(e) => setRequestForm({ ...requestForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={requestForm.notes}
                    onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="2"
                    placeholder="Any additional notes about this request"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetRequestForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                  >
                    <SafeIcon icon={FiShoppingCart} />
                    {loading ? 'Submitting...' : 'Submit Request'}
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

export default SpareManagement;