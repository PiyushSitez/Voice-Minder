
export enum PlanType {
  FREE = 'Free',
  MONTHLY = 'Monthly',
  HALF_YEARLY = '6 Months',
  YEARLY = '1 Year',
  LIFETIME = 'Lifetime'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, this would be hashed
  plan: PlanType;
  planExpiry?: number; // Timestamp
  isAdmin: boolean;
  // Trial Features
  isTrialEligible?: boolean; // True if they haven't used it yet
  trialActive?: boolean;     // True if currently running
  trialEndsAt?: number;      // Timestamp when trial expires
  hasPlanUpdate?: boolean;   // New: To trigger celebration modal
}

export interface Reminder {
  id: string;
  userId: string;
  subject: string;
  text: string; // The speech text
  time: string; // ISO Date string
  speed: number; // 0.5 to 2.0
  mood: 'calm' | 'urgent' | 'cheerful';
  isCompleted: boolean;
  voiceId?: string; // Specific voice selection
  repeatVoice?: boolean; // Toggle for looping audio
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  plan: PlanType;
  amount: number;
  upiId: string;
  transactionId: string;
  screenshot: string; // Base64 string
  status: 'pending' | 'approved' | 'rejected';
  date: number;
}

export interface ChatAttachment {
  type: 'image' | 'pdf' | 'text';
  url: string; // Base64 string
  name: string;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'admin' or userId
  receiverId: string; // 'admin' or userId
  text: string;
  attachment?: ChatAttachment;
  timestamp: number;
  read: boolean;
}

export interface PlanFeature {
  nameKey: string;
  valueKey?: string; // For suffix like (1 Free/Day)
  arg?: string; // For dynamic values like "10"
  status: 'included' | 'excluded' | 'limited';
}

export interface PlanConfig {
  type: PlanType;
  nameLabel: string; // New: Branding Name (e.g., Starter, Pro)
  price: number;
  durationLabel: string;
  features: PlanFeature[];
}
