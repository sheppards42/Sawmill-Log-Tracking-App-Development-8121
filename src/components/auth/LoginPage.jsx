import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiUser, FiLock, FiLogIn, FiShield, FiSettings, FiUsers } = FiIcons;

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"></div>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-xl">
                <SafeIcon icon={FiHome} className="text-3xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Sawmill Manager</h1>
                <p className="text-blue-100">Professional Management System</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Secure Access to Your
              <span className="block text-blue-200">Sawmill Operations</span>
            </h2>

            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Role-based access control ensures each team member has the right permissions 
              for their responsibilities in the sawmill workflow.
            </p>

            <div className="space-y-6">
              <motion.div 
                className="flex items-center gap-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <SafeIcon icon={FiShield} className="text-2xl text-blue-200" />
                <div>
                  <h3 className="font-semibold">Secure Authentication</h3>
                  <p className="text-sm text-blue-100">Admin-controlled user accounts</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <SafeIcon icon={FiSettings} className="text-2xl text-blue-200" />
                <div>
                  <h3 className="font-semibold">Role-Based Access</h3>
                  <p className="text-sm text-blue-100">Customizable permissions per user</p>
                </div>
              </motion.div>

              <motion.div 
                className="flex items-center gap-4 p-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <SafeIcon icon={FiUsers} className="text-2xl text-blue-200" />
                <div>
                  <h3 className="font-semibold">Team Management</h3>
                  <p className="text-sm text-blue-100">Operator, Stock Control, Driver roles</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <SafeIcon icon={FiHome} className="text-2xl text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Sawmill Manager</h1>
                <p className="text-gray-600">Management System</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h2>
              <p className="text-gray-600">Access your sawmill management dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <SafeIcon icon={FiUser} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <SafeIcon icon={FiLock} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiLogIn} />
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 mt-6">
              <p>Contact your administrator for account access</p>
            </div>
          </div>

          {/* Demo Accounts for Testing */}
          <div className="lg:hidden mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Demo Accounts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Admin:</span>
                <span className="font-mono">admin / admin123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Operator:</span>
                <span className="font-mono">operator1 / op123</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Driver:</span>
                <span className="font-mono">driver1 / dr123</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;