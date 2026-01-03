
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatVoucherReceipt } from '../services/shareService';
import { Voucher } from '../types';

const VouchersList: React.FC = () => {
  const { vouchers, navigate, deleteVoucher, addNotification, theme } = useApp();
  const [filter, setFilter] = useState<'الكل' | 'قبض' | 'دفع'>('الكل');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const matchesFilter = filter === 'الكل' || v.type === filter;
      const matchesSearch = v.person_name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [vouchers, filter, searchTerm]);

  const stats = useMemo(() => {
    const receipts = vouchers.filter(v => v.type === 'قبض').reduce((sum, v) => sum + v.amount, 0);
    const payments = vouchers.filter(v => v.type === 'دفع').reduce((sum, v) => sum + v.amount, 0);
    return { receipts, payments };
  }, [vouchers]);

  const handleDelete = async (v: Voucher) => {
    if (window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف السند الخاص بـ "${v.person_name}" بمبلغ ${v.amount.toLocaleString()}؟\nهذا الإجراء سيؤثر على أرصدة الحسابات فوراً.`)) {
      try {
        await deleteVoucher(v.id);
        addNotification("تم الحذف ✅", "تم حذف السند وتحديث الأرصدة.", "success");
      } catch (err: any) {
        addNotification("خطأ ❌", "فشل في عملية الحذف.", "warning");
      }
    }
  };

  return (
    <PageLayout title="السندات المالية" onBack={() => navigate('dashboard')}>
      <div className="space-y-6 lg:space-y-16 pb-32 max-w-7xl mx-auto w-full px-1">
        
        {/* Stats Section - Optimized for Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-8 px-1">
           <div className={`p-4 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border-2 flex flex-col items-center justify-center text-center transition-all ${theme === 'dark' ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100 shadow-sm'}`}>
              <p className="text-[8px] lg:text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1 lg:mb-5 tracking-widest">إجمالي المقبوضات</p>
              <p className="text-lg lg:text-5xl font-black text-emerald-600 tabular-nums">+{stats.receipts.toLocaleString()}</p>
           </div>
           <div className={`p-4 lg:p-10 rounded-2xl lg:rounded-[2.5rem] border-2 flex flex-col items-center justify-center text-center transition-all ${theme === 'dark' ? 'bg-rose-900/10 border-rose-500/20' : 'bg-rose-50 border-rose-100 shadow-sm'}`}>
              <p className="text-[8px] lg:text-sm font-black text-rose-600 dark:text-rose-400 uppercase mb-1 lg:mb-5 tracking-widest">إجمالي المدفوعات</p>
              <p className="text-lg lg:text-5xl font-black text-rose-600 tabular-nums">-{stats.payments.toLocaleString()}</p>
           </div>
           <div className={`hidden lg:flex p-10 rounded-[2.5rem] border-2 flex-col items-center justify-center bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-500/20`}>
              <p className="text-sm font-black text-sky-600 dark:text-sky-400 uppercase mb-5 tracking-widest">عدد العمليات</p>
              <p className="text-5xl font-black text-sky-600 tabular-nums">{vouchers.length}</p>
           </div>
           <div className={`hidden lg:flex p-10 rounded-[2.5rem] border-2 flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-white/5`}>
              <p className="text-sm font-black text-slate-400 uppercase mb-5 tracking-widest">الحالة اليوم</p>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300">مستقر ✅</p>
           </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-3 items-center max-w-4xl mx-auto w-full px-1">
          <div className="relative flex-1 w-full">
            <input 
              type="text" 
              placeholder="ابحث باسم الشخص..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl lg:rounded-2xl p-4 pr-12 font-black shadow-lg text-sm lg:text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl flex w-full lg:w-auto border border-slate-200 dark:border-white/5">
            {['الكل', 'قبض', 'دفع'].map(f => (
              <button
                key={f} onClick={() => setFilter(f as any)}
                className={`flex-1 lg:flex-none px-4 lg:px-8 py-2.5 rounded-lg font-black text-[10px] lg:text-sm transition-all ${filter === f ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Vouchers Grid - Compact for mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-12 px-1">
          {filteredVouchers.map((v) => (
            <div 
              key={v.id} 
              className={`p-5 lg:p-12 rounded-[1.8rem] lg:rounded-[3.5rem] border-2 transition-all hover:shadow-2xl group ${
                theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-lg'
              }`}
            >
              <div className="flex justify-between items-center mb-5 lg:mb-12">
                <div className="flex items-center gap-3 lg:gap-8">
                  <div className={`w-12 h-12 lg:w-24 lg:h-24 rounded-xl lg:rounded-[2.2rem] flex items-center justify-center text-2xl lg:text-5xl shadow-sm ${
                    v.type === 'قبض' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                  }`}>
                    {v.type === 'قبض' ? '📥' : '📤'}
                  </div>
                  <div>
                    <h3 className="font-black text-sm lg:text-3xl text-slate-900 dark:text-white leading-tight mb-1">{v.person_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] lg:text-xs font-black uppercase px-2 py-0.5 rounded-lg border ${v.type === 'قبض' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{v.type}</span>
                      <span className="text-[8px] lg:text-xs font-bold text-slate-400 tabular-nums">📅 {new Date(v.date).toLocaleDateString('ar-YE')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`text-lg lg:text-4xl font-black tabular-nums tracking-tighter ${v.type === 'قبض' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {v.type === 'قبض' ? '+' : '-'}{v.amount.toLocaleString()}
                  </p>
                  <small className="text-[8px] lg:text-xs font-black opacity-30 uppercase tracking-widest block text-left">{v.currency}</small>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-8 rounded-xl lg:rounded-[2rem] mb-6 lg:mb-8 border border-slate-100 dark:border-slate-800 italic text-xs lg:text-sm text-slate-500 truncate">
                 "{v.notes || 'سند مالي موثق'}"
              </div>

              <div className="grid grid-cols-3 gap-2 pt-5 border-t border-slate-100 dark:border-white/5">
                <button onClick={() => shareToWhatsApp(formatVoucherReceipt(v))} className="bg-sky-600 text-white py-3 rounded-xl font-black text-[9px] lg:text-sm shadow-md hover:bg-sky-500 transition-all flex flex-col items-center justify-center gap-1">
                   <span className="text-lg lg:text-2xl">💬</span>
                   <span>مشاركة</span>
                </button>
                <button onClick={() => navigate('voucher-details', { voucherId: v.id })} className="bg-slate-100 dark:bg-slate-800 text-slate-500 py-3 rounded-xl font-black text-[9px] lg:text-sm border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-all flex flex-col items-center justify-center gap-1">
                   <span className="text-lg lg:text-2xl">📄</span>
                   <span>تفاصيل</span>
                </button>
                <button onClick={() => handleDelete(v)} className="bg-rose-50 dark:bg-rose-900/20 text-rose-500 py-3 rounded-xl font-black text-[9px] lg:text-sm border border-rose-100 dark:border-rose-900/30 hover:bg-rose-500 hover:text-white transition-all flex flex-col items-center justify-center gap-1">
                   <span className="text-lg lg:text-2xl">🗑️</span>
                   <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredVouchers.length === 0 && (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-10">
            <span className="text-[10rem]">📑</span>
            <p className="font-black text-3xl">لا توجد سندات</p>
          </div>
        )}
      </div>
      
      {/* Dynamic Action Buttons */}
      <div className="fixed bottom-10 lg:bottom-16 left-6 lg:left-16 flex flex-col gap-4 lg:gap-10 z-40">
        <button onClick={() => navigate('add-voucher', { type: 'دفع' })} className="w-14 h-14 lg:w-24 lg:h-24 rounded-2xl bg-rose-600 text-white shadow-2xl flex flex-col items-center justify-center border-4 border-white dark:border-slate-800 active:scale-90 transition-all">
          <span className="text-xl lg:text-4xl">📤</span>
          <span className="text-[6px] lg:text-[7px] font-black uppercase">دفع</span>
        </button>
        <button onClick={() => navigate('add-voucher', { type: 'قبض' })} className="w-16 h-16 lg:w-28 lg:h-28 rounded-2xl bg-sky-600 text-white shadow-2xl flex flex-col items-center justify-center border-4 border-white dark:border-slate-800 active:scale-90 transition-all">
          <span className="text-2xl lg:text-5xl">📥</span>
          <span className="text-[6px] lg:text-[7px] font-black uppercase">قبض</span>
        </button>
      </div>
    </PageLayout>
  );
};

export default VouchersList;
