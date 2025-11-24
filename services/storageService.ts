import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Reminder, Transaction, ChatMessage, PlanType } from '../types';
import { SUPABASE_URL, SUPABASE_KEY } from '../constants';

// --- SUPABASE CLIENT INITIALIZATION ---
let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }
}

// Keys for fallback/session (localStorage still used for session persistence)
const CURRENT_USER_KEY = 'vm_current_user';

// --- HELPER: Upload Base64 to Supabase Storage ---
async function uploadToSupabase(base64Data: string, folder: string): Promise<string | null> {
    if (!supabase || !base64Data.startsWith('data:')) return base64Data;

    try {
        const timestamp = Date.now();
        const rand = Math.random().toString(36).substring(7);
        // Clean folder name just in case
        const cleanFolder = folder.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // Fetch base64 as blob
        const res = await fetch(base64Data);
        const blob = await res.blob();
        
        // Infer extension
        const ext = blob.type.split('/')[1] || 'bin';
        const fileName = `${cleanFolder}/${timestamp}_${rand}.${ext}`;

        const { data, error } = await supabase.storage
            .from('voiceminder-files')
            .upload(fileName, blob);

        if (error) {
            console.error("Upload Error:", error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('voiceminder-files')
            .getPublicUrl(fileName);
            
        return publicUrl;
    } catch (e) {
        console.error("Upload Exception:", e);
        return null;
    }
}

// --- MAPPERS (CamelCase <-> SnakeCase) ---

const mapUserToDB = (u: User) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password,
    plan: u.plan,
    plan_expiry: u.planExpiry,
    is_admin: u.isAdmin,
    is_trial_eligible: u.isTrialEligible,
    trial_active: u.trialActive,
    trial_ends_at: u.trialEndsAt,
    has_plan_update: u.hasPlanUpdate
});

const mapUserFromDB = (data: any): User => ({
    id: data.id,
    name: data.name,
    email: data.email,
    password: data.password,
    plan: data.plan as PlanType,
    planExpiry: data.plan_expiry,
    isAdmin: data.is_admin,
    isTrialEligible: data.is_trial_eligible,
    trialActive: data.trial_active,
    trialEndsAt: data.trial_ends_at,
    hasPlanUpdate: data.has_plan_update
});

const mapReminderToDB = (r: Reminder) => ({
    id: r.id,
    user_id: r.userId,
    subject: r.subject,
    text: r.text,
    time: r.time,
    speed: r.speed,
    mood: r.mood,
    is_completed: r.isCompleted,
    voice_id: r.voiceId,
    repeat_voice: r.repeatVoice
});

const mapReminderFromDB = (data: any): Reminder => ({
    id: data.id,
    userId: data.user_id,
    subject: data.subject,
    text: data.text,
    time: data.time,
    speed: data.speed,
    mood: data.mood,
    isCompleted: data.is_completed,
    voiceId: data.voice_id,
    repeatVoice: data.repeat_voice
});

const mapTransactionToDB = (t: Transaction) => ({
    id: t.id,
    user_id: t.userId,
    user_email: t.userEmail,
    plan: t.plan,
    amount: t.amount,
    upi_id: t.upiId,
    transaction_id: t.transactionId,
    screenshot: t.screenshot, // Will be URL after upload
    status: t.status,
    date: t.date
});

const mapTransactionFromDB = (data: any): Transaction => ({
    id: data.id,
    userId: data.user_id,
    userEmail: data.user_email,
    plan: data.plan,
    amount: data.amount,
    upiId: data.upi_id,
    transactionId: data.transaction_id,
    screenshot: data.screenshot,
    status: data.status,
    date: data.date
});

const mapChatToDB = (c: ChatMessage) => ({
    id: c.id,
    sender_id: c.senderId,
    receiver_id: c.receiverId,
    text: c.text,
    attachment: c.attachment, // Supabase handles JSONB
    timestamp: c.timestamp,
    read: c.read
});

const mapChatFromDB = (data: any): ChatMessage => ({
    id: data.id,
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    text: data.text,
    attachment: data.attachment,
    timestamp: data.timestamp,
    read: data.read
});

