import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './components/auth/LoginPage';
import UserManagement from './components/admin/UserManagement';
import CustomerManagement from './components/admin/CustomerManagement';
import MachineManagement from './components/maintenance/MachineManagement';
import ToolManagement from './components/maintenance/ToolManagement';
import SpareManagement from './components/maintenance/SpareManagement';
import BreakdownManagement from './components/maintenance/BreakdownManagement';
import CustomerAnalytics from './components/analytics/CustomerAnalytics';
import SupplierAnalytics from './components/analytics/SupplierAnalytics';
import SafeIcon from './common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { userOperations, initializeTables } from './data/supabaseOperations';
import LogEntry from './components/LogEntry';
import CuttingStation from './components/CuttingStation';
import Reports from './components/Reports';
import PlankTracking from './components/PlankTracking';
import JoiningPlaning from './components/JoiningPlaning';
import LoadManagement from './components/LoadManagement';
import DeliveryNote from './components/DeliveryNote';
import './App.css';

const { 
  FiTruck, FiZap, FiBarChart3, FiHome, FiLayers, FiPackage, FiSend, FiLogOut, 
  FiUser, FiUsers, FiFileText, FiTool, FiSettings, FiAlertTriangle, FiUserCheck,
  FiPieChart, FiTrendingUp
} = FiIcons;

// Dashboard Component
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [deliveryNoteLoadId, setDeliveryNoteLoadId] = useState(null);
  const { logout, user, hasAccess, isAdmin } = useAuth();

  // Define all tabs with their permission requirements
  const allTabs = [
    { id: 'home', label: 'Dashboard', icon: FiHome, permission: null },
    { id: 'entry', label: 'Log Entry', icon: FiTruck, permission: 'log_entry' },
    { id: 'cutting', label: 'Cutting Station', icon: FiZap, permission: 'cutting_station' },
    { id: 'planks', label: 'Plank Tracking', icon: FiLayers, permission: 'plank_tracking' },
    { id: 'processing', label: 'Plank Processing', icon: FiPackage, permission: 'plank_processing' },
    { id: 'loads', label: 'Load Management', icon: FiSend, permission: 'load_management' },
    { id: 'delivery', label: 'Delivery Notes', icon: FiFileText, permission: 'delivery_notes' },
    { id: 'reports', label: 'Reports', icon: FiBarChart3, permission: 'reports' },
    { id: 'machines', label: 'Machines', icon: FiSettings, permission: 'user_management' },
    { id: 'tools', label: 'Tools', icon: FiTool, permission: 'user_management' },
    { id: 'spares', label: 'Spare Parts', icon: FiPackage, permission: 'user_management' },
    { id: 'breakdowns', label: 'Breakdowns', icon: FiAlertTriangle, permission: null },
    { id: 'customers', label: 'Customers', icon: FiUserCheck, permission: 'user_management' },
    { id: 'customer-analytics', label: 'Customer Analytics', icon: FiPieChart, permission: 'reports' },
    { id: 'supplier-analytics', label: 'Supplier Analytics', icon: FiTrendingUp, permission: 'reports' },
    { id: 'users', label: 'Users', icon: FiUsers, permission: 'user_management' }
  ];

  // Filter tabs based on user permissions
  const tabs = allTabs.filter(tab => 
    tab.permission === null || hasAccess(tab.permission)
  );

  const handleLogout = () => {
    logout();
  };

  const renderContent = () => {
    if (deliveryNoteLoadId) {
      return (
        <DeliveryNote 
          loadId={deliveryNoteLoadId} 
          onClose={() => setDeliveryNoteLoadId(null)} 
        />
      );
    }

    switch (activeTab) {
      case 'entry':
        return hasAccess('log_entry') ? <LogEntry /> : <AccessDenied />;
      case 'cutting':
        return hasAccess('cutting_station') ? <CuttingStation /> : <AccessDenied />;
      case 'planks':
        return hasAccess('plank_tracking') ? <PlankTracking /> : <AccessDenied />;
      case 'processing':
        return hasAccess('plank_processing') ? <JoiningPlaning /> : <AccessDenied />;
      case 'loads':
        return hasAccess('load_management') ? <LoadManagement onDeliveryNote={setDeliveryNoteLoadId} /> : <AccessDenied />;
      case 'reports':
        return hasAccess('reports') ? <Reports /> : <AccessDenied />;
      case 'machines':
        return hasAccess('user_management') ? <MachineManagement /> : <AccessDenied />;
      case 'tools':
        return hasAccess('user_management') ? <ToolManagement /> : <AccessDenied />;
      case 'spares':
        return hasAccess('user_management') ? <SpareManagement /> : <AccessDenied />;
      case 'breakdowns':
        return <BreakdownManagement />;
      case 'customers':
        return hasAccess('user_management') ? <CustomerManagement /> : <AccessDenied />;
      case 'customer-analytics':
        return hasAccess('reports') ? <CustomerAnalytics /> : <AccessDenied />;
      case 'supplier-analytics':
        return hasAccess('reports') ? <SupplierAnalytics /> : <AccessDenied />;
      case 'users':
        return hasAccess('user_management') ? <UserManagement /> : <AccessDenied />;
      default:
        return <DashboardHome tabs={tabs} setActiveTab={setActiveTab} user={user} />;
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
            
            <div className="flex items-center space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setDeliveryNoteLoadId(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <SafeIcon icon={tab.icon} />
                  <span className="hidden md:inline text-sm">{tab.label}</span>
                </button>
              ))}
              
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <SafeIcon icon={FiUser} className="text-gray-600" />
                  <div className="hidden sm:block">
                    <span className="text-sm font-medium text-gray-700">{user?.full_name}</span>
                    <div className="text-xs text-gray-500">@{user?.username}</div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  title="Logout"
                >
                  <SafeIcon icon={FiLogOut} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
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
};

