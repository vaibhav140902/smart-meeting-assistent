import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Assuming you have a way to set the user state or token globally (e.g., Context, Redux, Zustand)
// Placeholder for a hook that handles user context/login state
const useAuth = () => ({
    loginSuccess: (token) => {
        console.log('Token received:', token);
        // In a real app, this would store the token (e.g., in localStorage or an HttpOnly cookie)
        // and update global user state.
    }
});

const AuthCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { loginSuccess } = useAuth();
    const [status, setStatus] = useState('Processing authentication...');

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token'); // Assuming your backend sends the JWT via a 'token' query parameter

        if (token) {
            setStatus('Authentication successful! Redirecting...');
            
            // 1. Process the token (store it, update state)
            loginSuccess(token);

            // 2. Redirect the user to the dashboard or home page
            // Use a short delay for the user to see the success message
            const redirectTimer = setTimeout(() => {
                navigate('/dashboard', { replace: true });
            }, 1500);

            return () => clearTimeout(redirectTimer);
        } else {
            // Handle errors or missing token
            const error = urlParams.get('error') || 'Authentication failed.';
            setStatus(`Error: ${error}. Redirecting to login.`);
            
            const errorTimer = setTimeout(() => {
                navigate('/login', { replace: true });
            }, 3000);
            
            return () => clearTimeout(errorTimer);
        }
    }, [location, navigate, loginSuccess]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm text-center border-t-4 border-indigo-500">
                <div className="mb-4">
                    <svg className="mx-auto h-12 w-12 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Status</h1>
                <p className={`text-md ${status.startsWith('Error') ? 'text-red-500' : 'text-gray-600'}`}>
                    {status}
                </p>
            </div>
        </div>
    );
};

export default AuthCallback;