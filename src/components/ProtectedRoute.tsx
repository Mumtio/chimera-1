import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { CyberSpinner } from './ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    // If there's a token but no user, we need to validate or clear it
    if (token && !user) {
      // For now, if there's a token but no user state, clear the token
      // This prevents stale sessions from accessing data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
    
    setIsChecking(false);
  }, [user]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <CyberSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}
