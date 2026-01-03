
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';

const AddOpeningBalance: React.FC = () => {
  const { addOpeningBalance, navigate, customers, suppliers, addNotification, theme } = useApp();
  
  const [personTypeFilter, setPersonTypeFilter] = useState<'عميل' | 'مورد' | 'الكل'>('الكل');
  const [formData, setFormData] = useState({
    person_id: '',
    person_name: '',
    person_real_type: 'عميل' as 'عميل' | 'مورد',
    balance_type: 'مدين' as 'مدين' | 'دائن', // مدين = لنا، دائن = علينا
    amount: 0,
    currency: 'YER' as 'YER' | 'SAR' | 'OMR',
    notes: 'رصيد افتتاحي سابق',
    date: new Date().toISOString()
  });

  const filteredList = useMemo(() => {
    const custs = customers.map((c: any) => ({ ...c, type: 'عميل' }));
    const supps = suppliers.map((s: any) => ({ ...s, type: 'مورد' }));
    
    if (personTypeFilter === 'عميل') return custs;
    if (personTypeFilter === 'مورد') return supps;
    return [...custs, ...supps].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, suppliers, personTypeFilter]);

  const handlePersonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const person = filteredList.find(p => p.id === selectedId);
    if (person) {
      setFormData({
        ...formData,
        person_id: selectedId,
        person_name: person.name,
        person_real_type: person.type
      });
    } else {
      setFormData({ ...formData, person_id: '', person_name: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.person_id || formData.amount <= 0) {
      addNotification("تنبيه ⚠️", "يرجى اختيار الاسم وتحديد المبلغ", "warning");
      return;
    }

    try {
      await addOpeningBalance({
        ...formData,
        person_type: formData.person_real_type
      });
      addNotification("تم القيد بنجاح ✅", "تم تسجيل الرصيد السابق في السحابة", "success");
      navigate('debts');
    } catch (err) {
      addNotification("خطأ ❌", "تعذر حفظ الرصيد، حاول ثانية", "warning");
    }
  };

  return (
    <PageLayout title="ديون قديمة (رصيد سابق)" onBack={() => navigate('debts')}>
      <form onSubmit={handleSubmit} className="space-y-4 page-enter max-w-md mx-auto pb-20 px-1">
        
        <div className={`rounded-[2.5rem] p-6 lg:p-8 shadow-2xl border transition-all ${
          theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
        } space-y-6`}>
          
          <div className="flex justify-center -mt-14 mb-2">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-xl border-4 border-white dark:border-slate-900">
              ⚖️
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['الكل', 'عميل', 'مورد'] as const).map(t => (
              <button 
                key={t} type="button" 
                onClick={() => setPersonTypeFilter(t)} 
                className={`py-2 rounded-lg font-black text-[10px] transition-all ${
                  personTypeFilter === t ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-widest">اختر الاسم</label>
            <select 
              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-xl p-4 font-black text-base outline-none"
              value={formData.person_id}
              onChange={handlePersonChange}
              required
            >
              <option value="">-- اضغط للاختيار --</option>
              {filteredList.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} {personTypeFilter === 'الكل' ? `(${p.type})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button"
              onClick={() => setFormData({...formData, balance_type: 'مدين'})}
              className={`p-4 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-1 ${
                formData.balance_type === 'مدين' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
              }`}
            >
              <span className="text-xl">📈</span>
              <span className="text-[10px]">لنا (دين)</span>
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, balance_type: 'دائن'})}
              className={`p-4 rounded-2xl border-2 font-black transition-all flex flex-col items-center gap-1 ${
                formData.balance_type === 'دائن' ? 'bg-rose-500/10 border-rose-500 text-rose-600' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'
              }`}
            >
              <span className="text-xl">📉</span>
              <span className="text-[10px]">علينا (حق)</span>
            </button>
          </div>

          <div className="space-y-3">
            <input 
              type="number" 
              className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-5 font-black text-center text-4xl outline-none tabular-nums ${
                formData.balance_type === 'مدين' ? 'text-emerald-500' : 'text-rose-500'
              }`}
              value={formData.amount || ''} 
              placeholder="0" 
              onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})} 
              required 
            />
            <div className="grid grid-cols-3 gap-2">
              {['YER', 'SAR', 'OMR'].map(cur => (
                <button 
                  key={cur} type="button" 
                  onClick={() => setFormData({...formData, currency: cur as any})} 
                  className={`py-2.5 rounded-xl font-black text-[10px] border-2 transition-all ${
                    formData.currency === cur ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'border-slate-100 dark:border-white/5 text-slate-400'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          {/* مربع بيان الدين السابق المطور */}
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase px-2">مربع بيان (وصف الدين)</label>
             <textarea 
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 rounded-2xl p-4 font-bold text-sm outline-none transition-all shadow-inner" 
                rows={2} 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
                placeholder="مثلاً: رصيد مرحل من الدفتر القديم شهر 1" 
             />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-indigo-600 text-white p-6 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 border-b-8 border-indigo-900 transition-all"
        >
          تثبيت الرصيد السابق ✅
        </button>
      </form>
    </PageLayout>
  );
};

export default AddOpeningBalance;
