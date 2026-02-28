import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';

import { DashboardLayout } from './components/DashboardLayout';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { Team } from './pages/Team';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Sessão...</div>;
  return isAuthenticated ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" />;
};

const DashboardRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Sessão...</div>;
  return isAuthenticated ? <Navigate to="/pdv" /> : <Navigate to="/login" />;
};

import { PDV } from './pages/PDV';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<DashboardRedirect />} />

      {/* Rotas Privadas */}
      <Route
        path="/pdv"
        element={
          <PrivateRoute>
            <PDV />
          </PrivateRoute>
        }
      />
      <Route
        path="/estoque"
        element={
          <PrivateRoute>
            <Inventory />
          </PrivateRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <PrivateRoute>
            <Finance />
          </PrivateRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <PrivateRoute>
            <Finance />
          </PrivateRoute>
        }
      />
      <Route
        path="/equipe"
        element={
          <PrivateRoute>
            <Team />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
