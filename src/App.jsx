import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Arena from './pages/Arena';
import LevelMap from './pages/LevelMap';
import Simulation from './pages/Simulation';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-screen"><div className="boot-spinner"/></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-screen"><div className="boot-spinner"/></div>;
  return !user ? children : <Navigate to="/arena" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/arena" element={<ProtectedRoute><Arena /></ProtectedRoute>} />
          <Route path="/arena/level/:levelId" element={<ProtectedRoute><LevelMap /></ProtectedRoute>} />
          <Route path="/arena/level/:levelId/task/:taskId" element={<ProtectedRoute><Simulation /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/arena" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
