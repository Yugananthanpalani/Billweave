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
      <div
        className="w-16 h-16 rounded-full animate-spin"
        style={{
          background: "conic-gradient(#000000, #5ae396ff, #000000)",
          mask: "radial-gradient(transparent 55%, black 56%)",
          WebkitMask: "radial-gradient(transparent 55%, black 56%)",
        }}
      />
    </div>
  );
}

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}