
import { supabase } from './supabaseClient';
import { logger } from './loggerService';
import { 
  Sale, Customer, Purchase, Supplier, QatCategory, 
  Voucher, Expense, Waste, AppNotification, ActivityLog, ExpenseTemplate
} from "../types";
import { 
  customerSchema, saleSchema, voucherSchema, categorySchema, 
  purchaseSchema, expenseSchema, supplierSchema, wasteSchema 
} from "../schemas";

export class AppError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

const l1Cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 300000; 

const getErrorMessage = (err: any): string => {
  if (!err) return "خطأ غير معروف";
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  if (err.error_description) return err.error_description;
  if (err.error?.message) return err.error.message;
  try {
    return JSON.stringify(err);
  } catch (e) {
    return String(err);
  }
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = getErrorMessage(error);
    const isRetryable = 
      errorMsg.toLowerCase().includes('failed to fetch') || 
      errorMsg.toLowerCase().includes('network') ||
      error?.status === 429 || 
      (error?.status >= 500);

    if (retries > 0 && isRetryable) {
      await new Promise(r => setTimeout(r, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw new AppError(errorMsg, String(error?.code || ""), Number(error?.status || 0));
  }
}

export const dataService = {
  async getUserId() {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id || null;
    } catch (e) {
      return null;
    }
  },

  async ensureUserExists(userId: string) {
    return withRetry(async () => {
      const { data: profile } = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
      if (!profile) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase.from('users').upsert({
            id: userId, 
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || 'مدير جديد',
            agency_name: authData.user.user_metadata?.agency_name || 'وكالة الشويع للقات'
          });
        }
      }
    });
  },

  async getCategories() { 
    return withRetry(async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name'); 
      if (error) throw error;
      return data || []; 
    });
  },

  async getSales() { 
    return withRetry(async () => {
      const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false }).limit(200); 
      if (error) throw error;
      return data || []; 
    });
  },

  async saveNotification(notification: any) {
    const userId = await this.getUserId();
    // إصلاح حرج: إذا لم يكن هناك مستخدم مسجل، احفظ الإشعار محلياً فقط ولا ترسل للسيرفر لتجنب خطأ RLS
    if (!userId) {
      console.warn("Skipping cloud sync for notification: No active user session.");
      return { ...notification, id: 'local-' + Date.now(), created_at: new Date().toISOString() };
    }
    
    return withRetry(async () => {
      const { data, error } = await supabase.from('notifications').insert([{ ...notification, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  async getFullProfile(userId: string) {
    return withRetry(async () => {
      const [userRes, settingsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
      ]);
      return { ...(userRes?.data || {}), ...(settingsRes?.data || {}) };
    });
  },

  async saveSale(sale: Partial<Sale>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('sales').insert([{ ...sale, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  async deleteRecord(table: string, id: string) {
    const userId = await this.getUserId();
    return withRetry(async () => {
      const { error } = await supabase.from(table).delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
      return true;
    });
  },

  // Fix: Adding saveCategory method to handle category creation
  async saveCategory(category: Partial<QatCategory>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('categories').insert([{ ...category, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding savePurchase method to handle purchase recording
  async savePurchase(purchase: Partial<Purchase>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('purchases').insert([{ ...purchase, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding saveCustomer method to handle customer registration
  async saveCustomer(customer: Partial<Customer>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('customers').insert([{ ...customer, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding saveSupplier method to handle supplier registration
  async saveSupplier(supplier: Partial<Supplier>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('suppliers').insert([{ ...supplier, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding returnSale method using the corresponding RPC function
  async returnSale(saleId: string) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول");
    return withRetry(async () => {
      const { error } = await supabase.rpc('return_sale', { sale_uuid: saleId, user_uuid: userId });
      if (error) throw error;
      return true;
    });
  },

  // Fix: Adding returnPurchase method using the corresponding RPC function
  async returnPurchase(purchaseId: string) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول");
    return withRetry(async () => {
      const { error } = await supabase.rpc('return_purchase', { purchase_uuid: purchaseId, user_uuid: userId });
      if (error) throw error;
      return true;
    });
  },

  // Fix: Adding saveVoucher method to record financial vouchers
  async saveVoucher(voucher: Partial<Voucher>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('vouchers').insert([{ ...voucher, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding saveExpense method to record business expenses
  async saveExpense(expense: Partial<Expense>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('expenses').insert([{ ...expense, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding saveWaste method to record inventory loss
  async saveWaste(waste: Partial<Waste>) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('waste').insert([{ ...waste, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding updateSettings method to update user preferences and exchange rates
  async updateSettings(userId: string, updates: any) {
    return withRetry(async () => {
      const { error } = await supabase.from('user_settings').upsert({ user_id: userId, ...updates });
      if (error) throw error;
    });
  },

  // Fix: Adding saveOpeningBalance method for initial debt tracking
  async saveOpeningBalance(balance: any) {
    const userId = await this.getUserId();
    if (!userId) throw new Error("يجب تسجيل الدخول للحفظ");
    return withRetry(async () => {
      const { data, error } = await supabase.from('opening_balances').insert([{ ...balance, user_id: userId }]).select().single();
      if (error) throw error;
      return data;
    });
  },

  // Fix: Adding getFinancialSummary method for the Reports dashboard
  async getFinancialSummary(startDate: string, endDate: string) {
    const userId = await this.getUserId();
    if (!userId) return [];
    return withRetry(async () => {
      const [salesRes, expensesRes] = await Promise.all([
        supabase.from('sales').select('total, currency').eq('user_id', userId).eq('is_returned', false).gte('date', startDate).lte('date', endDate),
        supabase.from('expenses').select('amount, currency').eq('user_id', userId).gte('date', startDate).lte('date', endDate)
      ]);
      const sales = salesRes.data || [];
      const expenses = expensesRes.data || [];
      const currencies = ['YER', 'SAR', 'OMR'] as const;
      return currencies.map(cur => {
        const totalSales = sales.filter(s => s.currency === cur).reduce((sum, s) => sum + Number(s.total), 0);
        const totalExpenses = expenses.filter(e => e.currency === cur).reduce((sum, e) => sum + Number(e.amount), 0);
        return {
          currency: cur,
          total_sales: totalSales,
          total_expenses: totalExpenses,
          net_profit: totalSales - totalExpenses
        };
      });
    });
  },
  
  async getCustomers() { return withRetry(async () => { const { data, error } = await supabase.from('customers').select('*'); if (error) throw error; return data || []; }); },
  async getSuppliers() { return withRetry(async () => { const { data, error } = await supabase.from('suppliers').select('*'); if (error) throw error; return data || []; }); },
  async getVouchers() { return withRetry(async () => { const { data, error } = await supabase.from('vouchers').select('*'); if (error) throw error; return data || []; }); },
  async getExpenses() { return withRetry(async () => { const { data, error } = await supabase.from('expenses').select('*'); if (error) throw error; return data || []; }); },
  async getWaste() { return withRetry(async () => { const { data, error } = await supabase.from('waste').select('*'); if (error) throw error; return data || []; }); },
  async getNotifications() { return withRetry(async () => { const { data, error } = await supabase.from('notifications').select('*').limit(50); if (error) throw error; return data || []; }); },
  async getActivityLogs() { return withRetry(async () => { const { data, error } = await supabase.from('activity_logs').select('*').limit(50); if (error) throw error; return data || []; }); },
  async getExpenseTemplates() { return withRetry(async () => { const { data, error } = await supabase.from('expense_templates').select('*'); if (error) throw error; return data || []; }); },
  async markAllNotificationsRead() { const userId = await this.getUserId(); if (userId) await supabase.from('notifications').update({ read: true }).eq('user_id', userId); },
  async updateProfile(userId: string, updates: any) { await supabase.from('users').update(updates).eq('id', userId); },
  async saveLog(action: string, details: string, type: string) { const userId = await this.getUserId(); if (userId) await supabase.from('activity_logs').insert([{ user_id: userId, action, details, type }]); }
};
