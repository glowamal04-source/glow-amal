import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }) {
  const hasAccess = localStorage.getItem('admin_access') === 'true';

  if (!hasAccess) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default PrivateRoute;
