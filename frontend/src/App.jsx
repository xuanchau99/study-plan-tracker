import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TakeQuiz from './pages/TakeQuiz';

/**
 * Main Application Component.
 * Handles global routing and authentication state management.
 */
function App() {
  // Initialize the user state by attempting to read JWT and role from LocalStorage
  const [user, setUser] = useState(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && role) {
      return { role, token, username };
    }
    return null;
  });

  return (
    <BrowserRouter>
      <Routes>
        {/* Root Redirect: Directs users to the appropriate dashboard based on their role */}
        <Route path="/" element={<Navigate to={user ? (user.role === 'ADMIN' ? '/admin' : '/user') : '/login'} />} />
        
        {/* Public Login Route */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        {/* Protected Admin Routes: Only accessible if user has ADMIN role */}
        <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminDashboard user={user} setUser={setUser}/> : <Navigate to="/login" />} />
        
        {/* Protected User Routes: Accessible by USER and ADMIN (for testing) */}
        <Route path="/user" element={user?.role === 'USER' || user?.role === 'ADMIN' ? <UserDashboard user={user} setUser={setUser}/> : <Navigate to="/login" />} />
        
        {/* Exam interface */}
        <Route path="/quiz/:id" element={user ? <TakeQuiz user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
