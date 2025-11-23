
import React, { useState, useEffect, useRef } from 'react';
import { User, Reminder, PlanType } from '../types';
import * as Storage from '../services/storageService';
import * as GeminiService from '../services/geminiService';
import ChatSupport from './ChatSupport';
import { OWNER_EMAIL, VOICE_OPTIONS } from '../constants';
import { Clock, Play, Trash2, Plus, Settings, Volume2, Bell, Zap, X, Calendar, Mic, CheckCircle, Repeat, Activity, Music, Smile, TrendingUp, CalendarDays, Layout, BarChart3, AlertOctagon, FastForward, CheckSquare, List, Trash, Lock, Timer, Crown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  user: User;
  onUpgrade: () => void;
}

type Tab = 'create' | 'data' | 'analytics';

// --- Helper Component for Locked Feature ---
const LockedFeature: React.FC<{ isLocked: boolean; children: React.ReactNode; onUpgrade: () => void }> = ({ isLocked, children, onUpgrade }) => {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative group h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 to-black/80 backdrop-blur-sm z-20 flex items-center justify-center flex-col border border-red-500/30 rounded-xl cursor-not-allowed">
         <Lock className="text-red-400 mb-2" size={24} />
         <span className="text-red-200 font-bold text-xs uppercase tracking-wider">LOCKED</span>
         <button onClick={onUpgrade} className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-full transition">
            Buy Plan
         </button>
      </div>
      <div className="opacity-20 pointer-events-none filter blur-[2px] h-full">
         {children}
      </div>
    </div>
  );
};

// --- Helper Component for Locked Tab Overlay ---
const TabLockOverlay: React.FC<{ title: string; desc: string; onUpgrade: () => void }> = ({ title, desc, onUpgrade }) => {
  return (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md rounded-2xl"></div>
          <div className="relative z-10 glass-card p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] text-center border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full mx-auto">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg animate-pulse">
                   <Lock size={32} className="text-white md:w-10 md:h-10" />
               </div>
               <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 md:mb-4">{title}</h2>
               <p className="text-gray-400 mb-6 md:mb-8 text-sm md:text-base">{desc}</p>
               <button 
                  onClick={onUpgrade}
                  className="w-full md:w-auto px-8 py-3 md:py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Lock size={16} /> Buy plan
               </button>
          </div>
      </div>
  );
}


