
import { Sale, Purchase, Voucher, Customer, Supplier, Expense } from "../types";

export interface AccountStatus {
  label: string;
  color: string;
  icon: string;
  level: 'fresh' | 'warning' | 'critical';
}

export const financeService = {
  getDaysDifference(dateStr: string): number {
    if (!dateStr) return 999;
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  getAccountStatus(days: number, amount: number): AccountStatus {
    if (amount === 0) return { label: 'مصفى', color: 'text-slate-400', icon: '✅', level: 'fresh' };
    if (days <= 3) return { label: 'نشط جداً', color: 'text-emerald-500', icon: '⚡', level: 'fresh' };
    if (days <= 7) return { label: 'مستقر', color: 'text-sky-500', icon: '👍', level: 'fresh' };
    if (days <= 15) return { label: 'متأخر قليلاً', color: 'text-amber-500', icon: '⏳', level: 'warning' };
    return { label: 'حساب حرج', color: 'text-rose-500', icon: '⚠️', level: 'critical' };
  },

  getCustomerBalances(customerId: string, sales: Sale[], vouchers: Voucher[]) {
    const currencies = ['YER', 'SAR', 'OMR'] as const;
    return currencies.map(cur => {
      const customerSales = sales.filter(s => s.customer_id === customerId && s.currency === cur && !s.is_returned);
      const totalSalesDebt = customerSales.filter(s => s.status === 'آجل').reduce((sum, s) => sum + s.total, 0);
      const totalReceipts = vouchers.filter(v => v.person_id === customerId && v.type === 'قبض' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
      
      const lastOp = [...customerSales, ...vouchers.filter(v => v.person_id === customerId)]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const balance = totalSalesDebt - totalReceipts;
      const days = this.getDaysDifference(lastOp?.date || '');

      return { 
        currency: cur, 
        amount: balance,
        lastDate: lastOp?.date || '',
        daysSinceLastOp: days,
        pendingCount: customerSales.filter(s => s.status === 'آجل').length,
        status: this.getAccountStatus(days, balance)
      };
    });
  },

  getSupplierBalances(supplierId: string, purchases: Purchase[], vouchers: Voucher[]) {
    const currencies = ['YER', 'SAR', 'OMR'] as const;
    return currencies.map(cur => {
      const supplierPurchases = purchases.filter(p => p.supplier_id === supplierId && p.currency === cur && !p.is_returned);
      const totalPurchases = supplierPurchases.filter(p => p.status === 'آجل').reduce((sum, p) => sum + p.total, 0);
      const totalPayments = vouchers.filter(v => v.person_id === supplierId && v.type === 'دفع' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);

      const lastOp = [...supplierPurchases, ...vouchers.filter(v => v.person_id === supplierId)]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      const balance = totalPurchases - totalPayments;
      const days = this.getDaysDifference(lastOp?.date || '');

      return { 
        currency: cur, 
        amount: balance,
        lastDate: lastOp?.date || '',
        daysSinceLastOp: days,
        pendingCount: supplierPurchases.filter(p => p.status === 'آجل').length,
        status: this.getAccountStatus(days, balance)
      };
    });
  },

  getGlobalBudgetSummary(customers: Customer[], suppliers: Supplier[], sales: Sale[], purchases: Purchase[], vouchers: Voucher[], expenses: Expense[] = []) {
    const currencies = ['YER', 'SAR', 'OMR'] as const;
    return currencies.map(cur => {
      let customerDebts = 0;
      let supplierCredits = 0;
      let supplierDebts = 0;
      let customerCredits = 0;

      customers.forEach(c => {
        const bal = this.getCustomerBalances(c.id, sales, vouchers).find(b => b.currency === cur);
        if (bal) {
          if (bal.amount > 0) customerDebts += bal.amount;
          else if (bal.amount < 0) customerCredits += Math.abs(bal.amount);
        }
      });

      suppliers.forEach(s => {
        const bal = this.getSupplierBalances(s.id, purchases, vouchers).find(b => b.currency === cur);
        if (bal) {
          if (bal.amount > 0) supplierDebts += bal.amount;
          else if (bal.amount < 0) supplierCredits += Math.abs(bal.amount);
        }
      });

      const cashSales = sales.filter(s => s.status === 'نقدي' && s.currency === cur && !s.is_returned).reduce((sum, s) => sum + s.total, 0);
      const voucherReceipts = vouchers.filter(v => v.type === 'قبض' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
      const cashPurchases = purchases.filter(p => p.status === 'نقدي' && p.currency === cur && !p.is_returned).reduce((sum, p) => sum + p.total, 0);
      const voucherPayments = vouchers.filter(v => v.type === 'دفع' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
      const totalExp = (expenses || []).filter(e => e.currency === cur).reduce((sum, e) => sum + e.amount, 0);

      const cash = (cashSales + voucherReceipts) - (cashPurchases + voucherPayments + totalExp);
      const assets = customerDebts + supplierCredits;
      const liabilities = supplierDebts + customerCredits;
      const net = cash + assets - liabilities;
      
      const collectionRatio = (cash + assets) > 0 ? (cash / (cash + assets)) * 100 : 0;

      return {
        currency: cur,
        customerDebts, supplierCredits, supplierDebts, customerCredits,
        assets, liabilities, cash, net, collectionRatio
      };
    });
  }
};
