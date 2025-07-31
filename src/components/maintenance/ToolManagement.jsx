import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { toolOperations, machineOperations } from '../../data/supabaseOperations';

const { FiTool, FiPlus, FiTrash2, FiSave, FiEdit3, FiX, FiSearch, FiCheck, FiTruck } = FiIcons;

const ToolManagement = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [tools, setTools] = useState([]);
  const [machines, setMachines] = useState([]);
  const [toolUsage, setToolUsage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tool form state
  const [showToolForm, setShowToolForm] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [toolForm, setToolForm] = useState({
    name: '',
    description: '',
    quantity: 1
  });
  
  // Tool usage form state
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [usageForm, setUsageForm] = useState({
    tool_id: '',
    machine_id: '',
    quantity: 1,
    notes: ''
  });
  
  useEffect(() => {
    loadTools();
    loadMachines();
    if (activeTab === 'usage') {
      loadToolUsage();
    }
  }, [activeTab]);
  
  const loadTools = async () => {
    setLoading(true);
    try {
      const toolsData = await toolOperations.getTools();
      setTools(toolsData);
    } catch (error) {
      console.error('Error loading tools:', error);
      alert('Error loading tools');
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
  
  const loadToolUsage = async () => {
    setLoading(true);
    try {
      const usageData = await toolOperations.getToolUsage();
      setToolUsage(usageData);
    } catch (error) {
      console.error('Error loading tool usage:', error);
      alert('Error loading tool usage data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToolSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingTool) {
        await toolOperations.updateTool(editingTool.id, toolForm);
        alert('Tool updated successfully!');
      } else {
        await toolOperations.createTool(toolForm);
        alert('Tool added successfully!');
      }
      resetToolForm();
      loadTools();
    } catch (error) {
      console.error('Error saving tool:', error);
      alert('Error saving tool. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUsageSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Find selected tool to check quantity
      const selectedTool = tools.find(tool => tool.id === usageForm.tool_id);
      
      if (!selectedTool) {
        throw new Error('Selected tool not found');
      }
      
      if (usageForm.quantity > selectedTool.quantity) {
        alert(`Not enough tools available. You requested ${usageForm.quantity} but only ${selectedTool.quantity} are available.`);
        setLoading(false);
        return;
      }
      
      await toolOperations.recordToolUsage(usageForm);
      alert('Tool usage recorded successfully!');
      resetUsageForm();
      loadTools();
      loadToolUsage();
    } catch (error) {
      console.error('Error recording tool usage:', error);
      alert('Error recording tool usage. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReturnTool = async (usageId) => {
    if (window.confirm('Are you sure you want to mark this tool as returned?')) {
      setLoading(true);
      try {
        await toolOperations.returnTool(usageId);
        alert('Tool marked as returned successfully!');
        loadTools();
        loadToolUsage();
      } catch (error) {
        console.error('Error returning tool:', error);
        alert('Error returning tool. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const editTool = (tool) => {
    setToolForm({
      name: tool.name,
      description: tool.description || '',
      quantity: tool.quantity
    });
    setEditingTool(tool);
    setShowToolForm(true);
  };
  
  const deleteTool = async (toolId) => {
    if (window.confirm('Are you sure you want to delete this tool? This action cannot be undone.')) {
      setLoading(true);
      try {
        await toolOperations.deleteTool(toolId);
        alert('Tool deleted successfully!');
        loadTools();
      } catch (error) {
        console.error('Error deleting tool:', error);
        alert('Error deleting tool. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const resetToolForm = () => {
    setToolForm({
      name: '',
      description: '',
      quantity: 1
    });
    setEditingTool(null);
    setShowToolForm(false);
  };
  
  const resetUsageForm = () => {
    setUsageForm({
      tool_id: '',
      machine_id: '',
      quantity: 1,
      notes: ''
    });
    setShowUsageForm(false);
  };
  
  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <SafeIcon icon={FiTool} className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Tool Management</h2>
              <p className="text-gray-600">Manage tools and track usage</p>
            </div>
          </div>
          <div className="flex gap-3">
            {activeTab === 'inventory' && (
              <button 
                onClick={() => setShowToolForm(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} />
                <span>Add Tool</span>
              </button>
            )}
            {activeTab === 'usage' && (
              <button 
                onClick={() => setShowUsageForm(true)} 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <SafeIcon icon={FiTruck} />
                <span>Assign Tool</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiTool} />
              <span>Tool Inventory</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'usage' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiTruck} />
              <span>Tool Usage</span>
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
              placeholder="Search tools..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {activeTab === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tool Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        <span>Loading tools...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTools.length > 0 ? (
                  filteredTools.map((tool) => (
                    <tr key={tool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{tool.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{tool.description || 'No description'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          tool.quantity > 5 
                            ? 'bg-green-100 text-green-800' 
                            : tool.quantity > 0 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tool.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editTool(tool)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                            onClick={() => deleteTool(tool.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                      No tools found. Add your first tool to get started!
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
                    Tool
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        <span>Loading tool usage data...</span>
                      </div>
                    </td>
                  </tr>
                ) : toolUsage.length > 0 ? (
                  toolUsage.map((usage) => (
                    <tr key={usage.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{usage.tool_name}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usage.return_date 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {usage.return_date ? 'Returned' : 'In Use'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!usage.return_date && (
                          <button
                            onClick={() => handleReturnTool(usage.id)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-900"
                          >
                            <SafeIcon icon={FiCheck} />
                            <span>Return</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No tool usage records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Tool Form Modal */}
      {showToolForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingTool ? 'Edit Tool' : 'Add New Tool'}
                </h3>
                <button onClick={resetToolForm} className="text-gray-400 hover:text-gray-600">
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleToolSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tool Name *
                  </label>
                  <input
                    type="text"
                    value={toolForm.name}
                    onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={toolForm.description}
                    onChange={(e) => setToolForm({ ...toolForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={toolForm.quantity}
                    onChange={(e) => setToolForm({ ...toolForm, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetToolForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading 
                      ? 'Saving...' 
                      : (editingTool ? 'Update Tool' : 'Add Tool')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Tool Usage Form Modal */}
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
                  Assign Tool to Machine
                </h3>
                <button onClick={resetUsageForm} className="text-gray-400 hover:text-gray-600">
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>
              
              <form onSubmit={handleUsageSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Tool *
                  </label>
                  <select
                    value={usageForm.tool_id}
                    onChange={(e) => setUsageForm({ ...usageForm, tool_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a tool</option>
                    {tools
                      .filter(tool => tool.quantity > 0)
                      .map((tool) => (
                        <option key={tool.id} value={tool.id}>
                          {tool.name} (Available: {tool.quantity})
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Optional notes about this tool assignment"
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
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    <SafeIcon icon={FiTruck} />
                    {loading ? 'Assigning...' : 'Assign Tool'}
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

export default ToolManagement;