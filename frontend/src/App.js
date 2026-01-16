import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import CalendarCallback from './pages/CalendarCallback';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/api/calendar/oauth/callback" element={<CalendarCallback />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;