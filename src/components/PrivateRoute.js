import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasAdminSession } from '../adminApi';

function PrivateRoute({ children }) {
  const hasAccess = hasAdminSession();
  if (!hasAccess) return <Navigate to="/admin-login" replace />;
  return children;
}
export default PrivateRoute;
