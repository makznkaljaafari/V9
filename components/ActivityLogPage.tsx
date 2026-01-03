
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PageLayout } from './ui/Layout';
import { dataService } from '../services/dataService';
import { ActivityLog } from '../types';

const ActivityLogPage: React.FC = () => {
  const { navigate, theme } = useApp();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await dataService.getActivityLogs();
      setLogs(data);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'sale': return '💰';
      case 'purchase': return '📦';
      case 'voucher': return '📥';
      case 'waste': return '🥀';
      default: return '🛡️';
    }
  };

  const getLabel = (type: string) => {
    switch(type) {
      case 'sale': return 'بيع';
      case 'purchase': return 'توريد';
      case 'voucher': return 'سند';
      case 'waste': return 'تالف';
      default: return 'نظام';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'sale': return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400';
      case 'purchase': return 'text-orange-600 bg-orange-50 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/30 dark:text-orange-400';
      case 'voucher': return 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800/30 dark:text-indigo-400';
      case 'waste': return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400';
      default: return 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-700/30 dark:text-slate-400';
    }
  };

  return (
    <PageLayout title="سجل الرقابة السحابي" onBack={() => navigate('dashboard')}>
      <div className="space-y-6 lg:space-y-12 pb-32 max-w-7xl mx-auto w-full px-1">
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الحركات</p>
              <p className="text-2xl font-black text-indigo-600 tabular-nums">{logs.length}</p>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المبيعات اليوم</p>
              <p className="text-2xl font-black text-emerald-600 tabular-nums">{logs.filter(l => l.type === 'sale').length}</p>
           </div>
           <div className="hidden lg:block bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">حالة الاتصال</p>
              <p className="text-2xl font-black text-emerald-500">Live ☁️</p>
           </div>
           <div className="hidden lg:block bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">آخر تحديث</p>
              <p className="text-sm font-black text-slate-500">{new Date().toLocaleTimeString('ar-YE')}</p>
           </div>
        </div>

        {/* Search Bar */}
        <div className="relative group max-w-3xl mx-auto w-full px-1">
          <input 
            type="text" placeholder="بحث في السجلات (اسم، مبلغ، إجراء)..."
            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-transparent focus:border-indigo-500 rounded-2xl lg:rounded-3xl p-5 lg:p-8 pr-14 lg:pr-20 font-black text-base lg:text-xl text-slate-900 dark:text-white shadow-xl transition-all"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-5 lg:right-8 top-1/2 -translate-y-1/2 text-2xl lg:text-3xl opacity-20">🔍</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black text-slate-400 animate-pulse">جاري جلب البيانات من السحابة...</p>
          </div>
        )}

        {/* --- Mobile View: Details Card Layout --- */}
        {!isLoading && (
          <div className="lg:hidden space-y-4 px-1">
            {filteredLogs.map((log) => (
              <div key={log.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-white/5 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border flex items-center gap-2 ${getTypeColor(log.type)}`}>
                    <span className="text-sm">{getTypeIcon(log.type)}</span>
                    <span>{getLabel(log.type)}</span>
                  </div>
                  <div className="text-left">
                     <p className="text-[10px] font-black text-slate-400 tabular-nums leading-none">
                       {new Date(log.timestamp).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                     </p>
                     <p className="text-[8px] font-bold text-slate-300 mt-1">{new Date(log.timestamp).toLocaleDateString('ar-YE')}</p>
                  </div>
                </div>
                
                <h4 className="font-black text-slate-900 dark:text-white text-base lg:text-lg mb-3">{log.action}</h4>
                
                <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10">
                   <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold italic">
                     {log.details}
                   </p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-50 dark:border-white/5">
                   <span className="text-[8px] font-black text-slate-400 tracking-tighter uppercase">Cloud ID: {log.id.slice(0, 12)}</span>
                   <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px]">✅</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Desktop View: Deep Table with High Visibility --- */}
        {!isLoading && (
          <div className="hidden lg:block overflow-hidden rounded-[3rem] shadow-3xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="p-8 font-black text-xs uppercase tracking-widest text-center w-24 border-l border-white/10">التوقيت</th>
                    <th className="p-8 font-black text-xs uppercase tracking-widest text-center w-32 border-l border-white/10">الفئة</th>
                    <th className="p-8 font-black text-xs uppercase tracking-widest border-l border-white/10 w-64">الإجراء الرقابي</th>
                    <th className="p-8 font-black text-xs uppercase tracking-widest">التفاصيل الكاملة للعملية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-indigo-900/5 transition-colors group">
                      <td className="p-8 border-l border-slate-100 dark:border-slate-800/50">
                        <p className="font-black text-lg text-slate-900 dark:text-white tabular-nums">{new Date(log.timestamp).toLocaleTimeString('ar-YE')}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString('ar-YE')}</p>
                      </td>
                      <td className="p-8 text-center border-l border-slate-100 dark:border-slate-800/50">
                        <div className={`px-4 py-3 rounded-2xl flex flex-col items-center justify-center gap-1 border shadow-sm ${getTypeColor(log.type)}`}>
                          <span className="text-3xl">{getTypeIcon(log.type)}</span>
                          <span className="text-[10px] font-black uppercase">{getLabel(log.type)}</span>
                        </div>
                      </td>
                      <td className="p-8 border-l border-slate-100 dark:border-slate-800/50">
                         <p className="font-black text-xl text-slate-900 dark:text-white mb-1">{log.action}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">REF: {log.id.slice(0, 16)}</p>
                      </td>
                      <td className="p-8">
                         <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[1.8rem] border border-slate-100 dark:border-white/5 shadow-inner">
                            <p className="font-bold text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                               {log.details.split('|').map((part, i) => (
                                 <span key={i} className={`inline-block ml-4 mb-2 ${i > 0 ? 'border-r-2 border-slate-200 dark:border-slate-700 pr-4' : ''}`}>
                                   {part.trim()}
                                 </span>
                               ))}
                            </p>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredLogs.length === 0 && (
          <div className="p-40 text-center opacity-30 font-black text-3xl italic flex flex-col items-center gap-6">
             <span className="text-[10rem]">🛡️</span>
             <p>لا توجد أي نشاطات تطابق بحثك حالياً</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ActivityLogPage;