// --- API IMPLEMENTATION ---

export const saveUser = async (user: User): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').upsert(mapUserToDB(user)).select().single();
    if (error) {
        console.error("Supabase Save User Error:", error);
        return null;
    }
    return mapUserFromDB(data);
};

export const getUsers = async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) return [];
    return data.map(mapUserFromDB);
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !data) return undefined;
    return mapUserFromDB(data);
};

export const getUserById = async (id: string): Promise<User | undefined> => {
    if (!supabase) return undefined;
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    return mapUserFromDB(data);
}

export const updateUserName = async (userId: string, newName: string): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').update({ name: newName }).eq('id', userId).select().single();
    if (error || !data) return null;
    const updated = mapUserFromDB(data);
    loginUser(updated); // Update session
    return updated;
};

export const updateUserPlan = async (userId: string, plan: PlanType) => {
    if (!supabase) return;
    
    const now = Date.now();
    const day = 86400000;
    let duration = 0;
    if(plan === PlanType.MONTHLY) duration = day * 30;
    if(plan === PlanType.HALF_YEARLY) duration = day * 180;
    if(plan === PlanType.YEARLY) duration = day * 365;
    if(plan === PlanType.LIFETIME) duration = day * 365 * 100;

    const updates = {
        plan: plan,
        plan_expiry: now + duration,
        trial_active: false,
        has_plan_update: plan !== PlanType.FREE
    };

    const { data } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if(data) {
        // If current user is this user, update session
        const current = getCurrentUserSession();
        if(current && current.id === userId) {
            loginUser(mapUserFromDB(data));
        }
    }
};

export const clearPlanUpdateFlag = async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('users').update({ has_plan_update: false }).eq('id', userId).select().single();
    if(data) {
         const updated = mapUserFromDB(data);
         // update session silently
         const current = getCurrentUserSession();
         if(current && current.id === userId) {
             loginUser(updated);
         }
         return updated;
    }
    return null;
}

export const activateTrial = async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    const updates = {
        trial_active: true,
        is_trial_eligible: false,
        trial_ends_at: Date.now() + (60 * 60 * 1000)
    };
    const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if (data) {
        const u = mapUserFromDB(data);
        loginUser(u);
        return u;
    }
    return null;
};

export const rejectTrial = async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    const updates = {
        is_trial_eligible: false,
        trial_active: false
    };
    const { data } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if (data) {
        const u = mapUserFromDB(data);
        loginUser(u);
        return u;
    }
    return null;
};

export const checkTrialExpiry = async (user: User): Promise<User> => {
    if (user.trialActive && user.trialEndsAt && Date.now() > user.trialEndsAt) {
        if (!supabase) return { ...user, trialActive: false };
        
        const { data } = await supabase.from('users').update({ trial_active: false }).eq('id', user.id).select().single();
        if(data) {
            const updated = mapUserFromDB(data);
            loginUser(updated);
            return updated;
        }
        // Fallback if db fails
        const fallback = { ...user, trialActive: false };
        loginUser(fallback);
        return fallback;
    }
    return user;
};

export const deleteUser = async (userId: string) => {
    if(!supabase) return;
    await supabase.from('users').delete().eq('id', userId);
}

// --- Session (Local Storage for Perf) ---
export const loginUser = (user: User) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
};

export const logoutUser = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

// Returns synchronous session data (fast)
export const getCurrentUserSession = (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
};

// Returns async fresh data (reliable)
export const getCurrentUser = async (): Promise<User | null> => {
    const session = getCurrentUserSession();
    if (!session) return null;
    // Verify against DB
    const fresh = await getUserById(session.id);
    if(fresh) {
        loginUser(fresh); // Update cache
        return fresh;
    }
    return session; // Fallback to session if DB offline or err, to prevent lockout
};

// --- Reminders ---
export const saveReminder = async (reminder: Reminder) => {
    if (!supabase) return;
    await supabase.from('reminders').upsert(mapReminderToDB(reminder));
};