const Dashboard: React.FC<DashboardProps> = ({ user: initialUser, onUpgrade }) => {
  const [user, setUser] = useState<User>(initialUser);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingTTS, setLoadingTTS] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [notification, setNotification] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const { t } = useLanguage();

  // Trial State
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [trialWarning, setTrialWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Form State
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [mood, setMood] = useState<'calm'|'urgent'|'cheerful'>('calm');
  const [speed, setSpeed] = useState(1.0);
  const [voiceId, setVoiceId] = useState('Kore');
  const [repeatVoice, setRepeatVoice] = useState(true);

  // Audio Control Ref for Loop
  const audioControlRef = useRef<{ source: AudioBufferSourceNode | null, ctx: AudioContext | null, timeoutId: any } | null>(null);
  // Ref to track if notification is active for the loop closure
  const isNotificationActiveRef = useRef(false);

  const isOwner = user.email === OWNER_EMAIL;

  useEffect(() => {
    let trialTimer: ReturnType<typeof setTimeout>;

    // Check User Validity/Trial Status on Mount and Interval
    const refreshUser = () => {
        const freshUser = Storage.checkTrialExpiry(user);
        setUser(freshUser);

        if (freshUser.isTrialEligible && !freshUser.trialActive && freshUser.plan === PlanType.FREE) {
            // Delay the popup by 10 seconds (10000ms)
            trialTimer = setTimeout(() => {
                setShowTrialModal(true);
            }, 10000);
        }
    };
    
    refreshUser();
    loadReminders();

    const interval = setInterval(() => {
        checkReminders();
        
        // Trial Timer Logic
        const freshUser = Storage.getCurrentUser();
        if(freshUser) {
            if(freshUser.trialActive && freshUser.trialEndsAt) {
                const diff = freshUser.trialEndsAt - Date.now();
                if(diff > 0) {
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${mins}m ${secs}s`);
                    
                    // Warning at 5 minutes
                    if(diff < 5 * 60 * 1000 && !trialWarning) {
                        setTrialWarning(true);
                    }
                } else {
                    // Expired
                    Storage.checkTrialExpiry(freshUser);
                    setUser({...freshUser, trialActive: false});
                    setTrialWarning(false);
                    setTimeLeft('');
                }
            }
        }
    }, 1000); 
    
    return () => {
        clearInterval(interval);
        clearTimeout(trialTimer);
        stopAudioLoop(); // Cleanup audio on unmount
    };
  }, [user.id]);

  const loadReminders = () => {
    setReminders(Storage.getReminders(user.id));
  };

  const checkReminders = () => {
    const now = new Date();
    const pending = Storage.getReminders(user.id).filter(r => !r.isCompleted);
    
    pending.forEach(r => {
      const rTime = new Date(r.time);
      if (rTime <= now && (now.getTime() - rTime.getTime()) < 60000 * 5) { 
         if(notification?.id !== r.id) {
             setNotification(r);
             isNotificationActiveRef.current = true;
             playReminderLoop(r);
             markAsCompleted(r.id);
         }
      }
    });
  };

  const markAsCompleted = (id: string) => {
      const list = Storage.getReminders(user.id);
      const idx = list.findIndex(r => r.id === id);
      if(idx !== -1) {
          list[idx].isCompleted = true;
          Storage.deleteReminder(id);
          Storage.saveReminder(list[idx]);
          loadReminders();
      }
  }
  
  const clearHistory = () => {
      if(window.confirm("Clear all completed reminders?")) {
          const completed = reminders.filter(r => r.isCompleted);
          completed.forEach(r => Storage.deleteReminder(r.id));
          loadReminders();
      }
  }

  // --- AUDIO LOOP LOGIC ---

  const stopAudioLoop = () => {
      if (audioControlRef.current) {
          try {
            audioControlRef.current.source?.stop();
          } catch(e) {}
          try {
             // We don't necessarily close context if it's shared, 
             // but here each play creates one, so closing is good.
             audioControlRef.current.ctx?.close();
          } catch(e) {}
          
          clearTimeout(audioControlRef.current.timeoutId);
          audioControlRef.current = null;
      }
  };

  const playReminderLoop = async (r: Reminder) => {
    setLoadingTTS(true);
    // Generate audio once
    const audioData = await GeminiService.generateSpeech(r.text, r.mood, r.voiceId);
    setLoadingTTS(false);

    if (audioData) {
        // Recursive function to play -> wait 2s -> play
        const playWithGap = async () => {
            if (!isNotificationActiveRef.current) return; // Stop if dismissed

            stopAudioLoop(); // Stop previous instance in memory if any

            const audioResult = await GeminiService.playAudioFromBase64(audioData, r.speed, false);
            
            if (audioResult) {
                const { source, context, duration } = audioResult;
                
                // Calculate total duration + 2 seconds gap
                const totalDurationMs = (duration * 1000) / r.speed;
                const nextPlayDelay = totalDurationMs + 2000; // 2000ms = 2 sec gap

                const timeoutId = setTimeout(() => {
                    if (isNotificationActiveRef.current) {
                        playWithGap();
                    }
                }, nextPlayDelay);

                audioControlRef.current = { source, ctx: context, timeoutId };
            }
        };

        playWithGap();
    }
  };
  
  const handleDismissNotification = () => {
      stopAudioLoop();
      isNotificationActiveRef.current = false;
      setNotification(null);
  };

  const handleSnoozeNotification = () => {
      stopAudioLoop();
      isNotificationActiveRef.current = false;
      
      if(notification) {
          // 1. Reschedule: Current time + 5 minutes
          const now = new Date();
          const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
          
          // 2. We need to un-complete it since checkReminders marked it complete
          // The reminder is currently in storage as completed. We need to update it.
          const list = Storage.getReminders(user.id);
          const idx = list.findIndex(r => r.id === notification.id);
          
          if(idx !== -1) {
              list[idx].isCompleted = false;
              list[idx].time = snoozeTime.toISOString();
              // Save
              Storage.deleteReminder(notification.id); // Remove old entry
              Storage.saveReminder(list[idx]); // Save new
          } else {
              // Fallback if not found (edge case), create new
              const newR = { ...notification, isCompleted: false, time: snoozeTime.toISOString() };
              Storage.saveReminder(newR);
          }
          
          loadReminders();
      }
      
      setNotification(null);
  };

  const handlePreviewVoice = async () => {
      setPreviewLoading(true);
      const previewText = text.trim() ? text : "This is a preview of your selected voice reminder.";
      const audioData = await GeminiService.generateSpeech(previewText, mood, voiceId);
      setPreviewLoading(false);
      if (audioData) {
          GeminiService.playAudioFromBase64(audioData, speed, false);
      }
  };

  const handleClaimTrial = () => {
      const updatedUser = Storage.activateTrial(user.id);
      if(updatedUser) {
          setUser(updatedUser);
          setShowTrialModal(false);
          alert("Deal Activated! You have 1 Hour of unrestricted access.");
      }
  }

  const handleRejectTrial = () => {
      const updatedUser = Storage.rejectTrial(user.id);
      if(updatedUser) {
          setUser(updatedUser);
          setShowTrialModal(false);
      }
  }

  // --- PLAN LOGIC & LIMITS ---
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRemindersCount = reminders.filter(r => r.time.startsWith(todayStr)).length;
  
  const isTrialActive = user.trialActive && user.trialEndsAt && Date.now() < user.trialEndsAt;

  const getDailyLimit = () => {
      if (isOwner) return 9999;
      if (isTrialActive) return 10; // Trial Limit as per prompt "First 10 Reminders" context
      
      switch (user.plan) {
          case PlanType.MONTHLY: return 5; // Plan 1 Limit
          case PlanType.HALF_YEARLY: return 20;
          case PlanType.YEARLY: return 35;
          case PlanType.LIFETIME: return 9999;
          default: return 3; // Default Free Limit
      }
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    
    const limit = getDailyLimit();
    if (todayRemindersCount >= limit) {
        alert(`Daily limit reached (${limit}). Upgrade your plan for more.`);
        return;
    }
    
    const combinedDateTime = new Date(`${date}T${timeStr}`);
    const newReminder: Reminder = {
      id: Date.now().toString(),
      userId: user.id,
      subject,
      text: text || "Reminder", // Fallback
      time: combinedDateTime.toISOString(),
      speed,
      mood,
      isCompleted: false,
      voiceId,
      repeatVoice
    };
    Storage.saveReminder(newReminder);
    loadReminders();
    setSubject(''); setText(''); setDate(''); setTimeStr('');
    
    // If Data tab is unlocked, go there. Else stay.
    if(!isTabLocked('data')) {
        setActiveTab('data');
    }
  };

  const handleDelete = (id: string) => {
      Storage.deleteReminder(id);
      loadReminders();
  }

  // --- LOCKING LOGIC ---
  
  // Returns true if the detailed features (Text, Mood, Voice, Test) are locked
  const isAdvancedFeatureLocked = () => {
      if (isOwner || isTrialActive) return false; // Trial unlocks everything
      
      if (user.plan === PlanType.MONTHLY) {
          return todayRemindersCount >= 5; // Plan 1: Locked after 5th
      }
      
      if (user.plan === PlanType.FREE) return true; // Free: Strictly Locked
      
      return false;
  };

  const isSpeedLocked = () => {
      if (isOwner || isTrialActive) return false;
      if (user.plan === PlanType.YEARLY || user.plan === PlanType.LIFETIME) return false;
      return true; // Locked for Free, Monthly, Half-Yearly
  };

  const isTabLocked = (tab: 'data' | 'analytics') => {
      if (isOwner || isTrialActive) return false; // Trial unlocks tabs
      
      if (tab === 'data') {
          if (user.plan === PlanType.MONTHLY || user.plan === PlanType.FREE) return true;
          return false;
      }

      if (tab === 'analytics') {
          if (user.plan === PlanType.MONTHLY || user.plan === PlanType.HALF_YEARLY || user.plan === PlanType.FREE) return true;
          return false;
      }
      return false;
  };

  // --- DATA PROCESSING ---
  
  const ongoingReminders = reminders.filter(r => !r.isCompleted).sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  const completedReminders = reminders.filter(r => r.isCompleted);
  const todayReminders = reminders.filter(r => r.time.startsWith(todayStr)).sort((a,b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const now = new Date();
  const nextUpcoming = ongoingReminders.find(r => new Date(r.time) > now);
  const urgentCount = ongoingReminders.filter(r => r.mood === 'urgent').length;
  const calmCount = ongoingReminders.filter(r => r.mood === 'calm').length;
  const cheerfulCount = ongoingReminders.filter(r => r.mood === 'cheerful').length;

  // --- ANALYTICS DATA ---
  const completedCount = completedReminders.length;
  const totalCount = reminders.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const barHeight1 = Math.min(100, reminders.length * 10);
  const barHeight2 = Math.min(100, completedReminders.length * 15);
  const barHeight3 = Math.min(100, ongoingReminders.length * 10);

  const moodCounts = {
      calm: reminders.filter(r => r.mood === 'calm').length,
      urgent: reminders.filter(r => r.mood === 'urgent').length,
      cheerful: reminders.filter(r => r.mood === 'cheerful').length
  };
  const maxMood = Math.max(moodCounts.calm, moodCounts.urgent, moodCounts.cheerful) || 1;

  const voiceCounts: Record<string, number> = {};
  let totalSpeed = 0;
  reminders.forEach(r => {
    const vId = r.voiceId || 'Kore';
    voiceCounts[vId] = (voiceCounts[vId] || 0) + 1;
    totalSpeed += r.speed;
  });
  const topVoiceId = Object.keys(voiceCounts).length > 0 
    ? Object.keys(voiceCounts).reduce((a, b) => voiceCounts[a] > voiceCounts[b] ? a : b)
    : '-';
  const topVoiceName = VOICE_OPTIONS.find(v => v.id === topVoiceId)?.name || topVoiceId;
  const avgSpeed = totalCount > 0 ? (totalSpeed / totalCount).toFixed(1) : '1.0';

  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const forecastCount = reminders.filter(r => {
      const d = new Date(r.time);
      return d > now && d <= nextWeek && !r.isCompleted;
  }).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative">
      
      {/* TRIAL ACTIVE HEADER INDICATOR */}
      {isTrialActive && (
          <div className="col-span-full bg-gradient-to-r from-yellow-600/80 to-orange-600/80 backdrop-blur-md p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center text-white shadow-lg animate-pulse border border-yellow-400/50 gap-2">
              <div className="flex items-center gap-2 font-bold text-center sm:text-left">
                  <Zap fill="white" className="animate-bounce flex-shrink-0" />
                  <span>1 Hour Free Trial Active!</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-lg font-bold bg-black/20 px-4 py-1.5 rounded-lg">
                  <Timer size={18} /> {timeLeft}
              </div>
          </div>
      )}

      {/* TRIAL WARNING TOAST */}
      {trialWarning && isTrialActive && (
          <div className="fixed top-24 right-4 left-4 md:left-auto z-[100] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-in slide-in-from-right flex items-center gap-3">
              <Clock className="animate-spin flex-shrink-0" />
              <div>
                <p className="font-bold text-lg">Under 5 minute your deal will end.</p>
                <p className="text-xs text-red-200">Upgrade to keep features unlocked.</p>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="lg:col-span-3 space-y-6 relative w-full">
        
        {/* Custom Tab Navigation - Scrollable on Mobile */}
        <div className="overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            <div className="flex p-1 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 mb-2 md:mb-8 min-w-max md:min-w-0">
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 py-3 px-6 md:px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Plus size={18} /> {t('tab_create')}
                </button>
                <button 
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 py-3 px-6 md:px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'data' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isTabLocked('data') ? 'opacity-70' : ''}`}
                >
                    <Layout size={18} /> 
                    {t('tab_data')} 
                    {isTabLocked('data') && <Lock size={14} className="text-red-400 ml-1" />}
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`flex-1 py-3 px-6 md:px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isTabLocked('analytics') ? 'opacity-70' : ''}`}
                >
                    <BarChart3 size={18} /> 
                    {t('tab_analytics')}
                    {isTabLocked('analytics') && <Lock size={14} className="text-red-400 ml-1" />}
                </button>
            </div>
        </div>

        {/* 1. CREATE REMINDER TAB */}
        {activeTab === 'create' && (
            <section className="animate-in slide-in-from-left-4 duration-500">
                <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-40 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                                <Zap className="text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white">{t('sect_create_title')}</h2>
                                <p className="text-xs text-gray-400">Daily Usage: <span className={todayRemindersCount >= getDailyLimit() ? "text-red-400 font-bold" : "text-green-400"}>{todayRemindersCount}/{getDailyLimit()}</span></p>
                            </div>
                        </div>
                    </div>
                    
                    <form onSubmit={handleAddReminder} className="relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Left Column */}
                            <div className="space-y-5">
                                {/* SUBJECT (Always Unlocked) */}
                                <div>
                                    <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_subject')}</label>
                                    <input type="text" required className="w-full glass-input rounded-xl p-4 transition-all" placeholder="e.g. Meeting with Team" value={subject} onChange={e => setSubject(e.target.value)} />
                                </div>
                                
                                {/* VOICE MESSAGE (Conditional Lock) */}
                                <LockedFeature isLocked={isAdvancedFeatureLocked()} onUpgrade={onUpgrade}>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_voice_text')}</label>
                                        <textarea rows={3} className="w-full glass-input rounded-xl p-4 transition-all" placeholder="Type what you want to hear..." value={text} onChange={e => setText(e.target.value)} />
                                    </div>
                                </LockedFeature>

                                {/* TIME & DATE (Always Unlocked) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_date')}</label>
                                        <input type="date" required className="w-full glass-input rounded-xl p-4 text-white [color-scheme:dark] transition-all" value={date} onChange={e => setDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_time')}</label>
                                        <input type="time" required className="w-full glass-input rounded-xl p-4 text-white [color-scheme:dark] transition-all" value={timeStr} onChange={e => setTimeStr(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-5">
                                {/* MOOD (Conditional Lock) */}
                                <LockedFeature isLocked={isAdvancedFeatureLocked()} onUpgrade={onUpgrade}>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_mood')}</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['calm', 'urgent', 'cheerful'].map((m) => (
                                                <button 
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setMood(m as any)}
                                                    className={`p-3 rounded-xl text-xs md:text-sm font-bold capitalize transition-all ${mood === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                                >
                                                    {t(`mood_${m}`)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </LockedFeature>
                                
                                {/* VOICE SETTING & TEST (Conditional Lock) */}
                                <LockedFeature isLocked={isAdvancedFeatureLocked()} onUpgrade={onUpgrade}>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_voice')}</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-grow">
                                                <select 
                                                    className="w-full glass-input rounded-xl p-4 appearance-none cursor-pointer text-white bg-black text-sm"
                                                    value={voiceId}
                                                    onChange={e => setVoiceId(e.target.value)}
                                                >
                                                    {VOICE_OPTIONS.map(v => (
                                                        <option key={v.id} value={v.id}>{v.name} - {v.gender}</option>
                                                    ))}
                                                </select>
                                                <Mic className="absolute right-4 top-4 text-gray-400 pointer-events-none" size={18} />
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={handlePreviewVoice}
                                                disabled={previewLoading}
                                                className="px-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                                                title={t('frm_check_voice')}
                                            >
                                                {previewLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Play size={20} fill="white" />}
                                            </button>
                                        </div>
                                    </div>
                                </LockedFeature>

                                {/* SPEED (Hard Lock for Plan 1 & 2, and Free) */}
                                <LockedFeature isLocked={isSpeedLocked()} onUpgrade={onUpgrade}>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_speed')}: {speed}x</label>
                                        <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none" />
                                    </div>
                                </LockedFeature>

                                {/* REPEAT (Always Unlocked) */}
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                    <label className="text-sm text-gray-300 font-medium flex items-center gap-2"><Repeat size={16} /> {t('frm_repeat')}</label>
                                    <button 
                                        type="button"
                                        onClick={() => setRepeatVoice(!repeatVoice)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${repeatVoice ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${repeatVoice ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.01] transition-all flex justify-center items-center gap-2">
                            <CheckCircle size={20} /> {t('frm_submit')}
                        </button>
                    </form>
                </div>
            </section>
        )}

        {/* 2. DATA TAB */}
        {activeTab === 'data' && (
            <section className="animate-in slide-in-from-right-4 duration-500 relative">
                 {isTabLocked('data') && <TabLockOverlay title={t('data_locked_title')} desc={t('data_locked_desc')} onUpgrade={onUpgrade} />}
                 
                 <div className={isTabLocked('data') ? 'filter blur-md pointer-events-none select-none' : ''}>
                    {/* Feature 1 & 2: Next Up Card & Priority Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Next Up Hero Card */}
                        <div className="md:col-span-2 glass-card rounded-[2rem] p-6 md:p-8 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-20 bg-blue-500/10 rounded-full blur-3xl"></div>
                            <h3 className="text-blue-300 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2"><FastForward size={14} /> {t('data_next_up')}</h3>
                            
                            {nextUpcoming ? (
                                <div className="relative z-10">
                                    <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-2 truncate">{nextUpcoming.subject}</h2>
                                    <p className="text-gray-400 mb-6 text-base md:text-lg line-clamp-2">"{nextUpcoming.text}"</p>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="bg-black/40 px-4 py-2 rounded-lg text-xl md:text-2xl font-mono font-bold text-white border border-white/10">
                                            {new Date(nextUpcoming.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${nextUpcoming.mood === 'urgent' ? 'bg-red-500 text-white' : 'bg-green-500 text-black'}`}>
                                            {nextUpcoming.mood} Priority
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 md:h-40 text-gray-500">
                                    <CheckSquare size={32} className="mb-2 opacity-50" />
                                    <p>{t('data_no_upcoming')}</p>
                                </div>
                            )}
                        </div>

                        {/* Priority Overview */}
                        <div className="glass-card rounded-[2rem] p-6 md:p-8 border border-white/10 flex flex-col justify-center">
                            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-6 flex items-center gap-2"><AlertOctagon size={14} /> {t('data_priority_overview')}</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-red-400 font-bold">Urgent</span>
                                    <span className="text-2xl font-black text-white">{urgentCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-400 font-bold">Calm</span>
                                    <span className="text-2xl font-black text-white">{calmCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-yellow-400 font-bold">Cheerful</span>
                                    <span className="text-2xl font-black text-white">{cheerfulCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Box 1: Today (Modified with Timeline Visuals) */}
                        <div className="glass-card rounded-[1.5rem] p-6 border-t-4 border-t-blue-500 flex flex-col h-[400px] md:h-[500px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-blue-200 flex items-center gap-2"><List size={16} /> {t('data_timeline')}</h3>
                                <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{todayReminders.length} Tasks</span>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 relative">
                                {/* Vertical Line */}
                                {todayReminders.length > 0 && <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-700"></div>}
                                
                                {todayReminders.map((r, idx) => (
                                    <div key={r.id} className="relative pl-10 mb-6 group">
                                        {/* Timeline Dot */}
                                        <div className={`absolute left-[9px] top-1 w-3.5 h-3.5 rounded-full border-2 border-black z-10 ${r.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                                        
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm hover:bg-white/10 transition group-hover:translate-x-1 duration-200">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-white">{new Date(r.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                <span className={`text-[10px] px-1.5 rounded ${r.isCompleted ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>{r.isCompleted ? 'DONE' : 'PENDING'}</span>
                                            </div>
                                            <p className="text-gray-400 truncate">{r.subject}</p>
                                        </div>
                                    </div>
                                ))}
                                {todayReminders.length === 0 && <p className="text-gray-500 text-sm italic text-center mt-20">No tasks for today yet.</p>}
                            </div>
                        </div>

                        {/* Box 2: Ongoing */}
                        <div className="glass-card rounded-[1.5rem] p-6 border-t-4 border-t-yellow-500 flex flex-col h-[400px] md:h-[500px]">
                            <h3 className="font-bold text-lg text-yellow-200 mb-4 flex items-center gap-2"><Activity size={16} /> {t('col_ongoing')}</h3>
                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {ongoingReminders.map(r => (
                                    <div key={r.id} className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm hover:bg-white/10 transition group relative">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-white">{new Date(r.time).toLocaleDateString()}</span>
                                            {/* Removed direct play button from list to avoid conflict, keeping delete */}
                                        </div>
                                        <p className="text-gray-400 truncate">{r.subject}</p>
                                        <button onClick={() => handleDelete(r.id)} className="absolute bottom-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Box 3: Completed & Quick Actions */}
                        <div className="glass-card rounded-[1.5rem] p-6 border-t-4 border-t-green-500 flex flex-col h-[400px] md:h-[500px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-green-200 flex items-center gap-2"><CheckCircle size={16} /> {t('col_completed')}</h3>
                                <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1" title={t('data_clear_history')}><Trash size={12}/> Clear</button>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {completedReminders.map(r => (
                                    <div key={r.id} className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm opacity-60 hover:opacity-100 transition">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-gray-300 line-through">{new Date(r.time).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-500 line-through truncate">{r.subject}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )}

        {/* 3. ANALYTICS TAB */}
        {activeTab === 'analytics' && (
            <section className="animate-in slide-in-from-right-4 duration-500 relative">
                 {isTabLocked('analytics') && <TabLockOverlay title={t('analytics_locked_title')} desc={t('analytics_locked_desc')} onUpgrade={onUpgrade} />}

                 <div className={isTabLocked('analytics') ? 'filter blur-md pointer-events-none select-none' : ''}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-pink-600/20 rounded-xl border border-pink-500/30">
                            <Zap className="text-pink-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{t('sect_analytics_title')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Pie Chart Visual */}
                        <div className="glass-card rounded-[2rem] p-8 flex flex-col items-center justify-center relative overflow-hidden group">
                            <h3 className="absolute top-6 left-6 text-gray-400 font-bold text-sm uppercase tracking-wider">{t('chart_pie_title')}</h3>
                            <div className="relative w-48 h-48 mt-4">
                                <div className="w-full h-full rounded-full shadow-[0_0_40px_rgba(168,85,247,0.3)]" style={{ background: `conic-gradient(#22c55e ${completionRate}%, #374151 0)` }}></div>
                                <div className="absolute inset-0 m-auto w-36 h-36 bg-gray-900 rounded-full flex items-center justify-center flex-col">
                                    <span className="text-3xl font-black text-white">{completionRate}%</span>
                                    <span className="text-xs text-gray-500">Completed</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-gray-300">Done ({completedCount})</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-700 rounded-full"></div><span className="text-gray-300">Pending ({totalCount - completedCount})</span></div>
                            </div>
                        </div>

                        {/* Bar Chart Visual */}
                        <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden">
                            <h3 className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-8">{t('chart_bar_title')}</h3>
                            <div className="flex items-end justify-around h-48 w-full pt-4 border-b border-gray-700">
                                <div className="flex flex-col items-center gap-2 group w-1/3">
                                    <div className="w-8 md:w-12 bg-gradient-to-t from-indigo-600 to-blue-500 rounded-t-lg transition-all duration-1000 group-hover:brightness-125 shadow-[0_0_15px_rgba(79,70,229,0.4)]" style={{ height: `${barHeight1}%` }}></div>
                                    <span className="text-xs text-gray-400 font-bold">Total</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 group w-1/3">
                                    <div className="w-8 md:w-12 bg-gradient-to-t from-green-600 to-emerald-500 rounded-t-lg transition-all duration-1000 delay-100 group-hover:brightness-125 shadow-[0_0_15px_rgba(34,197,94,0.4)]" style={{ height: `${barHeight2}%` }}></div>
                                    <span className="text-xs text-gray-400 font-bold">Done</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 group w-1/3">
                                    <div className="w-8 md:w-12 bg-gradient-to-t from-yellow-600 to-orange-500 rounded-t-lg transition-all duration-1000 delay-200 group-hover:brightness-125 shadow-[0_0_15px_rgba(234,179,8,0.4)]" style={{ height: `${barHeight3}%` }}></div>
                                    <span className="text-xs text-gray-400 font-bold">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 md:mt-8">
                        <div className="glass-card rounded-[1.5rem] p-6 border border-indigo-500/20">
                            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-200 flex items-center gap-2"><Smile size={18} className="text-indigo-400"/> {t('stat_mood_title')}</h3></div>
                            <div className="space-y-4">
                                <div><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Calm</span> <span>{moodCounts.calm}</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-blue-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${(moodCounts.calm / maxMood) * 100}%` }}></div></div></div>
                                <div><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Urgent</span> <span>{moodCounts.urgent}</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-red-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${(moodCounts.urgent / maxMood) * 100}%` }}></div></div></div>
                                <div><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Cheerful</span> <span>{moodCounts.cheerful}</span></div><div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-yellow-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${(moodCounts.cheerful / maxMood) * 100}%` }}></div></div></div>
                            </div>
                        </div>
                        <div className="glass-card rounded-[1.5rem] p-6 border border-indigo-500/20 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-200 flex items-center gap-2"><Mic size={18} className="text-purple-400"/> {t('stat_voice_title')}</h3></div>
                            <div className="flex items-center gap-4 mb-2"><div className="w-12 h-12 bg-purple-900/50 rounded-full flex items-center justify-center border border-purple-500/30"><Music size={20} className="text-purple-300" /></div><div><p className="text-xs text-gray-500 uppercase font-bold">{t('stat_fav_voice')}</p><p className="text-xl font-bold text-white truncate w-32" title={topVoiceName}>{topVoiceName}</p></div></div>
                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center"><span className="text-xs text-gray-400">{t('stat_avg_speed')}</span><span className="text-sm font-bold text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded-lg">{avgSpeed}x</span></div>
                        </div>
                        <div className="glass-card rounded-[1.5rem] p-6 border border-indigo-500/20 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-10 bg-green-500/5 rounded-full blur-2xl"></div>
                            <div className="flex items-center justify-between mb-2 relative z-10"><h3 className="font-bold text-gray-200 flex items-center gap-2"><TrendingUp size={18} className="text-green-400"/> {t('stat_forecast_title')}</h3><CalendarDays size={20} className="text-gray-600"/></div>
                            <div className="relative z-10"><div className="flex items-baseline gap-1"><span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{forecastCount}</span><span className="text-sm text-gray-400 font-medium">{t('stat_upcoming')}</span></div><p className="text-xs text-gray-500 mt-2">Scheduled for next 7 days</p></div>
                            <div className="mt-4 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 animate-pulse w-2/3 rounded-full"></div></div>
                        </div>
                    </div>
                 </div>
            </section>
        )}
      </div>

      {/* Sidebar (Chat) - Keeps fixed position on lg screens, stacks on mobile */}
      <div className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-32 space-y-8">
            <ChatSupport currentUser={user} />
          </div>
      </div>

      {/* Active Notification Modal */}
      {notification && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-[110] p-4 animate-in zoom-in duration-500">
              <div className="relative bg-gray-900 rounded-[2.5rem] shadow-[0_0_100px_rgba(234,179,8,0.6)] p-8 md:p-10 max-w-md w-full text-center border border-yellow-500/50">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-[2.5rem] blur opacity-40 animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="bg-yellow-500/20 p-6 rounded-full inline-flex mb-8 animate-bounce shadow-[0_0_30px_rgba(234,179,8,0.4)]"><Volume2 size={56} className="text-yellow-400" /></div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 drop-shadow-lg">{notification.subject}</h2>
                    <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10"><p className="text-gray-200 italic text-lg md:text-xl leading-relaxed">"{notification.text}"</p></div>
                    <div className="flex flex-col gap-4">
                        <button onClick={handleSnoozeNotification} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-black rounded-2xl font-bold hover:brightness-110 transition-all flex justify-center items-center gap-2 shadow-lg shadow-yellow-500/40 text-lg hover:scale-105">
                           <Clock size={24} /> {t('notif_snooze')}
                        </button>
                        <button onClick={handleDismissNotification} className="w-full py-4 border border-gray-600 text-gray-400 rounded-2xl font-bold hover:bg-white/5 hover:text-white hover:border-white transition-all">
                            {t('notif_dismiss')}
                        </button>
                    </div>
                  </div>
              </div>
          </div>
      )}

      {/* NEW USER TRIAL MODAL */}
      {showTrialModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-700">
              <div className="max-w-lg w-full glass-card rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-yellow-500/50 shadow-[0_0_100px_rgba(234,179,8,0.3)]">
                  {/* Confetti / Shine Effects */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-[80px]"></div>
                  
                  <div className="relative z-10 text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                          <Crown size={40} className="text-black" />
                      </div>
                      <h2 className="text-3xl font-extrabold text-white mb-2">Congratulation sir,</h2>
                      <p className="text-yellow-400 font-bold text-lg mb-6">Special New User Offer!</p>
                      
                      <p className="text-gray-300 mb-8 leading-relaxed text-sm md:text-base">
                          You get this deal where you can get <strong className="text-white">FREE access</strong> for all of feature of this website for <strong className="text-white">1 Hour</strong>.
                          <br/><span className="text-xs text-gray-500 mt-2 block">(First 10 Reminders Unlocked)</span>
                      </p>
                      
                      <div className="flex flex-col gap-3">
                          <button 
                              onClick={handleClaimTrial}
                              className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-600 text-black font-bold rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:scale-105 transition-transform text-lg uppercase tracking-wider"
                          >
                              Claim Deal
                          </button>
                          <button 
                              onClick={handleRejectTrial}
                              className="w-full py-3 text-gray-500 font-bold hover:text-white transition-colors text-sm"
                          >
                              Reject Deal
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;
