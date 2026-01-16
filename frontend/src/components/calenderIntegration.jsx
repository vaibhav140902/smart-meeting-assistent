import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Plus, RefreshCw, Link, AlertCircle } from 'lucide-react';

// This component shows what you need to add to your Settings page
const CalendarIntegrationSettings = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [syncedEvents, setSyncedEvents] = useState(0);

  const API_URL = 'http://localhost:5001'; // Your backend URL

  // Check if calendar is already connected
  useEffect(() => {
    const tokens = localStorage.getItem('calendar_tokens');
    if (tokens) {
      setIsConnected(true);
      loadSyncedEvents();
    }
  }, []);

  // Function to initiate Google Calendar connection
  const connectCalendar = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/calendar/auth`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Redirect user to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate calendar connection:', error);
      alert('Failed to connect calendar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sync events from Google Calendar
  const syncCalendarEvents = async () => {
    setSyncStatus('syncing');
    try {
      const tokens = localStorage.getItem('calendar_tokens');
      
      if (!tokens) {
        alert('Please connect your calendar first');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/calendar/events?tokens=${encodeURIComponent(tokens)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setSyncedEvents(data.count);
        setLastSync(new Date());
        setSyncStatus('success');
        
        // Here you would typically update your meetings list
        // For example: updateMeetingsList(data.events);
        
        setTimeout(() => setSyncStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  };

  // Function to disconnect calendar
  const disconnectCalendar = () => {
    if (('Are you sure you want to disconnect your calendar?')) {
      localStorage.removeItem('calendar_tokens');
      setIsConnected(false);
      setSyncedEvents(0);
      setLastSync(null);
    }
  };

  // Mock function - you'll replace this with actual API call
  const loadSyncedEvents = async () => {
    // This would fetch your synced meetings count
    setSyncedEvents(4); // Example
    setLastSync(new Date());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar Integration</h1>
          <p className="text-gray-600">
            Connect your Google Calendar to automatically sync meetings
          </p>
        </div>

        {/* Connection Status Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isConnected ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <Calendar className={isConnected ? 'text-green-600' : 'text-gray-400'} size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Google Calendar</h3>
                <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {isConnected ? '✓ Connected' : 'Not connected'}
                </p>
              </div>
            </div>

            {!isConnected ? (
              <button
                onClick={connectCalendar}
                disabled={isLoading}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link size={20} />
                    Connect Calendar
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={disconnectCalendar}
                className="bg-red-100 text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-red-200 transition"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Connection Details */}
          {isConnected && (
            <div className="border-t pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Synced Events</p>
                  <p className="text-2xl font-bold text-gray-900">{syncedEvents}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Last Sync</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {lastSync ? lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </p>
                </div>
              </div>

              <button
                onClick={syncCalendarEvents}
                disabled={syncStatus === 'syncing'}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Syncing...
                  </>
                ) : syncStatus === 'success' ? (
                  <>
                    <CheckCircle size={20} />
                    Synced Successfully!
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <AlertCircle size={20} />
                    Sync Failed
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Sync Now
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">How it works</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Connect Your Calendar</h4>
                <p className="text-gray-600 text-sm">Authorize Smart Meeting Assistant to access your Google Calendar</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600 font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Automatic Sync</h4>
                <p className="text-gray-600 text-sm">Your calendar events automatically appear in the app</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600 font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">AI-Powered Insights</h4>
                <p className="text-gray-600 text-sm">Get smart summaries and action items for all your meetings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Note */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-blue-900 mb-2">For Developers:</h4>
              <p className="text-blue-800 text-sm mb-2">
                To integrate this into your existing app, add this component to your Settings page and:
              </p>
              <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                <li>Add the CalendarCallback.jsx route to handle OAuth redirects</li>
                <li>Update your .env file with Google Calendar API credentials</li>
                <li>Make sure your backend routes match the API_URL</li>
                <li>Call syncCalendarEvents() after user connects their calendar</li>
                <li>Update your meetings list component to display synced events</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarIntegrationSettings;