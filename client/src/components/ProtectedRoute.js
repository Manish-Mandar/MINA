import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, requiredRole, children }) => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        return idTokenResult.claims.role || 'patient';
      }
      return null;
    };
    
    checkUserRole().then(role => {
      setUserRole(role);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;