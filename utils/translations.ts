
export type LanguageCode = 'en' | 'hi';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

const dictionary: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navbar
    nav_home: "Home",
    nav_login: "Login",
    nav_signup: "Get Started",
    nav_dashboard: "Profile", 
    nav_workspace: "Reminders", 
    nav_upgrade: "Upgrade",
    nav_admin: "Admin",
    nav_logout: "Logout",
    nav_back: "Back",
    
    // Hero & Landing
    hero_title1: "Master Your",
    hero_title2: "Own Time.",
    hero_subtitle: "Stop typing. Start speaking. The most advanced Voice-to-Reminder system that adapts to your mood and urgency.",
    hero_cta_primary: "Get Started Free",
    hero_cta_secondary: "Login",
    feat_title: "Features That Glow",
    feat_subtitle: "Experience a UI so smooth, you'll want to set reminders just to use it.",
    
    // Auth
    auth_welcome_login: "Welcome Back",
    auth_welcome_signup: "Join the Future",
    auth_subtitle_login: "Enter your credentials to access your space.",
    auth_subtitle_signup: "Create an account to start mastering your time.",
    auth_name: "Full Name",
    auth_email: "Email address",
    auth_password: "Password",
    auth_confirm_password: "Confirm Password",
    auth_btn_login: "Sign In",
    auth_btn_signup: "Sign Up",
    auth_switch_login: "Don't have an account? Sign Up",
    auth_switch_signup: "Already have an account? Login",
    auth_err_password: "Passwords do not match.",
    auth_err_exists: "Account already exists with this email. Please Login instead.",
    auth_err_invalid: "Invalid email or password.",
    
    // Profile Page
    prof_title: "User Profile",
    prof_plan: "Current Plan",
    prof_member_since: "Member Since",
    prof_details: "Account Details",
    prof_edit: "Edit Profile",
    
    // Tabs
    tab_create: "Create Reminder",
    tab_data: "Reminder Data",
    tab_analytics: "Analytics",

    // Dashboard Common
    dash_hello: "Hello",
    dash_unlock: "Upgrade Plan",
    sect_create_title: "Create New Reminder",
    sect_analytics_title: "Usage Analytics",
    
    // Dashboard Columns / Data Features
    col_today: "Today's List",
    col_ongoing: "All Ongoing",
    col_completed: "History",
    data_next_up: "Next Up",
    data_no_upcoming: "No upcoming tasks for today",
    data_timeline: "Today's Timeline",
    data_priority_overview: "Priority Overview",
    data_urgent_count: "Urgent Tasks",
    data_clear_history: "Clear History",
    data_quick_actions: "Quick Actions",
    data_locked_title: "Data Locked",
    data_locked_desc: "Upgrade your plan to view detailed reminder lists and timelines.",
    analytics_locked_title: "Analytics Locked",
    analytics_locked_desc: "Upgrade to visualize your productivity, mood, and voice insights.",

    // Create Form
    frm_subject: "Subject",
    frm_voice_text: "Text to Voice Message",
    frm_date: "Date",
    frm_time: "Time",
    frm_mood: "Mood",
    frm_voice: "Voice Setting (20+)",
    frm_check_voice: "Check Voice",
    frm_repeat: "Repeat Voice",
    frm_speed: "Voice Speed",
    frm_submit: "Set Reminder",
    frm_locked_feature: "Locked",
    frm_locked_desc: "Upgrade Plan to Unlock",
    
    // Analytics
    chart_pie_title: "Completion Rate",
    chart_bar_title: "Weekly Activity",
    stat_mood_title: "Mood Analysis",
    stat_voice_title: "Voice Insights",
    stat_forecast_title: "7-Day Forecast",
    stat_fav_voice: "Favorite Voice",
    stat_avg_speed: "Avg Speed",
    stat_upcoming: "Upcoming Tasks",
    
    // Add Reminder Modal
    modal_title: "Set New Reminder",
    modal_subject: "Subject",
    modal_voice_msg: "Voice Message (TTS)",
    modal_time: "Time",
    modal_mood: "Mood",
    modal_save: "Save Reminder",
    modal_cancel: "Cancel",
    mood_calm: "Calm",
    mood_urgent: "Urgent",
    mood_cheerful: "Cheerful",
    
    // Notification
    notif_replay: "Replay Audio",
    notif_dismiss: "Dismiss",
    notif_snooze: "Snooze (5m)",

    // Pricing
    price_title: "Choose Your",
    price_title_highlight: "Power",
    price_subtitle: "Unlock the full potential of VoiceMinder with premium voice features.",
    price_best_value: "Best Value",
    price_select: "Select",
    price_month: "Month",
    price_year: "Year",
    
    // Plan Names - UPDATED
    plan_starter: "Basic",
    plan_pro: "Standard",
    plan_elite: "Premium",
    plan_infinity: "Infinity",
    
    // Plan Features Keys
    feat_limit: "Reminders Per Day",
    feat_subject: "Create Subject",
    feat_tts: "Text to Voice Message",
    feat_date: "Date & Time",
    feat_mood: "Mood Detection",
    feat_voice_set: "Voice Customization",
    feat_test: "Test Sound",
    feat_speed: "Voice Speed Control",
    feat_repeat: "Repeat Voice",
    feat_data: "Reminder Data Tab",
    feat_analytics: "Analytics Tab",
    val_1_free: "(1 Free/Day)",
    val_5_free: "(5 Free/Day)",

    // Checkout
    check_title: "Checkout:",
    check_secure: "Secure Payment",
    check_scan: "Scan using PhonePe or Any UPI App",
    check_ensure: "Please ensure you pay exactly",
    check_verify: "Verify Transaction",
    check_txn_id: "Transaction ID / UTR",
    check_screenshot: "Payment Screenshot",
    check_upload_text: "Click to upload payment proof",
    check_upload_max: "(Max 2MB)",
    check_img_loaded: "Image Loaded",
    check_submit_verify: "Submit Verification",
    check_verifying: "Verifying...",
    check_success_title: "Payment Submitted!",
    check_success_desc: "Your transaction ID has been sent to the admin for approval. Your plan will be active once approved.",
    check_goto_dash: "Go to Dashboard",

    // Admin
    admin_restricted: "Restricted Area",
    admin_auth_req: "Owner Authorization Required",
    admin_enter_pin: "ENTER PIN",
    admin_unlock: "UNLOCK PANEL",
    admin_center: "Admin Command Center",
    admin_system: "SYSTEM: ONLINE",
    admin_exit: "EXIT PANEL",
    admin_tab_tx: "Transactions",
    admin_tab_users: "Users",
    admin_tab_support: "Support",
    admin_pending: "Pending Approvals",
    admin_no_pending: "No pending approvals required.",
    admin_history: "History",
    admin_approve: "Approve",
    admin_reject: "Reject",
    admin_th_date: "Date",
    admin_th_email: "Email",
    admin_th_plan: "Plan",
    admin_th_status: "Status",
    admin_th_name: "Name",
    admin_th_actions: "Actions",
    admin_chat_select: "Select a user to start chatting",
    admin_chat_placeholder: "Type your reply...",

    // Chat Support
    chat_title: "Support Chat",
    chat_intro: "Direct line to the Owner. Ask for help or plan upgrades.",
    chat_placeholder: "Type message...",
  },
  hi: {
    // Navbar
    nav_home: "होम",
    nav_login: "लॉगिन",
    nav_signup: "साइन अप",
    nav_dashboard: "प्रोफ़ाइल", 
    nav_workspace: "रिमाइंडर्स",
    nav_upgrade: "अपग्रेड",
    nav_admin: "एडमिन",
    nav_logout: "लॉगआउट",
    nav_back: "वापस जाएं",

    // Hero & Landing
    hero_title1: "अपने समय पर",
    hero_title2: "काबू पाएं।",
    hero_subtitle: "टाइप करना बंद करें। बोलना शुरू करें। सबसे उन्नत वॉयस-टू-रिमाइंडर सिस्टम जो आपके मूड और तात्कालिकता के अनुकूल है।",
    hero_cta_primary: "मुफ्त में शुरू करें",
    hero_cta_secondary: "लॉगिन",
    feat_title: "शानदार फीचर्स",
    feat_subtitle: "इतने सहज यूआई का अनुभव करें कि आप केवल इसका उपयोग करने के लिए रिमाइंडर सेट करना चाहेंगे।",

    // Auth
    auth_welcome_login: "वापसी पर स्वागत है",
    auth_welcome_signup: "भविष्य में शामिल हों",
    auth_subtitle_login: "अपने स्पेस तक पहुंचने के लिए क्रेडेंशियल्स दर्ज करें।",
    auth_subtitle_signup: "अपने समय में महारत हासिल करने के लिए खाता बनाएं।",
    auth_name: "पूरा नाम",
    auth_email: "ईमेल पता",
    auth_password: "पासवर्ड",
    auth_confirm_password: "पासवर्ड की पुष्टि करें",
    auth_btn_login: "साइन इन करें",
    auth_btn_signup: "साइन अप करें",
    auth_switch_login: "खाता नहीं है? साइन अप करें",
    auth_switch_signup: "पहले से खाता है? लॉगिन करें",
    auth_err_password: "पासवर्ड मेल नहीं खाते।",
    auth_err_exists: "इस ईमेल के साथ खाता पहले से मौजूद है। कृपया लॉगिन करें।",
    auth_err_invalid: "अमान्य ईमेल या पासवर्ड।",

    // Profile Page
    prof_title: "उपयोगकर्ता प्रोफ़ाइल",
    prof_plan: "वर्तमान प्लान",
    prof_member_since: "सदस्यता तिथि",
    prof_details: "खाता विवरण",
    prof_edit: "प्रोफ़ाइल संपादित करें",

    // Tabs
    tab_create: "रिमाइंडर बनाएं",
    tab_data: "रिमाइंडर डेटा",
    tab_analytics: "एनालिटिक्स",

    // Dashboard Common
    dash_hello: "नमस्ते",
    dash_unlock: "अपग्रेड करें",
    sect_create_title: "नया रिमाइंडर बनाएं",
    sect_analytics_title: "उपयोग एनालिटिक्स",

    // Dashboard Columns / Data Features
    col_today: "आज की सूची",
    col_ongoing: "सभी चल रहे",
    col_completed: "इतिहास",
    data_next_up: "अगला कार्य",
    data_no_upcoming: "आज कोई आगामी कार्य नहीं",
    data_timeline: "आज की समयरेखा",
    data_priority_overview: "प्राथमिकता अवलोकन",
    data_urgent_count: "जरूरी कार्य",
    data_clear_history: "इतिहास साफ़ करें",
    data_quick_actions: "त्वरित कार्रवाई",
    data_locked_title: "डेटा लॉक है",
    data_locked_desc: "विस्तृत रिमाइंडर सूचियाँ और समयसीमा देखने के लिए अपना प्लान अपग्रेड करें।",
    analytics_locked_title: "एनालिटिक्स लॉक है",
    analytics_locked_desc: "अपनी उत्पादकता, मूड और वॉयस इनसाइट्स को देखने के लिए अपग्रेड करें।",

    // Create Form
    frm_subject: "विषय",
    frm_voice_text: "वॉयस संदेश (टेक्स्ट)",
    frm_date: "तारीख",
    frm_time: "समय",
    frm_mood: "मूड",
    frm_voice: "आवाज़ सेटिंग (20+)",
    frm_check_voice: "आवाज़ चेक करें",
    frm_repeat: "आवाज़ दोहराएं",
    frm_speed: "आवाज़ की गति",
    frm_submit: "रिमाइंडर सेट करें",
    frm_locked_feature: "लॉक है",
    frm_locked_desc: "अनलॉक करने के लिए प्लान खरीदें",
    
    // Analytics
    chart_pie_title: "पूर्णता दर",
    chart_bar_title: "साप्ताहिक गतिविधि",
    stat_mood_title: "मूड विश्लेषण",
    stat_voice_title: "आवाज़ प्राथमिकताएं",
    stat_forecast_title: "7-दिवसीय पूर्वानुमान",
    stat_fav_voice: "पसंदीदा आवाज़",
    stat_avg_speed: "औसत गति",
    stat_upcoming: "आगामी कार्य",

    // Add Reminder Modal
    modal_title: "नया रिमाइंडर सेट करें",
    modal_subject: "विषय",
    modal_voice_msg: "वॉयस संदेश (TTS)",
    modal_time: "समय",
    modal_mood: "मूड",
    modal_save: "रिमाइंडर सहेजें",
    modal_cancel: "रद्द करें",
    mood_calm: "शांत",
    mood_urgent: "जरूरी",
    mood_cheerful: "हंसमुख",

    // Notification
    notif_replay: "ऑडियो फिर से चलाएं",
    notif_dismiss: "बंद करें",
    notif_snooze: "स्नूज़ (5 मिनट)",

    // Pricing
    price_title: "अपनी शक्ति",
    price_title_highlight: "चुनें",
    price_subtitle: "प्रीमियम वॉयस फीचर्स के साथ वॉयस माइंडर की पूरी क्षमता को अनलॉक करें।",
    price_best_value: "सबसे अच्छा मूल्य",
    price_select: "चुनें",
    price_month: "महीना",
    price_year: "साल",
    
    // Plan Names - UPDATED
    plan_starter: "बेसिक",
    plan_pro: "स्टैंडर्ड",
    plan_elite: "प्रीमियम",
    plan_infinity: "इन्फिनिटी",

    // Plan Features Keys
    feat_limit: "रिमाइंडर्स प्रति दिन",
    feat_subject: "विषय बनाएं",
    feat_tts: "टेक्स्ट टू वॉयस संदेश",
    feat_date: "तारीख और समय",
    feat_mood: "मूड डिटेक्शन",
    feat_voice_set: "वॉयस कस्टमाइज़ेशन",
    feat_test: "साउंड टेस्ट करें",
    feat_speed: "वॉयस स्पीड कंट्रोल",
    feat_repeat: "आवाज़ दोहराएं",
    feat_data: "रिमाइंडर डेटा टैब",
    feat_analytics: "एनालिटिक्स टैब",
    val_1_free: "(1 मुफ्त/दिन)",
    val_5_free: "(5 मुफ्त/दिन)",

    // Checkout
    check_title: "चेकआउट:",
    check_secure: "सुरक्षित भुगतान",
    check_scan: "PhonePe या किसी भी UPI ऐप का उपयोग करके स्कैन करें",
    check_ensure: "कृपया सुनिश्चित करें कि आप ठीक भुगतान करें",
    check_verify: "लेन-देन सत्यापित करें",
    check_txn_id: "ट्रांसक्शन आईडी / UTR",
    check_screenshot: "भुगतान स्क्रीनशॉट",
    check_upload_text: "भुगतान प्रमाण अपलोड करने के लिए क्लिक करें",
    check_upload_max: "(अधिकतम 2MB)",
    check_img_loaded: "छवि लोड की गई",
    check_submit_verify: "सत्यापन जमा करें",
    check_verifying: "सत्यापन हो रहा है...",
    check_success_title: "भुगतान जमा हो गया!",
    check_success_desc: "आपकी ट्रांसक्शन आईडी अनुमोदन के लिए एडमिन को भेज दी गई है। अनुमोदन के बाद आपका प्लान सक्रिय हो जाएगा।",
    check_goto_dash: "डैशबोर्ड पर जाएं",

    // Admin
    admin_restricted: "प्रतिबंधित क्षेत्र",
    admin_auth_req: "मालिक की अनुमति आवश्यक है",
    admin_enter_pin: "पिन दर्ज करें",
    admin_unlock: "पैनल अनलॉक करें",
    admin_center: "एडमिन कमांड सेंटर",
    admin_system: "सिस्टम: ऑनलाइन",
    admin_exit: "पैनल से बाहर निकलें",
    admin_tab_tx: "लेन-देन",
    admin_tab_users: "उपयोगकर्ता",
    admin_tab_support: "सहायता",
    admin_pending: "लंबित अनुमोदन",
    admin_no_pending: "कोई लंबित अनुमोदन आवश्यक नहीं है।",
    admin_history: "इतिहास",
    admin_approve: "स्वीकृत",
    admin_reject: "अस्वीकार",
    admin_th_date: "तारीख",
    admin_th_email: "ईमेल",
    admin_th_plan: "प्लान",
    admin_th_status: "स्थिति",
    admin_th_name: "नाम",
    admin_th_actions: "कार्रवाई",
    admin_chat_select: "चैट शुरू करने के लिए एक उपयोगकर्ता चुनें",
    admin_chat_placeholder: "अपना जवाब टाइप करें...",

    // Chat Support
    chat_title: "सहायता चैट",
    chat_intro: "मालिक से सीधी बात। मदद या प्लान अपग्रेड के लिए पूछें।",
    chat_placeholder: "संदेश टाइप करें...",
  }
};

export const getTranslation = (lang: LanguageCode, key: string): string => {
  const langDict = dictionary[lang] || dictionary['en'];
  return langDict[key] || dictionary['en'][key] || key;
};
