import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Activity, Calendar, TrendingUp, Search,
  Ban, Trash2, Eye, RefreshCw, Shield, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- CUSTOM UI DIALOG STATES ---
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'confirm', // 'confirm' or 'alert'
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmColor: 'indigo',
    onConfirm: null
  });

  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const showAlert = (title, message) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message,
      confirmText: 'OK',
      confirmColor: 'indigo',
      onConfirm: closeModal
    });
  };

  const showConfirm = (title, message, confirmText, color, onConfirm) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      confirmColor: color,
      onConfirm: async () => {
        await onConfirm();
        closeModal();
      }
    });
  };
  // -------------------------------

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
    fetchUsers();
  }, [currentPage, searchQuery]);

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.user.role !== 'admin') {
        // Replacement for alert()
        showAlert('Access Denied', 'You do not have the necessary permissions to view the Admin Panel.');
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/admin/users?page=${currentPage}&search=${searchQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusToggle = (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    // Replacement for confirm()
    showConfirm(
      'Confirm Status Change',
      `Are you sure you want to ${action} this user?`,
      currentStatus ? 'Deactivate' : 'Activate',
      currentStatus ? 'red' : 'green',
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.put(
            `${API_URL}/api/admin/users/${userId}/status`,
            { isActive: !currentStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          fetchUsers();
          showNotification(`User ${action}d successfully`);
        } catch (error) {
          console.error('Error updating status:', error);
          showNotification('Failed to update status', 'error');
        }
      }
    );
  };

  const handleDeleteUser = (userId) => {
    // Replacement for confirm()
    showConfirm(
      'Permanent Deletion',
      'Are you sure? This will delete the user and ALL their data permanently! This action cannot be undone.',
      'Delete Permanently',
      'red',
      async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchUsers();
          fetchStats();
          showNotification('User deleted successfully');
        } catch (error) {
          console.error('Error deleting user:', error);
          showNotification('Failed to delete user', 'error');
        }
      }
    );
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Custom Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-6 py-3 rounded-lg shadow-2xl animate-in slide-in-from-right duration-300 ${
          notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {notification.type === 'error' ? <XCircle size={20} /> : <CheckCircle size={20} />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Custom Universal Modal */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <AlertTriangle size={32} />
              <h3 className="text-xl font-bold text-gray-900">{modal.title}</h3>
            </div>
            <p className="text-gray-600 mb-8 leading-relaxed">{modal.message}</p>
            <div className="flex justify-end gap-3">
              {modal.type === 'confirm' && (
                <button 
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={modal.onConfirm}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition transform active:scale-95 ${
                  modal.confirmColor === 'red' ? 'bg-red-600 hover:bg-red-700' : 
                  modal.confirmColor === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {modal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-indigo-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">System Management Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="text-indigo-600" size={28} />
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  +{stats.recentSignups} new
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers}</h3>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Users</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="text-green-600" size={28} />
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {stats.activeUserPercentage}% Active
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.activeUsers}</h3>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Users (7d)</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="text-purple-600" size={28} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900">{stats.totalMeetings}</h3>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Meetings Created</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="text-orange-600" size={28} />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Completed:</span>
                  <span className="font-bold text-gray-900">{stats.meetingsByStatus.completed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Scheduled:</span>
                  <span className="font-bold text-gray-900">{stats.meetingsByStatus.scheduled || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length > 0 ? users.map((u) => (
                  <tr key={u.id} className="group hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {u.firstName} {u.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleUserStatusToggle(u.id, u.isActive)}
                          className={`p-2 rounded-lg transition ${
                            u.isActive ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={u.isActive ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Ban size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 italic">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <p className="text-sm font-bold text-gray-500">
              Page <span className="text-indigo-600">{currentPage}</span> of {totalPages}
            </p>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl shadow-sm disabled:opacity-50 hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;