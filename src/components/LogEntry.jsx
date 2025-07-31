import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { getLogVolume, AVAILABLE_LENGTHS, AVAILABLE_DIAMETERS } from '../data/volumeLookup';
import { logOperations, supplierOperations } from '../data/supabaseOperations';

const { FiPlus, FiTrash2, FiSave, FiTruck } = FiIcons;

const LogEntry = () => {
  const [supplier, setSupplier] = useState('');
  const [truckReg, setTruckReg] = useState('');
  const [logSheetNumber, setLogSheetNumber] = useState('');
  const [logs, setLogs] = useState([
    { id: Date.now(), length: '', diameter: '', quantity: 1 }
  ]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const suppliersData = await supplierOperations.getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const addLog = () => {
    setLogs([...logs, { id: Date.now(), length: '', diameter: '', quantity: 1 }]);
  };

  const removeLog = (id) => {
    if (logs.length > 1) {
      setLogs(logs.filter(log => log.id !== id));
    }
  };

  const updateLog = (id, field, value) => {
    setLogs(logs.map(log => 
      log.id === id ? { ...log, [field]: value } : log
    ));
  };

  const calculateTotalVolume = () => {
    return logs.reduce((total, log) => {
      if (log.length && log.diameter && log.quantity) {
        const volume = getLogVolume(log.length, log.diameter);
        return total + (volume * parseInt(log.quantity));
      }
      return total;
    }, 0);
  };

  const saveLogEntry = async () => {
    if (!supplier.trim() || !truckReg.trim() || !logSheetNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const validLogs = logs.filter(log => 
      log.length && log.diameter && log.quantity > 0
    );

    if (validLogs.length === 0) {
      alert('Please add at least one valid log');
      return;
    }

    setLoading(true);

    try {
      // Create individual log entries
      const logEntries = [];
      validLogs.forEach(log => {
        for (let i = 0; i < parseInt(log.quantity); i++) {
          logEntries.push({
            supplier,
            truck_reg: truckReg,
            log_sheet_number: logSheetNumber,
            length: parseFloat(log.length),
            diameter: parseFloat(log.diameter),
            volume: getLogVolume(log.length, log.diameter),
            status: 'available'
          });
        }
      });

      // Save all logs to Supabase
      for (const logEntry of logEntries) {
        await logOperations.createLog(logEntry);
      }

      // Reset form
      setSupplier('');
      setTruckReg('');
      setLogSheetNumber('');
      setLogs([{ id: Date.now(), length: '', diameter: '', quantity: 1 }]);
      
      alert(`Successfully logged ${logEntries.length} logs to database!`);
    } catch (error) {
      console.error('Error saving logs:', error);
      alert('Error saving logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <SafeIcon icon={FiTruck} className="text-2xl text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Log Entry</h2>
        <div className="ml-auto text-sm text-green-600">
          Connected to Database
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier *
          </label>
          <select
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select supplier</option>
            {suppliers.map(sup => (
              <option key={sup.id} value={sup.name}>{sup.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Truck Registration *
          </label>
          <input
            type="text"
            value={truckReg}
            onChange={(e) => setTruckReg(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter truck registration"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Log Sheet Number *
          </label>
          <input
            type="text"
            value={logSheetNumber}
            onChange={(e) => setLogSheetNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter log sheet number"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Log Details</h3>
          <button
            onClick={addLog}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            Add Log
          </button>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Length (m)
                </label>
                <select
                  value={log.length}
                  onChange={(e) => updateLog(log.id, 'length', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select</option>
                  {AVAILABLE_LENGTHS.map(length => (
                    <option key={length} value={length}>{length}m</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Diameter (cm)
                </label>
                <select
                  value={log.diameter}
                  onChange={(e) => updateLog(log.id, 'diameter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select</option>
                  {AVAILABLE_DIAMETERS.map(diameter => (
                    <option key={diameter} value={diameter}>{diameter}cm</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={log.quantity}
                  onChange={(e) => updateLog(log.id, 'quantity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Volume (m³)
                </label>
                <div className="px-3 py-2 bg-gray-200 rounded-lg text-sm font-medium">
                  {log.length && log.diameter ? 
                    (getLogVolume(log.length, log.diameter) * parseInt(log.quantity || 1)).toFixed(3) : 
                    '0.000'
                  }
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => removeLog(log.id)}
                  disabled={logs.length === 1}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <SafeIcon icon={FiTrash2} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-6">
        <div>
          <h4 className="text-lg font-semibold text-blue-800">Total Volume</h4>
          <p className="text-2xl font-bold text-blue-900">{calculateTotalVolume().toFixed(3)} m³</p>
        </div>
        <button
          onClick={saveLogEntry}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          <SafeIcon icon={FiSave} />
          {loading ? 'Saving...' : 'Save to Database'}
        </button>
      </div>
    </motion.div>
  );
};

export default LogEntry;