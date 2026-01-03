
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatBudgetSummary } from '../services/shareService';
import { financeService } from '../services/financeService';

type TabType = 'all' | 'customer_debts' | 'supplier_debts' | 'critical';

const DebtsReport: React.FC = () => {
  const { customers, suppliers, sales, purchases, vouchers, expenses, navigate, theme } = useApp();
  const [activeCurrency, setActiveCurrency] = useState<'YER' | 'SAR' | 'OMR'>('YER');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const budgetSummary = useMemo(() => {
    return financeService.getGlobalBudgetSummary(customers, suppliers, sales, purchases, vouchers, expenses);
  }, [customers, suppliers, sales, purchases, vouchers, expenses]);

  const currentSummary = useMemo(() => {
    return budgetSummary.find(s => s.currency === activeCurrency) || { 
      assets: 0, liabilities: 0, cash: 0, net: 0, currency: activeCurrency,
      customerDebts: 0, supplierDebts: 0, customerCredits: 0, supplierCredits: 0, collectionRatio: 0
    };
  }, [budgetSummary, activeCurrency]);

  const detailedBalances = useMemo(() => {
    const list: any[] = [];
    
    customers.forEach(c => {
      const bal = financeService.getCustomerBalances(c.id, sales, vouchers).find(b => b.currency === activeCurrency);
      if (bal && bal.amount !== 0) {
        list.push({
          id: c.id,
          name: c.name,
          type: 'عميل',
          amount: bal.amount,
          lastDate: bal.lastDate,
          days: bal.daysSinceLastOp,
          pending: bal.pendingCount,
          status: bal.status,
          phone: c.phone
        });
      }
    });

    suppliers.forEach(s => {
      const bal = financeService.getSupplierBalances(s.id, purchases, vouchers).find(b => b.currency === activeCurrency);
      if (bal && bal.amount !== 0) {
        list.push({
          id: s.id,
          name: s.name,
          type: 'مورد',
          amount: -bal.amount, // الديون التي علينا تظهر سالبة في الموقف المالي
          lastDate: bal.lastDate,
          days: bal.daysSinceLastOp,
          pending: bal.pendingCount,
          status: bal.status,
          phone: s.phone
        });
      }
    });

    return list.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [customers, suppliers, sales, purchases, vouchers, activeCurrency, searchTerm]);

  const filteredBalances = useMemo(() => {
    if (activeTab === 'customer_debts') return detailedBalances.filter(b => b.type === 'عميل' && b.amount > 0);
    if (activeTab === 'supplier_debts') return detailedBalances.filter(b => b.type === 'مورد' && b.amount < 0);
    if (activeTab === 'critical') return detailedBalances.filter(b => b.status.level === 'critical' && b.amount > 0);
    return detailedBalances;
  }, [detailedBalances, activeTab]);

  const handleShareSummary = () => {
    const activeStats = budgetSummary.filter(s => s.assets > 0 || s.liabilities > 0 || s.cash !== 0);
    const text = formatBudgetSummary(activeStats as any);
    shareToWhatsApp(text);
  };

  return (
    <PageLayout 
      title="الميزانية والديون الذكية" 
      onBack={() => navigate('dashboard')} 
      headerExtra={
        <button onClick={handleShareSummary} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shadow-lg border border-white/20 active:scale-90 transition-all">📤</button>
      }
    >
      <div className="space-y-6 pt-2 page-enter pb-44 max-w-lg mx-auto w-full px-2">
        
        {/* Currency Switcher - Floating Style */}
        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl gap-1 border border-slate-200 dark:border-white/5 shadow-inner">
           {(['YER', 'SAR', 'OMR'] as const).map(cur => (
             <button
               key={cur} onClick={() => setActiveCurrency(cur)}
               className={`flex-1 py-2.5 rounded-xl font-black text-xs transition-all ${activeCurrency === cur ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400'}`}
             >
               {cur === 'YER' ? 'يمني' : cur === 'SAR' ? 'سعودي' : 'عماني'}
             </button>
           ))}
        </div>

        {/* Global Wealth Card - Compact High Impact */}
        <div className={`rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden border ${
          theme === 'dark' ? 'bg-slate-900 border-white/5 text-white' : 'bg-white border-slate-100 text-slate-900'
        }`}>
          <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">صافي القيمة التقديرية (Net)</p>
          <div className="flex items-baseline gap-2">
             <h2 className={`text-4xl font-black tabular-nums tracking-tighter ${currentSummary.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {currentSummary.net.toLocaleString()}
             </h2>
             <span className="text-[10px] font-bold opacity-30 uppercase">{activeCurrency}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
             <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="text-[8px] font-black text-slate-400 mb-1 uppercase">كاش متوفر</p>
                <p className="text-lg font-black tabular-nums text-sky-600">{currentSummary.cash.toLocaleString()}</p>
             </div>
             <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="text-[8px] font-black text-slate-400 mb-1 uppercase">نسبة السيولة</p>
                <p className="text-lg font-black tabular-nums text-emerald-500">{Math.round(currentSummary.collectionRatio)}%</p>
             </div>
          </div>
        </div>

        {/* Filter Tabs - Horizontal Scroll on Mobile */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
           {[
             { id: 'all', label: 'الكل' },
             { id: 'customer_debts', label: 'ديون العملاء' },
             { id: 'supplier_debts', label: 'لنا عند الموردين' },
             { id: 'critical', label: 'ديون حرجة ⚠️' }
           ].map(tab => (
             <button
               key={tab.id} onClick={() => setActiveTab(tab.id as any)}
               className={`flex-shrink-0 px-5 py-2.5 rounded-full font-black text-xs transition-all border-2 ${
                 activeTab === tab.id 
                 ? 'bg-slate-900 dark:bg-emerald-600 text-white border-transparent shadow-lg' 
                 : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-white/5'
               }`}
             >
               {tab.label}
             </button>
           ))}
        </div>

        {/* Search */}
        <div className="relative">
           <input 
             type="text" placeholder="ابحث عن شخص..."
             className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl p-4 pr-12 font-black text-sm outline-none shadow-sm focus:border-sky-500 transition-all"
             value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
           />
           <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 text-xl">🔍</span>
        </div>

        {/* Account Cards List */}
        <div className="space-y-3">
           {filteredBalances.map((item) => (
             <div key={item.id} className={`p-5 rounded-[2rem] border-2 transition-all active:scale-[0.98] ${
               theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-md'
             }`}>
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                       item.type === 'عميل' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'
                     }`}>
                       {item.type === 'عميل' ? '👤' : '🚛'}
                     </div>
                     <div>
                        <h4 className="font-black text-base text-slate-800 dark:text-white leading-tight">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={`${item.status.color} text-[9px] font-black flex items-center gap-1`}>
                              <span>{item.status.icon}</span>
                              {item.status.label}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 tabular-nums">آخر حركة: {item.days} يوم</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-left">
                     <p className={`text-xl font-black tabular-nums tracking-tighter ${item.amount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {Math.abs(item.amount).toLocaleString()}
                     </p>
                     <p className="text-[8px] font-black text-slate-400 uppercase">{item.amount > 0 ? 'لنا' : 'علينا'}</p>
                  </div>
               </div>

               {/* Stats bar for the person */}
               <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-3 rounded-xl mb-4 border border-slate-100 dark:border-white/5">
                  <div className="flex-1 text-center border-l border-slate-200 dark:border-white/5">
                     <p className="text-[8px] font-black text-slate-400 uppercase">فواتير معلقة</p>
                     <p className="text-xs font-black text-indigo-500">{item.pending}</p>
                  </div>
                  <div className="flex-1 text-center">
                     <p className="text-[8px] font-black text-slate-400 uppercase">مستوى المخاطر</p>
                     <div className="flex justify-center gap-0.5 mt-0.5">
                        {[1,2,3].map(i => (
                          <div key={i} className={`w-3 h-1 rounded-full ${item.status.level === 'critical' ? 'bg-rose-500' : item.status.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'} ${i > (item.status.level === 'critical' ? 3 : item.status.level === 'warning' ? 2 : 1) ? 'opacity-20' : ''}`}></div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Quick Actions */}
               <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => navigate('account-statement', { personId: item.id, personType: item.type })}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-black text-[10px] active:scale-95 transition-all"
                  >📑 كشف</button>
                  <button 
                    onClick={() => shareToWhatsApp(`*🧾 تذكير بالرصيد - ${item.name}*\nإجمالي المديونية الحالية: *${Math.abs(item.amount).toLocaleString()} ${activeCurrency}*\nنرجو التكرم بالتصفية.\nشكراً لك.`, item.phone)}
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-2.5 rounded-xl font-black text-[10px] border border-emerald-500/20 active:scale-95 transition-all"
                  >💬 تذكير</button>
                  <button 
                    onClick={() => navigate('add-voucher', { 
                      type: item.amount > 0 ? (item.type === 'عميل' ? 'قبض' : 'دفع') : (item.type === 'عميل' ? 'دفع' : 'قبض'), 
                      personId: item.id, personType: item.type, amount: Math.abs(item.amount), currency: activeCurrency 
                    })}
                    className="bg-emerald-600 text-white py-2.5 rounded-xl font-black text-[10px] shadow-lg active:scale-95 transition-all"
                  >✅ تصفية</button>
               </div>
             </div>
           ))}

           {filteredBalances.length === 0 && (
             <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                <span className="text-7xl">⚖️</span>
                <p className="font-black text-sm uppercase tracking-widest">لا توجد سجلات حالياً</p>
             </div>
           )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DebtsReport;
