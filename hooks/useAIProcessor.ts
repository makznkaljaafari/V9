
import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { financeService } from '../services/financeService';

export const useAIProcessor = () => {
  const { 
    sales, customers, purchases, vouchers, suppliers, categories, exchangeRates,
    addSale, addPurchase, addVoucher, returnSale, returnPurchase, 
    addCustomer, addSupplier, deleteCustomer, deleteSupplier,
    updateExchangeRates, createCloudBackup, addNotification,
    addCategory, deleteCategory
  } = useApp();

  const [pendingAction, setPendingAction] = useState<any>(null);
  const [ambiguityMatches, setAmbiguityMatches] = useState<any[]>([]);
  const [debtWarning, setDebtWarning] = useState<number | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const validateToolCall = useCallback((name: string, args: any) => {
    setErrorInfo(null);
    setDebtWarning(null);
    setAmbiguityMatches([]);

    if (name === 'recordSale') {
      const searchName = (args.customer_name || "").trim();
      const matches = customers.filter(c => c.name.includes(searchName));
      
      if (matches.length === 0) {
        setErrorInfo(`العميل "${searchName}" غير موجود. يرجى إضافته أولاً.`);
        return false;
      }
      if (matches.length > 1) {
        setAmbiguityMatches(matches);
        return true; 
      }
      
      const debts = financeService.getCustomerBalances(matches[0].id, sales, vouchers);
      const yerDebt = debts.find(b => b.currency === (args.currency || 'YER'))?.amount || 0;
      if (yerDebt > 0) setDebtWarning(yerDebt);
    }

    if (name === 'recordVoucher') {
      const list = args.type === 'قبض' ? customers : suppliers;
      const searchName = (args.person_name || "").trim();
      const matches = list.filter(p => p.name.includes(searchName));
      if (matches.length === 0) {
        setErrorInfo(`الاسم "${args.person_name}" غير مسجل في القائمة.`);
        return false;
      }
      if (matches.length > 1) {
        setAmbiguityMatches(matches);
        return true;
      }
    }

    return true;
  }, [customers, suppliers, sales, vouchers]);

  const executeAction = useCallback(async (forcedId?: string) => {
    if (!pendingAction || isExecuting) return;
    
    // فك التشفير الآمن لتجنب "Missing initializer"
    const actionName = pendingAction.name;
    const actionArgs = pendingAction.args || {};

    setIsExecuting(true);
    try {
      switch (actionName) {
        case 'recordSale': {
          const target = forcedId ? customers.find(c => c.id === forcedId) : customers.find(c => c.name.includes(actionArgs.customer_name));
          if (!target) throw new Error("العميل غير موجود");
          await addSale({ ...actionArgs, customer_id: target.id, customer_name: target.name, total: (actionArgs.quantity || 0) * (actionArgs.unit_price || 0), date: new Date().toISOString() });
          break;
        }
        case 'recordVoucher': {
          const list = actionArgs.type === 'قبض' ? customers : suppliers;
          const target = forcedId ? list.find(p => p.id === forcedId) : list.find(p => p.name.includes(actionArgs.person_name));
          if (!target) throw new Error("الشخص غير موجود");
          await addVoucher({ ...actionArgs, person_id: target.id, person_name: target.name, person_type: actionArgs.type === 'قبض' ? 'عميل' : 'مورد', date: new Date().toISOString() });
          break;
        }
        case 'recordReturn': {
          if (actionArgs.operation_type === 'بيع') {
            const sale = sales.find(s => s.customer_name.includes(actionArgs.person_name) && !s.is_returned);
            if (!sale) throw new Error("لم يتم العثور على الفاتورة");
            await returnSale(sale.id);
          } else {
            const pur = purchases.find(p => p.supplier_name.includes(actionArgs.person_name) && !p.is_returned);
            if (!pur) throw new Error("لم يتم العثور على فاتورة المشتريات");
            await returnPurchase(pur.id);
          }
          break;
        }
        case 'managePerson': {
          if (actionArgs.action === 'إضافة') {
            if (actionArgs.type === 'عميل') await addCustomer({ name: actionArgs.name, phone: actionArgs.phone || '', address: actionArgs.address_region || '' });
            else await addSupplier({ name: actionArgs.name, phone: actionArgs.phone || '', region: actionArgs.address_region || '' });
          }
          break;
        }
        case 'systemControl': {
          if (actionArgs.command === 'نسخ_احتياطي') await createCloudBackup();
          break;
        }
      }

      addNotification("تم التنفيذ ✅", "تمت المعالجة بنجاح.", "success");
      setPendingAction(null);
      setAmbiguityMatches([]);
      return true;
    } catch (err: any) {
      addNotification("خطأ ⚠️", err.message || "فشل التنفيذ.", "warning");
      return false;
    } finally {
      setIsExecuting(false);
    }
  }, [pendingAction, isExecuting, customers, suppliers, sales, purchases, addSale, addVoucher, createCloudBackup, addNotification, addCustomer, addSupplier, returnSale, returnPurchase]);

  return {
    pendingAction, setPendingAction,
    ambiguityMatches, setAmbiguityMatches,
    debtWarning, errorInfo, setErrorInfo,
    isExecuting, validateToolCall, executeAction
  };
};
