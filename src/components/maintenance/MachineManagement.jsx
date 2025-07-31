import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { machineOperations, toolOperations, spareOperations } from '../../data/supabaseOperations';

const { 
  FiTruck, FiPlus, FiTrash2, FiSave, FiEdit3, FiX, FiSearch, 
  FiTool, FiPackage, FiInfo, FiMapPin
} = FiIcons;

const MachineManagement = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineTools, setMachineTools] = useState([]);
  const [machineSpares, setMachineSpares] = useState([]);
  
  // Machine form state
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineForm, setMachineForm] = useState({
    name: '',
    description: '',
    location: ''
  });
  
  useEffect(() => {
    loadMachines();
  }, []);
  
  useEffect(() => {
    if (selectedMachine) {
      loadMachineTools(selectedMachine.id);
      loadMachineSpares(selectedMachine.id);
    }
  }, [selectedMachine]);
  
  const loadMachines = async () => {
    setLoading(true);
    try {
      const machinesData = await machineOperations.getMachines();
      setMachines(machinesData);
    } catch (error) {
      console.error('Error loading machines:', error);
      alert('Error loading machines');
    } finally {
      setLoading(false);
    }
  };
  
  const loadMachineTools = async (machineId) => {
    try {
      const toolsData = await toolOperations.getToolsByMachine(machineId);
      setMachineTools(toolsData);
    } catch (error) {
      console.error('Error loading machine tools:', error);
      setMachineTools([]);
    }
  };
  
  const loadMachineSpares = async (machineId) => {
    try {
      const sparesData = await spareOperations.getSparesByMachine(machineId);
      setMachineSpares(sparesData);
    } catch (error) {
      console.error('Error loading machine spares:', error);
      setMachineSpares([]);
    }
  };
  
  const handleMachineSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingMachine) {
        await machineOperations.updateMachine(editingMachine.id, machineForm);
        alert('Machine updated successfully!');
      } else {
        await machineOperations.createMachine(machineForm);
        alert('Machine added successfully!');
      }
      resetMachineForm();
      loadMachines();
    } catch (error) {
      console.error('Error saving machine:', error);
      alert('Error saving machine. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const editMachine = (machine) => {
    setMachineForm({
      name: machine.name,
      description: machine.description || '',
      location: machine.location || ''
    });
    setEditingMachine(machine);
    setShowMachineForm(true);
  };
  
  const deleteMachine = async (machineId) => {
    if (window.confirm('Are you sure you want to delete this machine? This will also remove all associated tool and spare part records.')) {
      setLoading(true);
      try {
        await machineOperations.deleteMachine(machineId);
        alert('Machine deleted successfully!');
        loadMachines();
        if (selectedMachine && selectedMachine.id === machineId) {
          setSelectedMachine(null);
        }
      } catch (error) {
        console.error('Error deleting machine:', error);
        alert('Error deleting machine. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const resetMachineForm = () => {
    setMachineForm({
      name: '',
      description: '',
      location: ''
    });
    setEditingMachine(null);
    setShowMachineForm(false);
  };
  
  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
  };
  
  const handleReturnTool = async (usageId) => {
    if (window.confirm('Are you sure you want to mark this tool as returned?')) {
      setLoading(true);
      try {
        await toolOperations.returnTool(usageId);
        alert('Tool marked as returned successfully!');
        loadMachineTools(selectedMachine.id);
      } catch (error) {
        console.error('Error returning tool:', error);
        alert('Error returning tool. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const filteredMachines = machines.filter(machine => 
    machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (machine.description && machine.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (machine.location && machine.location.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <SafeIcon icon={FiTruck} className="text-2xl text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Machine Management</h2>
              <p className="text-gray-600">Manage machines and view assigned tools and parts</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowMachineForm(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <SafeIcon icon={FiPlus} />
              <span>Add Machine</span>
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search machines..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Machines List */}
          <div className="lg:col-span-1 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Machines</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mr-2"></div>
                    <span>Loading machines...</span>
                  </div>
                </div>
              ) : filteredMachines.length > 0 ? (
                filteredMachines.map((machine) => (
                  <div 
                    key={machine.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedMachine?.id === machine.id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                    onClick={() => handleSelectMachine(machine)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{machine.name}</h4>
                        {machine.location && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <SafeIcon icon={FiMapPin} className="mr-1 text-gray-400" />
                            {machine.location}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editMachine(machine);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <SafeIcon icon={FiEdit3} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMachine(machine.id);
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No machines found. Add your first machine to get started!
                </div>
              )}
            </div>
          </div>
          
          {/* Machine Details */}
          <div className="lg:col-span-2 border border-gray-200 rounded-lg overflow-hidden">
            {selectedMachine ? (
              <>
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">{selectedMachine.name} Details</h3>
                </div>
                <div className="p-4">
                  <div className="mb-6">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Machine Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">Description:</span>
                          <p className="text-gray-800">{selectedMachine.description || 'No description provided'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Location:</span>
                          <p className="text-gray-800">{selectedMachine.location || 'No location specified'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">Created:</span>
                          <p className="text-gray-800">{new Date(selectedMachine.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Assigned Tools */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <SafeIcon icon={FiTool} className="text-blue-600" />
                      <h4 className="text-md font-semibold text-gray-800">Assigned Tools</h4>
                    </div>
                    {machineTools.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tool
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date Assigned
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {machineTools.map((usage) => (
                              <tr key={usage.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{usage.tool_name}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{usage.quantity}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(usage.usage_date).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    usage.return_date 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {usage.return_date ? 'Returned' : 'In Use'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                  {!usage.return_date && (
                                    <button
                                      onClick={() => handleReturnTool(usage.id)}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Return
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No tools assigned to this machine.</p>
                    )}
                  </div>
                  
                  {/* Used Spare Parts */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <SafeIcon icon={FiPackage} className="text-green-600" />
                      <h4 className="text-md font-semibold text-gray-800">Used Spare Parts</h4>
                    </div>
                    {machineSpares.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Spare Part
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date Used
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Notes
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {machineSpares.map((usage) => (
                              <tr key={usage.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{usage.spare_name}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{usage.quantity}</div>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <div className="text-sm text-gray-500">
                                    {new Date(usage.usage_date).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="text-sm text-gray-500">{usage.notes || '-'}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No spare parts used on this machine.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <SafeIcon icon={FiInfo} className="text-4xl text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Machine Selected</h3>
                <p className="text-gray-500">Select a machine from the list to view its details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Machine Form Modal */}
      {showMachineForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingMachine ? 'Edit Machine' : 'Add New Machine'}
                </h3>
                <button onClick={resetMachineForm} className="text-gray-400 hover:text-gray-600">
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleMachineSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine Name *
                  </label>
                  <input
                    type="text"
                    value={machineForm.name}
                    onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={machineForm.description}
                    onChange={(e) => setMachineForm({ ...machineForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                    placeholder="Describe the machine, model number, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={machineForm.location}
                    onChange={(e) => setMachineForm({ ...machineForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Where is this machine located?"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetMachineForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading 
                      ? 'Saving...' 
                      : (editingMachine ? 'Update Machine' : 'Add Machine')}
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

export default MachineManagement;