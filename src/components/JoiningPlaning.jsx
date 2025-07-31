import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { format } from 'date-fns';
import { joiningPlaningOperations, plankOperations, cutLogOperations } from '../data/supabaseOperations';

const { FiPlus, FiTrash2, FiSave, FiLink, FiCalendar, FiRefreshCw, FiTool, FiCheck, FiPackage } = FiIcons;

// Constants for plank dimensions - reusing the same as plank tracking
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

const JoiningPlaning = () => {
  const [activeTab, setActiveTab] = useState('taken');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [operator, setOperator] = useState('');

  // Planks Taken state
  const [takenPlanks, setTakenPlanks] = useState([
    { id: Date.now(), size: '', length: '', quantity: 1 }
  ]);
  const [availablePlanks, setAvailablePlanks] = useState([]);
  const [isSubmittingTaken, setIsSubmittingTaken] = useState(false);

  // Joining state
  const [joinedPlanks, setJoinedPlanks] = useState([
    { id: Date.now(), size: '', length: '', quantity: 1 }
  ]);
  const [availableTaken, setAvailableTaken] = useState([]);
  const [isSubmittingJoined, setIsSubmittingJoined] = useState(false);

  // Planing state
  const [planedPlanks, setPlanedPlanks] = useState([
    { id: Date.now(), size: '', length: '', quantity: 1 }
  ]);
  const [availableJoined, setAvailableJoined] = useState([]);
  const [isSubmittingPlaned, setIsSubmittingPlaned] = useState(false);

  useEffect(() => {
    if (activeTab === 'taken') {
      loadAvailablePlanks();
    } else if (activeTab === 'joining') {
      loadAvailableTaken();
    } else if (activeTab === 'planing') {
      loadAvailableJoined();
    }
  }, [activeTab]);

  const loadAvailablePlanks = async () => {
    try {
      const data = await plankOperations.getAvailablePlanks();
      setAvailablePlanks(data);
    } catch (error) {
      console.error('Error loading available planks:', error);
    }
  };

  const loadAvailableTaken = async () => {
    try {
      const data = await joiningPlaningOperations.getAvailableTakenPlanks();
      setAvailableTaken(data);
    } catch (error) {
      console.error('Error loading available taken planks:', error);
    }
  };

  const loadAvailableJoined = async () => {
    try {
      const data = await joiningPlaningOperations.getAvailableJoinedPlanks();
      setAvailableJoined(data);
    } catch (error) {
      console.error('Error loading available joined planks:', error);
    }
  };

  // Taken Planks functions
  const addTakenPlank = () => {
    setTakenPlanks([...takenPlanks, { id: Date.now(), size: '', length: '', quantity: 1 }]);
  };

  const removeTakenPlank = (id) => {
    if (takenPlanks.length > 1) {
      setTakenPlanks(takenPlanks.filter(plank => plank.id !== id));
    }
  };

  const updateTakenPlank = (id, field, value) => {
    setTakenPlanks(takenPlanks.map(plank =>
      plank.id === id ? { ...plank, [field]: value } : plank
    ));
  };

  const getAvailableQuantity = (size, length, availableList) => {
    if (!size || !length) return 0;
    const [width, height] = size.split('x').map(Number);
    const lengthNum = parseFloat(length);
    
    const available = availableList.find(plank =>
      plank.width === width &&
      plank.height === height &&
      plank.length === lengthNum
    );
    return available ? available.available_quantity : 0;
  };

  const saveTakenPlanks = async () => {
    if (!operator) {
      alert('Please enter operator name');
      return;
    }

    const validPlanks = takenPlanks.filter(plank =>
      plank.size && plank.length && plank.quantity > 0
    );

    if (validPlanks.length === 0) {
      alert('Please add at least one valid plank entry');
      return;
    }

    // Check availability
    for (const plank of validPlanks) {
      const available = getAvailableQuantity(plank.size, plank.length, availablePlanks);
      if (plank.quantity > available) {
        alert(`Not enough planks available. You need ${plank.quantity} but only ${available} are available for ${plank.size} - ${plank.length}m`);
        return;
      }
    }

    setIsSubmittingTaken(true);
    try {
      const plankEntries = [];
      validPlanks.forEach(plank => {
        const [width, height] = plank.size.split('x').map(Number);
        const length = parseFloat(plank.length);
        const volume = calculatePlankVolume(width, height, length, plank.quantity);

        plankEntries.push({
          date: selectedDate,
          operator,
          width,
          height,
          length,
          quantity: parseInt(plank.quantity),
          volume
        });
      });

      await joiningPlaningOperations.createTakenPlanks(plankEntries);

      // Reset form
      setTakenPlanks([{ id: Date.now(), size: '', length: '', quantity: 1 }]);

      // Reload data
      await loadAvailablePlanks();

      alert(`Successfully logged ${plankEntries.length} taken plank entries to database!`);
    } catch (error) {
      console.error('Error saving taken planks:', error);
      alert('Error saving taken plank data. Please try again.');
    } finally {
      setIsSubmittingTaken(false);
    }
  };

  // Joined Planks functions
  const addJoinedPlank = () => {
    setJoinedPlanks([...joinedPlanks, { id: Date.now(), size: '', length: '', quantity: 1 }]);
  };

  const removeJoinedPlank = (id) => {
    if (joinedPlanks.length > 1) {
      setJoinedPlanks(joinedPlanks.filter(plank => plank.id !== id));
    }
  };

  const updateJoinedPlank = (id, field, value) => {
    setJoinedPlanks(joinedPlanks.map(plank =>
      plank.id === id ? { ...plank, [field]: value } : plank
    ));
  };

  const saveJoinedPlanks = async () => {
    if (!operator) {
      alert('Please enter operator name');
      return;
    }

    const validPlanks = joinedPlanks.filter(plank =>
      plank.size && plank.length && plank.quantity > 0
    );

    if (validPlanks.length === 0) {
      alert('Please add at least one valid plank entry');
      return;
    }

    setIsSubmittingJoined(true);
    try {
      const plankEntries = [];
      validPlanks.forEach(plank => {
        const [width, height] = plank.size.split('x').map(Number);
        const length = parseFloat(plank.length);
        const volume = calculatePlankVolume(width, height, length, plank.quantity);

        plankEntries.push({
          date: selectedDate,
          operator,
          width,
          height,
          length,
          quantity: parseInt(plank.quantity),
          volume
        });
      });

      await joiningPlaningOperations.createJoinedPlanks(plankEntries);

      // Reset form
      setJoinedPlanks([{ id: Date.now(), size: '', length: '', quantity: 1 }]);

      // Reload data
      await loadAvailableTaken();

      alert(`Successfully logged ${plankEntries.length} joined plank entries to database!`);
    } catch (error) {
      console.error('Error saving joined planks:', error);
      alert('Error saving joined plank data. Please try again.');
    } finally {
      setIsSubmittingJoined(false);
    }
  };

  // Planed Planks functions
  const addPlanedPlank = () => {
    setPlanedPlanks([...planedPlanks, { id: Date.now(), size: '', length: '', quantity: 1 }]);
  };

  const removePlanedPlank = (id) => {
    if (planedPlanks.length > 1) {
      setPlanedPlanks(planedPlanks.filter(plank => plank.id !== id));
    }
  };

  const updatePlanedPlank = (id, field, value) => {
    setPlanedPlanks(planedPlanks.map(plank =>
      plank.id === id ? { ...plank, [field]: value } : plank
    ));
  };

  const savePlanedPlanks = async () => {
    if (!operator) {
      alert('Please enter operator name');
      return;
    }

    const validPlanks = planedPlanks.filter(plank =>
      plank.size && plank.length && plank.quantity > 0
    );

    if (validPlanks.length === 0) {
      alert('Please add at least one valid plank entry');
      return;
    }

    setIsSubmittingPlaned(true);
    try {
      const plankEntries = [];
      validPlanks.forEach(plank => {
        const [width, height] = plank.size.split('x').map(Number);
        const length = parseFloat(plank.length);
        const volume = calculatePlankVolume(width, height, length, plank.quantity);

        plankEntries.push({
          date: selectedDate,
          operator,
          width,
          height,
          length,
          quantity: parseInt(plank.quantity),
          volume
        });
      });

      await joiningPlaningOperations.createPlanedPlanks(plankEntries);

      // Reset form
      setPlanedPlanks([{ id: Date.now(), size: '', length: '', quantity: 1 }]);

      // Reload data
      await loadAvailableJoined();

      alert(`Successfully logged ${plankEntries.length} planed plank entries to database!`);
    } catch (error) {
      console.error('Error saving planed planks:', error);
      alert('Error saving planed plank data. Please try again.');
    } finally {
      setIsSubmittingPlaned(false);
    }
  };

  const calculateTotalQuantity = (planks) => {
    return planks.reduce((total, plank) => {
      if (plank.quantity) {
        return total + parseInt(plank.quantity);
      }
      return total;
    }, 0);
  };

  const calculateTotalVolume = (planks) => {
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
        <SafeIcon icon={activeTab === 'taken' ? FiPackage : activeTab === 'joining' ? FiLink : FiTool} className="text-2xl text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          {activeTab === 'taken' ? 'Planks Taken' : activeTab === 'joining' ? 'Joining' : 'Planing'} Station
        </h2>
        <div className="ml-auto text-sm text-green-600">
          Database Connected
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('taken')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'taken' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SafeIcon icon={FiPackage} />
            <span>Planks Taken</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('joining')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'joining' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SafeIcon icon={FiLink} />
            <span>Joining</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('planing')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'planing' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SafeIcon icon={FiTool} />
            <span>Planing</span>
          </div>
        </button>
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
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Operator <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            placeholder="Operator name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {activeTab === 'taken' ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Taken Plank Details</h3>
              <button
                onClick={addTakenPlank}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} />
                Add Taken Plank
              </button>
            </div>

            <div className="space-y-3">
              {takenPlanks.map((plank) => {
                const availableQty = getAvailableQuantity(plank.size, plank.length, availablePlanks);
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
                        onChange={(e) => updateTakenPlank(plank.id, 'size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        onChange={(e) => updateTakenPlank(plank.id, 'length', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        onChange={(e) => updateTakenPlank(plank.id, 'quantity', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
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
                        onClick={() => removeTakenPlank(plank.id)}
                        disabled={takenPlanks.length === 1}
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

          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-indigo-800">Total Planks Taken</h4>
                <p className="text-2xl font-bold text-indigo-900">{calculateTotalQuantity(takenPlanks)}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-indigo-800">Total Volume</h4>
                <p className="text-2xl font-bold text-indigo-900">{calculateTotalVolume(takenPlanks).toFixed(4)} m³</p>
              </div>
            </div>
            <button
              onClick={saveTakenPlanks}
              disabled={isSubmittingTaken}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              <SafeIcon icon={FiSave} />
              {isSubmittingTaken ? 'Saving...' : 'Save to Database'}
            </button>
          </div>
        </>
      ) : activeTab === 'joining' ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Joined Plank Details</h3>
              <button
                onClick={addJoinedPlank}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} />
                Add Joined Plank
              </button>
            </div>

            <div className="space-y-3">
              {joinedPlanks.map((plank) => {
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
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Size
                      </label>
                      <select
                        value={plank.size}
                        onChange={(e) => updateJoinedPlank(plank.id, 'size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        onChange={(e) => updateJoinedPlank(plank.id, 'length', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        Quantity & Volume
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={plank.quantity}
                        onChange={(e) => updateJoinedPlank(plank.id, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Vol: {volume.toFixed(4)} m³
                      </p>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => removeJoinedPlank(plank.id)}
                        disabled={joinedPlanks.length === 1}
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

          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-indigo-800">Total Joined Planks</h4>
                <p className="text-2xl font-bold text-indigo-900">{calculateTotalQuantity(joinedPlanks)}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-indigo-800">Total Volume</h4>
                <p className="text-2xl font-bold text-indigo-900">{calculateTotalVolume(joinedPlanks).toFixed(4)} m³</p>
              </div>
            </div>
            <button
              onClick={saveJoinedPlanks}
              disabled={isSubmittingJoined}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              <SafeIcon icon={FiSave} />
              {isSubmittingJoined ? 'Saving...' : 'Save to Database'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Planed Plank Details</h3>
              <button
                onClick={addPlanedPlank}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <SafeIcon icon={FiPlus} />
                Add Planed Plank
              </button>
            </div>

            <div className="space-y-3">
              {planedPlanks.map((plank) => {
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
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Size
                      </label>
                      <select
                        value={plank.size}
                        onChange={(e) => updatePlanedPlank(plank.id, 'size', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        onChange={(e) => updatePlanedPlank(plank.id, 'length', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                        Quantity & Volume
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={plank.quantity}
                        onChange={(e) => updatePlanedPlank(plank.id, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Vol: {volume.toFixed(4)} m³
                      </p>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => removePlanedPlank(plank.id)}
                        disabled={planedPlanks.length === 1}
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

          <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-indigo-800">Total Planed Planks</h4>
                <p className="text-2xl font-bold text-indigo-900">{calculateTotalQuantity(planedPlanks)}</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-indigo-800">Total Volume</h4>
                <p className="text-2xl font-bold text-indigo-900">{calculateTotalVolume(planedPlanks).toFixed(4)} m³</p>
              </div>
            </div>
            <button
              onClick={savePlanedPlanks}
              disabled={isSubmittingPlaned}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
            >
              <SafeIcon icon={FiSave} />
              {isSubmittingPlaned ? 'Saving...' : 'Save to Database'}
            </button>
          </div>
        </>
      )}

      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Note</h3>
        <p className="text-blue-700">
          Daily summaries, waste analysis, and detailed breakdowns are now available in the <strong>Reports</strong> section.
          Select "Current Day" or "Custom Day" to view comprehensive processing analysis including waste calculations and volume tracking.
        </p>
      </div>
    </motion.div>
  );
};

export default JoiningPlaning;