
import { User, Reminder, Transaction, ChatMessage, PlanType } from '../types';

// Keys
const USERS_KEY = 'vm_users';
const REMINDERS_KEY = 'vm_reminders';
const TRANSACTIONS_KEY = 'vm_transactions';
const CHATS_KEY = 'vm_chats';
const CURRENT_USER_KEY = 'vm_current_user';

// Helpers
const get = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const set = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Auth ---
export const saveUser = (user: User) => {
  const users = get<User>(USERS_KEY);
  users.push(user);
  set(USERS_KEY, users);
};

export const getUsers = (): User[] => get<User>(USERS_KEY);

export const getUserByEmail = (email: string): User | undefined => {
  return get<User>(USERS_KEY).find(u => u.email === email);
};

export const updateUserPlan = (userId: string, plan: PlanType) => {
  const users = get<User>(USERS_KEY);
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].plan = plan;
    // simple expiry logic
    const now = Date.now();
    const day = 86400000;
    let duration = 0;
    if(plan === PlanType.MONTHLY) duration = day * 30;
    if(plan === PlanType.HALF_YEARLY) duration = day * 180;
    if(plan === PlanType.YEARLY) duration = day * 365;
    if(plan === PlanType.LIFETIME) duration = day * 365 * 100;

    users[idx].planExpiry = now + duration;
    // If they buy a plan, trial is considered finished/irrelevant
    users[idx].trialActive = false;
    
    set(USERS_KEY, users);
  }
};

export const activateTrial = (userId: string) => {
    const users = get<User>(USERS_KEY);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        users[idx].trialActive = true;
        users[idx].isTrialEligible = false; // Used it
        users[idx].trialEndsAt = Date.now() + (60 * 60 * 1000); // 1 Hour from now
        set(USERS_KEY, users);
        
        // Update current session too
        const currentUser = getCurrentUser();
        if(currentUser && currentUser.id === userId) {
            const updated = { ...currentUser, trialActive: true, isTrialEligible: false, trialEndsAt: users[idx].trialEndsAt };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
            return updated;
        }
    }
    return null;
};

export const rejectTrial = (userId: string) => {
    const users = get<User>(USERS_KEY);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
        users[idx].isTrialEligible = false; // Rejected, so can't see again
        users[idx].trialActive = false;
        set(USERS_KEY, users);
        
        const currentUser = getCurrentUser();
        if(currentUser && currentUser.id === userId) {
             const updated = { ...currentUser, isTrialEligible: false, trialActive: false };
             localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
             return updated;
        }
    }
    return null;
};

export const checkTrialExpiry = (user: User): User => {
    if (user.trialActive && user.trialEndsAt && Date.now() > user.trialEndsAt) {
        // Expire it
        const users = get<User>(USERS_KEY);
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx].trialActive = false;
            set(USERS_KEY, users);
            
            const updated = { ...user, trialActive: false };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
            return updated;
        }
    }
    return user;
}

export const deleteUser = (userId: string) => {
    const users = get<User>(USERS_KEY).filter(u => u.id !== userId);
    set(USERS_KEY, users);
}

// --- Session ---
export const loginUser = (user: User) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  // Refresh from main db to get latest plan status
  if(data) {
     const partial = JSON.parse(data);
     const full = getUserByEmail(partial.email);
     return full || null;
  }
  return null;
};

// --- Reminders ---
export const saveReminder = (reminder: Reminder) => {
  const list = get<Reminder>(REMINDERS_KEY);
  list.push(reminder);
  set(REMINDERS_KEY, list);
};

export const getReminders = (userId: string): Reminder[] => {
  return get<Reminder>(REMINDERS_KEY).filter(r => r.userId === userId);
};

export const deleteReminder = (id: string) => {
    const list = get<Reminder>(REMINDERS_KEY).filter(r => r.id !== id);
    set(REMINDERS_KEY, list);
};

// --- Transactions ---
export const saveTransaction = (tx: Transaction) => {
  const list = get<Transaction>(TRANSACTIONS_KEY);
  list.push(tx);
  set(TRANSACTIONS_KEY, list);
};

export const getTransactions = (): Transaction[] => get<Transaction>(TRANSACTIONS_KEY);

export const updateTransactionStatus = (txId: string, status: 'approved' | 'rejected') => {
  const list = get<Transaction>(TRANSACTIONS_KEY);
  const idx = list.findIndex(t => t.id === txId);
  if (idx !== -1) {
    list[idx].status = status;
    set(TRANSACTIONS_KEY, list);
    
    if(status === 'approved') {
        updateUserPlan(list[idx].userId, list[idx].plan);
    }
  }
};

// --- Chat ---
export const saveMessage = (msg: ChatMessage) => {
  const list = get<ChatMessage>(CHATS_KEY);
  list.push(msg);
  set(CHATS_KEY, list);
};

export const getMessages = (userId: string): ChatMessage[] => {
  // Get messages between user and admin
  return get<ChatMessage>(CHATS_KEY).filter(
    m => (m.senderId === userId && m.receiverId === 'admin') || 
         (m.senderId === 'admin' && m.receiverId === userId)
  );
};

export const getAllChats = (): ChatMessage[] => get<ChatMessage>(CHATS_KEY);

export const getUniqueChatUsers = (): string[] => {
    const msgs = getAllChats();
    const users = new Set<string>();
    msgs.forEach(m => {
        if(m.senderId !== 'admin') users.add(m.senderId);
        if(m.receiverId !== 'admin') users.add(m.receiverId);
    });
    return Array.from(users);
}
