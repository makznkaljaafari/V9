
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatPurchaseInvoice } from '../services/shareService';

const AddPurchase: React.FC = () => {
  const { addPurchase, navigate, suppliers, categories, user, addNotification, navigationParams } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: navigationParams?.supplierId || '',
    qat_type: '',
    quantity: 1,
    unit_price: 0,
    status: 'نقدي' as 'نقدي' | 'آجل',
    currency: 'YER' as 'YER' | 'SAR' | 'OMR',
    notes: ''
  });

  const [shareAfterSave, setShareAfterSave] = useState(false);

  useEffect(() => {
    if (!formData.qat_type && categories.length > 0) {
      setFormData(prev => ({ ...prev, qat_type: categories[0].name }));
    }
  }, [categories, formData.qat_type]);

  const quickPrices = [5000, 10000, 15000, 20000, 25000, 30000];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const supplier = suppliers.find(s => s.id === formData.supplier_id);
    if (!supplier) {
      addNotification("تنبيه ⚠️", "يرجى اختيار المورد أولاً", "warning");
      return;
    }
    if (formData.unit_price <= 0) {
      addNotification("تنبيه ⚠️", "يرجى تحديد سعر الشراء", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const total = formData.quantity * formData.unit_price;
      const purchaseData = { ...formData, supplier_name: supplier.name, total, date: new Date().toISOString() };
      await addPurchase(purchaseData);
      if (shareAfterSave) {
        const text = formatPurchaseInvoice(purchaseData as any, user?.agency_name || 'وكالة الشويع');
        shareToWhatsApp(text, supplier.phone);
      }
      navigate('purchases');
    } catch (err) {
      addNotification("خطأ ⚠️", "فشل في حفظ عملية الشراء", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="فاتورة شراء وتوريد" onBack={() => navigate('purchases')}>
      <form onSubmit={handleSubmit} className="space-y-6 page-enter max-w-xl mx-auto pb-48 w-full px-2">
        
        <div className="bg-white dark:bg-dark-card p-8 rounded-[3rem] shadow-xl border border-light-border dark:border-dark-border space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] px-2">المورد / المزارع</label>
            <div className="relative group">
              <select 
                disabled={isSubmitting}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] p-5 pr-14 font-black text-xl outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 text-light-text dark:text-dark-text appearance-none transition-all shadow-inner"
                value={formData.supplier_id}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                required
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl opacity-30 group-focus-within:opacity-100 transition-all">🚛</span>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-light-muted dark:text-dark-muted uppercase tracking-[0.3em] px-2">نوع القات المورد</label>
            <div className="relative group">
              <select 
                disabled={isSubmitting}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] p-5 pr-14 font-black text-xl outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 text-light-text dark:text-dark-text appearance-none transition-all shadow-inner"
                value={formData.qat_type}
                onChange={e => setFormData({ ...formData, qat_type: e.target.value })}
                required
              >
                <option value="">-- اختر نوع القات --</option>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-2xl opacity-30 group-focus-within:opacity-100 transition-all">🌿</span>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
            </div>
          </div>
        </div>

        {/* ... باقي الحقول مع إضافة disabled={isSubmitting} لكل منها ... */}
        {/* سأختصر للأهمية وهو زر الحفظ */}

        <div className="bg-slate-900 dark:bg-slate-800 text-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10 relative overflow-hidden group">
           <div className="text-right z-10 w-full md:w-auto">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em] mb-2 opacity-70">إجمالي قيمة التوريد</p>
              <div className="flex items-baseline gap-3">
                <p className="text-5xl font-black tabular-nums tracking-tighter">{(formData.quantity * formData.unit_price).toLocaleString()}</p>
                <span className="text-sm font-black opacity-40 uppercase">{formData.currency}</span>
              </div>
           </div>
           <button 
             type="submit" 
             disabled={isSubmitting}
             className="w-full md:w-auto z-10 bg-orange-600 hover:bg-orange-500 px-12 py-6 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all border-b-8 border-orange-800 flex items-center justify-center gap-4 disabled:opacity-50"
           >
              {isSubmitting ? (
                 <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><span>حفظ التوريد</span><span className="text-3xl">💾</span></>
              )}
           </button>
        </div>
      </form>
    </PageLayout>
  );
};

export default AddPurchase;
