import React, { useState } from 'react';
import { useMeeting } from '../../hooks/useMeeting';
import { 
  Video, Calendar, Clock, Users, FileText, Mic, 
  Loader2, Plus, Search, ArrowRight, CheckCircle, 
  Circle, AlertCircle 
} from 'lucide-react';

// Meeting Card Component
const MeetingCard = ({ meeting }) => {
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
            <p className="text-sm font-semibold text-gray-900">{meeting.duration || 'N/A'}</p>
          </div>
          <div className="text-center">
            <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Participants</p>
            <p className="text-sm font-semibold text-gray-900">{meeting.participants || 0}</p>
          </div>
          <div className="text-center">
            <FileText className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <p className="text-xs text-gray-500">Action Items</p>
            <p className="text-sm font-semibold text-gray-900">{meeting.actionItems || 0}</p>
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

// Main Dashboard Component
const Dashboard = () => {
  const { meetings, loading } = useMeeting();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Calculate stats
  const stats = [
    { 
      label: 'Total Meetings', 
      value: meetings?.length || 0, 
      icon: Calendar, 
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    },
    { 
      label: 'Active Now', 
      value: meetings?.filter(m => m.status === 'in-progress').length || 0, 
      icon: Circle, 
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    { 
      label: 'Scheduled', 
      value: meetings?.filter(m => m.status === 'scheduled').length || 0, 
      icon: Clock, 
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    { 
      label: 'Action Items', 
      value: meetings?.reduce((sum, m) => sum + (m.actionItems || 0), 0) || 0, 
      icon: AlertCircle, 
      color: 'purple',
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

            {/* Filter & Actions */}
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
              <p className="text-gray-600">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first meeting to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;