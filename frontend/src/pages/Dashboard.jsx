import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, CheckCircle, RefreshCw, Link, AlertCircle } from 'lucide-react';
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Calendar Integration Component
const CalendarIntegrationSection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const tokens = localStorage.getItem('calendar_tokens');
    if (tokens) {
      setIsConnected(true);
    }
  }, []);

  const connectCalendar = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/calendar/auth`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      alert('Failed to connect calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectCalendar = () => {
    if (window.confirm('Disconnect calendar?')) {
      localStorage.removeItem('calendar_tokens');
      setIsConnected(false);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Calendar Integration</h3>
        <p className="text-sm text-gray-600">Connect Google Calendar to sync meetings</p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Calendar className={isConnected ? 'text-green-600' : 'text-gray-400'} size={24} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Google Calendar</h4>
              <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                {isConnected ? '✓ Connected' : 'Not connected'}
              </p>
            </div>
          </div>

          {!isConnected ? (
            <button onClick={connectCalendar} disabled={isLoading} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition">
              {isLoading ? 'Connecting...' : 'Connect Calendar'}
            </button>
          ) : (
            <button onClick={disconnectCalendar} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-medium hover:bg-red-200 transition">
              Disconnect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    duration: '',
    description: ''
  });
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    fetchUser();
    fetchMeetings();
  }, []);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Simple fetchMeetings for Dashboard
  const fetchMeetings = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔄 Fetching meetings from API...');
    
    const response = await axios.get(`${API_URL}/api/meetings?limit=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ API Response:', response.data);

    if (response.data.success) {
      console.log('✅ Setting meetings:', response.data.meetings);
      setMeetings(response.data.meetings);
      
      // Force a re-render
      setTimeout(() => {
        console.log('📊 Current state:', response.data.meetings.length, 'meetings');
      }, 100);
    }
  } catch (error) {
    console.error('❌ Error fetching meetings:', error);
    console.error('Error details:', error.response?.data);
  }
};

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const handleCreateMeeting = (e) => {
    e.preventDefault();
    const newId = meetings.length + 1;
    const meeting = {
      id: newId,
      title: newMeeting.title,
      status: 'upcoming',
      scheduledAt: new Date(newMeeting.date), // Changed from 'date' to 'scheduledAt'
      duration: newMeeting.duration,
      participants: 0,
      description: newMeeting.description
    };
    setMeetings([...meetings, meeting]);
    setShowNewMeetingModal(false);
    setNewMeeting({ title: '', date: '', duration: '', description: '' });
  };

  const filteredMeetings = meetings.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter(m => m.status === 'scheduled').length,
    inProgress: meetings.filter(m => m.status === 'in-progress').length,
    completed: meetings.filter(m => m.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Smart Meeting Assistant
                </h1>
                <p className="text-xs text-gray-500">AI-powered intelligence</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.fullName} className="w-10 h-10 rounded-full border-2 border-purple-200" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-purple-600 font-bold border-2 border-purple-200">
                  {user?.firstName?.[0] || 'U'}
                </div>
              )}
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}! 👋</h2>
            <p className="text-purple-100 text-lg mb-6">You have {stats.upcoming} upcoming meetings and {stats.inProgress} in progress.</p>
            <button
              onClick={() => setShowNewMeetingModal(true)}
              className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Schedule New Meeting</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-purple-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</h3>
            <p className="text-sm text-gray-600 font-medium">Total Meetings</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-blue-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">+5%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.upcoming}</h3>
            <p className="text-sm text-gray-600 font-medium">Upcoming</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-green-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center ${stats.inProgress > 0 ? 'animate-pulse' : ''}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.inProgress}</h3>
            <p className="text-sm text-gray-600 font-medium">In Progress</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-gray-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">+23%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.completed}</h3>
            <p className="text-sm text-gray-600 font-medium">Completed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {['overview', 'meetings', 'analytics', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search meetings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">Recent Meetings</h3>
                  {filteredMeetings.length > 0 ? (
                    filteredMeetings.map((meeting) => {
                      const statusColors = {
                        scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
                        'in-progress': 'bg-green-100 text-green-700 border-green-200',
                        completed: 'bg-gray-100 text-gray-700 border-gray-200',
                      };

                      const formatDate = (dateStr) => {
                        const now = new Date();
                        const meetingDate = new Date(dateStr);
                        const isToday = meetingDate.toDateString() === now.toDateString();
                        
                        if (isToday) {
                          return `Today at ${meetingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                        }
                        return meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                      };

                      return (
                        <div key={meeting.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900 mb-1">{meeting.title}</h4>
                              <p className="text-sm text-gray-600">{formatDate(meeting.scheduledAt)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[meeting.status] || statusColors.scheduled}`}>
                              {(meeting.status || 'scheduled').replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{meeting.duration} min</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span>{Array.isArray(meeting.participants) ? meeting.participants.length : 0} people</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <p className="text-gray-500">No meetings found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'meetings' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">All Meetings</h3>
                {meetings.length > 0 ? (
                  meetings.map((meeting) => (
                    <div key={meeting.id} className="p-4 border border-gray-200 rounded-lg">
                      <p className="font-semibold">{meeting.title}</p>
                      <p className="text-sm text-gray-600">{meeting.description || 'No description'}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No meetings yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <CalendarIntegrationSection />
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Settings</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input type="text" defaultValue={user?.firstName} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input type="text" defaultValue={user?.lastName} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" defaultValue={user?.email} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                    </div>
                    <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Meeting Modal */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Schedule New Meeting</h3>
              <button onClick={() => setShowNewMeetingModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <input
                type="text"
                placeholder="Meeting Title"
                value={newMeeting.title}
                onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="datetime-local"
                value={newMeeting.date}
                onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                placeholder="Duration (e.g., 60 min)"
                value={newMeeting.duration}
                onChange={(e) => setNewMeeting({...newMeeting, duration: e.target.value})}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              ></textarea>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Create Meeting
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;