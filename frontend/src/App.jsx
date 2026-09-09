import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import TakeQuiz from './pages/TakeQuiz';
import { Client } from '@stomp/stompjs';
import { Toaster, toast } from 'react-hot-toast';

/**
 * Manages the browser tab title and favicon dynamically.
 */
function DynamicTabManager() {
  const location = useLocation();

  useEffect(() => {
    const isBackend = location.pathname.startsWith('/admin');
    document.title = isBackend ? 'QuizMaster - Backend' : 'QuizMaster - Frontend';
    
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = isBackend ? '/backend-logo.svg' : '/frontend-logo.svg';
  }, [location]);

  return null;
}

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

  // Establish WebSocket connection when user is logged in
  useEffect(() => {
    if (!user || !user.token) return;

    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: {
        Authorization: `Bearer ${user.token}`
      },
      debug: function (str) {
        console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function (frame) {
      console.log('Connected: ' + frame);
      
      // Subscribe to personal notification queue
      client.subscribe('/user/queue/notifications', (message) => {
        if (message.body) {
          const notification = JSON.parse(message.body);
          // Rung chuông, pop-up
          toast.success(notification.message, {
            duration: 5000,
            position: 'top-right',
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
          });
        }
      });
    };

    client.onStompError = function (frame) {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [user]);

  return (
    <BrowserRouter>
      <DynamicTabManager />
      <Toaster />
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
