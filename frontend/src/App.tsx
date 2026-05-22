import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/login/Login';
import RegisterPage from './pages/register/Register';
import {Dashboard} from './pages/dashboard/Dashboard';
import { ToastProvider } from './contexts/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}