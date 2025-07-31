import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { plankOperations } from '../data/supabaseOperations';

const { FiPlus, FiTrash2, FiSave, FiLayers, FiCalendar, FiRefreshCw } = FiIcons;

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
  // Convert mm to m for width and height, length is already in m
  const widthM = width / 1000;
  const heightM = height / 1000;
  return widthM * heightM * length * quantity;
};

const PlankTracking = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [planks, setPlanks] = useState([
    { id: Date.now(), size: '', length: '', quantity: 1 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPlank = () => {
    setPlanks([...planks, { id: Date.now(), size: '', length: '', quantity: 1 }]);
  };

  const removePlank = (id) => {
    if (planks.length > 1) {
      setPlanks(planks.filter(plank => plank.id !== id));
    }
  };

  const updatePlank = (id, field, value) => {
    setPlanks(planks.map(plank =>
      plank.id === id ? { ...plank, [field]: value } : plank
    ));
  };

  const savePlankData = async () => {
    const validPlanks = planks.filter(plank =>
      plank.size && plank.length && plank.quantity > 0
    );

    if (validPlanks.length === 0) {
      alert('Please add at least one valid plank entry');
      return;
    }

    setIsSubmitting(true);
    try {
      const plankEntries = [];
      validPlanks.forEach(plank => {
        const [width, height] = plank.size.split('x').map(Number);
        const length = parseFloat(plank.length);
        const volume = calculatePlankVolume(width, height, length, parseInt(plank.quantity));

        plankEntries.push({
          date: selectedDate,
          width,
          height,
          length,
          quantity: parseInt(plank.quantity),
          volume
        });
      });

      await plankOperations.createPlankEntries(plankEntries);

      // Reset form
      setPlanks([{ id: Date.now(), size: '', length: '', quantity: 1 }]);

      alert(`Successfully logged ${plankEntries.length} plank entries to database!`);
    } catch (error) {
      console.error('Error saving planks:', error);
      alert('Error saving plank data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotalPlanks = () => {
    return planks.reduce((total, plank) => {
      if (plank.quantity) {
        return total + parseInt(plank.quantity);
      }
      return total;
    }, 0);
  };

  const calculateTotalVolume = () => {
    return planks.reduce((total, plank) => {
      if (plank.size && plank.length && plank.quantity) {
        const [width, height] = plank.size.split('x').map(Number);
        const length = parseFloat(plank.length);
        const volume = calculatePlankVolume(width, height, length, parseInt(plank.quantity));
        return total + volume;
      }
      return total;
    }, 0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <SafeIcon icon={FiLayers} className="text-2xl text-cyan-600" />
        <h2 className="text-2xl font-bold text-gray-800">Plank Tracking</h2>
        <div className="ml-auto text-sm text-green-600">
          Database Connected
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Plank Details</h3>
          <button
            onClick={addPlank}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <SafeIcon icon={FiPlus} />
            Add Plank
          </button>
        </div>

        <div className="space-y-3">
          {planks.map((plank) => {
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
                    onChange={(e) => updatePlank(plank.id, 'size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
                    onChange={(e) => updatePlank(plank.id, 'length', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    {PLANK_LENGTHS.map((length) => (
                      <option key={length.label} value={length.value}>
                        {length.label}
                      </option>
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
                    value={plank.quantity}
                    onChange={(e) => updatePlank(plank.id, 'quantity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
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
                    onClick={() => removePlank(plank.id)}
                    disabled={planks.length === 1}
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

      <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-lg font-semibold text-cyan-800">Total Planks</h4>
            <p className="text-2xl font-bold text-cyan-900">{calculateTotalPlanks()}</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-cyan-800">Total Volume</h4>
            <p className="text-2xl font-bold text-cyan-900">{calculateTotalVolume().toFixed(4)} m³</p>
          </div>
        </div>
        <button
          onClick={savePlankData}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-cyan-400"
        >
          <SafeIcon icon={FiSave} />
          {isSubmitting ? 'Saving...' : 'Save to Database'}
        </button>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Note</h3>
        <p className="text-blue-700">
          Daily summaries and detailed breakdowns are now available in the <strong>Reports</strong> section.
          Select "Current Day" or "Custom Day" to view comprehensive analysis including recovery percentages and volume breakdowns.
        </p>
      </div>
    </motion.div>
  );
};

export default PlankTracking;