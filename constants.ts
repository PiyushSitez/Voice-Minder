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

// 20+ Voice Presets mapped to available Gemini voices
export const VOICE_OPTIONS = [
    { id: 'India-Male', name: 'India (Male)', gender: 'Male', realId: 'Puck' },
    { id: 'India-Female', name: 'India (Female)', gender: 'Female', realId: 'Kore' },
    { id: 'Kore', name: 'Kore (Default)', gender: 'Female' },
    { id: 'Puck', name: 'Puck (Playful)', gender: 'Male' },
    { id: 'Charon', name: 'Charon (Deep)', gender: 'Male' },
    { id: 'Fenrir', name: 'Fenrir (Intense)', gender: 'Male' },
    { id: 'Zephyr', name: 'Zephyr (Soft)', gender: 'Female' },
    { id: 'Kore-2', name: 'Sarah (Professional)', gender: 'Female', realId: 'Kore' },
    { id: 'Puck-2', name: 'Mike (Casual)', gender: 'Male', realId: 'Puck' },
    { id: 'Charon-2', name: 'James (Narrator)', gender: 'Male', realId: 'Charon' },
    { id: 'Fenrir-2', name: 'Marcus (Urgent)', gender: 'Male', realId: 'Fenrir' },
    { id: 'Zephyr-2', name: 'Emily (Whisper)', gender: 'Female', realId: 'Zephyr' },
    { id: 'Kore-3', name: 'Linda (Assistant)', gender: 'Female', realId: 'Kore' },
    { id: 'Puck-3', name: 'Alex (Friendly)', gender: 'Male', realId: 'Puck' },
    { id: 'Charon-3', name: 'Robert (Formal)', gender: 'Male', realId: 'Charon' },
    { id: 'Fenrir-3', name: 'David (Alert)', gender: 'Male', realId: 'Fenrir' },
    { id: 'Zephyr-3', name: 'Sophie (Calm)', gender: 'Female', realId: 'Zephyr' },
    { id: 'Kore-4', name: 'Emma (News)', gender: 'Female', realId: 'Kore' },
    { id: 'Puck-4', name: 'Ryan (Sport)', gender: 'Male', realId: 'Puck' },
    { id: 'Charon-4', name: 'William (Classic)', gender: 'Male', realId: 'Charon' },
    { id: 'Fenrir-4', name: 'Jack (Warning)', gender: 'Male', realId: 'Fenrir' },
    { id: 'Zephyr-4', name: 'Olivia (Story)', gender: 'Female', realId: 'Zephyr' },
    { id: 'Kore-5', name: 'Ava (Digital)', gender: 'Female', realId: 'Kore' },
];