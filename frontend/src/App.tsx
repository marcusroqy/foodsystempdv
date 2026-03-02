import { type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';

import { DashboardLayout } from './components/DashboardLayout';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { Team } from './pages/Team';
import { OrdersHistory } from './pages/OrdersHistory';
import { Kitchen } from './pages/Kitchen';

const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Sessão...</div>;
  return isAuthenticated ? (
    <>
      {mustChangePassword && <ForcePasswordChangeModal />}
      <DashboardLayout>{children}</DashboardLayout>
    </>
  ) : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: ReactElement }) => {
  const { user, isAuthenticated, isLoading, mustChangePassword } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Sessão...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  const adminRoles = ['OWNER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  const isAdmin = user?.role ? adminRoles.includes(user.role) : false;

  return isAdmin ? (
    <>
      {mustChangePassword && <ForcePasswordChangeModal />}
      <DashboardLayout>{children}</DashboardLayout>
    </>
  ) : <Navigate to="/pdv" />;
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
          <AdminRoute>
            <Team />
          </AdminRoute>
        }
      />
      <Route
        path="/historico"
        element={
          <PrivateRoute>
            <OrdersHistory />
          </PrivateRoute>
        }
      />
      <Route
        path="/cozinha"
        element={
          <PrivateRoute>
            <Kitchen />
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
