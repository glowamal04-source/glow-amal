import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from '../storefrontData';
import { db } from '../firebase';

const StorefrontContext = createContext(null);

export function StorefrontProvider({ children }) {
  const [state, setState] = useState({ settings: null, loading: true, error: false });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    let active = true;
    let timer;
    setState({ settings: null, loading: true, error: false });
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Storefront timeout')), 12000); });
    Promise.race([getDoc(doc(db, 'settings', 'storefront')), timeout])
      .then(snapshot => { if (active) setState({ settings: snapshot.exists() ? snapshot.data() : {}, loading: false, error: false }); })
      .catch(error => { console.error('Erreur chargement vitrine:', error); if (active) setState({ settings: null, loading: false, error: true }); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); };
  }, [attempt]);

  return <StorefrontContext.Provider value={{ ...state, retry }}>{children}</StorefrontContext.Provider>;
}

export function useStorefront() { return useContext(StorefrontContext); }
