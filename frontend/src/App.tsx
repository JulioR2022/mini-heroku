import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LoginPage } from './pages/login/Login';
import RegisterPage from './pages/register/Register';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Dashboard from './pages/dashboard/Dashboard';
import ProjectPage from './pages/project/Project';
import ServicePage from './pages/service/Service';

function GlobalAuthListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/login');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <GlobalAuthListener />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path='/dashboard/:projectId' element={<ProjectPage/>} />
          <Route path="/dashboard/:projectName/:serviceId" element={<ServicePage/>}/>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}