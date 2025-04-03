import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

const App = () => {
  const { user, loading } = useContext(AuthContext);

  const PrivateRoute = ({ children }) => {
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <ProfileProvider>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/signup" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </ProfileProvider>
    </Router>
  );
};

export default App;