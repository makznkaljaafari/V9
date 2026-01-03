
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Customer, Supplier, Sale, Purchase } from '../types';
import { dataService } from '../services/dataService';
import { useUI } from './UIContext';
import { useInventory } from './InventoryContext';

const BusinessContext = createContext<any>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addNotification, triggerFeedback } = useUI();
  const { setCategories } = useInventory();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const addSale = useCallback(async (s: any) => {
    // 1. تحديث الواجهة فوراً (Optimistic Update)
    const tempId = Math.random().toString(36).substr(2, 9);
    const optimisticSale = { ...s, id: tempId, created_at: new Date().toISOString() };
    
    setSales(prev => [optimisticSale, ...prev]);
    setCategories((prev: any[]) => prev.map(cat => 
      cat.name === s.qat_type ? { ...cat, stock: Math.max(0, Number(cat.stock) - Number(s.quantity)) } : cat
    ));
    
    addNotification("تم البيع ✅", "تم تسجيل العملية لحظياً وجاري المزامنة...", "success");
    s.status === 'نقدي' ? triggerFeedback('celebration') : triggerFeedback('debt');

    // 2. الحفظ الحقيقي في الخلفية
    try {
      const saved = await dataService.saveSale(s);
      setSales(prev => prev.map(item => item.id === tempId ? saved : item));
    } catch (e: any) {
      addNotification("فشل المزامنة ⚠️", "تعذر الحفظ في السحابة، يرجى التحقق من الإنترنت.", "warning");
      // التراجع عن التغييرات في حال الفشل
      setSales(prev => prev.filter(item => item.id !== tempId));
    }
  }, [addNotification, triggerFeedback, setCategories]);

  const addPurchase = useCallback(async (p: any) => {
    const tempId = Math.random().toString(36).substr(2, 9);
    const optimisticPur = { ...p, id: tempId, created_at: new Date().toISOString() };
    
    setPurchases(prev => [optimisticPur, ...prev]);
    setCategories((prev: any[]) => prev.map(cat => 
      cat.name === p.qat_type ? { ...cat, stock: Number(cat.stock) + Number(p.quantity) } : cat
    ));
    
    addNotification("تم التوريد ✅", "تمت الإضافة للمخازن لحظياً.", "success");

    try {
      const saved = await dataService.savePurchase(p);
      setPurchases(prev => prev.map(item => item.id === tempId ? saved : item));
    } catch (e: any) {
      addNotification("فشل المزامنة ⚠️", "تعذر حفظ التوريد سحابياً.", "warning");
      setPurchases(prev => prev.filter(item => item.id !== tempId));
    }
  }, [addNotification, setCategories]);

  const addCustomer = useCallback(async (c: any) => {
    const saved = await dataService.saveCustomer(c);
    setCustomers(prev => [saved, ...prev]);
    return saved;
  }, []);

  const addSupplier = useCallback(async (s: any) => {
    const saved = await dataService.saveSupplier(s);
    setSuppliers(prev => [saved, ...prev]);
    return saved;
  }, []);

  const deleteSale = useCallback(async (id: string) => {
    const original = [...sales];
    setSales(prev => prev.filter(s => s.id !== id));
    try {
      await dataService.deleteRecord('sales', id);
    } catch (e) {
      setSales(original);
      addNotification("خطأ في الحذف ⚠️", "تعذر حذف السجل من السحابة.", "warning");
    }
  }, [sales, addNotification]);

  const returnSale = useCallback(async (id: string) => {
    try {
      await dataService.returnSale(id);
      setSales(prev => prev.map(s => s.id === id ? { ...s, is_returned: true } : s));
      addNotification("تم المرتجع ✅", "تمت إعادة الكمية للمخازن.", "success");
    } catch (e) {
      addNotification("فشل المرتجع ⚠️", "حدث خطأ أثناء معالجة الطلب.", "warning");
    }
  }, [addNotification]);

  // Fix: Implement returnPurchase in BusinessContext to handle purchase returns and inventory update
  const returnPurchase = useCallback(async (id: string) => {
    try {
      await dataService.returnPurchase(id);
      setPurchases(prev => prev.map(p => p.id === id ? { ...p, is_returned: true } : p));
      addNotification("تم المرتجع ✅", "تم خصم الكمية المرجعة من المخازن.", "success");
    } catch (e) {
      addNotification("فشل المرتجع ⚠️", "حدث خطأ أثناء معالجة طلب المرتجع.", "warning");
    }
  }, [addNotification]);

  const value = useMemo(() => ({
    customers, setCustomers, suppliers, setSuppliers, sales, setSales, purchases, setPurchases,
    addSale, addPurchase, addCustomer, addSupplier, deleteSale, returnSale, returnPurchase,
    deleteCustomer: (id: string) => dataService.deleteRecord('customers', id).then(() => setCustomers(p => p.filter(x => x.id !== id))),
    deleteSupplier: (id: string) => dataService.deleteRecord('suppliers', id).then(() => setSuppliers(p => p.filter(x => x.id !== id)))
  }), [customers, suppliers, sales, purchases, addSale, addPurchase, addCustomer, addSupplier, deleteSale, returnSale, returnPurchase]);

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};

export const useBusiness = () => useContext(BusinessContext);
