
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';

const AddSupplier: React.FC = () => {
  const { suppliers, addSupplier, navigate, addNotification } = useApp();
  const [formData, setFormData] = useState({ name: '', phone: '', region: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ميزة اختيار جهة اتصال من الهاتف
  const handleSelectFromContacts = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const contacts = await (navigator as any).contacts.select(props, { multiple: false });
        
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const rawPhone = contact.tel?.[0] || '';
          const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
          setFormData(prev => ({
            ...prev,
            name: contact.name?.[0] || prev.name,
            phone: cleanPhone || prev.phone
          }));
          addNotification("تم الجلب ✅", "تم تحديث بيانات المورد من الهاتف", "success");
        }
      } catch (err: any) {
        console.error("Contact Picker Error:", err);
      }
    } else {
      alert("ميزة اختيار جهات الاتصال غير مدعومة في متصفحك الحالي.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      addNotification("تنبيه ⚠️", "يرجى إدخال اسم المورد", "warning");
      return;
    }
    const isDuplicate = suppliers.some((s: any) => s.name.trim() === trimmedName);
    if (isDuplicate) {
      addNotification("الاسم موجود مسبقاً ⚠️", `المورد "${trimmedName}" مسجل بالفعل.`, "warning");
      return;
    }
    if (!formData.phone.trim()) {
      addNotification("تنبيه ⚠️", "يرجى إدخال رقم الهاتف", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      await addSupplier({ ...formData, name: trimmedName });
      addNotification("تم الحفظ ✅", `تمت إضافة المورد ${trimmedName}.`, "success");
      navigate('suppliers');
    } catch (err: any) {
      addNotification("خطأ ❌", err?.message || "حدث خطأ أثناء الحفظ", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="إضافة مورد جديد" onBack={() => navigate('suppliers')}>
      <form onSubmit={handleSubmit} className="space-y-6 page-enter max-w-md mx-auto px-1 pb-10">
        <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl border transition-all ${
          localStorage.getItem('theme') === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
        } space-y-6`}>
           <div className="flex justify-center -mt-14 sm:-mt-20 mb-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-orange-600 rounded-[1.2rem] sm:rounded-[1.8rem] shadow-2xl flex items-center justify-center text-3xl sm:text-5xl text-white border-4 sm:border-8 border-white dark:border-slate-900">📦</div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest px-2">اسم المورد / المزرعة</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 font-black text-gray-800 dark:text-white text-base sm:text-xl outline-none transition-all" 
              placeholder="مثال: مزارع خولان" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required 
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest px-2">رقم الهاتف</label>
            <div className="relative group">
              <input 
                type="tel" 
                className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 pr-14 font-black text-gray-800 dark:text-white text-base sm:text-xl outline-none tabular-nums transition-all" 
                placeholder="770000000" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                required 
                disabled={isSubmitting}
              />
              <button 
                type="button"
                onClick={handleSelectFromContacts}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl flex items-center justify-center text-xl shadow-sm hover:scale-110 active:scale-90 transition-all"
              >
                📱
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest px-2">المنطقة</label>
            <input 
              type="text" 
              className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-5 font-black text-gray-800 dark:text-white text-base sm:text-xl outline-none transition-all" 
              placeholder="مثال: خولان - الطيال" 
              value={formData.region} 
              onChange={e => setFormData({ ...formData, region: e.target.value })} 
              disabled={isSubmitting}
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-2xl active:scale-95 border-b-4 sm:border-b-8 border-orange-800 flex items-center justify-center gap-4 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <><span>حفظ المورد</span><span className="text-xl sm:text-3xl">✅</span></>
          )}
        </button>
      </form>
    </PageLayout>
  );
};

export default AddSupplier;
