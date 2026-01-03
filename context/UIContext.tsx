
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Page, Theme, AppNotification } from '../types';
import { dataService } from '../services/dataService';

interface UIContextType {
  currentPage: Page;
  navigationParams: any;
  theme: Theme;
  activeToasts: any[];
  notifications: AppNotification[];
  isSidebarCollapsed: boolean;
  feedbackType: 'celebration' | 'debt' | null;
  isOnline: boolean;
  installPrompt: any;
  navigate: (p: Page, params?: any) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addNotification: (title: string, message: string, type: AppNotification['type']) => Promise<void>;
  removeToast: (id: string) => void;
  markNotificationsAsRead: () => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  triggerFeedback: (type: 'celebration' | 'debt') => void;
  promptInstall: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [navigationParams, setNavigationParams] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [activeToasts, setActiveToasts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [feedbackType, setFeedbackType] = useState<'celebration' | 'debt' | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const navigate = useCallback((p: Page, params?: any) => {
    setCurrentPage(p);
    setNavigationParams(params || null);
  }, []);

  const promptInstall = useCallback(async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') setInstallPrompt(null);
    }
  }, [installPrompt]);

  const toggleTheme = useCallback(() => {
    const nt = theme === 'light' ? 'dark' : 'light';
    setTheme(nt);
    localStorage.setItem('theme', nt);
    document.documentElement.classList.toggle('dark', nt === 'dark');
  }, [theme]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', String(newState));
      return newState;
    });
  }, []);

  const addNotification = useCallback(async (title: string, message: string, type: AppNotification['type']) => {
    try {
      const saved = await dataService.saveNotification({ title, message, type, date: new Date().toISOString(), read: false });
      setNotifications(prev => [saved, ...prev]);
      const toastId = Math.random().toString(36).substr(2, 9);
      setActiveToasts(prev => [...prev, { id: toastId, title, message, type }]);
    } catch (e) { console.error(e); }
  }, []);

  const removeToast = useCallback((id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const markNotificationsAsRead = useCallback(async () => {
    await dataService.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const triggerFeedback = useCallback((type: 'celebration' | 'debt') => {
    setFeedbackType(type);
    setTimeout(() => setFeedbackType(null), 4000);
  }, []);

  const value = useMemo(() => ({
    currentPage, navigationParams, theme, activeToasts, notifications, isSidebarCollapsed, feedbackType, isOnline, installPrompt,
    navigate, toggleTheme, toggleSidebar, addNotification, removeToast, markNotificationsAsRead, setNotifications, triggerFeedback, promptInstall
  }), [currentPage, navigationParams, theme, activeToasts, notifications, isSidebarCollapsed, feedbackType, isOnline, installPrompt, navigate, toggleTheme, toggleSidebar, addNotification, removeToast, markNotificationsAsRead, triggerFeedback, promptInstall]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};
