import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard';
import { 
  Video, Calendar, Clock, Users, FileText, Mic, 
  Loader2, Plus, Search, ArrowRight, CheckCircle, 
  Circle, AlertCircle 
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Meeting Card Component
const MeetingCard = ({ meeting, onClick }) => {
  const statusConfig = {
    scheduled: { color: 'blue', icon: Clock, label: 'Scheduled' },
    'in-progress': { color: 'green', icon: Circle, label: 'Live' },
    completed: { color: 'gray', icon: CheckCircle, label: 'Completed' }
  };

  const status = statusConfig[meeting.status] || statusConfig.scheduled;
  const StatusIcon = status.icon;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
              {meeting.title}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(meeting.scheduledAt || meeting.startTime)}
            </div>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            status.color === 'blue' ? 'bg-blue-100 text-blue-700' :
            status.color === 'green' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            <StatusIcon className={`w-3 h-3 mr-1 ${status.color === 'green' ? 'animate-pulse' : ''}`} />
            {status.label}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="text-center">
            <Clock className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-semibold text-gray-900">{meeting.duration || 'N/A'} min</p>
          </div>
          <div className="text-center">
            <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Participants</p>
            <p className="text-sm font-semibold text-gray-900">
              {Array.isArray(meeting.participants) ? meeting.participants.length : 0}
            </p>
          </div>
          <div className="text-center">
            <FileText className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Action Items</p>
            <p className="text-sm font-semibold text-gray-900">
              {Array.isArray(meeting.actionItems) ? meeting.actionItems.length : 0}
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex items-center gap-3 flex-wrap">
          {meeting.recordingUrl && (
            <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
              <Video className="w-3 h-3 mr-1" />
              Recorded
            </span>
          )}
          {meeting.transcript && (
            <span className="inline-flex items-center text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-md">
              <FileText className="w-3 h-3 mr-1" />
              Transcript
            </span>
          )}
          {meeting.status === 'in-progress' && (
            <span className="inline-flex items-center text-xs text-red-700 bg-red-50 px-2 py-1 rounded-md animate-pulse">
              <Mic className="w-3 h-3 mr-1" />
              Recording
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-100">
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center group-hover:gap-2 transition-all">
          View Details
          <ArrowRight className="w-4 h-4 ml-0 group-hover:ml-1 transition-all" />
        </button>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    duration: '60',
    description: ''
  });

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
      console.error('Fetch user error:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/meetings?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMeetings(response.data.meetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  const handleCreateMeeting = async (e) => {
  e.preventDefault();
  
  console.log('🚀 Creating meeting...');
  console.log('Form data:', newMeeting);
  
  try {
    const token = localStorage.getItem('token');
    const durationValue = parseInt(newMeeting.duration) || 60;
    
    const payload = {
      title: newMeeting.title,
      description: newMeeting.description,
      scheduledAt: new Date(newMeeting.date).toISOString(),
      duration: durationValue,
      participants: [],
    };
    
    console.log('📤 Sending payload:', payload);
    console.log('📤 API URL:', `${API_URL}/api/meetings`);
    console.log('📤 Token exists:', !!token);
    
    const response = await axios.post(
      `${API_URL}/api/meetings`,
      payload,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Response received:', response.data);

    if (response.data.success) {
      console.log('✅ Meeting created successfully:', response.data.meeting);
      
      // Add new meeting to local state
      setMeetings([...meetings, response.data.meeting]);
      
      // Close modal and reset form
      setShowNewMeetingModal(false);
      setNewMeeting({ title: '', date: '', duration: '60', description: '' });
      
      alert('Meeting created successfully!');
      
      // Refresh meetings list to be sure
      fetchMeetings();
    } else {
      console.error('❌ Response not successful:', response.data);
      alert('Failed to create meeting: ' + response.data.message);
    }
  } catch (error) {
    console.error('❌ Error creating meeting:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    alert('Failed to create meeting. Check console for details.');
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

  // Calculate stats
  const stats = [
    { 
      label: 'Total Meetings', 
      value: meetings?.length || 0, 
      icon: Calendar, 
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    },
    { 
      label: 'Active Now', 
      value: meetings?.filter(m => m.status === 'in-progress').length || 0, 
      icon: Circle, 
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    { 
      label: 'Scheduled', 
      value: meetings?.filter(m => m.status === 'scheduled').length || 0, 
      icon: Clock, 
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Action Items', 
      value: meetings?.reduce((sum, m) => {
        const items = Array.isArray(m.actionItems) ? m.actionItems : [];
        return sum + items.length;
      }, 0) || 0, 
      icon: AlertCircle, 
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    }
  ];

  // Filter meetings
  const filteredMeetings = meetings?.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || meeting.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Smart Meeting Assistant</h1>
                <p className="text-xs text-gray-500">AI-powered intelligence</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.fullName} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  {user?.firstName?.[0] || 'U'}
                </div>
              )}
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="border-b border-gray-200 px-6">
            <nav className="flex space-x-8">
              {['overview', 'meetings', 'analytics', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${stat.textColor}`} />
                          </div>
                          <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Actions Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search meetings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>

                      <button 
                        onClick={() => setShowNewMeetingModal(true)}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center whitespace-nowrap"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        New Meeting
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meetings Grid */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Meetings</h2>
                  {filteredMeetings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMeetings.map((meeting) => (
                        <MeetingCard 
                          key={meeting.id} 
                          meeting={meeting}
                          onClick={() => navigate(`/meeting/${meeting.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings found</h3>
                      <p className="text-gray-600">
                        {searchQuery || filterStatus !== 'all' 
                          ? 'Try adjusting your search or filters' 
                          : 'Create your first meeting to get started'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meetings Tab */}
            {activeTab === 'meetings' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">All Meetings</h3>
                {meetings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {meetings.map((meeting) => (
                      <MeetingCard 
                        key={meeting.id} 
                        meeting={meeting}
                        onClick={() => navigate(`/meeting/${meeting.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">No meetings yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <AnalyticsDashboard />
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Profile Settings</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input 
                          type="text" 
                          defaultValue={user?.firstName} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          defaultValue={user?.lastName} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        defaultValue={user?.email} 
                        disabled 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" 
                      />
                    </div>
                    <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700">
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
              <button 
                onClick={() => setShowNewMeetingModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
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
                type="number"
                placeholder="Duration in minutes"
                value={newMeeting.duration}
                onChange={(e) => setNewMeeting({...newMeeting, duration: e.target.value})}
                required
                min="1"
                max="480"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={newMeeting.description}
                onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700"
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