
import React, { useMemo, useState, memo } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { PageLayout } from './ui/Layout';
import { financeService } from '../services/financeService';

const ServiceButton = memo(({ s, onClick, theme }: any) => (
  <button 
    onClick={() => onClick(s.id)}
    className={`flex flex-col items-center justify-center gap-1 p-2 lg:p-8 rounded-2xl lg:rounded-[3rem] border transition-all active:scale-95 hover:shadow-2xl ${
      theme === 'dark' ? 'bg-slate-900/40 border-white/5 hover:bg-slate-800' : 'bg-white border-slate-100 shadow-sm hover:border-emerald-200'
    }`}
  >
    <div className={`w-8 h-8 lg:w-16 lg:h-16 rounded-xl lg:rounded-[2rem] flex items-center justify-center text-base lg:text-4xl shadow-lg ${s.bg}`}>
      {s.icon}
    </div>
    <span className={`text-[8px] lg:text-base font-black tracking-tighter text-center leading-none ${s.text}`}>{s.label}</span>
  </button>
));

const Dashboard: React.FC = () => {
  const { navigate, theme, toggleTheme, isOnline, isSyncing } = useUI();
  const { user } = useAuth();
  const { 
    sales, purchases, vouchers, customers, suppliers, expenses, 
    loadAllData 
  } = useData();
  
  const [isMasked, setIsMasked] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState<'YER' | 'SAR' | 'OMR'>('YER');
  const [showDetailType, setShowDetailType] = useState<'cash' | 'assets' | 'liabilities' | null>(null);

  const budgetSummary = useMemo(() => {
    return financeService.getGlobalBudgetSummary(customers, suppliers, sales, purchases, vouchers, expenses);
  }, [customers, suppliers, sales, purchases, vouchers, expenses]);

  const currentSummary = useMemo(() => {
    return budgetSummary.find(s => s.currency === activeCurrency) || { 
      assets: 0, liabilities: 0, cash: 0, net: 0, currency: activeCurrency,
      customerDebts: 0, supplierDebts: 0, customerCredits: 0, supplierCredits: 0
    };
  }, [budgetSummary, activeCurrency]);

  const cashBreakdown = useMemo(() => {
    const cur = activeCurrency;
    const cashSales = sales.filter(s => s.status === 'نقدي' && s.currency === cur && !s.is_returned).reduce((sum, s) => sum + s.total, 0);
    const voucherReceipts = vouchers.filter(v => v.type === 'قبض' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
    const cashPurchases = purchases.filter(p => p.status === 'نقدي' && p.currency === cur && !p.is_returned).reduce((sum, p) => sum + p.total, 0);
    const voucherPayments = vouchers.filter(v => v.type === 'دفع' && v.currency === cur).reduce((sum, v) => sum + v.amount, 0);
    const totalExp = (expenses || []).filter(e => e.currency === cur).reduce((sum, e) => sum + e.amount, 0);

    return {
      in: cashSales + voucherReceipts,
      out: cashPurchases + voucherPayments + totalExp,
      sales: cashSales,
      receipts: voucherReceipts,
      purchases: cashPurchases,
      payments: voucherPayments,
      expenses: totalExp
    };
  }, [sales, vouchers, purchases, expenses, activeCurrency]);

  const mainServices = useMemo(() => [
    { id: 'sales', label: 'المبيعات', icon: '💰', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-900 dark:text-emerald-400' },
    { id: 'purchases', label: 'المشتريات', icon: '📦', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-900 dark:text-orange-400' },
    { id: 'vouchers', label: 'السندات', icon: '📥', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-900 dark:text-indigo-400' },
    { id: 'debts', label: 'الميزانية', icon: '⚖️', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-900 dark:text-rose-400' },
    { id: 'customers', label: 'العملاء', icon: '👥', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-900 dark:text-blue-400' },
    { id: 'categories', label: 'المخزون', icon: '🌿', bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-900 dark:text-teal-400' },
    { id: 'returns', label: 'المرتجعات', icon: '🔄', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-900 dark:text-red-400' },
    { id: 'waste', label: 'التالف', icon: '🥀', bg: 'bg-rose-200 dark:bg-rose-900/20', text: 'text-rose-900 dark:text-rose-400' },
    { id: 'expenses', label: 'المصاريف', icon: '💸', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-900 dark:text-amber-400' },
    { id: 'suppliers', label: 'الموردين', icon: '🚛', bg: 'bg-slate-200 dark:bg-slate-800', text: 'text-slate-900 dark:text-slate-400' },
    { id: 'activity-log', label: 'الرقابة', icon: '🛡️', bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300' },
    { id: 'reports', label: 'التقارير', icon: '📊', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-900 dark:text-purple-400' },
  ], []);

  const formatAmount = (val: number) => isMasked ? '••••' : val.toLocaleString();

  const handleRefresh = () => {
    if (user?.id) loadAllData(user.id);
  };

  return (
    <PageLayout 
      title={user?.agency_name || 'وكالة الشويع'}
      headerExtra={
        <div className="flex items-center gap-1">
          <button 
            onClick={handleRefresh}
            disabled={isSyncing}
            className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm text-white border border-white/5 active:scale-90 transition-all ${isSyncing ? 'animate-spin opacity-50' : ''}`}
          >
            🔄
          </button>
          <button onClick={toggleTheme} className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 flex items-center justify-center text-sm text-white border border-white/5 active:scale-90 transition-all">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      }
    >
      <div className="space-y-2 lg:space-y-6 pb-6 w-full max-w-7xl mx-auto px-1">
        
        {/* Welcome Section - Ultra Compact */}
        <div className="flex items-center justify-between gap-2 pt-0">
          <div>
            <h2 className="text-lg lg:text-4xl font-black text-vibrant-hero leading-tight animate-vibrant-pulse inline-block">
              أهلاً، {user?.full_name?.split(' ')[0] || 'المدير'}
            </h2>
          </div>
          
          <div 
            onClick={() => navigate('ai-advisor')}
            className={`p-1.5 lg:p-4 rounded-xl shadow-md cursor-pointer active:scale-95 transition-all border ${
              theme === 'dark' ? 'bg-indigo-900/20 border-indigo-500/20 text-white' : 'bg-sky-50 border-sky-100 text-sky-950'
            }`}
          >
            <div className="flex items-center gap-2 relative z-10">
              <div className="w-6 h-6 lg:w-12 lg:h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-xs lg:text-2xl shadow-lg">🤖</div>
              <h3 className="text-[9px] lg:text-base font-black leading-none">المحاسب الذكي</h3>
            </div>
          </div>
        </div>

        {/* Financial Overview Card - Squeezed & Sliced */}
        <div className={`relative overflow-hidden rounded-2xl lg:rounded-[3rem] p-3 lg:p-10 shadow-xl transition-all border ${
          theme === 'dark' ? 'bg-slate-900 border-white/5 text-white shadow-emerald-900/5' : 'bg-white border-sky-50 text-slate-950 shadow-sky-900/5'
        }`}>
          <div className="flex justify-between items-center mb-2 lg:mb-8">
            <span className="text-[8px] lg:text-lg font-black uppercase tracking-widest opacity-40">الموقف المالي ({activeCurrency})</span>
            
            <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg gap-0.5">
               {(['YER', 'SAR', 'OMR'] as const).map(cur => (
                 <button
                   key={cur}
                   onClick={() => setActiveCurrency(cur)}
                   className={`px-2 lg:px-6 py-1 rounded-md font-black text-[8px] lg:text-sm transition-all ${
                     activeCurrency === cur 
                       ? 'bg-sky-600 text-white shadow-md' 
                       : 'text-slate-400'
                   }`}
                 >
                   {cur === 'YER' ? 'يمني' : cur === 'SAR' ? 'سعودي' : 'عماني'}
                 </button>
               ))}
               <button onClick={() => setIsMasked(!isMasked)} className="px-1.5 text-xs opacity-40">{isMasked ? '👁️' : '🙈'}</button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-12">
            <div 
              className="flex flex-col cursor-pointer group"
              onClick={() => setShowDetailType('cash')}
            >
              <p className="text-[7px] lg:text-xs font-black text-slate-400 uppercase leading-none mb-0.5">السيولة (الصندوق)</p>
              <h1 className={`text-2xl lg:text-6xl font-black tabular-nums tracking-tighter leading-none ${theme === 'dark' ? 'text-white' : 'text-sky-900'}`}>
                {formatAmount(currentSummary.cash)}
              </h1>
            </div>
            
            <div className="flex flex-row gap-2 lg:gap-8 border-t lg:border-t-0 lg:border-r border-slate-100 dark:border-white/5 pt-1.5 lg:pt-0 lg:pr-8 w-full lg:w-auto">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => setShowDetailType('assets')}
              >
                <p className="text-[6px] lg:text-xs font-black text-slate-400 uppercase mb-0">ما لنا</p>
                <p className="text-sm lg:text-3xl font-black text-emerald-500 tabular-nums leading-none">+{formatAmount(currentSummary.assets)}</p>
              </div>
              <div 
                className="flex-1 border-r border-slate-100 dark:border-white/5 pr-2 cursor-pointer"
                onClick={() => setShowDetailType('liabilities')}
              >
                <p className="text-[6px] lg:text-xs font-black text-slate-400 uppercase mb-0">ما علينا</p>
                <p className="text-sm lg:text-3xl font-black text-rose-500 tabular-nums leading-none">-{formatAmount(currentSummary.liabilities)}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
             <span className="text-[7px] lg:text-sm font-black text-slate-400 opacity-60">الصافي:</span>
             <span className={`text-[10px] lg:text-2xl font-black tabular-nums ${currentSummary.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatAmount(currentSummary.net)} {activeCurrency}
             </span>
          </div>
        </div>

        {/* Services Grid - Tight & Visible */}
        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 lg:gap-6">
          {mainServices.map((s) => (
            <ServiceButton key={s.id} s={s} onClick={navigate} theme={theme} />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailType && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setShowDetailType(null)}>
            <div className={`w-full max-w-md rounded-[2rem] p-6 shadow-3xl border-2 ${
              theme === 'dark' ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-900'
            }`} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg lg:text-2xl font-black">
                  {showDetailType === 'cash' && 'تفاصيل السيولة'}
                  {showDetailType === 'assets' && 'تفاصيل الأصول'}
                  {showDetailType === 'liabilities' && 'تفاصيل الخصوم'}
                </h3>
                <button onClick={() => setShowDetailType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-sm font-black">✕</button>
              </div>

              <div className="space-y-3">
                {showDetailType === 'cash' && (
                  <>
                    <div className="flex justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                      <span className="text-xs font-bold">المبيعات النقدية (+)</span>
                      <span className="text-sm font-black tabular-nums">{cashBreakdown.sales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                      <span className="text-xs font-bold">مقبوضات السندات (+)</span>
                      <span className="text-sm font-black tabular-nums">{cashBreakdown.receipts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
                      <span className="text-xs font-bold">المشتريات النقدية (-)</span>
                      <span className="text-sm font-black tabular-nums">{cashBreakdown.purchases.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
                      <span className="text-xs font-bold">إجمالي المصاريف (-)</span>
                      <span className="text-sm font-black tabular-nums">{cashBreakdown.expenses.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {showDetailType === 'assets' && (
                  <>
                    <div className="flex justify-between p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
                      <span className="text-xs font-bold">ديون العملاء</span>
                      <span className="text-sm font-black tabular-nums">{currentSummary.customerDebts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
                      <span className="text-xs font-bold">فائض عند الموردين</span>
                      <span className="text-sm font-black tabular-nums">{currentSummary.supplierCredits.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {showDetailType === 'liabilities' && (
                  <>
                    <div className="flex justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                      <span className="text-xs font-bold">ديون الموردين</span>
                      <span className="text-sm font-black tabular-nums">{currentSummary.supplierDebts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                      <span className="text-xs font-bold">فائض مبالغ العملاء</span>
                      <span className="text-sm font-black tabular-nums">{currentSummary.customerCredits.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
    </PageLayout>
  );
};

export default Dashboard;
