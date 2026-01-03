
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatVoucherReceipt } from '../services/shareService';
import { financeService } from '../services/financeService';

const AddVoucher: React.FC = () => {
  const { addVoucher, navigate, navigationParams, customers, suppliers, sales, purchases, vouchers, theme } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: (navigationParams?.type || 'قبض') as 'قبض' | 'دفع',
    person_id: navigationParams?.personId || '',
    person_name: '',
    person_type: (navigationParams?.personType || 'عميل') as 'عميل' | 'مورد',
    amount: navigationParams?.amount || 0,
    currency: (navigationParams?.currency || 'YER') as 'YER' | 'SAR' | 'OMR',
    notes: navigationParams?.amount ? `سداد مديونية سابقة` : ''
  });

  const [shareAfterSave, setShareAfterSave] = useState(true);

  const currentBalance = useMemo(() => {
    if (!formData.person_id) return 0;
    if (formData.person_type === 'عميل') {
      const balances = financeService.getCustomerBalances(formData.person_id, sales, vouchers);
      return balances.find(b => b.currency === formData.currency)?.amount || 0;
    } else {
      const balances = financeService.getSupplierBalances(formData.person_id, purchases, vouchers);
      return balances.find(b => b.currency === formData.currency)?.amount || 0;
    }
  }, [formData.person_id, formData.person_type, formData.currency, sales, purchases, vouchers]);

  useEffect(() => {
    if (formData.person_id) {
      const person = formData.person_type === 'عميل' 
        ? customers.find(c => c.id === formData.person_id)
        : suppliers.find(s => s.id === formData.person_id);
      if (person) setFormData(prev => ({ ...prev, person_name: person.name }));
    }
  }, [formData.person_id, formData.person_type, customers, suppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.person_id || formData.amount <= 0) {
      alert('يرجى اختيار الشخص وتحديد المبلغ');
      return;
    }

    setIsSubmitting(true);
    try {
      const voucherData = { ...formData, date: new Date().toISOString() };
      await addVoucher(voucherData);
      if (shareAfterSave) {
        const text = formatVoucherReceipt(voucherData as any);
        const person = formData.person_type === 'عميل' 
          ? customers.find(c => c.id === formData.person_id)
          : suppliers.find(s => s.id === formData.person_id);
        shareToWhatsApp(text, person?.phone);
      }
      navigate('vouchers');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSelectionList = formData.person_type === 'عميل' ? customers : suppliers;

  return (
    <PageLayout title={`إصدار سند ${formData.type}`} onBack={() => navigate('vouchers')}>
      <form onSubmit={handleSubmit} className="space-y-4 page-enter max-w-md mx-auto px-1 pb-20">
        
        <div className={`rounded-[2.5rem] p-6 lg:p-8 shadow-2xl border transition-all ${
          theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
        } space-y-5`}>
          
          <div className="flex justify-center -mt-14 mb-2">
            <div className={`w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-3xl text-white border-4 border-white dark:border-slate-900 ${
              formData.type === 'قبض' ? 'bg-emerald-600' : 'bg-amber-600'
            }`}>
              {formData.type === 'قبض' ? '📥' : '📤'}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">اختر ال{formData.person_type}</label>
            <select 
              disabled={isSubmitting}
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl p-4 font-black text-base outline-none transition-all"
              value={formData.person_id}
              onChange={e => setFormData({ ...formData, person_id: e.target.value })}
              required
            >
              <option value="">-- اضغط للاختيار --</option>
              {currentSelectionList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">المبلغ</label>
            <input 
              type="number" 
              disabled={isSubmitting}
              className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-5 font-black text-center text-4xl outline-none tabular-nums transition-all ${
                formData.type === 'قبض' ? 'text-emerald-600' : 'text-amber-600'
              }`}
              value={formData.amount || ''}
              placeholder="0"
              onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">بيان السند</label>
             <textarea 
                disabled={isSubmitting}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 rounded-2xl p-4 font-bold text-sm outline-none transition-all resize-none" 
                rows={3} 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                placeholder="اكتب تفاصيل الدفع..." 
             />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full p-6 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 border-b-8 transition-all text-white flex items-center justify-center gap-3 ${
            formData.type === 'قبض' ? 'bg-emerald-600 border-emerald-800' : 'bg-amber-600 border-amber-800'
          } disabled:opacity-50`}
        >
          {isSubmitting ? (
             <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span>حفظ السند الآن ✅</span>
          )}
        </button>
      </form>
    </PageLayout>
  );
};

export default AddVoucher;
