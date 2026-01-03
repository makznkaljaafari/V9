
import React, { useEffect, useRef } from 'react';
import { UIProvider, useUI } from './UIContext';
import { AuthProvider, useAuth } from './AuthContext';
import { DataProvider, useData } from './DataContext';
import { supabase } from '../services/supabaseClient';

const SyncManager: React.FC = () => {
  const { setIsLoggedIn, setUser, setIsCheckingSession } = useAuth();
  const { loadAllData } = useData();
  const { navigate, currentPage } = useUI();
  const authInitializedRef = useRef(false);

  useEffect(() => {
    const checkSession = async () => {
      if (authInitializedRef.current) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          // نبدأ تحميل البيانات فوراً ولكن لا نعلق شاشة البدء بانتظارها بالكامل
          loadAllData(session.user.id);
          
          if (currentPage === 'login') {
            navigate('dashboard');
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error("Critical Auth Check Failed:", err);
      } finally {
        // ننهي شاشة البدء بمجرد معرفة حالة الجلسة (سواء مسجل أو لا)
        setIsCheckingSession(false);
        authInitializedRef.current = true;
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        loadAllData(session.user.id);
        if (currentPage === 'login') navigate('dashboard');
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUser(null);
        navigate('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadAllData, navigate, setIsLoggedIn, setUser, setIsCheckingSession, currentPage]);

  return null;
};

export const AppProvider = ({ children }: { children?: React.ReactNode }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <DataProvider>
          <SyncManager />
          {children}
        </DataProvider>
      </AuthProvider>
    </UIProvider>
  );
};

export const useApp = () => {
  const ui = useUI();
  const auth = useAuth();
  const data = useData();
  return { ...ui, ...auth, ...data };
};
