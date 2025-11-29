import React, { useState } from 'react';
import { Video, Calendar, Clock, Users, FileText, Mic, LogOut, Mail, Lock, Loader2, Plus, Search, ArrowRight, CheckCircle, Circle, AlertCircle } from 'lucide-react';

// Mock Auth Hook
const useAuth = () => {
  const [user, setUser] = useState({ email: 'demo@meeting.ai', name: 'Demo User' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email, password) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUser({ email, name: email.split('@')[0] });
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return { user, handleLogin, handleLogout, loading };
};

// Mock Meeting Hook
const useMeeting = () => {
  const [meetings] = useState([
    {
      id: 1,
      title: 'Q4 Strategy Planning',
      status: 'scheduled',
      startTime: '2024-11-28T14:00:00',
      duration: '60 min',
      participants: 8,
      hasRecording: false,
      hasTranscript: false,
      actionItems: 0
    },
    {
      id: 2,
      title: 'Product Roadmap Review',
      status: 'completed',
      startTime: '2024-11-27T10:00:00',
      duration: '45 min',
      participants: 5,
      hasRecording: true,
      hasTranscript: true,
      actionItems: 7
    },
    {
      id: 3,
      title: 'Weekly Team Sync',
      status: 'in-progress',
      startTime: '2024-11-28T09:00:00',
      duration: '30 min',
      participants: 12,
      hasRecording: true,
      hasTranscript: true,
      actionItems: 3
    },
    {
      id: 4,
      title: 'Client Presentation',
      status: 'scheduled',
      startTime: '2024-11-29T15:00:00',
      duration: '90 min',
      participants: 6,
      hasRecording: false,
      hasTranscript: false,
      actionItems: 0
    },
    {
      id: 5,
      title: 'Design Sprint Planning',
      status: 'completed',
      startTime: '2024-11-26T13:00:00',
      duration: '120 min',
      participants: 10,
      hasRecording: true,
      hasTranscript: true,
      actionItems: 15
    },
    {
      id: 6,
      title: 'Engineering Stand-up',
      status: 'scheduled',
      startTime: '2024-11-28T16:30:00',
      duration: '15 min',
      participants: 15,
      hasRecording: false,
      hasTranscript: false,
      actionItems: 0
    }
  ]);

  return { meetings, loading: false };
};

// Login Component
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { handleLogin, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(email, password);
    onLogin();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Meeting Assistant</h1>
          <p className="text-gray-600">AI-powered meeting intelligence</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome back</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <span className="ml-2 text-gray-600">Remember me</span>
              </label>
              <button 
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <button 
              type="button"
              onClick={(e) => e.preventDefault()}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs text-blue-800 text-center">
            <strong>Demo:</strong> Use any email/password to login
          </p>
        </div>
      </div>
    </div>
  );
};

// Header Component
const Header = ({ user, onLogout }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mr-3">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Meeting Assistant</h1>
              <p className="text-xs text-gray-500">AI-powered intelligence</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Demo User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
              {(user?.name || 'D')[0].toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Meeting Card Component
const MeetingCard = ({ meeting }) => {
  const statusConfig = {
    scheduled: { color: 'blue', icon: Clock, label: 'Scheduled' },
    'in-progress': { color: 'green', icon: Circle, label: 'Live' },
    completed: { color: 'gray', icon: CheckCircle, label: 'Completed' }
  };

  const status = statusConfig[meeting.status];
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
    <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">
              {meeting.title}
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(meeting.startTime)}
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
            <p className="text-sm font-semibold text-gray-900">{meeting.duration}</p>
          </div>
          <div className="text-center">
            <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Participants</p>
            <p className="text-sm font-semibold text-gray-900">{meeting.participants}</p>
          </div>
          <div className="text-center">
            <FileText className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Action Items</p>
            <p className="text-sm font-semibold text-gray-900">{meeting.actionItems}</p>
          </div>
        </div>

        {/* Features */}
        <div className="flex items-center gap-3 flex-wrap">
          {meeting.hasRecording && (
            <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md">
              <Video className="w-3 h-3 mr-1" />
              Recorded
            </span>
          )}
          {meeting.hasTranscript && (
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

// Dashboard Component
const Dashboard = () => {
  const { meetings, loading } = useMeeting();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const stats = [
    { 
      label: 'Total Meetings', 
      value: meetings.length, 
      icon: Calendar, 
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    },
    { 
      label: 'Active Now', 
      value: meetings.filter(m => m.status === 'in-progress').length, 
      icon: Circle, 
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    { 
      label: 'Scheduled', 
      value: meetings.filter(m => m.status === 'scheduled').length, 
      icon: Clock, 
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Action Items', 
      value: meetings.reduce((sum, m) => sum + m.actionItems, 0), 
      icon: AlertCircle, 
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    }
  ];

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || meeting.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
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
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center whitespace-nowrap">
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
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { user } = useAuth();

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={() => setIsLoggedIn(false)} />
      <Dashboard />
    </div>
  );
}