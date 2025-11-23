
import React from 'react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { User as UserIcon, CreditCard, Calendar, Mail, Crown, Settings } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpgrade: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpgrade }) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8">
      <div className="glass-card rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
        {/* Banner */}
        <div className="h-48 bg-gradient-to-r from-indigo-900 via-purple-900 to-black relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            {user.isAdmin && (
                <div className="absolute top-6 right-6 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                    <Crown size={14} /> Admin
                </div>
            )}
        </div>

        {/* Content */}
        <div className="px-10 pb-10 relative z-10">
            {/* Avatar Section */}
            <div className="flex justify-between items-end -mt-16 mb-8">
                <div className="relative">
                    <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-pink-500 p-1 shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                        <div className="w-full h-full bg-black rounded-[1.8rem] flex items-center justify-center text-5xl font-bold text-white">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center">
                         <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                </div>
                
                {user.plan === 'Free' && (
                    <button 
                        onClick={onUpgrade}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Crown size={18} /> {t('dash_unlock')}
                    </button>
                )}
            </div>

            {/* User Info */}
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-white mb-2">{user.name}</h1>
                <p className="text-gray-400 flex items-center gap-2"><Mail size={16} /> {user.email}</p>
            </div>

            {/* Details Grid */}
            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                <Settings size={16} /> {t('prof_details')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition duration-300 group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-900/30 text-blue-400 rounded-xl group-hover:scale-110 transition">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">{t('prof_plan')}</p>
                            <p className="text-xl font-bold text-white">{user.plan}</p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${user.plan === 'Free' ? 'bg-gray-500 w-1/4' : 'bg-gradient-to-r from-blue-500 to-purple-500 w-full'} rounded-full`}></div>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition duration-300 group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-pink-900/30 text-pink-400 rounded-xl group-hover:scale-110 transition">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">{t('prof_member_since')}</p>
                            <p className="text-xl font-bold text-white">{new Date(parseInt(user.id)).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 w-3/4 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
