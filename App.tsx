
import React, { useState, useEffect, useRef } from 'react';
import { User, Reminder, PlanConfig } from './types';
import * as Storage from './services/storageService';
import { Mic, Bell, ShieldCheck, LogOut, Menu, X, User as UserIcon, ArrowLeft, Globe, ChevronDown, LayoutGrid } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import { LANGUAGES, LanguageCode } from './utils/translations';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import Pricing from './components/Pricing';
import Checkout from './components/Checkout';
import LandingPage from './components/LandingPage';
import CustomCursor from './components/CustomCursor';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  
  const { t, language, setLanguage } = useLanguage();
  const langMenuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkUser = Storage.getCurrentUser();
    if (checkUser) {
        setUser(checkUser);
        if(currentPage === 'landing') setCurrentPage('home');
    } else {
        if(!['login', 'signup'].includes(currentPage)) {
            setCurrentPage('landing');
        }
    }
  }, []);

  useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleLogout = () => {
    Storage.logoutUser();
    setUser(null);
    setCurrentPage('landing');
    setSelectedPlan(null);
  };

  const navigate = (page: string) => {
    if (page === currentPage) return;
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const handlePlanSelection = (plan: PlanConfig) => {
      setSelectedPlan(plan);
      if(user) {
          navigate('checkout');
      } else {
          navigate('signup');
      }
  }

  const handleAuthSuccess = (u: User) => {
      setUser(u);
      if (selectedPlan) {
          navigate('pricing');
      } else {
          navigate('home');
      }
  };

  const getBackgroundClass = () => {
      return "bg-black selection:bg-purple-500/30";
  };

  const renderContent = () => {
    return (
        <div key={currentPage} className="page-enter-active w-full">
            {(() => {
                if (!user) {
                    if (currentPage === 'signup') {
                        return <Auth type="signup" onSuccess={handleAuthSuccess} onSwitchMode={() => navigate('login')} />;
                    }
                    if (currentPage === 'login') {
                        return <Auth type="login" onSuccess={handleAuthSuccess} onSwitchMode={() => navigate('signup')} />;
                    }
                    return <LandingPage onNavigate={navigate} onSelectPlan={handlePlanSelection} />;
                }

                if (currentPage === 'admin') {
                    return <AdminPanel onBack={() => navigate('home')} />;
                }

                if (currentPage === 'pricing') {
                    return <Pricing onSelectPlan={handlePlanSelection} />;
                }

                if (currentPage === 'checkout') {
                    return <Checkout plan={selectedPlan} user={user} onComplete={() => navigate('home')} onCancel={() => navigate('pricing')} />;
                }
                
                if (currentPage === 'profile') {
                    return <Profile user={user} onUpgrade={() => navigate('pricing')} />;
                }

                // 'home' renders the Workspace/Dashboard with Tabs
                return <Dashboard user={user} onUpgrade={() => navigate('pricing')} />;
            })()}
        </div>
    );
  };

  const showBackButton = currentPage !== 'landing' && currentPage !== 'home' && currentPage !== 'login' && currentPage !== 'signup';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-1000 ${getBackgroundClass()} text-slate-50 relative overflow-x-hidden`}>
      <CustomCursor />

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         <div className={`absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] animate-pulse ${currentPage === 'admin' ? 'bg-red-900/20' : 'bg-indigo-900/10'}`}></div>
         <div className={`absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] animate-pulse ${currentPage === 'admin' ? 'bg-orange-900/20' : 'bg-fuchsia-900/10'}`} style={{ animationDelay: '2s' }}></div>
      </div>
      
      <nav className={`w-full z-50 transition-all duration-300 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center cursor-pointer group" onClick={() => navigate(user ? 'home' : 'landing')}>
              <div className="relative transition-transform duration-300 group-hover:scale-110">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-xl opacity-50 group-hover:opacity-100 transition duration-500 rounded-full"></div>
                <Mic className="h-8 w-8 relative z-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
              <span className="ml-3 font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-gray-400 group-hover:to-white transition-all">
                VoiceMinder
              </span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-4 flex items-center space-x-1">
                
                <div className="relative mr-1" ref={langMenuRef}>
                    <button 
                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                        className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 text-xs font-bold uppercase"
                    >
                        <Globe size={14} />
                        <span>{language}</span>
                        <ChevronDown size={12} className={`transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {langMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 max-h-80 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 z-50 custom-scrollbar">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        setLangMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition flex justify-between items-center ${language === lang.code ? 'text-purple-400 font-bold bg-white/5' : 'text-gray-300'}`}
                                >
                                    <span>{lang.nativeName}</span>
                                    {language === lang.code && <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {user ? (
                  <>
                    <button onClick={() => navigate('home')} className={`hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:bg-white/5 hover:scale-105 ${currentPage === 'home' ? 'text-white bg-white/5 shadow-lg' : 'text-gray-300'}`}>
                        <LayoutGrid size={16} /> {t('nav_workspace')}
                    </button>
                    <button onClick={() => navigate('profile')} className={`hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 hover:bg-white/5 hover:scale-105 ${currentPage === 'profile' ? 'text-white bg-white/5 shadow-lg' : 'text-gray-300'}`}>
                        <UserIcon size={16} /> {t('nav_dashboard')}
                    </button>
                    <button onClick={() => navigate('pricing')} className="hover:text-white text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-white/5 hover:scale-105">{t('nav_upgrade')}</button>
                    <button onClick={() => navigate('admin')} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 ${currentPage === 'admin' ? 'text-red-400 bg-red-900/20 border border-red-500/30' : 'text-gray-300 hover:bg-white/5 hover:text-red-300'}`}>
                        <ShieldCheck size={16} /> {t('nav_admin')}
                    </button>
                    <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent mx-1"></div>
                    <button onClick={handleLogout} className="group bg-red-500/10 border border-red-500/30 hover:bg-red-500/30 text-red-200 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('nav_logout')}
                    </button>
                  </>
                ) : (
                  <>
                    {currentPage !== 'landing' && (
                        <button onClick={() => navigate('landing')} className="hover:text-white text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition hover:bg-white/5 hover:scale-105">{t('nav_home')}</button>
                    )}
                     <button onClick={() => navigate('login')} className="hover:text-white text-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium transition hover:bg-white/5 hover:scale-105">{t('nav_login')}</button>
                     <button onClick={() => navigate('signup')} className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105">{t('nav_signup')}</button>
                  </>
                )}
              </div>
            </div>

            <div className="-mr-2 flex md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none">
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {showBackButton && (
            <div className="w-full bg-white/5 border-b border-white/5 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <button 
                        onClick={() => navigate('home')} 
                        className="group flex items-center gap-2 py-3 text-sm text-gray-400 hover:text-white transition-all"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t('nav_back')}
                    </button>
                </div>
            </div>
        )}

        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-top-5">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <div className="px-3 py-2">
                 <p className="text-xs text-gray-500 uppercase mb-2 font-bold">Language</p>
                 <div className="grid grid-cols-2 gap-2">
                     {LANGUAGES.slice(0, 6).map(lang => (
                         <button 
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setMobileMenuOpen(false);
                            }}
                            className={`px-2 py-1 text-sm rounded text-center ${language === lang.code ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400'}`}
                         >
                             {lang.nativeName}
                         </button>
                     ))}
                 </div>
              </div>
              <div className="border-t border-white/10 my-2"></div>

              {user ? (
                  <>
                    <button onClick={() => navigate('home')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white">{t('nav_workspace')}</button>
                    <button onClick={() => navigate('profile')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white">{t('nav_dashboard')}</button>
                    <button onClick={() => navigate('pricing')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-white/10 hover:text-white">{t('nav_upgrade')}</button>
                    <button onClick={() => navigate('admin')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-red-900/20">{t('nav_admin')}</button>
                    <button onClick={handleLogout} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-red-900/20">{t('nav_logout')}</button>
                  </>
                ) : (
                  <>
                     <button onClick={() => navigate('landing')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-white/10">{t('nav_home')}</button>
                     <button onClick={() => navigate('login')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:bg-white/10">{t('nav_login')}</button>
                     <button onClick={() => navigate('signup')} className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-purple-400 hover:bg-white/10">{t('nav_signup')}</button>
                  </>
                )}
            </div>
          </div>
        )}
      </nav>

      <main className={`flex-grow relative z-10 ${currentPage === 'landing' ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {renderContent()}
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-black/60 backdrop-blur-xl text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-6 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] cursor-pointer"><Mic size={18} /></div>
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] cursor-pointer"><UserIcon size={18} /></div>
          </div>
          <p className="mb-2 text-sm tracking-wide">&copy; 2024 VoiceMinder OS. Crafted for <span className="text-white font-semibold">Productivity</span>.</p>
          <p className="text-xs text-gray-600">Owner Contact: usearningofficial@gmail.com</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
