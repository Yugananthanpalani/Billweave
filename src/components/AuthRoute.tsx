import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthRouteProps {
  children: React.ReactNode;
}

export default function AuthRoute({ children }: AuthRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl animate-pulse">
            <img src="/icon/log.png" alt="Logo" className="w-16 h-16 object-contain" />
            </div>
          <div className="text-black text-xl font-semibold">Authenticating...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}