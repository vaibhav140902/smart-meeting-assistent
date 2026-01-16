import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Calendar, Clock, Users, CheckSquare,
  AlertCircle, Brain, Zap, Target, Download, Filter, RefreshCw
} from 'lucide-react';

// KPI Card Component
const KPICard = ({ title, value, change, changeType, icon: Icon, gradient, trend }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center`}>
        <Icon size={24} />
      </div>
      {change && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${
          changeType === 'positive' ? 'text-green-100' : 'text-red-100'
        }`}>
          {changeType === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {change}%
        </div>
      )}
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm opacity-90">{title}</div>
    {trend && <div className="text-xs mt-2 opacity-75">{trend}</div>}
  </div>
);

// Chart Card Wrapper
const ChartCard = ({ title, children, action }) => (
  <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// AI Insight Card
const InsightCard = ({ type, message, icon: Icon }) => {
  const styles = {
    recommendation: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    achievement: 'bg-green-50 border-green-200 text-green-900'
  };

  return (
    <div className={`${styles[type]} border-2 rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

// Main Analytics Dashboard
const AnalyticsDashboard = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [refreshing, setRefreshing] = useState(false);

  // Fetch meetings data
  useEffect(() => {
    fetchMeetings();
  }, [dateRange]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const fetchMeetings = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    console.log('🔍 Analytics: Fetching meetings...');
    console.log('Token exists:', !!token);
    console.log('API URL:', 'http://localhost:5001/api/meetings');
    
    const response = await fetch(`http://localhost:5001/api/meetings?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response not OK:', errorText);
      throw new Error('Failed to fetch meetings');
    }

    const data = await response.json();
    
    console.log('📊 Full API Response:', data);
    console.log('Meetings array:', data.meetings);
    console.log('Number of meetings:', data.meetings?.length || 0);
    
    if (data.success) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));
      
      console.log('Date range:', dateRange, 'days');
      console.log('Cutoff date:', cutoffDate);
      
      const filtered = data.meetings.filter(m => {
        const meetingDate = new Date(m.scheduledAt);
        console.log('Meeting:', m.title, 'Date:', meetingDate, 'Pass filter:', meetingDate >= cutoffDate);
        return meetingDate >= cutoffDate;
      });
      
      console.log('✅ Filtered meetings count:', filtered.length);
      console.log('Filtered meetings:', filtered);
      
      setMeetings(filtered);
    }
  } catch (error) {
    console.error('❌ Error fetching meetings:', error);
    console.error('Error details:', error.message);
  } finally {
    setLoading(false);
  }
};
      const response = await fetch(`http://localhost:5001/api/meetings?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch meetings');

      const data = await response.json();
      if (data.success) {
        // Filter by date range
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));
        
        const filtered = data.meetings.filter(m => 
          new Date(m.scheduledAt) >= cutoffDate
        );
        
        setMeetings(filtered);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMeetings();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate Analytics
  const analytics = useMemo(() => {
    if (!meetings.length) return null;

    const now = new Date();
    const completed = meetings.filter(m => m.status === 'completed');
    const scheduled = meetings.filter(m => m.status === 'scheduled');
    const inProgress = meetings.filter(m => m.status === 'in-progress');

    // Total duration
    const totalDuration = completed.reduce((sum, m) => sum + (m.duration || 0), 0);
    const avgDuration = completed.length ? Math.round(totalDuration / completed.length) : 0;

    // Action items
    const totalActionItems = meetings.reduce((sum, m) => {
      const items = Array.isArray(m.actionItems) ? m.actionItems : [];
      return sum + items.length;
    }, 0);

    const completedActionItems = meetings.reduce((sum, m) => {
      const items = Array.isArray(m.actionItems) ? m.actionItems : [];
      return sum + items.filter(item => item.completed).length;
    }, 0);

    const completionRate = totalActionItems ? Math.round((completedActionItems / totalActionItems) * 100) : 0;

    // Time saved (estimate: 15 min per meeting via AI summaries)
    const timeSaved = completed.length * 15;

    // Meeting frequency (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const frequencyData = last7Days.map(date => {
      const count = meetings.filter(m => 
        m.scheduledAt.startsWith(date)
      ).length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        meetings: count
      };
    });

    // Status distribution
    const statusData = [
      { name: 'Completed', value: completed.length, color: '#10B981' },
      { name: 'Scheduled', value: scheduled.length, color: '#3B82F6' },
      { name: 'In Progress', value: inProgress.length, color: '#F59E0B' }
    ].filter(item => item.value > 0);

    // Duration distribution
    const durationBuckets = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0
    };

    completed.forEach(m => {
      const duration = m.duration || 0;
      if (duration <= 30) durationBuckets['0-30']++;
      else if (duration <= 60) durationBuckets['31-60']++;
      else if (duration <= 90) durationBuckets['61-90']++;
      else durationBuckets['90+']++;
    });

    const durationData = Object.entries(durationBuckets).map(([range, count]) => ({
      range: `${range} min`,
      count
    }));

    // Calculate trends (compare with previous period)
    const halfwayPoint = Math.floor(meetings.length / 2);
    const recentMeetings = meetings.slice(0, halfwayPoint);
    const olderMeetings = meetings.slice(halfwayPoint);

    const recentAvgDuration = recentMeetings.reduce((sum, m) => sum + (m.duration || 0), 0) / recentMeetings.length || 0;
    const olderAvgDuration = olderMeetings.reduce((sum, m) => sum + (m.duration || 0), 0) / olderMeetings.length || 0;
    
    const durationTrend = olderAvgDuration ? ((recentAvgDuration - olderAvgDuration) / olderAvgDuration * 100).toFixed(1) : 0;

    // Productivity score (composite of completion rate, avg duration, frequency)
    const targetDuration = 45; // optimal meeting length
    const durationScore = Math.max(0, 100 - Math.abs(avgDuration - targetDuration));
    const completionScore = completionRate;
    const frequencyScore = Math.min(100, (meetings.length / parseInt(dateRange)) * 100);
    
    const productivityScore = ((durationScore + completionScore + frequencyScore) / 3).toFixed(1);

    return {
      kpis: {
        totalMeetings: meetings.length,
        avgDuration,
        completionRate,
        timeSaved: (timeSaved / 60).toFixed(1),
        durationTrend,
        productivityScore
      },
      charts: {
        frequency: frequencyData,
        status: statusData,
        duration: durationData
      }
    };
  }, [meetings, dateRange]);

  // AI Insights
  const insights = useMemo(() => {
    if (!analytics) return [];

    const results = [];

    // Duration insight
    if (analytics.kpis.avgDuration > 60) {
      results.push({
        type: 'warning',
        icon: Clock,
        message: `Your average meeting duration is ${analytics.kpis.avgDuration} minutes. Consider shortening meetings to improve efficiency.`
      });
    } else if (analytics.kpis.avgDuration < 30) {
      results.push({
        type: 'recommendation',
        icon: Target,
        message: 'Your meetings are brief! Consider if all agenda items are being covered adequately.'
      });
    }

    // Completion rate insight
    if (analytics.kpis.completionRate >= 80) {
      results.push({
        type: 'achievement',
        icon: CheckSquare,
        message: `Excellent! ${analytics.kpis.completionRate}% action item completion rate. Keep up the great work!`
      });
    } else if (analytics.kpis.completionRate < 60) {
      results.push({
        type: 'warning',
        icon: AlertCircle,
        message: `Only ${analytics.kpis.completionRate}% of action items are completed. Review follow-up processes.`
      });
    }

    // Time saved insight
    if (analytics.kpis.timeSaved > 5) {
      results.push({
        type: 'achievement',
        icon: Zap,
        message: `AI summaries saved you ${analytics.kpis.timeSaved} hours this month! That's equivalent to ${Math.round(analytics.kpis.timeSaved / 8)} work days.`
      });
    }

    return results;
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Start creating meetings to see analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 text-sm mt-1">
            Showing data from last {dateRange} days
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center gap-2">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Meetings"
          value={analytics.kpis.totalMeetings}
          change={12}
          changeType="positive"
          icon={Calendar}
          gradient="from-indigo-500 to-indigo-600"
          trend="vs last period"
        />
        
        <KPICard
          title="Avg Duration"
          value={`${analytics.kpis.avgDuration}m`}
          change={Math.abs(analytics.kpis.durationTrend)}
          changeType={analytics.kpis.durationTrend < 0 ? 'positive' : 'negative'}
          icon={Clock}
          gradient="from-purple-500 to-purple-600"
          trend={`${analytics.kpis.durationTrend > 0 ? '+' : ''}${analytics.kpis.durationTrend}% vs last period`}
        />
        
        <KPICard
          title="Completion Rate"
          value={`${analytics.kpis.completionRate}%`}
          change={7}
          changeType="positive"
          icon={CheckSquare}
          gradient="from-green-500 to-green-600"
          trend="action items"
        />
        
        <KPICard
          title="Time Saved"
          value={`${analytics.kpis.timeSaved}h`}
          icon={Zap}
          gradient="from-orange-500 to-orange-600"
          trend="via AI summaries"
        />
      </div>

      {/* Productivity Score */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target size={32} />
              <h3 className="text-2xl font-bold">Productivity Score</h3>
            </div>
            <p className="text-indigo-100">Based on meeting efficiency, completion rate, and frequency</p>
          </div>
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">{analytics.kpis.productivityScore}</div>
            <div className="text-xl">/100</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Meeting Frequency */}
        <ChartCard title="Meeting Frequency (Last 7 Days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.charts.frequency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="meetings" 
                stroke="#6366F1" 
                strokeWidth={3}
                dot={{ fill: '#6366F1', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard title="Meeting Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.charts.status}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.charts.status.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Duration Distribution */}
        <ChartCard title="Meeting Duration Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.charts.duration}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="range" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* AI Insights */}
        <ChartCard title="AI-Powered Insights">
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <InsightCard key={index} {...insight} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Gathering insights... Create more meetings to see personalized recommendations.</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;