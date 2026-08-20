import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';

function PrivateRoute({ children }) {
  const location = useLocation();
  const [state, setState] = useState({
    loading: true,
    allowed: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ loading: false, allowed: false });
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        setState({ loading: false, allowed: adminSnap.exists() });
      } catch (error) {
        console.error(error);
        setState({ loading: false, allowed: false });
      }
    });

    return unsubscribe;
  }, []);

  if (state.loading) {
    return (
      <section className="section">
        <div className="container small-container">
          <div className="auth-card">
            <p>Vérification admin...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!state.allowed) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin-login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return children;
}

export default PrivateRoute;
