import React, { useState, useEffect } from 'react';
import { User, PlanType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { User as UserIcon, CreditCard, Calendar, Mail, Crown, Settings, Pencil, Check, X as XIcon, Zap, Rocket, Gem } from 'lucide-react';
import { updateUserName } from '../services/storageService';
import { OWNER_EMAIL, PLANS } from '../constants';

interface ProfileProps {
  user: User;
  onUpgrade: () => void;
  onUserUpdate: (updatedUser: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpgrade, onUserUpdate }) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name);

  useEffect(() => {
    setTempName(user.name);
  }, [user.name]);

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    const updated = await updateUserName(user.id, tempName);
    if (updated) {
        onUserUpdate(updated);
        setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setTempName(user.name);
    setIsEditing(false);
  };

  const isOwner = user.email === OWNER_EMAIL;
  
  const getDisplayPlan = () => {
      if (isOwner) return "GOD MODE (ADMIN)";
      if (user.plan === PlanType.FREE) return "Free Plan";
      
      const planConfig = PLANS.find(p => p.type === user.plan);
      if (planConfig) {
          return `${t(planConfig.nameLabel)} (${user.plan})`;
      }
      return user.plan;
  };

  const displayPlan = getDisplayPlan();

  const getPlanIcon = () => {
     if (isOwner) return <Crown size={24} className="text-yellow-400" />;
     if (user.plan === PlanType.LIFETIME) return <Crown size={24} className="text-orange-400" />;
     if (user.plan === PlanType.YEARLY) return <Gem size={24} className="text-pink-400" />;
     if (user.plan === PlanType.HALF_YEARLY) return <Rocket size={24} className="text-purple-400" />;
     if (user.plan === PlanType.MONTHLY) return <Zap size={24} className="text-yellow-400" />;
     return <UserIcon size={24} className="text-gray-400" />;
  };

  return (
    <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8">
      <div className="glass-card rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
        <div className="h-48 bg-gradient-to-r from-indigo-900 via-purple-900 to-black relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            {user.isAdmin && (
                <div className="absolute top-6 right-6 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg">
                    <Crown size={14} /> Admin
                </div>
            )}
        </div>

        <div className="px-10 pb-10 relative z-10">
            <div className="flex justify-between items-end -mt-16 mb-8">
                <div className="relative">
                    <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-pink-500 p-1 shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                        <div className="w-full h-full bg-black rounded-[1.8rem] flex items-center justify-center text-5xl font-bold text-white uppercase">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center">
                         <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                </div>
                
                {user.plan === 'Free' && !isOwner && (
                    <button 
                        onClick={onUpgrade}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Crown size={18} /> {t('dash_unlock')}
                    </button>
                )}
            </div>

            <div className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    {isEditing ? (
                        <div className="flex items-center gap-2 w-full max-w-md animate-in slide-in-from-left-2">
                            <input 
                                type="text" 
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-2xl font-bold text-white focus:outline-none focus:border-indigo-500 w-full"
                                autoFocus
                            />
                            <button 
                                onClick={handleSaveName}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500 hover:text-black transition"
                            >
                                <Check size={20} />
                            </button>
                            <button 
                                onClick={cancelEdit}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition"
                            >
                                <XIcon size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 group">
                            <h1 className="text-4xl font-extrabold text-white">{user.name}</h1>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"
                                title="Edit Name"
                            >
                                <Pencil size={18} />
                            </button>
                        </div>
                    )}
                </div>
                <p className="text-gray-400 flex items-center gap-2"><Mail size={16} /> {user.email}</p>
            </div>

            <h3 className="text-gray-500 font-bold uppercase tracking-wider text-sm mb-6 flex items-center gap-2">
                <Settings size={16} /> {t('prof_details')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition duration-300 group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-900/30 text-blue-400 rounded-xl group-hover:scale-110 transition border border-blue-500/20">
                            {getPlanIcon()}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">{t('prof_plan')}</p>
                            <p className={`text-xl font-black uppercase ${isOwner || user.plan === PlanType.LIFETIME ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400' : 'text-white'}`}>
                                {displayPlan}
                            </p>
                        </div>
                    </div>
                    <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${user.plan === 'Free' && !isOwner ? 'bg-gray-500 w-1/4' : 'bg-gradient-to-r from-blue-500 to-purple-500 w-full'} rounded-full`}></div>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition duration-300 group">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-pink-900/30 text-pink-400 rounded-xl group-hover:scale-110 transition border border-pink-500/20">
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