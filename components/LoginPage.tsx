
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

const LoginPage: React.FC = () => {
  const { loginAction, registerAction, resetPasswordAction } = useAuth();
  const { theme, addNotification } = useUI();
  
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    agencyName: ''
  });
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('صباح الخير، رزقكم الله من واسع فضله ☀️');
    else setGreeting('مساء الخير، أهلاً بك في نظامك الذكي ✨');
    
    // محاولة استعادة البريد المحفوظ إذا كان تذكرني مفعلاً سابقاً
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
    }
  }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const emailToUse = formData.email.includes('@') ? formData.email : `${formData.email}@alshwaia.com`;

    try {
      if (isRegister) {
        await registerAction({
          agencyName: formData.agencyName,
          fullName: formData.fullName,
          email: emailToUse,
          password: formData.password
        });
      } else {
        await loginAction(emailToUse, formData.password);
        if (rememberMe) {
          localStorage.setItem('remembered_email', formData.email);
        } else {
          localStorage.removeItem('remembered_email');
        }
      }
    } catch (err: any) {
      const msg = err?.message || (typeof err === 'string' ? err : 'عذراً، تأكد من البيانات المدخلة أو جودة الاتصال');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف أولاً لإرسال رابط الاستعادة');
      return;
    }
    
    const emailToUse = formData.email.includes('@') ? formData.email : `${formData.email}@alshwaia.com`;
    
    setIsLoading(true);
    try {
      await resetPasswordAction(emailToUse);
      addNotification("تم الإرسال 📧", "يرجى فحص بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور", "success");
      setError('');
    } catch (err: any) {
      setError(err.message || "تعذر إرسال رابط الاستعادة حالياً");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-all duration-700 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-sky-500/10 dark:bg-emerald-600/5 rounded-full blur-[150px] animate-spin-slow"></div>
      
      <div className="w-full max-w-lg relative z-10 page-enter">
        <div className="text-center mb-12">
          <div className="relative inline-block animate-float">
             <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full scale-150 animate-pulse-glow"></div>
             <div className="w-36 h-36 bg-gradient-to-br from-sky-400 to-sky-700 dark:from-emerald-400 dark:to-emerald-800 rounded-[3rem] flex items-center justify-center text-8xl shadow-2xl mx-auto border-[8px] border-white dark:border-slate-800 relative z-10">
               🌿
             </div>
          </div>
          <h1 className="text-5xl font-black text-slate-950 dark:text-white mt-8 tracking-tighter leading-none">الشويع للقات</h1>
          <p className="text-sky-800 dark:text-primary-400 font-bold text-sm mt-4 italic opacity-80">
            {isRegister ? 'أنشئ حسابك السحابي الآمن' : greeting}
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-10 rounded-[3.5rem] shadow-2xl border border-white dark:border-white/5">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-10 relative">
            <button 
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-4 rounded-xl font-black text-sm relative z-10 transition-all ${!isRegister ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-sky-500'}`}
            >
              دخول
            </button>
            <button 
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-4 rounded-xl font-black text-sm relative z-10 transition-all ${isRegister ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-sky-500'}`}
            >
              جديد
            </button>
          </div>

          <form onSubmit={handleAction} className="space-y-6">
            {error && <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 p-5 rounded-2xl text-[11px] font-black text-center border border-rose-100 italic animate-pulse">{error}</div>}

            <div className="space-y-4">
              {isRegister && (
                <>
                  <div className="relative group">
                    <input 
                      type="text" 
                      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 pr-12 font-black text-slate-950 dark:text-white outline-none focus:border-sky-500 border-2 border-slate-200 dark:border-transparent transition-all shadow-inner"
                      placeholder="اسم الوكالة"
                      value={formData.agencyName}
                      onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🏛️</span>
                  </div>
                  <div className="relative group">
                    <input 
                      type="text" 
                      className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 pr-12 font-black text-slate-950 dark:text-white outline-none focus:border-sky-500 border-2 border-slate-200 dark:border-transparent transition-all shadow-inner"
                      placeholder="اسمك الكامل"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">👤</span>
                  </div>
                </>
              )}
              <div className="relative group">
                <input 
                  type="text" 
                  className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 pr-12 font-black text-slate-950 dark:text-white outline-none focus:border-sky-500 border-2 border-slate-200 dark:border-transparent transition-all shadow-inner"
                  placeholder="رقم الهاتف أو البريد"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">📧</span>
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  className="w-full bg-white dark:bg-slate-800 rounded-2xl p-5 pr-12 font-black text-slate-950 dark:text-white outline-none focus:border-sky-500 border-2 border-slate-200 dark:border-transparent transition-all shadow-inner"
                  placeholder="كلمة المرور"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 text-xl">🔑</span>
              </div>

              {!isRegister && (
                <div className="flex items-center justify-between px-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md peer-checked:bg-sky-600 peer-checked:border-sky-600 transition-all"></div>
                      <span className="absolute text-white opacity-0 peer-checked:opacity-100 left-1 font-bold text-[10px]">✓</span>
                    </div>
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400 group-hover:text-sky-600 transition-colors">تذكرني</span>
                  </label>
                  
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-xs font-black text-sky-600 hover:text-sky-500 hover:underline transition-all"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white p-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 border-b-4 border-sky-800"
            >
              {isLoading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div> : (isRegister ? 'إنشاء حساب سحابي' : 'تسجيل الدخول الآمن')}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] opacity-40">نظام إدارة الوكالات الذكي v3.1</p>
      </div>
    </div>
  );
};

export default LoginPage;
