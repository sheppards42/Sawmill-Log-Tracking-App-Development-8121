import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { VOLUME_LOOKUP, AVAILABLE_LENGTHS, AVAILABLE_DIAMETERS } from '../data/volumeLookup';

const { FiTable, FiSearch, FiDownload, FiFilter } = FiIcons;

const VolumeLookupTable = () => {
  const [searchLength, setSearchLength] = useState('');
  const [searchDiameter, setSearchDiameter] = useState('');
  const [selectedLength, setSelectedLength] = useState('');

  // Filter data based on search criteria
  const getFilteredData = () => {
    let data = [];
    
    AVAILABLE_LENGTHS.forEach(length => {
      if (selectedLength && parseFloat(selectedLength) !== length) return;
      if (searchLength && !length.toString().includes(searchLength)) return;
      
      AVAILABLE_DIAMETERS.forEach(diameter => {
        if (searchDiameter && !diameter.toString().includes(searchDiameter)) return;
        
        const volume = VOLUME_LOOKUP[length]?.[diameter];
        if (volume !== undefined) {
          data.push({
            length,
            diameter,
            volume
          });
        }
      });
    });
    
    return data;
  };

  const filteredData = getFilteredData();

  const exportToCSV = () => {
    const csvContent = [
      ['Length (m)', 'Diameter (cm)', 'Volume (m³)'],
      ...filteredData.map(row => [row.length, row.diameter, row.volume])
    ];
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'volume-lookup-table.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchLength('');
    setSearchDiameter('');
    setSelectedLength('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 bg-white rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-3 mb-6">
        <SafeIcon icon={FiTable} className="text-2xl text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Volume Lookup Table</h2>
        <div className="ml-auto text-sm text-gray-500">
          {filteredData.length} entries
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Length
          </label>
          <select
            value={selectedLength}
            onChange={(e) => setSelectedLength(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Lengths</option>
            {AVAILABLE_LENGTHS.map(length => (
              <option key={length} value={length}>{length}m</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Length
          </label>
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchLength}
              onChange={(e) => setSearchLength(e.target.value)}
              placeholder="e.g. 3.6"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Diameter
          </label>
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchDiameter}
              onChange={(e) => setSearchDiameter(e.target.value)}
              placeholder="e.g. 25"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <SafeIcon icon={FiFilter} />
            Clear
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <SafeIcon icon={FiDownload} />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-600 mb-1">Available Lengths</h4>
          <p className="text-2xl font-bold text-blue-800">{AVAILABLE_LENGTHS.length}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-600 mb-1">Available Diameters</h4>
          <p className="text-2xl font-bold text-green-800">{AVAILABLE_DIAMETERS.length}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <h4 className="text-sm font-medium text-purple-600 mb-1">Total Combinations</h4>
          <p className="text-2xl font-bold text-purple-800">
            {AVAILABLE_LENGTHS.length * AVAILABLE_DIAMETERS.length}
          </p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <h4 className="text-sm font-medium text-orange-600 mb-1">Filtered Results</h4>
          <p className="text-2xl font-bold text-orange-800">{filteredData.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Length (m)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diameter (cm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volume (m³)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volume Category
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((row, index) => {
              let volumeCategory = 'Small';
              if (row.volume > 1.0) volumeCategory = 'Large';
              else if (row.volume > 0.5) volumeCategory = 'Medium';

              return (
                <motion.tr
                  key={`${row.length}-${row.diameter}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.diameter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {row.volume.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      volumeCategory === 'Large' ? 'bg-red-100 text-red-800' :
                      volumeCategory === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {volumeCategory}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <SafeIcon icon={FiSearch} className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-500">No results found for your search criteria</p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Quick Reference */}
      <div className="mt-8 p-4 bg-indigo-50 rounded-lg">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-indigo-700 mb-2">Available Lengths (m):</h4>
            <p className="text-indigo-600">
              {AVAILABLE_LENGTHS.join(', ')}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-indigo-700 mb-2">Diameter Range (cm):</h4>
            <p className="text-indigo-600">
              {Math.min(...AVAILABLE_DIAMETERS)} - {Math.max(...AVAILABLE_DIAMETERS)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VolumeLookupTable;