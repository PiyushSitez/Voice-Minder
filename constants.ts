
import { PlanConfig, PlanType } from './types';

// ==========================================
// 🔴 IMPORTANT: FILL THESE WITH YOUR SUPABASE KEYS
// ==========================================
export const SUPABASE_URL = "https://rufthtnectywjhfpkoln.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnRodG5lY3R5d2poZnBrb2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTk1NjcsImV4cCI6MjA3OTQ3NTU2N30.zmkePoLh0_SOTL3u8-49bFdDnOKpoy3HpqunWdhByU0";
// ==========================================

export const OWNER_EMAIL = "usearningofficial@gmail.com";
export const ADMIN_PIN = "937032";
export const UPI_ID = "9970139021@ybl";

// Common Feature Keys
const F = {
  LIMIT: 'feat_limit',
  SUBJECT: 'feat_subject',
  TTS: 'feat_tts',
  DATE: 'feat_date',
  MOOD: 'feat_mood',
  VOICE_SET: 'feat_voice_set',
  TEST: 'feat_test',
  SPEED: 'feat_speed',
  REPEAT: 'feat_repeat',
  DATA: 'feat_data',
  ANALYTICS: 'feat_analytics'
};

export const PLANS: PlanConfig[] = [
  {
    type: PlanType.MONTHLY,
    nameLabel: 'plan_starter',
    price: 10,
    durationLabel: "1 Month",
    features: [
      { nameKey: F.LIMIT, arg: '5', status: 'included' },
      { nameKey: F.SUBJECT, status: 'included' },
      { nameKey: F.TTS, valueKey: 'val_5_free', status: 'limited' },
      { nameKey: F.DATE, status: 'included' },
      { nameKey: F.MOOD, valueKey: 'val_5_free', status: 'limited' },
      { nameKey: F.VOICE_SET, valueKey: 'val_5_free', status: 'limited' },
      { nameKey: F.TEST, valueKey: 'val_5_free', status: 'limited' },
      { nameKey: F.SPEED, status: 'excluded' },
      { nameKey: F.REPEAT, status: 'included' },
      { nameKey: F.DATA, status: 'excluded' },
      { nameKey: F.ANALYTICS, status: 'excluded' }
    ]
  },
  {
    type: PlanType.HALF_YEARLY,
    nameLabel: 'plan_pro',
    price: 89,
    durationLabel: "6 Months",
    features: [
      { nameKey: F.LIMIT, arg: '20', status: 'included' },
      { nameKey: F.SUBJECT, status: 'included' },
      { nameKey: F.TTS, status: 'included' },
      { nameKey: F.DATE, status: 'included' },
      { nameKey: F.MOOD, status: 'included' },
      { nameKey: F.VOICE_SET, status: 'included' },
      { nameKey: F.TEST, status: 'included' },
      { nameKey: F.SPEED, status: 'excluded' },
      { nameKey: F.REPEAT, status: 'included' },
      { nameKey: F.DATA, status: 'included' },
      { nameKey: F.ANALYTICS, status: 'excluded' }
    ]
  },
  {
    type: PlanType.YEARLY,
    nameLabel: 'plan_elite',
    price: 149,
    durationLabel: "1 Year",
    features: [
      { nameKey: F.LIMIT, arg: '35', status: 'included' },
      { nameKey: F.SUBJECT, status: 'included' },
      { nameKey: F.TTS, status: 'included' },
      { nameKey: F.DATE, status: 'included' },
      { nameKey: F.MOOD, status: 'included' },
      { nameKey: F.VOICE_SET, status: 'included' },
      { nameKey: F.TEST, status: 'included' },
      { nameKey: F.SPEED, status: 'included' },
      { nameKey: F.REPEAT, status: 'included' },
      { nameKey: F.DATA, status: 'included' },
      { nameKey: F.ANALYTICS, status: 'included' }
    ]
  },
  {
    type: PlanType.LIFETIME,
    nameLabel: 'plan_infinity',
    price: 349,
    durationLabel: "Lifetime",
    features: [
      { nameKey: F.LIMIT, arg: 'Unlimited', status: 'included' },
      { nameKey: F.SUBJECT, status: 'included' },
      { nameKey: F.TTS, status: 'included' },
      { nameKey: F.DATE, status: 'included' },
      { nameKey: F.MOOD, status: 'included' },
      { nameKey: F.VOICE_SET, status: 'included' },
      { nameKey: F.TEST, status: 'included' },
      { nameKey: F.SPEED, status: 'included' },
      { nameKey: F.REPEAT, status: 'included' },
      { nameKey: F.DATA, status: 'included' },
      { nameKey: F.ANALYTICS, status: 'included' }
    ]
  }
];

// Updated QR Code Image URL
export const PLACEHOLDER_QR = "https://instasize.com/api/image/687b32a2051442e5211f5b53f62fb7ad25498a8f65c0ba7ad72b56d2ce1d671c.jpeg";

// ONLY INDIAN OPTIONS AS REQUESTED
export const VOICE_OPTIONS = [
    { id: 'en-IN-Female', name: 'Indian (Female)', gender: 'Female', lang: 'en-IN' },
    { id: 'en-IN-Male', name: 'Indian (Male)', gender: 'Male', lang: 'en-IN' }
];

export const CATEGORIES = [
  { id: 'work', label: 'cat_work', color: 'blue' },
  { id: 'personal', label: 'cat_personal', color: 'purple' },
  { id: 'health', label: 'cat_health', color: 'green' },
  { id: 'finance', label: 'cat_finance', color: 'yellow' },
  { id: 'other', label: 'cat_other', color: 'gray' }
];