// Access Denied Component
const AccessDenied = () => (
  <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg text-center">
    <SafeIcon icon={FiUsers} className="text-6xl text-red-500 mx-auto mb-4" />
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
    <p className="text-gray-600">
      You don't have permission to access this section. Contact your administrator if you need access.
    </p>
  </div>
);

// Dashboard Home Component
const DashboardHome = ({ tabs, setActiveTab, user }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg text-center"
  >
    <div className="mb-6">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">
        Welcome, {user?.full_name}!
      </h1>
      <p className="text-lg text-gray-600">
        Sawmill Management System - {user?.role} Dashboard
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
      {tabs.filter(tab => tab.id !== 'home').map((tab) => {
        const colors = {
          entry: 'blue',
          cutting: 'orange',
          planks: 'cyan',
          processing: 'indigo',
          loads: 'green',
          delivery: 'purple',
          reports: 'purple',
          machines: 'gray',
          tools: 'blue',
          spares: 'green',
          breakdowns: 'red',
          customers: 'green',
          'customer-analytics': 'blue',
          'supplier-analytics': 'green',
          users: 'red'
        };
        const color = colors[tab.id] || 'gray';

        return (
          <motion.div
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            className={`p-6 bg-${color}-50 rounded-lg cursor-pointer`}
            onClick={() => setActiveTab(tab.id)}
          >
            <SafeIcon icon={tab.icon} className={`text-3xl text-${color}-600 mx-auto mb-3`} />
            <h3 className={`text-lg font-semibold text-${color}-800`}>{tab.label}</h3>
            <p className={`text-sm text-${color}-600 mt-2`}>
              {getTabDescription(tab.id)}
            </p>
          </motion.div>
        );
      })}
    </div>

    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Access Level</h3>
      <div className="flex items-center justify-center gap-4">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
          user?.role === 'Admin' ? 'bg-red-100 text-red-800' :
          user?.role === 'Operator' ? 'bg-blue-100 text-blue-800' :
          user?.role === 'Stock Control' ? 'bg-green-100 text-green-800' :
          user?.role === 'Driver' ? 'bg-orange-100 text-orange-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {user?.role}
        </span>
        <span className="text-sm text-gray-600">
          {user?.permissions?.length || 0} permissions granted
        </span>
      </div>
    </div>
  </motion.div>
);

// Helper function for tab descriptions
const getTabDescription = (tabId) => {
  const descriptions = {
    entry: 'Record incoming logs with supplier details',
    cutting: 'Process logs on ramps in real-time',
    planks: 'Record wet inventory from cutting',
    processing: 'Track joining & planing operations',
    loads: 'Create and manage delivery loads',
    delivery: 'Generate delivery documentation',
    reports: 'Analyze production and inventory data',
    machines: 'Manage machines and equipment',
    tools: 'Track tools and assignments',
    spares: 'Manage spare parts inventory',
    breakdowns: 'Track machine breakdowns and repairs',
    customers: 'Manage customer information',
    'customer-analytics': 'Analyze customer delivery patterns',
    'supplier-analytics': 'Analyze supplier performance',
    users: 'Manage users and permissions'
  };
  return descriptions[tabId] || '';
};

// Main App Component
function App() {
  useEffect(() => {
    // Initialize default users and tables on app start
    const initializeApp = async () => {
      await initializeTables();
      await userOperations.initializeDefaultUsers();
    };
    
    initializeApp();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;