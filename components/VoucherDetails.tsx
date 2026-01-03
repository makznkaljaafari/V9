
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { shareToWhatsApp, formatVoucherReceipt } from '../services/shareService';

const VoucherDetails: React.FC = () => {
  const { vouchers, navigationParams, navigate, deleteVoucher, addNotification, theme } = useApp();
  const voucherId = navigationParams?.voucherId;

  const voucher = useMemo(() => {
    return vouchers.find(v => v.id === voucherId);
  }, [vouchers, voucherId]);

  if (!voucher) {
    return (
      <PageLayout title="خطأ" onBack={() => navigate('vouchers')}>
        <div className="flex flex-col items-center justify-center py-40 text-rose-500">
          <span className="text-8xl mb-6">⚠️</span>
          <h2 className="text-2xl font-black">السند غير موجود</h2>
          <button onClick={() => navigate('vouchers')} className="mt-8 bg-slate-100 px-10 py-4 rounded-2xl font-black text-slate-600">العودة للقائمة</button>
        </div>
      </PageLayout>
    );
  }

  const handleShare = () => {
    const text = formatVoucherReceipt(voucher);
    shareToWhatsApp(text);
  };

  const handleDelete = async () => {
    if (window.confirm(`⚠️ حذف سند ${voucher.person_name}؟\nسيتم تعديل رصيد الطرف الآخر آلياً.`)) {
      try {
        await deleteVoucher(voucher.id);
        addNotification("تم الحذف ✅", "تم حذف السند بنجاح.", "success");
        navigate('vouchers');
      } catch (err) {
        addNotification("خطأ ⚠️", "فشل الحذف.", "warning");
      }
    }
  };

  return (
    <PageLayout title="تفاصيل السند" onBack={() => navigate('vouchers')}>
      <div className="flex flex-col items-center pt-2 lg:pt-6 space-y-4 lg:space-y-8 page-enter pb-32 max-w-lg mx-auto px-1">
        
        {/* Visual Receipt Card - Optimized for tiny screens */}
        <div className={`w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden shadow-2xl border-2 lg:border-4 ${
          theme === 'dark' ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'
        }`}>
          {/* Header Section */}
          <div className={`p-5 lg:p-8 text-center relative ${
            voucher.type === 'قبض' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}>
            <div className="absolute top-2 right-4 text-white/10 font-black text-xl lg:text-4xl select-none">#{voucher.id.slice(0, 4)}</div>
            <div className="w-14 h-14 lg:w-20 lg:h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl lg:text-4xl mx-auto mb-2 lg:mb-4 border-2 border-white/30 shadow-lg">
               {voucher.type === 'قبض' ? '📥' : '📤'}
            </div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tighter">سند {voucher.type} مالي</h2>
            <p className="text-[8px] lg:text-[10px] font-bold opacity-80 mt-1 uppercase tracking-widest">{voucher.currency} VOUCHER RECEIPT</p>
          </div>

          {/* Body Section */}
          <div className="p-5 lg:p-8 space-y-6 lg:space-y-8">
            <div className="flex flex-col items-center gap-1 pb-4 border-b border-slate-100 dark:border-white/5">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">الطرف المستلم/المسدد</p>
                <h3 className="text-lg lg:text-2xl font-black text-slate-900 dark:text-white text-center">{voucher.person_name}</h3>
                <span className="text-[8px] lg:text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-lg font-black">{voucher.person_type}</span>
            </div>

            <div className="flex flex-col items-center gap-0.5">
                <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">قيمة السند</p>
                <h2 className={`text-3xl lg:text-5xl font-black tabular-nums tracking-tighter ${
                    voucher.type === 'قبض' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                    {voucher.amount.toLocaleString()} <small className="text-sm lg:text-xl font-black opacity-30">{voucher.currency}</small>
                </h2>
            </div>

            {/* مربع البيان المطور والبارز */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border-2 border-slate-100 dark:border-white/5 relative overflow-hidden group shadow-inner">
               <p className="text-[8px] lg:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 text-center">البيان / الوصف</p>
               <p className="text-sm lg:text-lg font-bold leading-relaxed text-center text-slate-700 dark:text-slate-200 italic">
                 "{voucher.notes || 'تم توثيق هذا السند في السجلات المالية للوكالة.'}"
               </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center border-t border-slate-100 dark:border-white/5 pt-4">
              <div className="space-y-0.5">
                 <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest">التاريخ</p>
                 <p className="text-[10px] lg:text-xs font-black text-slate-900 dark:text-white tabular-nums">
                    {new Date(voucher.date).toLocaleDateString('ar-YE')}
                 </p>
              </div>
              <div className="space-y-0.5">
                 <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest">الوقت</p>
                 <p className="text-[10px] lg:text-xs font-black text-slate-900 dark:text-white tabular-nums">
                    {new Date(voucher.date).toLocaleTimeString('ar-YE', {hour:'2-digit', minute:'2-digit'})}
                 </p>
              </div>
            </div>
            
            <div className="pt-4 flex flex-col gap-2">
               <button onClick={handleShare} className="w-full bg-emerald-500 text-white p-4 rounded-xl lg:rounded-2xl font-black text-sm lg:text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                  <span>واتساب</span>
                  <span className="text-lg lg:text-xl">💬</span>
               </button>
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => window.print()} className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-3 rounded-xl font-black text-[10px] lg:text-xs hover:bg-slate-200 transition-all no-print">
                     طباعة 📄
                  </button>
                  <button onClick={handleDelete} className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl font-black text-[10px] lg:text-xs border border-rose-100 dark:border-rose-900/30 hover:bg-rose-600 hover:text-white transition-all no-print">
                     حذف السند 🗑️
                  </button>
               </div>
            </div>
          </div>
          
          <div className="bg-slate-950 p-3 text-center">
             <p className="text-[6px] lg:text-[7px] font-black text-white/20 uppercase tracking-[0.4em]">نظام الشويع الذكي - موثق سحابياً</p>
          </div>
        </div>

        <button onClick={() => navigate('vouchers')} className="text-slate-400 font-black text-[10px] lg:text-xs hover:text-indigo-500 transition-colors no-print">العودة لقائمة السندات</button>
      </div>
    </PageLayout>
  );
};

export default VoucherDetails;
