import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { 
  AVAILABLE_LENGTHS, 
  AVAILABLE_DIAMETERS,
  getLogVolume 
} from '../data/volumeLookup';

const { FiSearch, FiTarget, FiTrendingUp, FiTable } = FiIcons;

const VolumeCalculator = () => {
  const [lookupMode, setLookupMode] = useState('dimensions');
  const [length, setLength] = useState('');
  const [diameter, setDiameter] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [targetVolume, setTargetVolume] = useState('');
  const [results, setResults] = useState(null);
  const [matchingDimensions, setMatchingDimensions] = useState([]);

  useEffect(() => {
    if (length && diameter) {
      // Get the predefined volume from lookup table
      const volume = getLogVolume(parseFloat(length), parseFloat(diameter));
      const totalVolume = volume * quantity;
      
      setResults({
        singleVolume: volume,
        totalVolume,
        category: getVolumeCategory(volume),
        isValid: volume > 0
      });
    } else {
      setResults(null);
    }
  }, [length, diameter, quantity]);

  const getVolumeCategory = (volume) => {
    if (volume > 1.0) return 'Large';
    if (volume > 0.5) return 'Medium';
    return 'Small';
  };

  const findDimensionsForVolume = () => {
    if (!targetVolume || isNaN(parseFloat(targetVolume))) {
      return;
    }
    
    const target = parseFloat(targetVolume);
    const matches = [];
    
    // Search through all predefined combinations
    AVAILABLE_LENGTHS.forEach(len => {
      AVAILABLE_DIAMETERS.forEach(dia => {
        const volume = getLogVolume(len, dia);
        if (volume > 0) {
          const difference = Math.abs(volume - target);
          const percentDiff = (difference / target) * 100;
          
          matches.push({
            length: len,
            diameter: dia,
            volume: volume,
            difference: difference,
            percentDiff: percentDiff
          });
        }
      });
    });
    
    // Sort by closest match and take top 10
    const sortedMatches = matches
      .sort((a, b) => a.difference - b.difference)
      .slice(0, 10);
    
    setMatchingDimensions(sortedMatches);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <SafeIcon icon={FiTable} className="text-2xl text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800">Volume Lookup Tool</h2>
        <div className="ml-auto text-sm text-green-600">
          Using Predefined Values
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setLookupMode('dimensions')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            lookupMode === 'dimensions' 
              ? 'bg-green-600 text-white' 
              : 'hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SafeIcon icon={FiSearch} />
            <span>Find Volume</span>
          </div>
        </button>
        <button
          onClick={() => setLookupMode('volume')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            lookupMode === 'volume' 
              ? 'bg-green-600 text-white' 
              : 'hover:bg-gray-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <SafeIcon icon={FiTarget} />
            <span>Find Dimensions</span>
          </div>
        </button>
      </div>

      {lookupMode === 'dimensions' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Length (m)
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select length</option>
                {AVAILABLE_LENGTHS.map(len => (
                  <option key={len} value={len}>{len}m</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diameter (cm)
              </label>
              <select
                value={diameter}
                onChange={(e) => setDiameter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select diameter</option>
                {AVAILABLE_DIAMETERS.map(dia => (
                  <option key={dia} value={dia}>{dia}cm</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {results && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-lg ${results.isValid ? 'bg-green-50' : 'bg-red-50'}`}
            >
              {results.isValid ? (
                <>
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Lookup Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Single Log Volume</h4>
                      <p className="text-2xl font-bold text-green-600">{results.singleVolume.toFixed(3)} m³</p>
                      <span className={`mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        results.category === 'Large' ? 'bg-red-100 text-red-800' :
                        results.category === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {results.category}
                      </span>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Total Volume</h4>
                      <p className="text-2xl font-bold text-green-600">{results.totalVolume.toFixed(3)} m³</p>
                      <p className="text-xs text-gray-500 mt-2">For {quantity} log{quantity !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Dimensions</h4>
                      <p className="text-xl font-bold text-gray-800">{length}m × {diameter}cm</p>
                      <p className="text-xs text-gray-500 mt-2">From lookup table</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">No Volume Found</h3>
                  <p className="text-red-600">This dimension combination is not available in the lookup table.</p>
                  <p className="text-sm text-red-500 mt-2">Please select from the available standard dimensions.</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Volume (m³)
              </label>
              <div className="flex">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={targetVolume}
                  onChange={(e) => setTargetVolume(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter desired volume"
                />
                <button
                  onClick={findDimensionsForVolume}
                  className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 transition-colors"
                >
                  <SafeIcon icon={FiSearch} />
                </button>
              </div>
            </div>
          </div>

          {matchingDimensions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-green-50 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-4">
                <SafeIcon icon={FiTrendingUp} className="text-xl text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">
                  Closest Matches for {targetVolume} m³
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-green-100 text-green-800">
                    <tr>
                      <th className="px-4 py-2 rounded-tl-lg">Rank</th>
                      <th className="px-4 py-2">Length (m)</th>
                      <th className="px-4 py-2">Diameter (cm)</th>
                      <th className="px-4 py-2">Actual Volume (m³)</th>
                      <th className="px-4 py-2 rounded-tr-lg">Difference (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100">
                    {matchingDimensions.map((match, index) => (
                      <motion.tr
                        key={`${match.length}-${match.diameter}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={index === 0 ? "bg-green-200 font-medium" : "bg-white"}
                      >
                        <td className="px-4 py-3">
                          #{index + 1}
                          {index === 0 && (
                            <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Best
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{match.length}</td>
                        <td className="px-4 py-3 font-medium">{match.diameter}</td>
                        <td className="px-4 py-3 font-mono">{match.volume.toFixed(3)}</td>
                        <td className="px-4 py-3">
                          <span className={`${
                            match.percentDiff < 5 ? 'text-green-600' :
                            match.percentDiff < 15 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {match.percentDiff.toFixed(1)}%
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> All volumes are from the predefined lookup table. 
                  Green percentages (&lt;5%) indicate excellent matches.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default VolumeCalculator;