import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TerraformPlayground from './pages/TerraformPlayground';
import DockerPlayground from './pages/DockerPlayground';
import KubernetesPlayground from './pages/KubernetesPlayground';
import ScriptingPlayground from './pages/ScriptingPlayground';
import MonitoringPlayground from './pages/MonitoringPlayground';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playground/terraform"
              element={
                <ProtectedRoute>
                  <TerraformPlayground />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playground/docker"
              element={
                <ProtectedRoute>
                  <DockerPlayground />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playground/kubernetes"
              element={
                <ProtectedRoute>
                  <KubernetesPlayground />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playground/scripting"
              element={
                <ProtectedRoute>
                  <ScriptingPlayground />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playground/monitoring"
              element={
                <ProtectedRoute>
                  <MonitoringPlayground />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
