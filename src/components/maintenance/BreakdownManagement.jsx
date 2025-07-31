import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';
import { breakdownOperations, machineOperations, spareOperations } from '../../data/supabaseOperations';

const { FiAlertTriangle, FiPlus, FiClock, FiCheck, FiEdit3, FiTrash2, FiSave, FiX, FiSearch, FiFilter, FiTool, FiPackage, FiPlay, FiPause, FiSettings } = FiIcons;

const PRIORITY_LEVELS = [
  { value: 'orange', label: 'Orange - Machine runs but needs fixing', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  { value: 'red', label: 'Red - Machine down until fixed', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' }
];

const BreakdownManagement = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [breakdowns, setBreakdowns] = useState([]);
  const [machines, setMachines] = useState([]);
  const [spares, setSpares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterMachine, setFilterMachine] = useState('');

  // Breakdown form state
  const [showBreakdownForm, setShowBreakdownForm] = useState(false);
  const [editingBreakdown, setEditingBreakdown] = useState(null);
  const [breakdownForm, setBreakdownForm] = useState({
    machine_id: '',
    description: '',
    priority: 'orange',
    reported_by: ''
  });

  // Resolution form state
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [resolvingBreakdown, setResolvingBreakdown] = useState(null);
  const [resolutionForm, setResolutionForm] = useState({
    resolution_description: '',
    spares_used: [],
    resolved_by: ''
  });

  // Spare usage state
  const [spareUsage, setSpareUsage] = useState([]);

  useEffect(() => {
    loadBreakdowns();
    loadMachines();
    loadSpares();
  }, [activeTab]);

  const loadBreakdowns = async () => {
    setLoading(true);
    try {
      const data = await breakdownOperations.getBreakdowns(activeTab);
      setBreakdowns(data);
    } catch (error) {
      console.error('Error loading breakdowns:', error);
      alert('Error loading breakdowns');
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      const data = await machineOperations.getMachines();
      setMachines(data);
    } catch (error) {
      console.error('Error loading machines:', error);
    }
  };

  const loadSpares = async () => {
    try {
      const data = await spareOperations.getSpares();
      setSpares(data);
    } catch (error) {
      console.error('Error loading spares:', error);
    }
  };

  const handleBreakdownSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBreakdown) {
        await breakdownOperations.updateBreakdown(editingBreakdown.id, breakdownForm);
        alert('Breakdown updated successfully!');
      } else {
        await breakdownOperations.createBreakdown(breakdownForm);
        alert('Breakdown reported successfully!');
      }
      resetBreakdownForm();
      loadBreakdowns();
    } catch (error) {
      console.error('Error saving breakdown:', error);
      alert('Error saving breakdown. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolutionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await breakdownOperations.resolveBreakdown(resolvingBreakdown.id, resolutionForm);
      
      // Update spare quantities if spares were used
      for (const spareUsed of resolutionForm.spares_used) {
        if (spareUsed.spare_id && spareUsed.quantity > 0) {
          await spareOperations.recordSpareUsage({
            spare_id: spareUsed.spare_id,
            machine_id: resolvingBreakdown.machine_id,
            quantity: spareUsed.quantity,
            notes: `Used for breakdown resolution: ${resolutionForm.resolution_description}`
          });
        }
      }

      alert('Breakdown resolved successfully!');
      resetResolutionForm();
      loadBreakdowns();
      loadSpares(); // Reload to update spare quantities
    } catch (error) {
      console.error('Error resolving breakdown:', error);
      alert('Error resolving breakdown. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const editBreakdown = (breakdown) => {
    setBreakdownForm({
      machine_id: breakdown.machine_id,
      description: breakdown.description,
      priority: breakdown.priority,
      reported_by: breakdown.reported_by
    });
    setEditingBreakdown(breakdown);
    setShowBreakdownForm(true);
  };

  const deleteBreakdown = async (breakdownId) => {
    if (window.confirm('Are you sure you want to delete this breakdown record?')) {
      setLoading(true);
      try {
        await breakdownOperations.deleteBreakdown(breakdownId);
        alert('Breakdown deleted successfully!');
        loadBreakdowns();
      } catch (error) {
        console.error('Error deleting breakdown:', error);
        alert('Error deleting breakdown. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const startResolution = (breakdown) => {
    setResolvingBreakdown(breakdown);
    setResolutionForm({
      resolution_description: '',
      spares_used: [],
      resolved_by: ''
    });
    setSpareUsage([]);
    setShowResolutionForm(true);
  };

  const addSpareUsage = () => {
    setSpareUsage([...spareUsage, { id: Date.now(), spare_id: '', quantity: 1, notes: '' }]);
  };

  const removeSpareUsage = (id) => {
    setSpareUsage(spareUsage.filter(spare => spare.id !== id));
  };

  const updateSpareUsage = (id, field, value) => {
    setSpareUsage(spareUsage.map(spare => 
      spare.id === id ? { ...spare, [field]: value } : spare
    ));
    
    // Update resolution form
    setResolutionForm({
      ...resolutionForm,
      spares_used: spareUsage.map(spare => 
        spare.id === id ? { ...spare, [field]: value } : spare
      )
    });
  };

  const resetBreakdownForm = () => {
    setBreakdownForm({
      machine_id: '',
      description: '',
      priority: 'orange',
      reported_by: ''
    });
    setEditingBreakdown(null);
    setShowBreakdownForm(false);
  };

  const resetResolutionForm = () => {
    setResolutionForm({
      resolution_description: '',
      spares_used: [],
      resolved_by: ''
    });
    setResolvingBreakdown(null);
    setShowResolutionForm(false);
    setSpareUsage([]);
  };

  const calculateDowntime = (startTime, endTime = null) => {
    const end = endTime ? new Date(endTime) : new Date();
    const start = new Date(startTime);
    const totalMinutes = differenceInMinutes(end, start);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours < 24) {
      return `${hours}h ${minutes}m`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ${minutes}m`;
  };

  const getPriorityConfig = (priority) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[0];
  };

  const filteredBreakdowns = breakdowns.filter(breakdown => {
    const matchesSearch = breakdown.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         breakdown.machine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         breakdown.reported_by.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = !filterPriority || breakdown.priority === filterPriority;
    const matchesMachine = !filterMachine || breakdown.machine_id === filterMachine;
    
    return matchesSearch && matchesPriority && matchesMachine;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SafeIcon icon={FiAlertTriangle} className="text-2xl text-red-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Machine Breakdown Management</h2>
              <p className="text-gray-600">Track machine issues and resolution times</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBreakdownForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <SafeIcon icon={FiPlus} />
              <span>Report Breakdown</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'active' ? 'bg-red-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiAlertTriangle} />
              <span>Active Issues</span>
              {breakdowns.filter(b => b.status === 'active').length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {breakdowns.filter(b => b.status === 'active').length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'resolved' ? 'bg-red-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiCheck} />
              <span>Resolved</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'all' ? 'bg-red-600 text-white' : 'hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <SafeIcon icon={FiSettings} />
              <span>All Records</span>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search breakdowns..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Priorities</option>
              {PRIORITY_LEVELS.map(priority => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Machines</option>
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterPriority('');
                setFilterMachine('');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <SafeIcon icon={FiFilter} />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Breakdowns List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine & Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Problem Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downtime
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
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mr-2"></div>
                      <span>Loading breakdowns...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBreakdowns.length > 0 ? (
                filteredBreakdowns.map((breakdown) => {
                  const priorityConfig = getPriorityConfig(breakdown.priority);
                  return (
                    <tr key={breakdown.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{breakdown.machine_name}</div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig.bgColor} ${priorityConfig.textColor}`}>
                            {priorityConfig.value.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{breakdown.description}</div>
                        {breakdown.resolution_description && (
                          <div className="text-xs text-green-600 mt-1">
                            <strong>Resolution:</strong> {breakdown.resolution_description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(breakdown.reported_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(breakdown.reported_at), 'HH:mm')} by {breakdown.reported_by}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <SafeIcon icon={FiClock} className="text-gray-400" />
                          <span className={`text-sm font-medium ${
                            breakdown.status === 'resolved' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {calculateDowntime(breakdown.reported_at, breakdown.resolved_at)}
                          </span>
                        </div>
                        {breakdown.resolved_at && (
                          <div className="text-xs text-gray-500">
                            Resolved: {format(new Date(breakdown.resolved_at), 'MMM dd, HH:mm')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          breakdown.status === 'resolved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {breakdown.status === 'resolved' ? 'Resolved' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {breakdown.status === 'active' && (
                            <button
                              onClick={() => startResolution(breakdown)}
                              className="text-green-600 hover:text-green-900"
                              title="Resolve Breakdown"
                            >
                              <SafeIcon icon={FiCheck} />
                            </button>
                          )}
                          <button
                            onClick={() => editBreakdown(breakdown)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <SafeIcon icon={FiEdit3} />
                          </button>
                          <button
                            onClick={() => deleteBreakdown(breakdown.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <SafeIcon icon={FiTrash2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No breakdowns found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown Form Modal */}
      {showBreakdownForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingBreakdown ? 'Edit Breakdown' : 'Report New Breakdown'}
                </h3>
                <button
                  onClick={resetBreakdownForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleBreakdownSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Machine *
                  </label>
                  <select
                    value={breakdownForm.machine_id}
                    onChange={(e) => setBreakdownForm({ ...breakdownForm, machine_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a machine</option>
                    {machines.map(machine => (
                      <option key={machine.id} value={machine.id}>
                        {machine.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={breakdownForm.priority}
                    onChange={(e) => setBreakdownForm({ ...breakdownForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Description *
                  </label>
                  <textarea
                    value={breakdownForm.description}
                    onChange={(e) => setBreakdownForm({ ...breakdownForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="4"
                    placeholder="Describe the problem in detail..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reported By *
                  </label>
                  <input
                    type="text"
                    value={breakdownForm.reported_by}
                    onChange={(e) => setBreakdownForm({ ...breakdownForm, reported_by: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetBreakdownForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading ? 'Saving...' : (editingBreakdown ? 'Update' : 'Report Breakdown')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Resolution Form Modal */}
      {showResolutionForm && resolvingBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Resolve Breakdown - {resolvingBreakdown.machine_name}
                </h3>
                <button
                  onClick={resetResolutionForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Original Problem:</h4>
                <p className="text-red-700">{resolvingBreakdown.description}</p>
                <div className="mt-2 text-sm text-red-600">
                  Downtime: {calculateDowntime(resolvingBreakdown.reported_at)}
                </div>
              </div>

              <form onSubmit={handleResolutionSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution Description *
                  </label>
                  <textarea
                    value={resolutionForm.resolution_description}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, resolution_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows="4"
                    placeholder="Describe what was done to fix the problem..."
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Spare Parts Used
                    </label>
                    <button
                      type="button"
                      onClick={addSpareUsage}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <SafeIcon icon={FiPlus} />
                      Add Spare
                    </button>
                  </div>

                  {spareUsage.length > 0 && (
                    <div className="space-y-3">
                      {spareUsage.map((spare) => (
                        <div key={spare.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                          <div>
                            <select
                              value={spare.spare_id}
                              onChange={(e) => updateSpareUsage(spare.id, 'spare_id', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select spare part</option>
                              {spares.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.name} (Available: {s.quantity})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <input
                              type="number"
                              min="1"
                              value={spare.quantity}
                              onChange={(e) => updateSpareUsage(spare.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Quantity"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={spare.notes}
                              onChange={(e) => updateSpareUsage(spare.id, 'notes', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Notes (optional)"
                            />
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => removeSpareUsage(spare.id)}
                              className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <SafeIcon icon={FiTrash2} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolved By *
                  </label>
                  <input
                    type="text"
                    value={resolutionForm.resolved_by}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, resolved_by: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetResolutionForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                  >
                    <SafeIcon icon={FiCheck} />
                    {loading ? 'Resolving...' : 'Mark as Resolved'}
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

export default BreakdownManagement;