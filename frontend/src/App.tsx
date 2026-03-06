import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DeliveryProvider } from './contexts/DeliveryContext';
import { Login } from './pages/Login';

import { DashboardLayout } from './components/DashboardLayout';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { Team } from './pages/Team';
import { OrdersHistory } from './pages/OrdersHistory';
import { Kitchen } from './pages/Kitchen';
import { DeliveryDriver } from './pages/DeliveryDriver';

const PrivateLayout = () => {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Sessão...</div>;
  return isAuthenticated ? (
    <>
      {mustChangePassword && <ForcePasswordChangeModal />}
      <DashboardLayout />
    </>
  ) : <Navigate to="/login" />;
};

const AdminLayout = () => {
  const { user, isAuthenticated, isLoading, mustChangePassword } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Sessão...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  const adminRoles = ['OWNER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  const isAdmin = user?.role ? adminRoles.includes(user.role) : false;

  return isAdmin ? (
    <>
      {mustChangePassword && <ForcePasswordChangeModal />}
      <DashboardLayout />
    </>
  ) : <Navigate to="/pdv" />;
};

const DashboardRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 text-primary-500 font-bold">Carregando Sessão...</div>;
  return isAuthenticated ? <Navigate to="/pdv" /> : <Navigate to="/login" />;
};

import { PDV } from './pages/PDV';
import { DeliveryApp } from './pages/Delivery/DeliveryApp';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<DashboardRedirect />} />

      {/* Rota do App de Delivery */}
      <Route path="/d/:slug/*" element={
        <DeliveryProvider>
          <DeliveryApp />
        </DeliveryProvider>
      } />

      {/* Rotas Privadas */}
      <Route element={<PrivateLayout />}>
        <Route path="/pdv" element={<PDV />} />
        <Route path="/estoque" element={<Inventory />} />
        <Route path="/financeiro" element={<Finance />} />
        <Route path="/historico" element={<OrdersHistory />} />
        <Route path="/cozinha" element={<Kitchen />} />
        <Route path="/entregador" element={<DeliveryDriver />} />
      </Route>

      {/* Rotas Administrativas */}
      <Route element={<AdminLayout />}>
        <Route path="/equipe" element={<Team />} />
      </Route>
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
