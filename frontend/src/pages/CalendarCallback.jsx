import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const CalendarCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Connecting your calendar...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('Failed to connect calendar. Please try again.');
      setTimeout(() => navigate('/meetings'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received.');
      setTimeout(() => navigate('/meetings'), 3000);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/api/calendar/oauth/callback?code=${code}`
      );

      if (response.data.success) {
        // Store tokens in localStorage
        localStorage.setItem('calendar_tokens', JSON.stringify(response.data.tokens));
        
        setStatus('success');
        setMessage('Calendar connected successfully!');
        
        setTimeout(() => navigate('/meetings'), 2000);
      } else {
        setStatus('error');
        setMessage('Failed to connect calendar.');
        setTimeout(() => navigate('/meetings'), 3000);
      }
    } catch (error) {
      console.error('Calendar callback error:', error);
      setStatus('error');
      setMessage('An error occurred. Please try again.');
      setTimeout(() => navigate('/meetings'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-gray-600">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-gray-600">Redirecting to meetings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{message}</h2>
            <p className="text-gray-600">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarCallback;