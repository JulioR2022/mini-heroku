import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/login/Login';
import RegisterPage from './pages/register/Register';
import { ToastProvider } from './contexts/ToastContext';
import Dashboard from './pages/dashboard/Dashboard';
import ServicePage from './pages/service/Service';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path='/dashboard/:projectId' element={<ServicePage/>} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}