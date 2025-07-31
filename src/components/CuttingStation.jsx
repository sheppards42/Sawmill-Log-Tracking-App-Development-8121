import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { logOperations, cutLogOperations } from '../data/supabaseOperations';

const { FiZap, FiRefreshCw, FiCheck } = FiIcons;

const CuttingStation = () => {
  const [availableLogs, setAvailableLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState('');
  const [selectedRamp, setSelectedRamp] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableLogs();
  }, []);

  const loadAvailableLogs = async () => {
    setLoading(true);
    try {
      const logs = await logOperations.getLogsByStatus('available');
      setAvailableLogs(logs);
    } catch (error) {
      console.error('Error loading logs:', error);
      alert('Error loading available logs');
    } finally {
      setLoading(false);
    }
  };

  const cutLog = async () => {
    if (!selectedLog || !selectedRamp) {
      alert('Please select both a log and a ramp');
      return;
    }

    setIsProcessing(true);

    try {
      // Find the selected log
      const logToCut = availableLogs.find(log => log.id === selectedLog);
      
      if (!logToCut) {
        throw new Error('Selected log not found');
      }

      // Update log status to 'cut'
      await logOperations.updateLogStatus(selectedLog, 'cut');

      // Create cut log record
      const cutRecord = {
        original_log_id: selectedLog,
        ramp: parseInt(selectedRamp),
        supplier: logToCut.supplier,
        truck_reg: logToCut.truck_reg,
        log_sheet_number: logToCut.log_sheet_number,
        length: logToCut.length,
        diameter: logToCut.diameter,
        volume: logToCut.volume
      };

      await cutLogOperations.createCutLog(cutRecord);

      // Reset form and reload
      setSelectedLog('');
      setSelectedRamp('');
      await loadAvailableLogs();
      
      alert(`Log cut successfully on Ramp ${selectedRamp}!`);
    } catch (error) {
      console.error('Error cutting log:', error);
      alert('Error processing log cut. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedLogDetails = availableLogs.find(log => log.id === selectedLog);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="text-orange-600"
          >
            <SafeIcon icon={FiRefreshCw} className="text-3xl" />
          </motion.div>
          <span className="ml-3 text-lg text-gray-600">Loading available logs...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <SafeIcon icon={FiZap} className="text-2xl text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-800">Cutting Station</h2>
        <button
          onClick={loadAvailableLogs}
          className="ml-auto p-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <SafeIcon icon={FiRefreshCw} className="text-xl" />
        </button>
        <div className="text-sm text-green-600">
          Database Connected
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Log to Cut
          </label>
          <select
            value={selectedLog}
            onChange={(e) => setSelectedLog(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Choose a log...</option>
            {availableLogs.map(log => (
              <option key={log.id} value={log.id}>
                {log.length}m × {log.diameter}cm - {log.supplier} ({log.log_sheet_number})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {availableLogs.length} logs available
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Ramp
          </label>
          <select
            value={selectedRamp}
            onChange={(e) => setSelectedRamp(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="">Choose a ramp...</option>
            <option value="1">Ramp 1</option>
            <option value="2">Ramp 2</option>
            <option value="3">Ramp 3</option>
          </select>
        </div>
      </div>

      {selectedLogDetails && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-orange-50 rounded-lg mb-6"
        >
          <h3 className="text-lg font-semibold text-orange-800 mb-3">Selected Log Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Supplier:</span>
              <p className="text-gray-800">{selectedLogDetails.supplier}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Truck Reg:</span>
              <p className="text-gray-800">{selectedLogDetails.truck_reg}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Log Sheet:</span>
              <p className="text-gray-800">{selectedLogDetails.log_sheet_number}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Volume:</span>
              <p className="text-gray-800">{selectedLogDetails.volume.toFixed(3)} m³</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex justify-center">
        <button
          onClick={cutLog}
          disabled={!selectedLog || !selectedRamp || isProcessing}
          className="flex items-center gap-3 px-8 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold"
        >
          {isProcessing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <SafeIcon icon={FiRefreshCw} />
              </motion.div>
              Processing...
            </>
          ) : (
            <>
              <SafeIcon icon={FiCheck} />
              Cut Log on Ramp {selectedRamp || 'X'}
            </>
          )}
        </button>
      </div>

      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <p className="text-yellow-800 text-center">
            Cutting log on Ramp {selectedRamp}... Updating database.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CuttingStation;