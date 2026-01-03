
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { Customer } from '../types';
import { financeService } from '../services/financeService';

const CustomersList: React.FC = () => {
  const { customers, sales, vouchers, navigate, deleteCustomer, addNotification, theme } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c: Customer) => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  const handleDelete = async (customer: Customer) => {
    if (window.confirm(`⚠️ تحذير: هل أنت متأكد من حذف العميل "${customer.name}"؟\nسيتم حذف كافة بياناته وسجلاته نهائياً من السحابة.`)) {
      try {
        await deleteCustomer(customer.id);
        addNotification("تم الحذف 🗑️", `تم حذف العميل ${customer.name} بنجاح.`, "success");
      } catch (err: any) {
        addNotification("عذراً ⚠️", "لا يمكن حذف العميل لوجود عمليات مالية مرتبطة به.", "warning");
      }
    }
  };

  return (
    <PageLayout title="دليل العملاء" onBack={() => navigate('dashboard')}>
      <div className="space-y-8 lg:space-y-12 pb-32 max-w-7xl mx-auto w-full">
        
        {/* Professional Search */}
        <div className="relative group max-w-3xl mx-auto w-full px-1">
          <input 
            type="text" placeholder="ابحث عن عميل بالاسم أو الهاتف..."
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-transparent focus:border-indigo-500 rounded-3xl lg:rounded-[2.5rem] p-6 lg:p-10 pr-16 lg:pr-24 font-black text-lg lg:text-2xl text-slate-900 dark:text-white shadow-2xl transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 text-2xl lg:text-4xl opacity-20">🔍</span>
        </div>

        {/* Adaptive Grid: 1 col (Mobile), 3 cols (Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 px-1">
          {filteredCustomers.map((c) => {
            const debts = financeService.getCustomerBalances(c.id, sales, vouchers);
            const totalDebt = debts.find(d => d.currency === 'YER')?.amount || 0;
            return (
              <div 
                key={c.id} 
                className={`p-6 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border-2 transition-all hover:shadow-2xl hover:-translate-y-2 group ${
                  theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-50 shadow-xl'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4 lg:gap-8">
                    <div className="w-14 h-14 lg:w-24 lg:h-24 bg-indigo-500 rounded-2xl lg:rounded-[2.2rem] flex items-center justify-center text-2xl lg:text-5xl text-white shadow-lg group-hover:rotate-3 transition-transform">👤</div>
                    <div>
                      <h3 className="font-black text-lg lg:text-3xl text-slate-900 dark:text-white leading-tight">{c.name}</h3>
                      <p className="text-[10px] lg:text-base font-bold text-slate-400 mt-1 tabular-nums">📱 {c.phone || 'بدون هاتف'}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={`text-xl lg:text-4xl font-black tabular-nums tracking-tighter ${totalDebt > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {totalDebt.toLocaleString()}
                    </p>
                    <small className="text-[8px] lg:text-sm font-black opacity-30 uppercase tracking-widest block text-left">YER</small>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                   <button 
                     onClick={() => navigate('account-statement', { personId: c.id, personType: 'عميل' })} 
                     className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-4 rounded-2xl font-black text-[10px] lg:text-sm border border-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                   >
                     📑 كشف
                   </button>
                   <button 
                     onClick={() => navigate('add-sale', { customerId: c.id })} 
                     className="bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] lg:text-sm shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all"
                   >
                     💰 بيع
                   </button>
                   <button 
                     onClick={() => navigate('add-voucher', { type: 'قبض', personId: c.id, personType: 'عميل', currency: 'YER' })} 
                     className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-black text-[10px] lg:text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                   >
                     📥 قبض
                   </button>
                   <button 
                     onClick={() => handleDelete(c)}
                     className="bg-rose-50 dark:bg-rose-900/30 text-rose-500 py-4 rounded-2xl font-black text-[10px] lg:text-sm border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all"
                   >
                     🗑️ حذف
                   </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-40 opacity-20 flex flex-col items-center gap-8">
            <span className="text-[10rem]">👥</span>
            <p className="font-black text-3xl">لا يوجد عملاء بهذا الاسم</p>
          </div>
        )}
      </div>
      
      <button 
        onClick={() => navigate('add-customer')} 
        className="fixed bottom-10 lg:bottom-16 right-6 lg:right-16 w-16 h-16 lg:w-28 lg:h-28 rounded-2xl lg:rounded-[2.5rem] bg-indigo-600 text-white shadow-[0_20px_60px_-15px_rgba(79,70,229,0.5)] flex items-center justify-center text-4xl lg:text-7xl border-4 lg:border-8 border-white dark:border-slate-800 z-40 active:scale-90 hover:scale-110 transition-all hover:rotate-6"
      >👤＋</button>
    </PageLayout>
  );
};

export default CustomersList;