export const getReminders = async (userId: string): Promise<Reminder[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('reminders').select('*').eq('user_id', userId);
    if (error) return [];
    return data.map(mapReminderFromDB);
};

export const deleteReminder = async (id: string) => {
    if (!supabase) return;
    await supabase.from('reminders').delete().eq('id', id);
};

// --- Transactions ---
export const saveTransaction = async (tx: Transaction) => {
    if (!supabase) return;
    
    // Upload Screenshot to Storage Bucket if it is base64
    if (tx.screenshot && tx.screenshot.startsWith('data:')) {
        const url = await uploadToSupabase(tx.screenshot, 'transactions');
        if (url) {
            tx.screenshot = url; // Update object with public URL
        }
    }

    await supabase.from('transactions').upsert(mapTransactionToDB(tx));
};

export const getTransactions = async (): Promise<Transaction[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) return [];
    return data.map(mapTransactionFromDB);
};

export const updateTransactionStatus = async (txId: string, status: 'approved' | 'rejected') => {
    if (!supabase) return;
    
    // 1. Get transaction to know plan
    const { data: txData } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if(!txData) return;

    // 2. Update status
    await supabase.from('transactions').update({ status }).eq('id', txId);

    // 3. If approved, update user plan
    if (status === 'approved') {
        await updateUserPlan(txData.user_id, txData.plan as PlanType);
    }
};

export const deleteTransaction = async (id: string) => {
    if (!supabase) return;
    await supabase.from('transactions').delete().eq('id', id);
};

// --- Chat ---
export const saveMessage = async (msg: ChatMessage) => {
    if (!supabase) return;

    // Upload Attachment if it is base64
    if (msg.attachment && msg.attachment.url && msg.attachment.url.startsWith('data:')) {
        const url = await uploadToSupabase(msg.attachment.url, 'chats');
        if (url) {
            msg.attachment.url = url;
        }
    }

    await supabase.from('chats').upsert(mapChatToDB(msg));
};

export const getMessages = async (userId: string): Promise<ChatMessage[]> => {
    if (!supabase) return [];
    // Or condition for sender/receiver
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId},sender_id.eq.admin,receiver_id.eq.admin`);
    
    if (error) return [];
    
    // Filter strictly for this pair in memory (Supabase OR is broad here)
    const msgs = data.map(mapChatFromDB);
    return msgs.filter(m => 
        (m.senderId === userId && m.receiverId === 'admin') || 
        (m.senderId === 'admin' && m.receiverId === userId)
    ).sort((a,b) => a.timestamp - b.timestamp);
};

export const getAllChats = async (): Promise<ChatMessage[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('chats').select('*');
    return data ? data.map(mapChatFromDB).sort((a,b) => a.timestamp - b.timestamp) : [];
};

export const getUniqueChatUsers = async (): Promise<string[]> => {
    const msgs = await getAllChats();
    const users = new Set<string>();
    msgs.forEach(m => {
        if(m.senderId !== 'admin') users.add(m.senderId);
        if(m.receiverId !== 'admin') users.add(m.receiverId);
    });
    return Array.from(users);
};

// --- BACKUP & RESTORE ---
export const exportDatabase = async (): Promise<string> => {
    const users = await getUsers();
    const { data: reminders } = await supabase!.from('reminders').select('*');
    const transactions = await getTransactions();
    const chats = await getAllChats();

    const data = {
        users,
        reminders: reminders?.map(mapReminderFromDB) || [],
        transactions,
        chats,
        timestamp: Date.now()
    };
    return JSON.stringify(data, null, 2);
};

export const importDatabase = async (jsonString: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
        const data = JSON.parse(jsonString);
        
        if (data.users) {
            for (const u of data.users) await saveUser(u);
        }
        if (data.reminders) {
            for (const r of data.reminders) await saveReminder(r);
        }
        if (data.transactions) {
            for (const t of data.transactions) await saveTransaction(t);
        }
        if (data.chats) {
            for (const c of data.chats) await saveMessage(c);
        }
        return true;
    } catch (e) {
        console.error("Import Failed", e);
        return false;
    }
};