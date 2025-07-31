import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from './common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import LogEntry from './components/LogEntry';
import CuttingStation from './components/CuttingStation';
import Reports from './components/Reports';
import VolumeLookupTable from './components/VolumeLookupTable';
import VolumeCalculator from './components/VolumeCalculator';
import './App.css';

const { FiTruck, FiZap, FiBarChart3, FiHome, FiTable, FiCalculator } = FiIcons;

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Dashboard', icon: FiHome },
    { id: 'entry', label: 'Log Entry', icon: FiTruck },
    { id: 'cutting', label: 'Cutting Station', icon: FiZap },
    { id: 'reports', label: 'Reports', icon: FiBarChart3 },
    { id: 'volume-table', label: 'Volume Table', icon: FiTable },
    { id: 'volume-calculator', label: 'Calculator', icon: FiCalculator }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'entry':
        return <LogEntry />;
      case 'cutting':
        return <CuttingStation />;
      case 'reports':
        return <Reports />;
      case 'volume-table':
        return <VolumeLookupTable />;
      case 'volume-calculator':
        return <VolumeCalculator />;
      default:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg text-center"
          >
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Sawmill Management System</h1>
              <p className="text-lg text-gray-600">Track logs from delivery to cutting with real-time updates</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-blue-50 rounded-lg cursor-pointer"
                onClick={() => setActiveTab('entry')}
              >
                <SafeIcon icon={FiTruck} className="text-3xl text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-blue-800">Log Entry</h3>
                <p className="text-sm text-blue-600 mt-2">Record incoming logs with supplier details</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-orange-50 rounded-lg cursor-pointer"
                onClick={() => setActiveTab('cutting')}
              >
                <SafeIcon icon={FiZap} className="text-3xl text-orange-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-orange-800">Cutting Station</h3>
                <p className="text-sm text-orange-600 mt-2">Process logs on ramps in real-time</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-purple-50 rounded-lg cursor-pointer"
                onClick={() => setActiveTab('reports')}
              >
                <SafeIcon icon={FiBarChart3} className="text-3xl text-purple-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-purple-800">Reports</h3>
                <p className="text-sm text-purple-600 mt-2">Analyze production and inventory data</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-indigo-50 rounded-lg cursor-pointer"
                onClick={() => setActiveTab('volume-table')}
              >
                <SafeIcon icon={FiTable} className="text-3xl text-indigo-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-indigo-800">Volume Table</h3>
                <p className="text-sm text-indigo-600 mt-2">Reference table for log volumes</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-green-50 rounded-lg cursor-pointer"
                onClick={() => setActiveTab('volume-calculator')}
              >
                <SafeIcon icon={FiCalculator} className="text-3xl text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-green-800">Volume Calculator</h3>
                <p className="text-sm text-green-600 mt-2">Calculate volumes and find optimal dimensions</p>
              </motion.div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <SafeIcon icon={FiHome} className="text-2xl text-blue-600" />
              <span className="text-xl font-bold text-gray-800">Sawmill Manager</span>
            </div>
            
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <SafeIcon icon={tab.icon} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8 px-4">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;