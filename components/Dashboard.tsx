import React, { useState, useEffect, useRef } from 'react';
import { User, Reminder, PlanType } from '../types';
import * as Storage from '../services/storageService';
import * as GeminiService from '../services/geminiService';
import ChatSupport from './ChatSupport';
import { OWNER_EMAIL, VOICE_OPTIONS } from '../constants';
import { Clock, Play, Trash2, Plus, Settings, Volume2, Bell, Zap, X, Calendar, Mic, CheckCircle, Repeat, Activity, Music, Smile, TrendingUp, CalendarDays, Layout, BarChart3, AlertOctagon, FastForward, CheckSquare, List, Trash, Lock, Timer, Crown, PartyPopper } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DashboardProps {
  user: User;
  onUpgrade: () => void;
}

type Tab = 'create' | 'data' | 'analytics';

// --- Confetti Component ---
const Confetti: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: any[] = [];
        const colors = ['#FCD34D', '#F87171', '#60A5FA', '#818CF8', '#34D399'];

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            color: string;
            size: number;
            rotation: number;
            rotationSpeed: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.vx = (Math.random() - 0.5) * 15; // Explosive X
                this.vy = (Math.random() - 1) * 15;   // Explosive Upward Y
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.size = Math.random() * 8 + 4;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 10;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.vy += 0.3; // Gravity
                this.vx *= 0.96; // Friction
                this.rotation += this.rotationSpeed;
            }

            draw() {
                if(!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        const createBurst = () => {
             // Center burst
            for(let i=0; i<100; i++) particles.push(new Particle(canvas.width/2, canvas.height/2));
             // Left burst
            for(let i=0; i<60; i++) particles.push(new Particle(canvas.width * 0.2, canvas.height * 0.4));
             // Right burst
            for(let i=0; i<60; i++) particles.push(new Particle(canvas.width * 0.8, canvas.height * 0.4));
        };

        createBurst();
        const interval = setInterval(createBurst, 800);

        const animate = () => {
            if(!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for(let i=0; i<particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                if(particles[i].y > canvas.height) {
                    particles.splice(i, 1);
                    i--;
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        const cleanupTimeout = setTimeout(() => {
            clearInterval(interval);
        }, 5000);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearInterval(interval);
            clearTimeout(cleanupTimeout);
        }

    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[300]" />;
};


// --- Helper Component for Locked Feature ---
const LockedFeature: React.FC<{ isLocked: boolean; lockLabel: string; children: React.ReactNode; onUpgrade: () => void }> = ({ isLocked, lockLabel, children, onUpgrade }) => {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      <div className="filter blur-[2px] opacity-40 grayscale pointer-events-none select-none">
         {children}
      </div>
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
         <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-xl transform transition-transform hover:scale-105 cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpgrade(); }}>
             <Lock size={14} className="text-red-500" />
             <span className="text-xs font-bold text-white whitespace-nowrap">{lockLabel}</span>
         </div>
      </div>
    </div>
  );
};

// --- Helper Component for Locked Tab Overlay ---
const TabLockOverlay: React.FC<{ title: string; desc: string; lockLabel: string; onUpgrade: () => void }> = ({ title, desc, lockLabel, onUpgrade }) => {
  return (
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 rounded-[2rem] overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"></div>
          
          <div className="relative z-10 glass-card p-8 rounded-[2rem] text-center border border-white/10 shadow-2xl max-w-sm w-full mx-auto animate-in zoom-in-95 duration-300 hover:scale-[1.02] transition-transform">
               <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                   <Lock size={20} className="text-red-400" />
               </div>
               <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
               <p className="text-gray-400 mb-6 text-sm leading-relaxed">{desc}</p>
               <button 
                  onClick={onUpgrade}
                  className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  {lockLabel}
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

  // Success Celebration State
  const [showPlanSuccess, setShowPlanSuccess] = useState(false);

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
  const isNotificationActiveRef = useRef(false);

  const isOwner = user.email === OWNER_EMAIL;

  useEffect(() => {
    let trialTimer: ReturnType<typeof setTimeout>;

    const refreshUser = async () => {
        const freshUser = await Storage.checkTrialExpiry(user);
        setUser(freshUser);

        if (freshUser.isTrialEligible && !freshUser.trialActive && freshUser.plan === PlanType.FREE && freshUser.email !== OWNER_EMAIL) {
            trialTimer = setTimeout(() => {
                setShowTrialModal(true);
            }, 10000);
        }
    };
    
    refreshUser();
    loadReminders();

    const interval = setInterval(async () => {
        await checkReminders();
        
        // 1. Trial Timer Logic
        const freshUser = await Storage.getCurrentUser();
        if(freshUser) {
            if(freshUser.trialActive && freshUser.trialEndsAt) {
                const diff = freshUser.trialEndsAt - Date.now();
                if(diff > 0) {
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const secs = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${mins}m ${secs}s`);
                    
                    if(diff < 5 * 60 * 1000 && !trialWarning) {
                        setTrialWarning(true);
                    }
                } else {
                    await Storage.checkTrialExpiry(freshUser);
                    setUser({...freshUser, trialActive: false});
                    setTrialWarning(false);
                    setTimeLeft('');
                }
            }

            // 2. Check for Plan Activation
            if (freshUser.hasPlanUpdate && freshUser.id === user.id) {
                setShowPlanSuccess(true);
                const updated = await Storage.clearPlanUpdateFlag(user.id);
                if(updated) setUser(updated);
            }
        }
    }, 1000); 
    
    return () => {
        clearInterval(interval);
        clearTimeout(trialTimer);
        stopAudioLoop();
    };
  }, [user.id]);

  const loadReminders = async () => {
    const data = await Storage.getReminders(user.id);
    setReminders(data);
  };

  const checkReminders = async () => {
    const now = new Date();
    // Use current state reminders if possible, or fetch fresh? 
    // Ideally we fetch fresh or use state. State is okay here since loadReminders updates it.
    // But for accuracy in interval, better to rely on state or fetch. 
    // To avoid too many DB calls, let's use the local 'reminders' state if updated, 
    // BUT since setInterval closure captures old state, we should fetch or use a ref.
    // We will fetch for accuracy.
    const freshReminders = await Storage.getReminders(user.id);
    const pending = freshReminders.filter(r => !r.isCompleted);
    
    pending.forEach(r => {
      const rTime = new Date(r.time);
      if (rTime <= now && (now.getTime() - rTime.getTime()) < 60000 * 5) { 
         if(notification?.id !== r.id) {
             setNotification(r);
             isNotificationActiveRef.current = true;
             playReminderLoop(r);
             markAsCompleted(r);
         }
      }
    });
  };

  const markAsCompleted = async (r: Reminder) => {
      const updated = { ...r, isCompleted: true };
      await Storage.saveReminder(updated);
      loadReminders();
  }
  
  const clearHistory = async () => {
      if(window.confirm("Clear all completed reminders?")) {
          const completed = reminders.filter(r => r.isCompleted);
          for(const r of completed) {
             await Storage.deleteReminder(r.id);
          }
          loadReminders();
      }
  }

  // --- AUDIO LOOP LOGIC ---

  const stopAudioLoop = () => {
      if (audioControlRef.current) {
          try {
            audioControlRef.current.source?.stop();
          } catch(e) {}
          
          if(audioControlRef.current.timeoutId) {
             clearTimeout(audioControlRef.current.timeoutId);
          }
          audioControlRef.current = null;
      }
      GeminiService.stopNativeSpeech();
  };

  const playNativeLoop = async (fullText: string, r: Reminder) => {
      const loop = async () => {
          if (!isNotificationActiveRef.current) return;
          await GeminiService.speakNative(fullText, r.mood, r.speed);
          
          if (isNotificationActiveRef.current) {
              const id = setTimeout(() => {
                  loop();
              }, 2000);
              audioControlRef.current = { source: null, ctx: null, timeoutId: id };
          }
      };
      loop();
  };

  const playReminderLoop = async (r: Reminder) => {
    setLoadingTTS(true);
    const fullText = `${user.name}, ${r.text}`;

    if (!GeminiService.hasApiKey()) {
        console.log("No API Key detected. Using Native Fallback.");
        setLoadingTTS(false);
        playNativeLoop(fullText, r);
        return;
    }

    const startAudioLoopWithData = (audioData: string) => {
        const playWithGap = async () => {
            if (!isNotificationActiveRef.current) return;

            const audioResult = await GeminiService.playAudioFromBase64(audioData, r.speed, false);
            
            if (audioResult) {
                const { source, context, duration } = audioResult;
                const totalDurationMs = (duration * 1000) / r.speed;
                const nextPlayDelay = totalDurationMs + 2000;

                const timeoutId = setTimeout(() => {
                    if (isNotificationActiveRef.current) {
                        playWithGap(); 
                    }
                }, nextPlayDelay);

                audioControlRef.current = { source, ctx: context, timeoutId };
            }
        };
        playWithGap();
    };

    if (fullText.length > 100) {
        try {
            let introText = fullText.substring(0, 80); 
            const lastSpace = introText.lastIndexOf(' ');
            if (lastSpace > 0) introText = introText.substring(0, lastSpace);

            const introAudio = await GeminiService.generateSpeech(introText, r.mood, r.voiceId);
            setLoadingTTS(false); 

            if (introAudio && isNotificationActiveRef.current) {
                const introResult = await GeminiService.playAudioFromBase64(introAudio, r.speed, false);
                const fullAudioPromise = GeminiService.generateSpeech(fullText, r.mood, r.voiceId);

                if (introResult) {
                    const { duration } = introResult;
                    const introDurationMs = (duration * 1000) / r.speed;

                    const timeoutId = setTimeout(async () => {
                        if (!isNotificationActiveRef.current) return;
                        const fullAudio = await fullAudioPromise;
                        if (fullAudio) {
                            startAudioLoopWithData(fullAudio);
                        } else {
                            startAudioLoopWithData(introAudio); 
                        }
                    }, introDurationMs + 500);

                    audioControlRef.current = { source: introResult.source, ctx: introResult.context, timeoutId };
                }
            } else {
                const fullAudio = await GeminiService.generateSpeech(fullText, r.mood, r.voiceId);
                setLoadingTTS(false);
                if (fullAudio) {
                    startAudioLoopWithData(fullAudio);
                } else {
                    playNativeLoop(fullText, r);
                }
            }
        } catch (e) {
            console.error("Fast Playback Error:", e);
            setLoadingTTS(false);
            playNativeLoop(fullText, r);
        }
        return;
    }

    const audioData = await GeminiService.generateSpeech(fullText, r.mood, r.voiceId);
    setLoadingTTS(false);

    if (audioData) {
        startAudioLoopWithData(audioData);
    } else {
        playNativeLoop(fullText, r);
    }
  };
  
  const handleDismissNotification = () => {
      stopAudioLoop();
      isNotificationActiveRef.current = false;
      setNotification(null);
  };

  const handleSnoozeNotification = async () => {
      stopAudioLoop();
      isNotificationActiveRef.current = false;
      
      if(notification) {
          const now = new Date();
          const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000);
          const isoTime = snoozeTime.toISOString();

          // We delete old and create new to trigger sync cleanly, or update existing
          const newR = { ...notification, isCompleted: false, time: isoTime };
          await Storage.saveReminder(newR);
          loadReminders();
      }
      
      setNotification(null);
  };

  const handlePreviewVoice = async () => {
      setPreviewLoading(true);
      let previewText = text.trim() ? text : "This is a preview of your selected voice.";
      if (previewText.length > 60) previewText = previewText.substring(0, 60);
      
      if (!GeminiService.hasApiKey()) {
          await GeminiService.speakNative(previewText, mood, speed);
          setPreviewLoading(false);
          return;
      }

      const audioData = await GeminiService.generateSpeech(previewText, mood, voiceId);
      setPreviewLoading(false);
      
      if (audioData) {
          GeminiService.playAudioFromBase64(audioData, speed, false);
      } else {
           await GeminiService.speakNative(previewText, mood, speed);
      }
  };

  const handleClaimTrial = async () => {
      const updatedUser = await Storage.activateTrial(user.id);
      if(updatedUser) {
          setUser(updatedUser);
          setShowTrialModal(false);
      }
  }

  const handleRejectTrial = async () => {
      const updatedUser = await Storage.rejectTrial(user.id);
      if(updatedUser) {
          setUser(updatedUser);
          setShowTrialModal(false);
      }
  }

  const handleClosePlanSuccess = () => {
      setShowPlanSuccess(false);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRemindersCount = reminders.filter(r => r.time.startsWith(todayStr)).length;
  
  const isTrialActive = user.trialActive && user.trialEndsAt && Date.now() < user.trialEndsAt;

  const getDailyLimit = () => {
      if (isOwner) return 9999;
      if (isTrialActive) return 10; 
      
      switch (user.plan) {
          case PlanType.MONTHLY: return 5;
          case PlanType.HALF_YEARLY: return 20;
          case PlanType.YEARLY: return 35;
          case PlanType.LIFETIME: return 9999;
          default: return 3;
      }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
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
      text: text || "Reminder", 
      time: combinedDateTime.toISOString(),
      speed,
      mood,
      isCompleted: false,
      voiceId,
      repeatVoice
    };
    await Storage.saveReminder(newReminder);
    loadReminders();
    setSubject(''); setText(''); setDate(''); setTimeStr('');
    
    if(!isTabLocked('data')) {
        setActiveTab('data');
    }
  };

  const handleDelete = async (id: string) => {
      await Storage.deleteReminder(id);
      loadReminders();
  }

  // --- LOCKING LOGIC ---
  const getAdvancedFeatureLockInfo = (): { isLocked: boolean; label: string } => {
      if (isOwner || isTrialActive) return { isLocked: false, label: '' }; 

      if (user.plan === PlanType.FREE) {
          return { isLocked: true, label: 'Buy Plan 1' };
      }
      if (user.plan === PlanType.MONTHLY) {
          if (todayRemindersCount >= 5) {
             return { isLocked: true, label: 'Buy Plan 2' };
          }
      }
      return { isLocked: false, label: '' };
  };

  const getSpeedLockInfo = (): { isLocked: boolean; label: string } => {
      if (isOwner || isTrialActive) return { isLocked: false, label: '' };
      if (user.plan === PlanType.FREE || user.plan === PlanType.MONTHLY || user.plan === PlanType.HALF_YEARLY) {
          return { isLocked: true, label: 'Buy Plan 3' };
      }
      return { isLocked: false, label: '' };
  };

  const isTabLocked = (tab: 'data' | 'analytics') => {
      if (isOwner || isTrialActive) return false;
      if (tab === 'data') {
          return user.plan === PlanType.MONTHLY || user.plan === PlanType.FREE;
      }
      if (tab === 'analytics') {
          return user.plan === PlanType.MONTHLY || user.plan === PlanType.HALF_YEARLY || user.plan === PlanType.FREE;
      }
      return false;
  };

  const getTabLockLabel = (tab: 'data' | 'analytics'): string => {
      if (tab === 'data') return "Buy Plan 2";
      if (tab === 'analytics') return "Buy Plan 3";
      return "Buy Plan";
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
  
  const advLock = getAdvancedFeatureLockInfo();
  const speedLock = getSpeedLockInfo();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative">
      
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

      {trialWarning && isTrialActive && (
          <div className="fixed top-24 right-4 left-4 md:left-auto z-[100] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-in slide-in-from-right flex items-center gap-3">
              <Clock className="animate-spin flex-shrink-0" />
              <div>
                <p className="font-bold text-lg">Under 5 minute your deal will end.</p>
                <p className="text-xs text-red-200">Upgrade to keep features unlocked.</p>
              </div>
          </div>
      )}

      <div className="lg:col-span-3 space-y-6 relative w-full">
        
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
                    {isTabLocked('data') && <Lock size={14} className="text-gray-400 ml-1" />}
                </button>
                <button 
                    onClick={() => setActiveTab('analytics')}
                    className={`flex-1 py-3 px-6 md:px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'} ${isTabLocked('analytics') ? 'opacity-70' : ''}`}
                >
                    <BarChart3 size={18} /> 
                    {t('tab_analytics')}
                    {isTabLocked('analytics') && <Lock size={14} className="text-gray-400 ml-1" />}
                </button>
            </div>
        </div>

        {activeTab === 'create' && (
            <section className="animate-in slide-in-from-left-4 duration-500">
                <div className="glass-card p-4 md:p-8 rounded-[2rem] border border-indigo-500/20 shadow-2xl relative group">
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
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_subject')}</label>
                                    <input type="text" required className="w-full glass-input rounded-xl p-4 transition-all" placeholder="e.g. Meeting with Team" value={subject} onChange={e => setSubject(e.target.value)} />
                                </div>
                                
                                <LockedFeature isLocked={advLock.isLocked} lockLabel={advLock.label} onUpgrade={onUpgrade}>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_voice_text')}</label>
                                        <textarea rows={3} className="w-full glass-input rounded-xl p-4 transition-all" placeholder="Type what you want to hear..." value={text} onChange={e => setText(e.target.value)} />
                                    </div>
                                </LockedFeature>

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

                            <div className="space-y-5">
                                <LockedFeature isLocked={advLock.isLocked} lockLabel={advLock.label} onUpgrade={onUpgrade}>
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
                                
                                <LockedFeature isLocked={advLock.isLocked} lockLabel={advLock.label} onUpgrade={onUpgrade}>
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

                                <LockedFeature isLocked={speedLock.isLocked} lockLabel={speedLock.label} onUpgrade={onUpgrade}>
                                    <div>
                                        <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 pl-1">{t('frm_speed')}: {speed}x</label>
                                        <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none" />
                                    </div>
                                </LockedFeature>

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
                        
                        <button type="submit" className="relative z-30 w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.01] transition-all flex justify-center items-center gap-2">
                            <CheckCircle size={20} /> {t('frm_submit')}
                        </button>
                    </form>
                </div>
            </section>
        )}

        {activeTab === 'data' && (
            <section className="animate-in slide-in-from-right-4 duration-500 relative">
                 {isTabLocked('data') && <TabLockOverlay title={t('data_locked_title')} desc={t('data_locked_desc')} lockLabel={getTabLockLabel('data')} onUpgrade={onUpgrade} />}
                 
                 <div className={isTabLocked('data') ? 'filter blur-md pointer-events-none select-none' : ''}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                        <div className="glass-card rounded-[1.5rem] p-6 border-t-4 border-t-blue-500 flex flex-col h-[400px] md:h-[500px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-blue-200 flex items-center gap-2"><List size={16} /> {t('data_timeline')}</h3>
                                <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{todayReminders.length} Tasks</span>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 relative">
                                {todayReminders.length > 0 && <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-700"></div>}
                                
                                {todayReminders.map((r, idx) => (
                                    <div key={r.id} className="relative pl-10 mb-6 group">
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

                        <div className="glass-card rounded-[1.5rem] p-6 border-t-4 border-t-yellow-500 flex flex-col h-[400px] md:h-[500px]">
                            <h3 className="font-bold text-lg text-yellow-200 mb-4 flex items-center gap-2"><Activity size={16} /> {t('col_ongoing')}</h3>
                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                {ongoingReminders.map(r => (
                                    <div key={r.id} className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm hover:bg-white/10 transition group relative">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold text-white">{new Date(r.time).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-400 truncate">{r.subject}</p>
                                        <button onClick={() => handleDelete(r.id)} className="absolute bottom-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>

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

        {activeTab === 'analytics' && (
            <section className="animate-in slide-in-from-right-4 duration-500 relative">
                 {isTabLocked('analytics') && <TabLockOverlay title={t('analytics_locked_title')} desc={t('analytics_locked_desc')} lockLabel={getTabLockLabel('analytics')} onUpgrade={onUpgrade} />}

                 <div className={isTabLocked('analytics') ? 'filter blur-md pointer-events-none select-none' : ''}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-pink-600/20 rounded-xl border border-pink-500/30">
                            <Zap className="text-pink-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{t('sect_analytics_title')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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

      <div className="lg:col-span-1 mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-32 space-y-8">
            <ChatSupport currentUser={user} />
          </div>
      </div>

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

      {showTrialModal && !showPlanSuccess && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-700">
              <Confetti />
              <div className="max-w-lg w-full glass-card rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden border border-yellow-500/50 shadow-[0_0_100px_rgba(234,179,8,0.3)] animate-in zoom-in-50 duration-500">
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

      {showPlanSuccess && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-500">
              <Confetti />
              <div className="max-w-md w-full glass-card rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border border-green-500/50 shadow-[0_0_150px_rgba(34,197,94,0.4)] animate-in zoom-in-50 duration-700">
                  <div className="absolute inset-0 bg-green-500/10 animate-pulse"></div>
                  <div className="absolute -top-40 -left-40 w-96 h-96 bg-green-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                  <div className="relative z-10 text-center flex flex-col items-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,197,94,0.6)] animate-bounce">
                          <PartyPopper size={48} className="text-white" />
                      </div>
                      
                      <h2 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight">HURRAY!</h2>
                      <p className="text-green-400 font-bold text-xl uppercase tracking-widest mb-6">You Gain Your Plan</p>
                      
                      <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                          Your premium features have been unlocked. <br/>
                          <span className="text-white font-bold">Enjoy the power of VoiceMinder!</span>
                      </p>

                      <button 
                          onClick={handleClosePlanSuccess}
                          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-lg rounded-2xl shadow-lg hover:scale-105 hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all uppercase tracking-wider"
                      >
                          Let's Go!
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;