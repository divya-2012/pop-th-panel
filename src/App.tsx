import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getUser } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import LiveOrders from './pages/LiveOrders';
import SeatsQr from './pages/SeatsQr';
import Staff from './pages/Staff';
import PrintQr from './pages/PrintQr';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = getUser();
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/orders" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['THEATRE_ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/menu" element={
          <ProtectedRoute allowedRoles={['THEATRE_ADMIN']}>
            <MenuManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <LiveOrders />
          </ProtectedRoute>
        } />
        
        <Route path="/seats" element={
          <ProtectedRoute allowedRoles={['THEATRE_ADMIN']}>
            <SeatsQr />
          </ProtectedRoute>
        } />

        <Route path="/staff" element={
          <ProtectedRoute allowedRoles={['THEATRE_ADMIN']}>
            <Staff />
          </ProtectedRoute>
        } />

        <Route path="/print-qr" element={
          <ProtectedRoute allowedRoles={['THEATRE_ADMIN']}>
            <PrintQr />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
