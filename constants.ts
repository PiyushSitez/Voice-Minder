
import { PlanConfig, PlanType } from './types';

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
// Gemini currently supports: Puck, Charon, Kore, Fenrir, Zephyr
export const VOICE_OPTIONS = [
    // New Indian Voices
    { id: 'India-Male', name: 'India (Male)', gender: 'Male', realId: 'Puck' },
    { id: 'India-Female', name: 'India (Female)', gender: 'Female', realId: 'Kore' },
    
    // Standard Voices
    { id: 'Kore', name: 'Kore (Default)', gender: 'Female' },
    { id: 'Puck', name: 'Puck (Playful)', gender: 'Male' },
    { id: 'Charon', name: 'Charon (Deep)', gender: 'Male' },
    { id: 'Fenrir', name: 'Fenrir (Intense)', gender: 'Male' },
    { id: 'Zephyr', name: 'Zephyr (Soft)', gender: 'Female' },
    
    // Aliases to simulate 20+ options for UI as requested
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
