
import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { InventoryProvider, useInventory } from './InventoryContext';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { FinanceProvider, useFinance } from './FinanceContext';
import { SystemProvider, useSystem } from './SystemContext';
import { dataService } from '../services/dataService';
import { useUI } from './UIContext';
import { useAuth } from './AuthContext';
import { logger } from '../services/loggerService';
import { supabase } from '../services/supabaseClient';

const DataContext = createContext<any>(undefined);

const DataProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setNotifications, addNotification } = useUI();
  const { setUser } = useAuth();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const inv = useInventory();
  const bus = useBusiness();
  const fin = useFinance();
  const sys = useSystem();

  const syncIntervalRef = useRef<any>(null);

  const loadAllData = useCallback(async (userId: string, isSilent = false) => {
    if (!userId) return;
    
    if (!isSilent) setIsDataLoaded(false);
    setIsSyncing(true);
    
    try {
      await dataService.ensureUserExists(userId);
      const profile = await dataService.getFullProfile(userId);
      if (profile) setUser(profile);

      // تحميل البيانات بشكل متوازي لتقليل وقت الانتظار
      const results = await Promise.allSettled([
        dataService.getCustomers().then(bus.setCustomers),
        dataService.getSuppliers().then(bus.setSuppliers),
        dataService.getCategories().then(inv.setCategories),
        dataService.getSales().then(bus.setSales),
        dataService.getVouchers().then(fin.setVouchers),
        dataService.getExpenses().then(fin.setExpenses),
        dataService.getWaste().then(fin.setWasteRecords),
        dataService.getNotifications().then(setNotifications)
      ]);

      const failedCount = results.filter(r => r.status === 'rejected').length;
      
      if (failedCount === results.length) {
        throw new Error("فشل الاتصال السحابي بالكامل 📡");
      }

      setLastSyncTime(new Date());
      setIsDataLoaded(true);
      sys.setConnectionError(null);
    } catch (e: any) {
      const errorMessage = e?.message || "تعذر جلب البيانات من السحابة 📡";
      logger.error("Sync Error:", e);
      sys.setConnectionError(errorMessage);
      if (!isSilent) addNotification("تنبيه الاتصال", "أنت تعمل بالوضع المحلي حالياً بسبب ضعف الشبكة", "warning");
    } finally {
      setIsSyncing(false);
    }
  }, [setUser, setNotifications, addNotification, fin, bus, inv, sys]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        loadAllData(session.user.id, true);
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = setInterval(() => loadAllData(session.user.id, true), 120000);
      }
    });

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      subscription.unsubscribe();
    };
  }, [loadAllData]);

  const value = useMemo(() => ({
    ...inv, ...bus, ...fin, ...sys,
    isDataLoaded, isSyncing, lastSyncTime, loadAllData
  }), [inv, bus, fin, sys, isDataLoaded, isSyncing, lastSyncTime, loadAllData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SystemProvider>
    <InventoryProvider>
      <BusinessProvider>
        <FinanceProvider>
          <DataProviderInner>{children}</DataProviderInner>
        </FinanceProvider>
      </BusinessProvider>
    </InventoryProvider>
  </SystemProvider>
);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
