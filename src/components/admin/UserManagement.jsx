import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';
import { userOperations } from '../../data/supabaseOperations';

const { 
  FiUsers, FiPlus, FiEdit3, FiTrash2, FiSave, FiX, FiCheck, 
  FiShield, FiSettings, FiEye, FiEyeOff, FiUserPlus, FiLock 
} = FiIcons;

// Available sections/permissions
const AVAILABLE_PERMISSIONS = [
  { id: 'log_entry', label: 'Log Entry', description: 'Record incoming logs' },
  { id: 'cutting_station', label: 'Cutting Station', description: 'Process logs on ramps' },
  { id: 'plank_tracking', label: 'Plank Tracking', description: 'Record wet inventory' },
  { id: 'plank_processing', label: 'Plank Processing', description: 'Joining & planing operations' },
  { id: 'load_management', label: 'Load Management', description: 'Create and manage loads' },
  { id: 'delivery_notes', label: 'Delivery Notes', description: 'Generate delivery documentation' },
  { id: 'reports', label: 'Reports & Analytics', description: 'View reports and analytics' },
  { id: 'user_management', label: 'User Management', description: 'Manage users and permissions' }
];

// Predefined role templates
const ROLE_TEMPLATES = {
  'Admin': {
    label: 'Administrator',
    description: 'Full access to all sections',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
    color: 'red'
  },
  'Operator': {
    label: 'Operator',
    description: 'Log entry, cutting, plank tracking',
    permissions: ['log_entry', 'cutting_station', 'plank_tracking', 'reports'],
    color: 'blue'
  },
  'Stock Control': {
    label: 'Stock Controller',
    description: 'Inventory and processing management',
    permissions: ['plank_tracking', 'plank_processing', 'load_management', 'reports'],
    color: 'green'
  },
  'Driver': {
    label: 'Driver',
    description: 'Load management and delivery notes',
    permissions: ['load_management', 'delivery_notes'],
    color: 'orange'
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(ROLE_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [showPassword, setShowPassword] = useState({});

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Operator',
    permissions: [],
    active: true
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    label: '',
    description: '',
    permissions: [],
    color: 'blue'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const userData = await userOperations.getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        await userOperations.updateUser(editingUser.id, userForm);
        alert('User updated successfully!');
      } else {
        await userOperations.createUser(userForm);
        alert('User created successfully!');
      }
      
      resetUserForm();
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    
    const newRoles = {
      ...roles,
      [roleForm.name]: {
        label: roleForm.label,
        description: roleForm.description,
        permissions: roleForm.permissions,
        color: roleForm.color
      }
    };
    
    setRoles(newRoles);
    localStorage.setItem('customRoles', JSON.stringify(newRoles));
    
    resetRoleForm();
    alert('Role template saved successfully!');
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      password: '',
      full_name: '',
      role: 'Operator',
      permissions: [],
      active: true
    });
    setEditingUser(null);
    setShowUserForm(false);
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      label: '',
      description: '',
      permissions: [],
      color: 'blue'
    });
    setEditingRole(null);
    setShowRoleForm(false);
  };

  const editUser = (user) => {
    setUserForm({
      username: user.username,
      password: '', // Don't pre-fill password for security
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions || [],
      active: user.active
    });
    setEditingUser(user);
    setShowUserForm(true);
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userOperations.deleteUser(userId);
        alert('User deleted successfully!');
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user. Please try again.');
      }
    }
  };

  const handleRoleSelect = (roleName) => {
    const roleTemplate = roles[roleName];
    if (roleTemplate) {
      setUserForm({
        ...userForm,
        role: roleName,
        permissions: [...roleTemplate.permissions]
      });
    }
  };

  const togglePermission = (permissionId) => {
    const newPermissions = userForm.permissions.includes(permissionId)
      ? userForm.permissions.filter(p => p !== permissionId)
      : [...userForm.permissions, permissionId];
    
    setUserForm({
      ...userForm,
      permissions: newPermissions
    });
  };

  const toggleRolePermission = (permissionId) => {
    const newPermissions = roleForm.permissions.includes(permissionId)
      ? roleForm.permissions.filter(p => p !== permissionId)
      : [...roleForm.permissions, permissionId];
    
    setRoleForm({
      ...roleForm,
      permissions: newPermissions
    });
  };

  const togglePasswordVisibility = (userId) => {
    setShowPassword({
      ...showPassword,
      [userId]: !showPassword[userId]
    });
  };

  const getRoleColor = (roleName) => {
    const role = roles[roleName];
    return role ? role.color : 'gray';
  };

  const getColorClasses = (color) => {
    const colorMap = {
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-6 space-y-6"
    >
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SafeIcon icon={FiUsers} className="text-2xl text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
              <p className="text-gray-600">Manage users, roles, and permissions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRoleForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <SafeIcon icon={FiSettings} />
              <span className="hidden sm:inline">Add Role</span>
            </button>
            <button
              onClick={() => setShowUserForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <SafeIcon icon={FiUserPlus} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Templates */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Role Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(roles).map(([roleName, role]) => (
            <div key={roleName} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getColorClasses(role.color)}`}>
                  {role.label}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
              <div className="text-xs text-gray-500">
                {role.permissions.length} permissions
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Users</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColorClasses(getRoleColor(user.role))}`}>
                        {roles[user.role]?.label || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {user.permissions?.length || 0} permissions
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.permissions?.slice(0, 3).map(p => 
                          AVAILABLE_PERMISSIONS.find(ap => ap.id === p)?.label
                        ).join(', ')}
                        {user.permissions?.length > 3 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <SafeIcon icon={FiEdit3} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <SafeIcon icon={FiTrash2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
                <button
                  onClick={resetUserForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleUserSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={userForm.full_name}
                      onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {editingUser ? '(leave empty to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword.form ? "text" : "password"}
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!editingUser}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('form')}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <SafeIcon icon={showPassword.form ? FiEyeOff : FiEye} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Template
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(roles).map(([roleName, role]) => (
                      <option key={roleName} value={roleName}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <label key={permission.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={userForm.permissions.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{permission.label}</div>
                          <div className="text-sm text-gray-500">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="active"
                    checked={userForm.active}
                    onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Active User
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetUserForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    <SafeIcon icon={FiSave} />
                    {loading ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Add Role Template</h3>
                <button
                  onClick={resetRoleForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleRoleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Quality Control"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Label *
                    </label>
                    <input
                      type="text"
                      value={roleForm.label}
                      onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Quality Controller"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Brief description of role responsibilities"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color Theme
                  </label>
                  <select
                    value={roleForm.color}
                    onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="orange">Orange</option>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                    <option value="gray">Gray</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Default Permissions
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map((permission) => (
                      <label key={permission.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.includes(permission.id)}
                          onChange={() => toggleRolePermission(permission.id)}
                          className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{permission.label}</div>
                          <div className="text-sm text-gray-500">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetRoleForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <SafeIcon icon={FiSave} />
                    Create Role Template
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

export default UserManagement;