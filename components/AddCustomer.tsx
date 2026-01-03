
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';

const AddCustomer: React.FC = () => {
  const { customers, addCustomer, navigate, addNotification } = useApp();
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ميزة اختيار جهة اتصال من الهاتف
  const handleSelectFromContacts = async () => {
    if ('contacts' in navigator && 'select' in (navigator as any).contacts) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);
        
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const rawPhone = contact.tel?.[0] || '';
          // تنظيف الرقم من المسافات والرموز
          const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
          setFormData(prev => ({
            ...prev,
            name: contact.name?.[0] || prev.name,
            phone: cleanPhone || prev.phone
          }));
          addNotification("تم السحب ✅", "تم جلب البيانات من دفتر الهاتف", "success");
        }
      } catch (err: any) {
        console.error("Contact Picker Error:", err);
      }
    } else {
      alert("عذراً، متصفحك لا يدعم الوصول لجهات الاتصال. يرجى كتابة الرقم يدوياً.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      addNotification("تنبيه ⚠️", "يرجى إدخال اسم العميل", "warning");
      return;
    }
    const isDuplicate = customers.some((c: any) => c.name.trim() === trimmedName);
    if (isDuplicate) {
      addNotification("الاسم موجود مسبقاً ⚠️", `العميل "${trimmedName}" مسجل بالفعل.`, "warning");
      return;
    }
    if (!formData.phone.trim()) {
      addNotification("تنبيه ⚠️", "يرجى إدخال رقم الهاتف", "warning");
      return;
    }
    setIsSubmitting(true);
    try {
      await addCustomer({ ...formData, name: trimmedName });
      addNotification("تم الحفظ ✅", `تمت إضافة العميل ${trimmedName}.`, "success");
      navigate('customers');
    } catch (err: any) {
      addNotification("خطأ ❌", err?.message || "حدث خطأ في الحفظ", "warning");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="إضافة عميل جديد" onBack={() => navigate('customers')}>
      <form onSubmit={handleSubmit} className="space-y-6 page-enter max-w-md mx-auto px-1 pb-10">
        <div className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl border transition-all ${
          localStorage.getItem('theme') === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
        } space-y-6 relative overflow-hidden`}>
          
          <div className="flex justify-center -mt-14 sm:-mt-20 mb-4 relative z-10">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-600 rounded-[1.2rem] sm:rounded-[1.8rem] shadow-2xl flex items-center justify-center text-3xl sm:text-5xl text-white border-4 sm:border-8 border-white dark:border-slate-900">👤</div>
          </div>

          <div className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الاسم الكامل</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 font-black text-base sm:text-lg outline-none border-2 border-transparent focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                placeholder="اسم العميل"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex justify-between items-center">
                <span>رقم الجوال</span>
                <span className="text-[8px] opacity-50 font-bold">يقبل أي شركة اتصال</span>
              </label>
              <div className="relative group">
                <input 
                  type="tel"
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 pr-14 font-black text-base sm:text-lg outline-none border-2 border-transparent focus:border-blue-500 transition-all text-slate-800 dark:text-white tabular-nums"
                  placeholder="7xxxxxxx"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
                <button 
                  type="button"
                  onClick={handleSelectFromContacts}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-sm hover:scale-110 active:scale-90 transition-all"
                  title="البحث في جهات اتصال الهاتف"
                >
                  📱
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">العنوان / المنطقة</label>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 font-black text-base sm:text-lg outline-none border-2 border-transparent focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                placeholder="مكان العمل أو السكن"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white p-5 sm:p-7 rounded-2xl sm:rounded-[2rem] font-black text-lg sm:text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 border-b-4 sm:border-b-8 border-blue-800"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <><span>حفظ العميل سحابياً</span><span className="text-xl sm:text-3xl">💾</span></>
          )}
        </button>
      </form>
    </PageLayout>
  );
};

export default AddCustomer;
