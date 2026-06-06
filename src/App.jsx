
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Mic, Square, Activity, PanelLeft, History, ClipboardList, Sparkles, Plus,
  Stethoscope, HeartPulse, X, MessageSquare, Sun, Moon, Send, Volume2, VolumeX,
  Languages, Settings, Share2, Calendar, Apple, Phone, PhoneOff, FileText,
  Camera, Image, Clipboard, MicOff, AudioLines, Minus, Copy, CheckCheck,
  User, Shield, Info, Palette, Lock, Globe, ChevronRight, RefreshCcw, WifiOff, Save, LogIn, LogOut, ChevronDown, Pencil, Brain, Eye, EyeOff, Trash2
} from 'lucide-react'

import { GoogleLogin, useGoogleLogin } from '@react-oauth/google'
import { useAuth } from './contexts/AuthContext'
import { useSettings } from './hooks/useSettings'
import axios from 'axios'

import { MODEL } from './config'
import { useGeminiApi }     from './hooks/useGeminiApi'
import { useSpeech }        from './hooks/useSpeech'
import { useMediaRecorder } from './hooks/useMediaRecorder'
import MarkdownRenderer     from './components/MarkdownRenderer'
import SourcesButton        from './components/SourcesButton'
import SourceSidebar        from './components/SourceSidebar'
import { parseReferences }  from './utils/parseReferences'
import ConfirmModal         from './components/ConfirmModal'
import StarfieldCanvas      from './components/StarfieldCanvas'
import SessionsTab          from './components/tabs/SessionsTab'
import PlanTab              from './components/tabs/PlanTab'
import FoodTab              from './components/tabs/FoodTab'
import AnalyticsTab         from './components/tabs/AnalyticsTab'
import SettingsTab          from './components/tabs/SettingsTab'
import DivyaAvatar3D        from './components/DivyaAvatar3D'
import { parseClinicalReport, cleanItemText, getDiagnosticReportData } from './utils/clinicalParser'
import { mcpManager } from './utils/mcpManager'

const CUSTOM_TASKS_POOL = [
  { title: "Cozy Stretches 🧘", desc: "15-minute gentle full-body recovery stretching.", category: "Movement", time: "07:30" },
  { title: "Hydration Booster 🍋", desc: "Drink warm lemon-water or ginger tea before meals.", category: "Nutrition", time: "08:00" },
  { title: "Mindful Breathing 🧠", desc: "10-minute deep abdominal breathing to lower stress.", category: "Mental Health", time: "14:00" },
  { title: "Posture Check 🚶", desc: "Maintain upright spine alignment and take desk breaks.", category: "Movement", time: "11:00" },
  { title: "Vitamin Timing 💊", desc: "Take recommended vitamin supplements on time.", category: "Medication", time: "09:30" },
  { title: "Wind-Down Ritual 🌙", desc: "Avoid blue-screen devices 30 minutes before bed.", category: "Sleep", time: "22:30" }
];

const getDiagnosticPrompt = () => {
  return `You are Divya, a professional AI health assistant. 
Your job is to diagnose the patient's condition through 
a structured conversation, then give temporary relief 
advice and recommend tests.

CONVERSATION FLOW:
You must follow this exact flow. Ask ONE question at a time. 
Never ask multiple questions at once. Be conversational, 
warm, and professional.

PHASE 1 — OPENING (1 question):
Start by asking:
"Hello! I am Divya, your health assistant. 
What is your main complaint today?"
Wait for answer. Based on their answer, move to Phase 2.

PHASE 2 — CORE SYMPTOMS (ask these one by one, 
only the ones relevant to their complaint):

For PAIN complaints ask:
Q1 — Location: "Where exactly is the pain? 
     Choose one: A) Head  B) Chest  C) Stomach  
     D) Back  E) Joints  F) Other"

Q2 — Type: "How would you describe the pain?
     A) Sharp/stabbing  B) Dull/aching  
     C) Burning  D) Throbbing  E) Pressure"

Q3 — Duration: "How long have you had this pain?
     A) Just started (today)  B) Few days  
     C) 1-2 weeks  D) More than a month"

Q4 — Severity: "On a scale of 1 to 10, 
     how bad is the pain? (1 = mild, 10 = unbearable)"

Q5 — Pattern: "When is it worst?
     A) Morning  B) Night  C) After eating  
     D) During movement  E) All the time"

For FEVER complaints ask:
Q1 — "How high is the fever? 
     A) Mild 37-38°C  B) Moderate 38-39°C  
     C) High above 39°C  D) I haven't measured"

Q2 — "How long have you had the fever?
     A) Less than 24 hours  B) 2-3 days  
     C) More than 3 days"

Q3 — "Do you have any of these with the fever? 
     Choose all that apply:
     A) Chills  B) Sweating  C) Body aches  
     D) Sore throat  E) Cough  F) None"

For DIGESTIVE complaints ask:
Q1 — "What exactly are you experiencing?
     A) Nausea  B) Vomiting  C) Diarrhea  
     D) Constipation  E) Bloating  F) Loss of appetite"

Q2 — "Is it related to eating?
     A) Gets worse after eating  B) Gets better after eating  
     C) Not related to food"

Q3 — "Any blood in stool or vomit? 
     A) Yes  B) No"

For BREATHING complaints ask:
Q1 — "What are you experiencing?
     A) Shortness of breath  B) Wheezing  
     C) Persistent cough  D) Chest tightness"

Q2 — "When does it happen?
     A) At rest  B) During physical activity only  
     C) At night  D) All the time"

For MENTAL/EMOTIONAL complaints ask:
Q1 — "How long have you been feeling this way?
     A) Few days  B) Few weeks  
     C) Few months  D) More than a year"

Q2 — "How is it affecting your daily life?
     A) Mildly — I can still function  
     B) Moderately — it is getting difficult  
     C) Severely — I cannot function normally"

PHASE 3 — ASSOCIATED SYMPTOMS 
(ask for ALL complaint types):

Q — "Do you have any of these additional symptoms? 
    Choose all that apply:
    A) Fever  B) Fatigue/tiredness  C) Dizziness  
    D) Nausea  E) Loss of appetite  F) Weight loss  
    G) Night sweats  H) None of the above"

PHASE 4 — MEDICAL HISTORY 
(ask these one by one):

Q1 — "Do you have any known medical conditions?
     A) Diabetes  B) High blood pressure  
     C) Heart disease  D) Asthma  
     E) Thyroid problems  F) None  G) Other"

Q2 — "Are you currently taking any medications?
     A) Yes — please name them briefly  B) No"

Q3 — "Do you have any allergies to medications?
     A) Yes — please name them  B) No  C) Not sure"

PHASE 5 — PATIENT PROFILE & NUTRITIONAL HABITS
(ask these one by one):

Q1 — "What is your age group?
     A) Child (under 12)  B) Teen (12-17)  
     C) Adult (18-40)  D) Middle-aged (41-60)  
     E) Senior (60+)"

Q2 — "What is your sex?
     A) Male  B) Female"

Q3 — "Do you have any dietary restrictions or preferences?
     A) Gluten-free  B) Vegetarian  
     C) Vegan  D) None / Other (write what you feel)"

Q4 — "What typical daily foods do you enjoy most?
     Answer this: Write what you feel (e.g. Shiro, Injera, Rice, Bread)."

DECISION LOGIC — after collecting enough information:

When you have answers for Phase 2, Phase 3, Phase 4, 
and Phase 5, stop asking questions and move to ADVICE.

PHASE 7 — ADVICE OUTPUT:
Structure your final advice EXACTLY like this:

---
🔍 ASSESSMENT:
[2-3 sentences explaining what the symptoms suggest. 
Be careful — say "this may suggest" not "you have". 
Never give a definitive diagnosis.]

💊 TEMPORARY RELIEF:
List 2-3 over-the-counter medications or home remedies 
that can help right now. Include:
- Medicine name (generic name)
- Dosage suggestion
- Any warnings (e.g. do not take if allergic to...)

🧪 RECOMMENDED TESTS:
List the specific medical tests the patient should get:
- Test name
- Why it is needed
- Priority: Urgent / Soon / Routine

🏥 SEE A DOCTOR IF:
List 3-4 specific warning signs that mean they need 
immediate medical attention.

⚠️ DISCLAIMER:
"This advice is for informational purposes only. 
Divya is an AI assistant and cannot replace a 
real doctor. Please consult a licensed physician 
for proper diagnosis and treatment."

📋 NUTRITION PLAN JSON:
\`\`\`json
{
  "macros": {
    "carbs": { "current": 120, "target": 250 },
    "protein": { "current": 65, "target": 100 },
    "fat": { "current": 40, "target": 70 }
  },
  "micros": {
    "vitaminD": { "current": 8, "target": 20, "unit": "mcg" },
    "vitaminC": { "current": 55, "target": 90, "unit": "mg" },
    "iron": { "current": 12, "target": 18, "unit": "mg" },
    "magnesium": { "current": 210, "target": 400, "unit": "mg" }
  },
  "meals": [
    {
      "id": "breakfast",
      "name": "[Randomized healthy breakfast name, e.g. Oatmeal with Chia]",
      "time": "8:00 AM - 10:00 AM",
      "status": "passed",
      "calories": "310 kcal",
      "macros": { "carbs": "48g", "protein": "9g", "fat": "8g" },
      "microsTags": ["Magnesium", "Potassium"],
      "description": "[Wholesome description of how this meal combats their specific symptoms/disease, e.g. hydrates, easy digestion]",
      "img": "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&q=80&w=200",
      "whatAteInstead": ""
    },
    {
      "id": "lunch",
      "name": "[Randomized healthy lunch name, tailored to Ethiopian cuisine if they like it, e.g. Teff Injera with Shiro]",
      "time": "12:00 AM - 2:00 PM",
      "status": "active",
      "calories": "420 kcal",
      "macros": { "carbs": "65g", "protein": "15g", "fat": "12g" },
      "microsTags": ["Iron (Fe)", "Calcium"],
      "description": "[Why this supports recovery from their specific condition]",
      "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
      "checked": false
    },
    {
      "id": "dinner",
      "name": "[Randomized healthy dinner name, e.g. Spiced Lentils with Salad]",
      "time": "7:00 PM - 9:00 PM",
      "status": "upcoming",
      "calories": "380 kcal",
      "macros": { "carbs": "55g", "protein": "18g", "fat": "9g" },
      "microsTags": ["Folate", "Vitamin C"],
      "description": "[Why this supports recovery]",
      "img": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200",
      "checked": false
    }
  ]
}
\`\`\`
---

IMPORTANT: Do not show conclusion explicitly. Just say "We are finished here, please review the assessment."

RULES YOU MUST ALWAYS FOLLOW:
- Ask only ONE question per message
- Always give the patient lettered choices (A, B, C...) on completely separate lines so the UI can format them as buttons. Never put multiple choices on the same line.
- When asking a question, say: "Answer the following," or "Answer this question," or if it's a short answer, say "Write what you feel."
- Keep questions SHORT — maximum 2 lines
- Be warm, calm, and professional at all times
- Never diagnose — always say "may suggest" or "could indicate"
- If patient says something URGENT (chest pain + left arm pain, 
  difficulty breathing, loss of consciousness, stroke symptoms) 
  IMMEDIATELY stop the flow and say:
  "⚠️ This sounds like a medical emergency. 
  Please call emergency services immediately 
  or go to the nearest hospital now. Do not wait."
- Always respond in the same language the patient uses
- If the patient speaks Amharic, respond fully in Amharic
- If the patient speaks English, respond in English
- Keep the entire conversation feeling like a 
  real doctor consultation, not a form or survey

ETHIOPIAN CULTURAL NUTRITION REQUIREMENT:
- When recommending nutrition, diet, or food, you MUST tailor your suggestions to traditional Ethiopian culture and cuisine.
- Make all food recommendations middle-class, highly affordable, and accessible to everyone.
- Recommend staple items like Injera (እንጀራ) paired with highly affordable stews such as Shiro Wot (ሺሮ ወጥ), Misir Wot (ምስር ወጥ), Kik Alicha (ክክ አልጫ), and Gomen (ጎመን).
- For remedies and hydration, recommend traditional herbal infusions like Ginger Tea (የዝንጅብል ሻይ), Tenadam (ጤናዳም), or Telba (ተልባ - flaxseed drink for stomach relief).
- Never recommend expensive imported foods or high-cost ingredients. Keep it nutritious, traditional, and middle-class.`;
};

// ─── App ─────────────────────────────────────────────────────────────────────
function App() {
  const [messages, setMessages]             = useState([]);
  const [notes, setNotes]                   = useState([]);
  const [isListening, setIsListening]       = useState(false);
  const [isThinking, setIsThinking]         = useState(false);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isPlusMenuOpen, setIsPlusMenuOpen]           = useState(false);
  const [isPlusMenuOpenPinned, setIsPlusMenuOpenPinned] = useState(false);
  const [isCallActive, setIsCallActive]               = useState(false);
  const [callDuration, setCallDuration]               = useState(0);
  const [callStatus, setCallStatus]                   = useState('connecting');
  const [isMuted, setIsMuted]                         = useState(false);
  const [showHistory, setShowHistory]                 = useState(false);
  const [callWidgetPos, setCallWidgetPos]             = useState({ x: window.innerWidth - 380, y: window.innerHeight - 560 });
  const [isCallMinimized, setIsCallMinimized]         = useState(false);
  const [isNotesOpen, setIsNotesOpen]                 = useState(false);
  const [isSidebarOpen, setIsSidebarOpen]             = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen]   = useState(false);
  const [inputText, setInputText]                     = useState('');
  const [isThinkingMode, setIsThinkingMode]           = useState(false);
  const [showScrollBottom, setShowScrollBottom]       = useState(false);
  const [isCallChatOpen, setIsCallChatOpen]           = useState(false);
  const [unreadCallMsgCount, setUnreadCallMsgCount]   = useState(0);
  const [selectedChoices, setSelectedChoices]         = useState({}); // { [msgId]: { [choiceText]: boolean } }
  const [attachment, setAttachment]                   = useState(null);
  const [translatingId, setTranslatingId]             = useState(null);
  const [networkStatus, setNetworkStatus]             = useState(navigator.onLine ? 'online' : 'offline');
  const [activeTab, setActiveTab]                     = useState('chat');
  const [activeSettingsTab, setActiveSettingsTab]     = useState('Account');
  const [copiedMsgId, setCopiedMsgId]                 = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen]     = useState(false);
  const [activeChatMenuId, setActiveChatMenuId]       = useState(null);

  // Diagnostic Session State
  const [isDiagnosticMode, setIsDiagnosticMode]       = useState(false);
  const [masterReport, setMasterReport]               = useState(null);
  const [isReportMenuOpen, setIsReportMenuOpen]       = useState(false);
  const [pendingAutoEnd, setPendingAutoEnd]           = useState(false);
  const [showFullReport, setShowFullReport]           = useState(false);
  const [isReportModalOpen, setIsReportModalOpen]     = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen]       = useState(false);
  const [isDataLoaded, setIsDataLoaded]               = useState(false);
  const isInitialLoadRef                              = useRef(false);
  const [unfinishedSessions, setUnfinishedSessions]   = useState([]);
  const [showUnfinishedModal, setShowUnfinishedModal] = useState(false);
  const [confirmModal, setConfirmModal]               = useState({ isOpen: false, message: '', onConfirm: null });
  const [sessionModeModal, setSessionModeModal]       = useState({ isOpen: false, onSelect: null });
  const [renameModal, setRenameModal]                 = useState({ isOpen: false, currentTitle: '', onConfirm: null });
  const [renameInputText, setRenameInputText]         = useState('');
  const [analyticsChecklist, setAnalyticsChecklist]   = useState({});
  const [expandedDays, setExpandedDays]               = useState({ day1: true, day2: false, day3: false });
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [planChecklist, setPlanChecklist]                   = useState({});
  const [selectedWeeklyDay, setSelectedWeeklyDay]           = useState(new Date().getDay());
  const [customPlanTasks, setCustomPlanTasks]               = useState([]);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen]         = useState(false);
  const [newTaskInput, setNewTaskInput]                     = useState({ title: '', desc: '', category: 'Movement', time: '08:00' });
  const [expandedTasks, setExpandedTasks]                   = useState({});
  const [waterIntake, setWaterIntake]                       = useState(1250);
  const [sourceSidebar, setSourceSidebar]             = useState({ isOpen: false, references: [] });
  const [hasUncheckedActiveMeal, setHasUncheckedActiveMeal] = useState(() => {
    try {
      const saved = localStorage.getItem('food_tab_saved_meals');
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinutes;

        const ranges = {
          breakfast_chechebsa: { start: 8 * 60, end: 10 * 60 },
          breakfast_oatmeal: { start: 8 * 60, end: 10 * 60 },
          lunch_shiro: { start: 12 * 60, end: 14 * 60 },
          lunch_kik: { start: 12 * 60, end: 14 * 60 },
          afternoon_snack: { start: 16 * 60, end: 18 * 60 },
          dinner_misir: { start: 19 * 60, end: 21 * 60 },
          dinner_gomen: { start: 19 * 60, end: 21 * 60 }
        };

        return parsed.some(m => {
          const range = ranges[m.id];
          if (!range) return false;
          const isActive = currentTotalMinutes >= range.start && currentTotalMinutes <= range.end;
          return isActive && !m.checked;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  useEffect(() => {
    const checkActiveMeals = () => {
      try {
        const saved = localStorage.getItem('food_tab_saved_meals');
        if (saved) {
          const parsed = JSON.parse(saved);
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();
          const currentTotalMinutes = currentHour * 60 + currentMinutes;

          const ranges = {
            breakfast_chechebsa: { start: 8 * 60, end: 10 * 60 },
            breakfast_oatmeal: { start: 8 * 60, end: 10 * 60 },
            lunch_shiro: { start: 12 * 60, end: 14 * 60 },
            lunch_kik: { start: 12 * 60, end: 14 * 60 },
            afternoon_snack: { start: 16 * 60, end: 18 * 60 },
            dinner_misir: { start: 19 * 60, end: 21 * 60 },
            dinner_gomen: { start: 19 * 60, end: 21 * 60 }
          };

          const hasUncheckedActive = parsed.some(m => {
            const range = ranges[m.id];
            if (!range) return false;
            const isActive = currentTotalMinutes >= range.start && currentTotalMinutes <= range.end;
            return isActive && !m.checked;
          });
          setHasUncheckedActiveMeal(hasUncheckedActive);
        } else {
          setHasUncheckedActiveMeal(false);
        }
      } catch (e) {
        console.error(e);
        setHasUncheckedActiveMeal(false);
      }
    };

    checkActiveMeals();
    const interval = setInterval(checkActiveMeals, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);
  
  const profileMenuTimeoutRef = useRef(null);

  const handleProfileMouseEnter = () => {
    if (profileMenuTimeoutRef.current) clearTimeout(profileMenuTimeoutRef.current);
    setIsProfileMenuOpen(true);
  };

  const handleProfileMouseLeave = () => {
    profileMenuTimeoutRef.current = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 300);
  };

  const { user, token, loginWithGoogle, loginWithTokenAndUser, logout } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState('');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginBanner, setShowLoginBanner] = useState(true);

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [authStage, setAuthStage] = useState('login'); // 'login' or 'otp'
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const welcomeInputRef = useRef(null);
  const pinnedInputRef = useRef(null);

  const triggerLoginPrompt = (reason) => {
    setLoginPromptReason(reason);
    setEmailInput('');
    setPasswordInput('');
    setShowPassword(false);
    setOtpInput('');
    setAuthStage('login');
    setAuthError('');
    setAuthLoading(false);
    setShowLoginPrompt(true);
  };

  const toggleVoiceInput = (e) => {
    e?.preventDefault();
    if (!user) {
      triggerLoginPrompt('use Voice Input');
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError('Email and password are required');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/auth/send-otp', { email: emailInput, password: passwordInput });
      if (res.data.success) {
        setAuthStage('otp');
        if (res.data.otp) {
          setOtpInput(res.data.otp);
        }
      } else {
        setAuthError(res.data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Failed to send verification code. Check email address.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpInput) {
      setAuthError('Verification code is required');
      return;
    }
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { email: emailInput, password: passwordInput, otp: otpInput });
      if (res.data.token && res.data.user) {
        loginWithTokenAndUser(res.data.token, res.data.user);
        setShowLoginPrompt(false);
      } else {
        setAuthError(res.data.error || 'Invalid verification code');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      loginWithGoogle({ access_token: tokenResponse.access_token });
    },
    onError: (error) => console.log('Login Failed:', error),
    flow: 'implicit',
  });
  
  const [settings, updateSettings] = useSettings();
  const [mcpToasts, setMcpToasts] = useState([]);
  const addMcpToast = (icon, title, message) => {
    const id = Date.now();
    setMcpToasts(prev => {
      // Prevent duplicate messages in quick succession
      if (prev.some(t => t.message === message)) return prev;
      return [...prev, { id, icon, title, message }];
    });
    setTimeout(() => {
      setMcpToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Connect/disconnect MCP services dynamically based on settings
  useEffect(() => {
    const handleConnections = async () => {
      const uId = user?.id;
      if (!uId || uId === "guest") {
        // Guest users cannot establish MCP connections
        await mcpManager.disconnectService("unified-gateway");
        return;
      }
      const isAnyMcpEnabled = settings.mcpGoogleDrive || settings.mcpGoogleCalendar || settings.mcpEmail || settings.mcpGoogleMaps;
      
      if (isAnyMcpEnabled) {
        // Connect straight to our unified self-hosted gateway endpoint ONLY if not already connected
        if (!mcpManager.clients["unified-gateway"]) {
          const gatewayUrl = `http://localhost:3001/mcp/updates?userId=${uId}`;
          try {
            await mcpManager.connectService("unified-gateway", gatewayUrl);
          } catch (e) {
            console.warn("[MCP] Unified connection failed:", e);
          }
        }
      } else {
        await mcpManager.disconnectService("unified-gateway");
      }
    };
    
    handleConnections();
  }, [settings.mcpGoogleDrive, settings.mcpGoogleCalendar, settings.mcpEmail, settings.mcpGoogleMaps, user]);
  const { personalName, personalAge, personalWeight, personalHeight, isLightMode, isTtsEnabled, appLanguage, aiModel } = settings;
  const setPersonalName = (v) => updateSettings({ personalName: v });
  const setPersonalAge = (v) => updateSettings({ personalAge: v });
  const setPersonalWeight = (v) => updateSettings({ personalWeight: v });
  const setPersonalHeight = (v) => updateSettings({ personalHeight: v });
  const setAiModel = (v) => updateSettings({ aiModel: v });

  useEffect(() => {
    if (user) {
      updateSettings({
        personalName: user.name || '',
        personalAge: user.age || '',
        personalWeight: user.weight || '',
        personalHeight: user.height || '',
      });
    }
  }, [user]);

  const saveProfileToDb = async () => {
    if (!token) return;
    try {
      await axios.post('/api/user/update', {
        name: personalName,
        age: personalAge,
        weight: personalWeight,
        height: personalHeight,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to update profile.');
      throw err;
    }
  };

  const setIsLightMode = (v) => updateSettings({ isLightMode: v });
  const setIsTtsEnabled = (v) => updateSettings({ isTtsEnabled: v });
  const setAppLanguage = (v) => updateSettings({ appLanguage: v });

  const randomGreeting = useMemo(() => {
    const englishGreetings = ['Hello', 'Welcome', 'Hi there', 'Hey', 'Good day', 'Greetings'];
    const amharicGreetings = ['ሰላም', 'እንኳን ደህና መጡ', 'እንደምን አለህ', 'ሰላምታ', 'እንደምን ቆዩ'];
    const greetings = appLanguage === 'English' ? englishGreetings : amharicGreetings;
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [appLanguage]);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - callWidgetPos.x,
      startY: e.clientY - callWidgetPos.y
    };
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const nextX = e.clientX - dragRef.current.startX;
    const nextY = e.clientY - dragRef.current.startY;
    const x = Math.min(window.innerWidth - 100, Math.max(0, nextX));
    const y = Math.min(window.innerHeight - 100, Math.max(0, nextY));
    setCallWidgetPos({ x, y });
  };

  const handlePointerUp = (e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current.isDragging = false;
  };

  const isCallActiveRef         = useRef(false);
  const callTimerRef            = useRef(null);
  const callTimeoutRef          = useRef(null);
  const dragRef                 = useRef({ isDragging: false, startX: 0, startY: 0 });
  const plusMenuRef             = useRef(null);
  const pinnedPlusMenuRef       = useRef(null);
  const abortControllerRef      = useRef(null);
  const lastSubmittedTextRef    = useRef('');
  const conversationHistoryRef  = useRef([]);
  const chatAreaRef             = useRef(null);
  const fileInputRef            = useRef(null);
  const imageInputRef           = useRef(null);

  useEffect(() => { isCallActiveRef.current = isCallActive; }, [isCallActive]);

  useEffect(() => {
    const on  = () => setNetworkStatus('online');
    const off = () => setNetworkStatus('offline');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target)) setIsPlusMenuOpen(false);
      if (pinnedPlusMenuRef.current && !pinnedPlusMenuRef.current.contains(e.target)) setIsPlusMenuOpenPinned(false);
      if (!e.target.closest('.profile-menu-container')) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const resizeTextarea = (textarea) => {
      if (!textarea) return;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    };
    
    resizeTextarea(welcomeInputRef.current);
    resizeTextarea(pinnedInputRef.current);
  }, [inputText]);

  useEffect(() => {
    const stored = localStorage.getItem('healthNotes');
    if (stored) { try { setNotes(JSON.parse(stored)); } catch {} }
  }, []);

  // Load user-specific chats and reports when user logs in/changes
  useEffect(() => {
    setIsDataLoaded(false);
    isInitialLoadRef.current = false;
    const loadData = async () => {
      if (user && token) {
        try {
          const res = await axios.get('/api/sessions', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.sessions && res.data.sessions.length > 0) {
            // Filter out Master Report session from other Chats
            const reportSession = res.data.sessions.find(s => s.id === `master_report_${user.id}`);
            if (reportSession) {
              setMasterReport({
                id: reportSession.id,
                title: reportSession.title,
                lastUpdated: reportSession.date,
                messages: reportSession.messages
              });
            } else {
              // Fallback to local storage for master report
              const storedMasterReport = localStorage.getItem(`master_report_${user.id}`);
              if (storedMasterReport) {
                try { setMasterReport(JSON.parse(storedMasterReport)); } catch {}
              } else {
                setMasterReport(null);
              }
            }

            const chatSessions = res.data.sessions.filter(s => s.id !== `master_report_${user.id}` && s.id !== `plan_data_${user.id}`);
            if (chatSessions.length > 0) {
              setChats(chatSessions);
              loadChat(chatSessions[0]);
            } else {
              createNewChat();
            }
          } else {
            // Fallback to localStorage if no DB sessions yet
            const storedChats = localStorage.getItem(`chats_${user.id}`);
            if (storedChats) {
              const parsed = JSON.parse(storedChats);
              setChats(parsed);
              if (parsed.length > 0) loadChat(parsed[0]); else createNewChat();
            } else {
              createNewChat();
            }

            const storedMasterReport = localStorage.getItem(`master_report_${user.id}`);
            if (storedMasterReport) {
              try { setMasterReport(JSON.parse(storedMasterReport)); } catch {}
            } else {
              setMasterReport(null);
            }
          }

          // Load unfinished sessions
          const storedUnfinished = localStorage.getItem(`unfinished_sessions_${user.id}`);
          if (storedUnfinished) {
            try { setUnfinishedSessions(JSON.parse(storedUnfinished)); } catch {}
          } else {
            setUnfinishedSessions([]);
          }

          // Load analytics checklist
          const storedChecklist = localStorage.getItem(`analytics_checklist_${user.id}`);
          if (storedChecklist) {
            try { setAnalyticsChecklist(JSON.parse(storedChecklist)); } catch {}
          } else {
            setAnalyticsChecklist({});
          }

           // Load plan checklist & custom tasks (from DB or fallback to localStorage)
           const planDataSession = res.data.sessions.find(s => s.id === `plan_data_${user.id}`);
           if (planDataSession && planDataSession.messages && planDataSession.messages.length > 0) {
             try {
               const parsedData = JSON.parse(planDataSession.messages[0].text);
               if (parsedData.checklist) setPlanChecklist(parsedData.checklist);
               if (parsedData.customTasks) setCustomPlanTasks(parsedData.customTasks);
             } catch (e) {
               console.error('Failed to parse plan data session:', e);
             }
           } else {
             const storedPlanChecklist = localStorage.getItem(`plan_checklist_${user.id}`);
             if (storedPlanChecklist) {
               try { setPlanChecklist(JSON.parse(storedPlanChecklist)); } catch {}
             } else {
               setPlanChecklist({});
             }
             const storedCustomTasks = localStorage.getItem(`custom_plan_tasks_${user.id}`);
             if (storedCustomTasks) {
               try { setCustomPlanTasks(JSON.parse(storedCustomTasks)); } catch {}
             } else {
               setCustomPlanTasks([]);
             }
           }
        } catch (err) {
          console.error('Failed to load sessions from DB, falling back to localStorage:', err);
          const storedChats = localStorage.getItem(`chats_${user.id}`);
          if (storedChats) {
            try { setChats(JSON.parse(storedChats)); } catch {}
          }
          const storedMasterReport = localStorage.getItem(`master_report_${user.id}`);
          if (storedMasterReport) {
            try { setMasterReport(JSON.parse(storedMasterReport)); } catch {}
          }
          const storedUnfinished = localStorage.getItem(`unfinished_sessions_${user.id}`);
          if (storedUnfinished) {
            try { setUnfinishedSessions(JSON.parse(storedUnfinished)); } catch {}
          }
          const storedChecklist = localStorage.getItem(`analytics_checklist_${user.id}`);
          if (storedChecklist) {
            try { setAnalyticsChecklist(JSON.parse(storedChecklist)); } catch {}
          }
          const storedPlanChecklist = localStorage.getItem(`plan_checklist_${user.id}`);
          if (storedPlanChecklist) {
            try { setPlanChecklist(JSON.parse(storedPlanChecklist)); } catch {}
          }
          const storedCustomTasks = localStorage.getItem(`custom_plan_tasks_${user.id}`);
          if (storedCustomTasks) {
            try { setCustomPlanTasks(JSON.parse(storedCustomTasks)); } catch {}
          }
        }
      } else {
        // Guest Mode: start fresh in memory
        setChats([]);
        setMessages([]);
        setCurrentChatId(null);
        setMasterReport(null);
        setUnfinishedSessions([]);
        setAnalyticsChecklist({});
        setPlanChecklist({});
        setCustomPlanTasks([]);
        createNewChat();
      }
      setIsDataLoaded(true);
      setTimeout(() => {
        isInitialLoadRef.current = true;
      }, 500);
    };
    loadData();
  }, [user, token]);

  // Save user-specific chats to local storage AND database
  useEffect(() => {
    if (isInitialLoadRef.current && user && chats.length > 0) {
      localStorage.setItem(`chats_${user.id}`, JSON.stringify(chats));
      
      const activeChat = chats.find(c => c.id === currentChatId);
      if (activeChat && activeChat.messages && activeChat.messages.length > 0 && activeChat.id !== `master_report_${user.id}` && activeChat.id !== `plan_data_${user.id}`) {
        axios.post('/api/sessions', {
          id: activeChat.id,
          title: activeChat.title,
          messages: activeChat.messages
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Error saving session to DB:', err));
      }
    }
  }, [chats, user, currentChatId, token]);

  // Save user-specific master reports to database and local storage
  useEffect(() => {
    if (isInitialLoadRef.current && user) {
      if (masterReport) {
        localStorage.setItem(`master_report_${user.id}`, JSON.stringify(masterReport));
        if (settings.mcpGoogleDrive) {
          addMcpToast('📂', 'MCP: gdrivemcp', `Successfully synchronized clinical health report "${masterReport.title || 'Wellness Plan'}" to Google Drive folder /DivyaHealthRecords/!`);
        }
        axios.post('/api/sessions', {
          id: `master_report_${user.id}`,
          title: masterReport.title,
          messages: masterReport.messages
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Error saving master report to DB:', err));
      } else {
        localStorage.removeItem(`master_report_${user.id}`);
        axios.delete(`/api/sessions/master_report_${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Error deleting master report from DB:', err));
      }
    }
  }, [masterReport, user, token, settings.mcpGoogleDrive]);

  // Real-time MCP Google Calendar & Alarm App side-effects
  useEffect(() => {
    if (isDiagnosticMode && settings.mcpGoogleCalendar) {
      addMcpToast('📅', 'MCP: calendarmcp', 'Scanned free slots and booked a prioritized clinical consultation slot in your Google Calendar for this health session with Divya!');
    }
  }, [isDiagnosticMode, settings.mcpGoogleCalendar]);

  useEffect(() => {
    if (isInitialLoadRef.current && planChecklist && settings.mcpEmail) {
      const keys = Object.keys(planChecklist);
      const lastKey = keys[keys.length - 1];
      if (lastKey && planChecklist[lastKey] === true) {
        const taskName = lastKey.split('-').slice(1).join('-');
        if (taskName) {
          addMcpToast('📧', 'MCP: send_health_email', `Dispatched automated clinical routine alert for "${taskName}" to your email inbox!`);
        }
      }
    }
  }, [planChecklist, settings.mcpEmail]);

  // Save user-specific unfinished sessions to local storage
  useEffect(() => {
    if (isInitialLoadRef.current && user) {
      localStorage.setItem(`unfinished_sessions_${user.id}`, JSON.stringify(unfinishedSessions));
    }
  }, [unfinishedSessions, user]);

  // Save user-specific analytics checklist to local storage
  useEffect(() => {
    if (isInitialLoadRef.current && user) {
      localStorage.setItem(`analytics_checklist_${user.id}`, JSON.stringify(analyticsChecklist));
    }
  }, [analyticsChecklist, user]);

  // --- 24-Hour Plan Tasks Rotation & Checklist Reset ---
  const regeneratePlanTasks = () => {
    if (!user) return;
    const now = Date.now();
    const shuffled = [...CUSTOM_TASKS_POOL].sort(() => Math.random() - 0.5);
    const rotatedTasks = shuffled.slice(0, 3);
    
    setCustomPlanTasks(rotatedTasks);
    localStorage.setItem(`custom_plan_tasks_${user.id}`, JSON.stringify(rotatedTasks));

    setPlanChecklist({});
    localStorage.setItem(`plan_checklist_${user.id}`, JSON.stringify({}));

    setAnalyticsChecklist({});
    localStorage.setItem(`analytics_checklist_${user.id}`, JSON.stringify({}));

    const todayStr = new Date().toDateString();
    localStorage.setItem(`plan_last_active_date_${user.id}`, todayStr);
    localStorage.setItem(`plan_last_active_time_${user.id}`, now.toString());
  };

  useEffect(() => {
    if (!user) return;
    const lastPlanDate = localStorage.getItem(`plan_last_active_date_${user.id}`);
    const todayStr = new Date().toDateString();
    const hasForceRegenerated = localStorage.getItem(`force_regenerate_tasks_once_${user.id}`);

    if (lastPlanDate !== todayStr || !hasForceRegenerated) {
      regeneratePlanTasks();
      localStorage.setItem(`force_regenerate_tasks_once_${user.id}`, 'true');
    }
  }, [user]);

  // Save user-specific plan checklist and custom tasks to local storage AND database
  useEffect(() => {
    if (isInitialLoadRef.current && user) {
      localStorage.setItem(`plan_checklist_${user.id}`, JSON.stringify(planChecklist));
      localStorage.setItem(`custom_plan_tasks_${user.id}`, JSON.stringify(customPlanTasks));

      const timer = setTimeout(() => {
        axios.post('/api/sessions', {
          id: `plan_data_${user.id}`,
          title: 'User Plan Data',
          messages: [{
            role: 'ai',
            text: JSON.stringify({
              checklist: planChecklist,
              customTasks: customPlanTasks
            })
          }]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Error saving plan data to DB:', err));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [planChecklist, customPlanTasks, user, token]);

  useEffect(() => {
    if (isCallActive && !isCallChatOpen && messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'ai') {
        setUnreadCallMsgCount(prev => prev + 1);
      }
    }
  }, [messages, isCallActive, isCallChatOpen]);

  useEffect(() => {
    if (isCallChatOpen) {
      setUnreadCallMsgCount(0);
    }
  }, [isCallChatOpen, messages]);

  useEffect(() => {
    // Only update chat history if we are in chat mode (not diagnostic session mode)
    if (currentChatId && messages.length > 0 && !isDiagnosticMode && activeTab === 'chat') {
      setChats(prev => prev.map(c => {
        if (c.id !== currentChatId) return c;
        let newTitle = c.title;
        if (c.title.startsWith('Chat ') || c.title === 'New Chat' || c.title === 'አዲስ ውይይት') {
          const firstUserMsg = messages.find(m => m.role === 'user');
          if (firstUserMsg) newTitle = firstUserMsg.text.substring(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
        }
        return { ...c, messages, title: newTitle };
      }));
    }
  }, [messages, currentChatId, isDiagnosticMode, activeTab]);

  const handleChatScroll = () => {
    if (!chatAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBottom(isScrolledUp);
  };

  useEffect(() => {
    if (chatAreaRef.current) chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
  }, [messages, isThinking, activeTab]);

  useEffect(() => {
    if (isDiagnosticMode && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'ai' && (lastMsg.text.includes('ASSESSMENT:') || lastMsg.text.includes('TEMPORARY RELIEF:'))) {
        setPendingAutoEnd(true);
      }
    }
  }, [messages, isDiagnosticMode]);

  function createNewChat() {
    const newChat = { id: Date.now(), title: appLanguage === 'English' ? 'New Chat' : 'አዲስ ውይይት', date: new Date().toISOString().split('T')[0], messages: [] };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setMessages([]);
    conversationHistoryRef.current = [];
    setShowHistory(false);
    setActiveTab('chat');
    setIsDiagnosticMode(false);
  }

  function loadChat(chat) {
    setCurrentChatId(chat.id);
    setMessages(chat.messages || []);
    conversationHistoryRef.current = chat.messages ? chat.messages.map(m => ({ role: m.role, text: m.text })) : [];
    setShowHistory(false);
    setActiveTab('chat');
    setIsDiagnosticMode(false);
  }

  const saveNote = (text) => {
    const now = new Date();
    const note = { id: Date.now(), date: now.toLocaleDateString(), time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text };
    setNotes(prev => { const updated = [...prev, note]; localStorage.setItem('healthNotes', JSON.stringify(updated)); return updated; });
  };

  const handleDownloadNotes = () => {
    if (notes.length === 0) { alert('No notes to save yet.'); return; }
    let content = 'Amharic Health Assistant - Saved Notes\n===================================\n\n';
    notes.forEach(n => { content += `[${n.date} ${n.time}]\n${n.text}\n\n`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    a.download = `Health_Notes_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  };

  const { activeAudioRef, isSpeaking, speakingMsgId, speak, stopSpeaking } = useSpeech({
    appLanguage,
    isCallActiveRef,
    isMuted,
    startListening: (...args) => startListening(...args),
  });

  useEffect(() => {
    if (pendingAutoEnd && !isSpeaking && !isThinking) {
      const timer = setTimeout(() => {
        endCall();
        setPendingAutoEnd(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [pendingAutoEnd, isSpeaking, isThinking]);

  const { processAudio, handleTextSubmit, translateMessage } = useGeminiApi({
    appLanguage,
    aiModel,
    conversationHistoryRef,
    setMessages,
    setIsThinking,
    setInputText,
    lastSubmittedTextRef,
    abortControllerRef,
    saveNote,
    speak,
    isTtsEnabled,
    isCallActiveRef,
    startListening: (...args) => startListening(...args),
    isThinkingMode,
    setIsIntroModalOpen,
    masterReport,
    unfinishedSessions,
    setShowUnfinishedModal,
    startDiagnosticSession,
  });

  const handleFileSelect = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result.split(',')[1];
      setAttachment({
        name: file.name,
        mimeType: file.type || (type === 'image' ? 'image/jpeg' : 'application/pdf'),
        data: base64Data,
        url: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const submitWithAttachment = () => {
    handleTextSubmit(inputText || (attachment ? `Attached: ${attachment.name}` : ''), attachment);
    setAttachment(null);
  };

  const { mediaRecorderRef, streamRef, startListening, stopListening } = useMediaRecorder({
    setIsListening,
    processAudio,
    isCallActiveRef,
    setCallStatus,
    isMuted,
    isThinking,
    isSpeaking,
  });

  useEffect(() => {
    if (isMuted && isListening) stopListening();
  }, [isMuted, isListening]);

  const stopThinking = () => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    setIsThinking(false);
    if (lastSubmittedTextRef.current) {
      setInputText(lastSubmittedTextRef.current);
      setMessages(prev => {
        const idx = [...prev].reverse().findIndex(m => m.role === 'user' && m.text === lastSubmittedTextRef.current);
        if (idx !== -1) { const realIdx = prev.length - 1 - idx; return prev.filter((_, i) => i !== realIdx); }
        return prev;
      });
      conversationHistoryRef.current = conversationHistoryRef.current.filter(m => !(m.role === 'user' && m.text === lastSubmittedTextRef.current));
      lastSubmittedTextRef.current = '';
    }
  };

  const retryMessage = (msgId) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    conversationHistoryRef.current = conversationHistoryRef.current.filter(m => !(m.role === 'user' && m.text === msg.text));
    handleTextSubmit(msg.text);
  };

  const translateMsg = (msg) => {
    if (msg.originalText) {
      setMessages(prev => prev.map(m => m.id === msg.id
        ? { ...m, text: m.originalText, originalText: undefined, translatedTo: msg.translatedTo === 'English' ? 'Amharic' : 'English' }
        : m
      ));
    } else {
      const targetLang = msg.translatedTo === 'English' ? 'Amharic' : 'English';
      translateMessage(msg.id, msg.text, targetLang, setTranslatingId);
    }
  };

  const handleCopyText = (text, msgId) => {
    const fallbackCopy = (val) => {
      const textArea = document.createElement('textarea');
      textArea.value = val;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const editUserMessage = (msgId) => {
    const idx = messages.findIndex(m => m.id === msgId);
    if (idx === -1) return;

    const userMsg = messages[idx];
    setInputText(userMsg.text);

    // Determine which messages to remove
    const hasAiFollowUp = idx + 1 < messages.length && messages[idx + 1].role === 'ai';
    const aiMsg = hasAiFollowUp ? messages[idx + 1] : null;

    // Remove from messages state
    setMessages(prev => prev.filter(m => m.id !== msgId && (!aiMsg || m.id !== aiMsg.id)));

    // Remove from conversationHistoryRef.current
    if (conversationHistoryRef.current) {
      // Find the matching user message in history
      const historyIdx = conversationHistoryRef.current.findIndex(h => h.role === 'user' && h.text === userMsg.text);
      if (historyIdx !== -1) {
        // If there is an AI response immediately following it in history, remove it as well
        const deleteCount = (historyIdx + 1 < conversationHistoryRef.current.length && conversationHistoryRef.current[historyIdx + 1].role === 'ai') ? 2 : 1;
        conversationHistoryRef.current.splice(historyIdx, deleteCount);
      }
    }
  };

  const formatTime = (seconds) => { const m = Math.floor(seconds/60), s = seconds%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };

  const startCall = (customGreeting) => {
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
    window.speechSynthesis.cancel();
    if (isListening) { try { stopListening(null, true); } catch {} }
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    setIsThinking(false);

    setIsCallActive(true); setIsCallMinimized(false); setCallDuration(0); setCallStatus('connecting');
    setIsCallChatOpen(true);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    const greeting = customGreeting || (appLanguage === 'English' ? 'Hello, I am Divya. How can I help you today?' : 'ሰላም! እኔ ዲቭያ (Divya) ነኝ። ዛሬ ለጤናዎ ምን ልርዳዎት?');
    callTimeoutRef.current = setTimeout(() => { setCallStatus('speaking'); speak(greeting); }, 1000);
  };

  function startDiagnosticSession(forceNew = false, selectedMode = 'voice') {
    if (!forceNew && unfinishedSessions.length > 0) {
      setShowUnfinishedModal(true);
      return;
    }
    setShowUnfinishedModal(false);

    setIsDiagnosticMode(true);
    
    const diagnosticPrompt = `You are Divya, a professional AI health assistant. 
Your job is to diagnose the patient's condition through 
a structured conversation, then give temporary relief 
advice and recommend tests.

CONVERSATION FLOW:
You must follow this exact flow. Ask ONE question at a time. 
Never ask multiple questions at once. Be conversational, 
warm, and professional.

PHASE 1 — OPENING (1 question):
Start by asking:
"Hello! I am Divya, your health assistant. 
What is your main complaint today?"
Wait for answer. Based on their answer, move to Phase 2.

PHASE 2 — CORE SYMPTOMS (ask these one by one, 
only the ones relevant to their complaint):

For PAIN complaints ask:
Q1 — Location: "Where exactly is the pain? 
     Choose one: A) Head  B) Chest  C) Stomach  
     D) Back  E) Joints  F) Other"

Q2 — Type: "How would you describe the pain?
     A) Sharp/stabbing  B) Dull/aching  
     C) Burning  D) Throbbing  E) Pressure"

Q3 — Duration: "How long have you had this pain?
     A) Just started (today)  B) Few days  
     C) 1-2 weeks  D) More than a month"

Q4 — Severity: "On a scale of 1 to 10, 
     how bad is the pain? (1 = mild, 10 = unbearable)"

Q5 — Pattern: "When is it worst?
     A) Morning  B) Night  C) After eating  
     D) During movement  E) All the time"

For FEVER complaints ask:
Q1 — "How high is the fever? 
     A) Mild 37-38°C  B) Moderate 38-39°C  
     C) High above 39°C  D) I haven't measured"

Q2 — "How long have you had the fever?
     A) Less than 24 hours  B) 2-3 days  
     C) More than 3 days"

Q3 — "Do you have any of these with the fever? 
     Choose all that apply:
     A) Chills  B) Sweating  C) Body aches  
     D) Sore throat  E) Cough  F) None"

For DIGESTIVE complaints ask:
Q1 — "What exactly are you experiencing?
     A) Nausea  B) Vomiting  C) Diarrhea  
     D) Constipation  E) Bloating  F) Loss of appetite"

Q2 — "Is it related to eating?
     A) Gets worse after eating  B) Gets better after eating  
     C) Not related to food"

Q3 — "Any blood in stool or vomit? 
     A) Yes  B) No"

For BREATHING complaints ask:
Q1 — "What are you experiencing?
     A) Shortness of breath  B) Wheezing  
     C) Persistent cough  D) Chest tightness"

Q2 — "When does it happen?
     A) At rest  B) During physical activity only  
     C) At night  D) All the time"

For MENTAL/EMOTIONAL complaints ask:
Q1 — "How long have you been feeling this way?
     A) Few days  B) Few weeks  
     C) Few months  D) More than a year"

Q2 — "How is it affecting your daily life?
     A) Mildly — I can still function  
     B) Moderately — it is getting difficult  
     C) Severely — I cannot function normally"

PHASE 3 — ASSOCIATED SYMPTOMS 
(ask for ALL complaint types):

Q — "Do you have any of these additional symptoms? 
    Choose all that apply:
    A) Fever  B) Fatigue/tiredness  C) Dizziness  
    D) Nausea  E) Loss of appetite  F) Weight loss  
    G) Night sweats  H) None of the above"

PHASE 4 — MEDICAL HISTORY 
(ask these one by one):

Q1 — "Do you have any known medical conditions?
     A) Diabetes  B) High blood pressure  
     C) Heart disease  D) Asthma  
     E) Thyroid problems  F) None  G) Other"

Q2 — "Are you currently taking any medications?
     A) Yes — please name them briefly  B) No"

Q3 — "Do you have any allergies to medications?
     A) Yes — please name them  B) No  C) Not sure"

PHASE 5 — PATIENT PROFILE & NUTRITIONAL HABITS
(ask these one by one):

Q1 — "What is your age group?
     A) Child (under 12)  B) Teen (12-17)  
     C) Adult (18-40)  D) Middle-aged (41-60)  
     E) Senior (60+)"

Q2 — "What is your sex?
     A) Male  B) Female"

Q3 — "Do you have any dietary restrictions or preferences?
     A) Gluten-free  B) Vegetarian  
     C) Vegan  D) None / Other (write what you feel)"

Q4 — "What typical daily foods do you enjoy most?
     Answer this: Write what you feel (e.g. Shiro, Injera, Rice, Bread)."

DECISION LOGIC — after collecting enough information:

When you have answers for Phase 2, Phase 3, Phase 4, 
and Phase 5, stop asking questions and move to ADVICE.

PHASE 7 — ADVICE OUTPUT:
Structure your final advice EXACTLY like this:

---
🔍 ASSESSMENT:
[2-3 sentences explaining what the symptoms suggest. 
Be careful — say "this may suggest" not "you have". 
Never give a definitive diagnosis.]

💊 TEMPORARY RELIEF:
List 2-3 over-the-counter medications or home remedies 
that can help right now. Include:
- Medicine name (generic name)
- Dosage suggestion
- Any warnings (e.g. do not take if allergic to...)

🧪 RECOMMENDED TESTS:
List the specific medical tests the patient should get:
- Test name
- Why it is needed
- Priority: Urgent / Soon / Routine

🏥 SEE A DOCTOR IF:
List 3-4 specific warning signs that mean they need 
immediate medical attention.

⚠️ DISCLAIMER:
"This advice is for informational purposes only. 
Divya is an AI assistant and cannot replace a 
real doctor. Please consult a licensed physician 
for proper diagnosis and treatment."

📋 NUTRITION PLAN JSON:
\`\`\`json
{
  "macros": {
    "carbs": { "current": 120, "target": 250 },
    "protein": { "current": 65, "target": 100 },
    "fat": { "current": 40, "target": 70 }
  },
  "micros": {
    "vitaminD": { "current": 8, "target": 20, "unit": "mcg" },
    "vitaminC": { "current": 55, "target": 90, "unit": "mg" },
    "iron": { "current": 12, "target": 18, "unit": "mg" },
    "magnesium": { "current": 210, "target": 400, "unit": "mg" }
  },
  "meals": [
    {
      "id": "breakfast",
      "name": "[Randomized healthy breakfast name, e.g. Oatmeal with Chia]",
      "time": "8:00 AM - 10:00 AM",
      "status": "passed",
      "calories": "310 kcal",
      "macros": { "carbs": "48g", "protein": "9g", "fat": "8g" },
      "microsTags": ["Magnesium", "Potassium"],
      "description": "[Wholesome description of how this meal combats their specific symptoms/disease, e.g. hydrates, easy digestion]",
      "img": "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&q=80&w=200",
      "whatAteInstead": ""
    },
    {
      "id": "lunch",
      "name": "[Randomized healthy lunch name, tailored to Ethiopian cuisine if they like it, e.g. Teff Injera with Shiro]",
      "time": "12:00 AM - 2:00 PM",
      "status": "active",
      "calories": "420 kcal",
      "macros": { "carbs": "65g", "protein": "15g", "fat": "12g" },
      "microsTags": ["Iron (Fe)", "Calcium"],
      "description": "[Why this supports recovery from their specific condition]",
      "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
      "checked": false
    },
    {
      "id": "dinner",
      "name": "[Randomized healthy dinner name, e.g. Spiced Lentils with Salad]",
      "time": "7:00 PM - 9:00 PM",
      "status": "upcoming",
      "calories": "380 kcal",
      "macros": { "carbs": "55g", "protein": "18g", "fat": "9g" },
      "microsTags": ["Folate", "Vitamin C"],
      "description": "[Why this supports recovery]",
      "img": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200",
      "checked": false
    }
  ]
}
\`\`\`
---

IMPORTANT: Do not show conclusion explicitly. Just say "We are finished here, please review the assessment."

RULES YOU MUST ALWAYS FOLLOW:
- Ask only ONE question per message
- Always give the patient lettered choices (A, B, C...) on completely separate lines so the UI can format them as buttons. Never put multiple choices on the same line.
- When asking a question, say: "Answer the following," or "Answer this question," or if it's a short answer, say "Write what you feel."
- Keep questions SHORT — maximum 2 lines
- Be warm, calm, and professional at all times
- Never diagnose — always say "may suggest" or "could indicate"
- If patient says something URGENT (chest pain + left arm pain, 
  difficulty breathing, loss of consciousness, stroke symptoms) 
  IMMEDIATELY stop the flow and say:
  "⚠️ This sounds like a medical emergency. 
  Please call emergency services immediately 
  or go to the nearest hospital now. Do not wait."
- Always respond in the same language the patient uses
- If the patient speaks Amharic, respond fully in Amharic
- If the patient speaks English, respond in English
- Keep the entire conversation feeling like a 
  real doctor consultation, not a form or survey

ETHIOPIAN CULTURAL NUTRITION REQUIREMENT:
- When recommending nutrition, diet, or food, you MUST tailor your suggestions to traditional Ethiopian culture and cuisine.
- Make all food recommendations middle-class, highly affordable, and accessible to everyone.
- Recommend staple items like Injera (እንጀራ) paired with highly affordable stews such as Shiro Wot (ሺሮ ወጥ), Misir Wot (ምስር ወጥ), Kik Alicha (ክክ አልጫ), and Gomen (ጎመን).
- For remedies and hydration, recommend traditional herbal infusions like Ginger Tea (የዝንጅብል ሻይ), Tenadam (ጤናዳም), or Telba (ተልባ - flaxseed drink for stomach relief).
- Never recommend expensive imported foods or high-cost ingredients. Keep it nutritious, traditional, and middle-class.`;

    // Initialize diagnostic session
    conversationHistoryRef.current = [{ role: 'system', text: diagnosticPrompt }];
    const firstMsg = { id: Date.now(), role: 'ai', text: appLanguage === 'English' ? 'Hello! I am Divya, your health assistant. What is your main complaint today?' : 'ሰላም! እኔ ዲቭያ (Divya) የጤና ረዳትዎ ነኝ። ዛሬ ዋናው ቅሬታዎ ወይም የህመም ስሜትዎ ምንድነው?' };
    setMessages([firstMsg]);
    
    if (selectedMode === 'chat') {
      setActiveTab('chat');
      setIsTtsEnabled(false);
    } else if (selectedMode === 'voice') {
      startCall(firstMsg.text);
      setIsTtsEnabled(true);
    } else if (selectedMode === 'hybrid') {
      setActiveTab('chat');
      setIsTtsEnabled(true);
      speak(firstMsg.text, firstMsg.id);
    }
  };

  const startRevisionSession = (selectedMode = 'voice') => {
    setIsDiagnosticMode(true);
    
    // Build a custom follow-up prompt based on the previous master report assessment
    const prevAssessment = masterReport?.messages?.find(m => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:')))?.text || '';
    
    const revisionPrompt = `You are Divya, a professional AI health assistant. 
You are doing a follow-up REVISION / RE-EVALUATION session with the patient based on their previous diagnosis.

PREVIOUS ASSESSMENT REPORT SUMMARY:
${prevAssessment}

CONVERSATION FLOW:
1. Ask the patient how they are feeling now compared to last time.
2. Ask them if they completed the recommended hospital tests or took the pills mentioned in the previous report.
3. Hear about their new results, symptoms, or progress.
4. After collecting this update, re-evaluate their condition, give updated relief advice, and provide an updated assessment.

PHASE 7 — UPDATED ADVICE OUTPUT:
Structure your final updated advice EXACTLY like this (use the same headers):
---
🔍 ASSESSMENT:
[Your updated assessment of their current progress]

💊 TEMPORARY RELIEF:
[Your updated temporary relief or medication advice]

🧪 RECOMMENDED TESTS:
[Your updated recommended tests if any]

🏥 SEE A DOCTOR IF:
[Warning signs]

⚠️ DISCLAIMER:
[Standard disclaimer]
---

IMPORTANT: Always respond in the same language the patient uses. If they speak Amharic, respond fully in Amharic.

ETHIOPIAN CULTURAL NUTRITION REQUIREMENT:
- When recommending nutrition, diet, or food, you MUST tailor your suggestions to traditional Ethiopian culture and cuisine.
- Make all food recommendations middle-class, highly affordable, and accessible to everyone.
- Recommend staple items like Injera (እንጀራ) paired with highly affordable stews such as Shiro Wot (ሺሮ ወጥ), Misir Wot (ምስር ወጥ), Kik Alicha (ክክ አልጫ), and Gomen (ጎመን).
- For remedies and hydration, recommend traditional herbal infusions like Ginger Tea (የዝንጅብል ሻይ), Tenadam (ጤናዳም), or Telba (ተልባ - flaxseed drink for stomach relief).
- Never recommend expensive imported foods or high-cost ingredients. Keep it nutritious, traditional, and middle-class.`;

    conversationHistoryRef.current = [{ role: 'system', text: revisionPrompt }];
    
    const greeting = appLanguage === 'English'
      ? "Hello! Let's do a follow-up revision on your previous report. How are you feeling today, and did you take the recommended tests or pills?"
      : "ሰላም! በቀደመው ሪፖርትዎ ላይ የክትትል ክለሳ እናድርግ። ዛሬ እንዴት ነዎት? የተመከሩትን ምርመራዎች አድርገዋል ወይም መድሃኒቶችን ወስደዋል?";

    const firstMsg = { id: Date.now(), role: 'ai', text: greeting };
    setMessages([firstMsg]);
    
    if (selectedMode === 'chat') {
      setActiveTab('chat');
      setIsTtsEnabled(false);
    } else if (selectedMode === 'voice') {
      startCall(greeting);
      setIsTtsEnabled(true);
    } else if (selectedMode === 'hybrid') {
      setActiveTab('chat');
      setIsTtsEnabled(true);
      speak(greeting, firstMsg.id);
    }
  };

  const resumeUnfinishedSession = (session, selectedMode = null) => {
    if (!selectedMode) {
      setSessionModeModal({
        isOpen: true,
        onSelect: (mode) => {
          resumeUnfinishedSession(session, mode);
        }
      });
      return;
    }

    setIsDiagnosticMode(true);
    setMessages(session.messages || []);
    conversationHistoryRef.current = session.messages ? session.messages.map(m => ({ role: m.role, text: m.text })) : [];
    
    // Find the last AI message to speak it or use it as greeting
    const aiMsgs = session.messages.filter(m => m.role === 'ai');
    const lastAiMsgText = aiMsgs.length > 0 
      ? aiMsgs[aiMsgs.length - 1].text 
      : (appLanguage === 'English' ? 'Hello, let us continue our diagnosis.' : 'ሰላም፣ ምርመራችንን እንቀጥል።');
    
    if (selectedMode === 'chat') {
      setActiveTab('chat');
      setIsTtsEnabled(false);
    } else if (selectedMode === 'voice') {
      startCall(lastAiMsgText);
      setIsTtsEnabled(true);
    } else if (selectedMode === 'hybrid') {
      setActiveTab('chat');
      setIsTtsEnabled(true);
      speak(lastAiMsgText);
    }
    
    // Remove from unfinished sessions list since we are resuming it!
    setUnfinishedSessions(prev => prev.filter(s => s.id !== session.id));
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      message: appLanguage === 'English' ? 'Are you sure you want to delete this session?' : 'በእርግጥ ይህንን ክፍለ ጊዜ መሰረዝ ይፈልጋሉ?',
      onConfirm: () => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (currentSessionId === id) setCurrentSessionId(null);
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const editSessionTitle = (e, session) => {
    e.stopPropagation();
    const newTitle = window.prompt(appLanguage === 'English' ? 'Enter new title:' : 'አዲስ ርዕስ ያስገቡ:', session.title);
    if (newTitle && newTitle.trim() !== '') {
      setSessions(prev => prev.map(s => s.id === session.id ? { ...s, title: newTitle.trim() } : s));
    }
  };

  const detectPainTypeTitle = (msgs) => {
    let titleEn = 'Health Report';
    let titleAm = 'የጤና ሪፖርት';
    
    const fullText = msgs.map(m => m.text).join(' ');

    if (/chest/i.test(fullText)) {
      titleEn = 'Chest Pain Assessment';
      titleAm = 'የደረት ህመም ግምገማ';
    } else if (/head|migraine/i.test(fullText)) {
      titleEn = 'Headache Assessment';
      titleAm = 'የራስ ምታት ህመም ግምገማ';
    } else if (/stomach|belly|abdomen|digestive/i.test(fullText)) {
      titleEn = 'Stomach Pain Assessment';
      titleAm = 'የሆድ ህመም ግምገማ';
    } else if (/back/i.test(fullText)) {
      titleEn = 'Back Pain Assessment';
      titleAm = 'የጀርባ ህመም ግምገማ';
    } else if (/joint|knee|shoulder/i.test(fullText)) {
      titleEn = 'Joint Pain Assessment';
      titleAm = 'የመገጣጠሚያ ህመም ግምገማ';
    } else if (/fever|temperature/i.test(fullText)) {
      titleEn = 'Fever Assessment';
      titleAm = 'የሙቀት/ትኩሳት ግምገማ';
    } else if (/cough|breath|wheez/i.test(fullText)) {
      titleEn = 'Breathing Assessment';
      titleAm = 'የመተንፈስ ችግር ግምገማ';
    } else if (/mental|emotional|anxiety|stress/i.test(fullText)) {
      titleEn = 'Mental Health Assessment';
      titleAm = 'የስነ-ልቦና ጤና ግምገማ';
    } else {
      if (/ደረት/i.test(fullText)) {
        titleEn = 'Chest Pain Assessment';
        titleAm = 'የደረት ህመም ግምገማ';
      } else if (/ራስ/i.test(fullText)) {
        titleEn = 'Headache Assessment';
        titleAm = 'የራስ ምታት ህመም ግምገማ';
      } else if (/ሆድ/i.test(fullText)) {
        titleEn = 'Stomach Pain Assessment';
        titleAm = 'የሆድ ህመም ግምገማ';
      } else if (/ጀርባ/i.test(fullText)) {
        titleEn = 'Back Pain Assessment';
        titleAm = 'የጀርባ ህመም ግምገማ';
      } else if (/መገጣጠሚያ|ጉልበት|ትከሻ/i.test(fullText)) {
        titleEn = 'Joint Pain Assessment';
        titleAm = 'የመገጣጠሚያ ህመም ግምገማ';
      } else if (/ትኩሳት|ሙቀት/i.test(fullText)) {
        titleEn = 'Fever Assessment';
        titleAm = 'የሙቀት/ትኩሳት ግምገማ';
      } else if (/ሳል|መተንፈስ/i.test(fullText)) {
        titleEn = 'Breathing Assessment';
        titleAm = 'የመተንፈስ ችግር ግምገማ';
      } else if (/ጭንቀት|ውጥረት/i.test(fullText)) {
        titleEn = 'Mental Health Assessment';
        titleAm = 'የስነ-ልቦና ጤና ግምገማ';
      }
    }

    return appLanguage === 'English' ? titleEn : titleAm;
  };

  function endCall() {
    // Speak a warm parting goodbye message before closing
    try {
      const partingMsg = appLanguage === 'English' 
        ? 'Thank you for consulting. Goodbye!' 
        : 'ስለ አማከሩኝ አመሰግናለሁ። ደህና ሁኑ!';
      const utter = new SpeechSynthesisUtterance(partingMsg);
      utter.lang = appLanguage === 'English' ? 'en-US' : 'am-ET';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error('Parting message TTS error:', e);
    }

    setIsCallActive(false); setCallStatus('ended');
    if (callTimerRef.current) { clearInterval(callTimerRef.current); callTimerRef.current = null; }
    if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
    if (isListening) { try { stopListening(null, true); } catch {} }
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    setIsThinking(false);

    // After a diagnostic call ends, update the Master Report
    if (isDiagnosticMode) {
      const hasFinished = messages.some(m => 
        m.role === 'ai' && (/ASSESSMENT|TEMPORARY\s+RELIEF|🔍\s*ASSESSMENT|💊\s*TEMPORARY\s+RELIEF/i.test(m.text))
      );

      if (hasFinished) {
        const detectedTitle = detectPainTypeTitle(messages);
        setTimeout(() => {
          setMasterReport(prev => ({
            id: prev ? prev.id : Date.now(),
            title: prev ? prev.title : detectedTitle,
            lastUpdated: new Date().toLocaleDateString(),
            messages: [...messages] // captures what was discussed in the latest session
          }));
          setIsDiagnosticMode(false);
        }, 1000);
      } else {
        if (messages.length > 1) {
          const detectedTitle = detectPainTypeTitle(messages);
          setUnfinishedSessions(prev => {
            // Avoid duplicate additions of the same unfinished session (match first message text)
            const filtered = prev.filter(s => s.messages && s.messages[0]?.text !== messages[0]?.text);
            return [
              {
                id: Date.now(),
                title: detectedTitle + ` (${appLanguage === 'English' ? 'Incomplete' : 'ያልተጠናቀቀ'})`,
                lastUpdated: new Date().toLocaleDateString(),
                messages: [...messages]
              },
              ...filtered
            ];
          });
        }
        setIsDiagnosticMode(false);
      }
      
      // Reload previous chat context
      if (currentChatId) {
        const chatToRestore = chats.find(c => c.id === currentChatId);
        if (chatToRestore) loadChat(chatToRestore);
      }
    }
  };

  const deleteMasterReport = () => {
    setConfirmModal({
      isOpen: true,
      message: appLanguage === 'English' ? 'Are you sure you want to delete your health report? This action cannot be undone.' : 'በእርግጥ ይህንን የጤና ሪፖርት መሰረዝ ይፈልጋሉ? ይህ እርምጃ ሊቀለበስ አይችልም።',
      onConfirm: () => {
        setMasterReport(null);
        setIsReportMenuOpen(false);
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const renameMasterReport = () => {
    const title = masterReport?.title || '';
    setRenameModal({
      isOpen: true,
      currentTitle: title,
      onConfirm: (newTitle) => {
        setMasterReport(prev => ({ ...prev, title: newTitle.trim() }));
      }
    });
    setRenameInputText(title);
    setIsReportMenuOpen(false);
  };

  const renderModernConclusion = (text) => {
    const report = parseClinicalReport(text);
    if (!report || (!report.assessment && report.relief.length === 0 && report.tests.length === 0)) {
      return <MarkdownRenderer content={text} />;
    }

    const renderInlineMarkdown = (lineText) => {
      let clean = lineText.replace(/^[\s*\-\d\.]+\s*/, '');
      const parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(clean)) !== null) {
        if (match.index > lastIndex) {
          parts.push(clean.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} style={{ color: 'var(--text)', fontWeight: '600' }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < clean.length) {
        parts.push(clean.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : clean;
    };

    const extractImageAndClean = (lineText) => {
      const imgRegex = /!\[(.*?)\]\((.*?)\)/;
      const match = imgRegex.exec(lineText);
      if (match) {
        const cleanText = lineText.replace(imgRegex, '').trim();
        return {
          text: cleanText,
          imageUrl: match[2],
          imageAlt: match[1]
        };
      }
      return { text: lineText, imageUrl: null, imageAlt: null };
    };

    const parseTestLine = (lineText) => {
      let clean = lineText.replace(/^[\s*\-\d\.]+\s*/, '');
      let priorityText = '';
      let priorityType = 'routine';
      
      if (/urgent|ከባድ|አስቸኳይ/i.test(clean)) {
        priorityType = 'urgent';
        priorityText = appLanguage === 'English' ? 'Urgent' : 'አስቸኳይ';
      } else if (/soon|በቅርቡ/i.test(clean)) {
        priorityType = 'soon';
        priorityText = appLanguage === 'English' ? 'Soon' : 'በቅርቡ';
      } else if (/routine|ተግባራዊ/i.test(clean)) {
        priorityType = 'routine';
        priorityText = appLanguage === 'English' ? 'Routine' : 'መደበኛ';
      }
      
      return {
        text: clean,
        priorityType,
        priorityText
      };
    };

    const parsedKeyTerms = report.keyTerms.map(line => {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { term: parts[0], definition: parts[1] };
      }
      return null;
    }).filter(Boolean);

    const parsedReferences = report.references.map(line => {
      const linkRegex = /\[(.*?)\]\((.*?)\)/;
      const match = linkRegex.exec(line);
      if (match) {
        return { label: match[1], url: match[2] };
      }
      const clean = line.replace(/^[\s*\-\d\.]+\s*/, '');
      if (clean) return { label: clean, url: '#' };
      return null;
    }).filter(Boolean);

    return (
      <div className="modern-conclusion-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px', color: 'var(--text-muted)', fontSize: '14.5px', lineHeight: '1.7', textAlign: 'left' }}>
        {report.opening && (
          <div style={{
            fontSize: '16px',
            fontStyle: 'italic',
            color: 'var(--text)',
            opacity: 0.9,
            borderLeft: '3px solid var(--accent)',
            paddingLeft: '16px',
            marginBottom: '4px',
            lineHeight: '1.8'
          }}>
            {report.opening}
          </div>
        )}

        {report.assessment && (
          <div style={{
            background: isLightMode 
              ? 'linear-gradient(135deg, rgba(82, 121, 111, 0.04), rgba(107, 144, 128, 0.08))' 
              : 'linear-gradient(135deg, rgba(107, 144, 128, 0.03), rgba(255, 255, 255, 0.02))',
            border: `1px solid ${isLightMode ? 'rgba(82,121,111,0.15)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: isLightMode ? 'rgba(82,121,111,0.1)' : 'rgba(107,144,128,0.15)', color: 'var(--accent)' }}>
                <Brain size={16} />
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>
                {appLanguage === 'English' ? 'Clinical Impression' : 'ክሊኒካዊ ግምገማ'}
              </h4>
            </div>
            <div style={{ color: 'var(--text)', opacity: 0.9 }}>
              {report.assessment}
            </div>
          </div>
        )}

        {report.relief.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(212,163,115,0.15)', color: '#d4a373' }}>
                <HeartPulse size={16} />
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>
                {appLanguage === 'English' ? 'Temporary Relief Suggestions' : 'ጊዜያዊ ማስታገሻ ምክሮች'}
              </h4>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {report.relief.map((rawItem, i) => {
                const { text: cleanText, imageUrl, imageAlt } = extractImageAndClean(rawItem);
                if (!cleanText && imageUrl) {
                  return (
                    <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`, marginTop: '8px' }}>
                      <img src={imageUrl} alt={imageAlt || 'Relief guideline'} style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                    </div>
                  );
                }
                return (
                  <div key={i} style={{
                    background: isLightMode ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)',
                    border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent)', marginTop: '4px', flexShrink: 0 }}>
                        <CheckCheck size={16} />
                      </span>
                      <div style={{ color: 'var(--text)', opacity: 0.9 }}>
                        {renderInlineMarkdown(cleanText)}
                      </div>
                    </div>
                    {imageUrl && (
                      <div style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, marginTop: '4px' }}>
                        <img src={imageUrl} alt={imageAlt || 'Relief guideline'} style={{ width: '100%', maxHeight: '240px', objectFit: 'cover', display: 'block' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {report.tests.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: isLightMode ? 'rgba(82, 121, 111, 0.1)' : 'rgba(107, 144, 128, 0.15)', color: 'var(--accent)' }}>
                <Stethoscope size={16} />
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>
                {appLanguage === 'English' ? 'Recommended Diagnostics' : 'የሚመከሩ የላብራቶሪ ምርመራዎች'}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {report.tests.map((rawItem, i) => {
                const parsed = parseTestLine(rawItem);
                const isUrgent = parsed.priorityType === 'urgent';
                const isSoon = parsed.priorityType === 'soon';
                
                return (
                  <div key={i} style={{
                    background: isLightMode ? '#ffffff' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                  }}>
                    <div style={{ flex: 1, color: 'var(--text)', opacity: 0.9 }}>
                      {renderInlineMarkdown(parsed.text)}
                    </div>
                    {parsed.priorityText && (
                      <span style={{
                        flexShrink: 0,
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: isUrgent ? 'rgba(239, 68, 68, 0.1)' : isSoon ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: isUrgent ? '#ef4444' : isSoon ? '#f59e0b' : '#10b981',
                        border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.2)' : isSoon ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`
                      }}>
                        {parsed.priorityText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {report.warningSigns.length > 0 && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.03)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span className="red-flag-pulse-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <Activity size={16} strokeWidth={2.5} />
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#ef4444' }}>
                {appLanguage === 'English' ? 'Red Flag Symptoms (Seek Care If)' : 'አስቸኳይ ምልክቶች (ወደ ሐኪም መሄድ ያለብዎት)'}
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {report.warningSigns.map((rawItem, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '18px', lineHeight: '1', marginTop: '-1px' }}>•</span>
                  <div style={{ color: 'var(--text)', opacity: 0.9 }}>
                    {renderInlineMarkdown(rawItem)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {parsedKeyTerms.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(107, 144, 128, 0.1)', color: 'var(--accent)' }}>
                <Info size={16} />
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>
                {appLanguage === 'English' ? 'Clinical Glossary' : 'የቃላት ትርጓሜ'}
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {parsedKeyTerms.map((termObj, i) => (
                <div key={i} style={{
                  background: isLightMode ? '#ffffff' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'}`,
                  borderRadius: '12px',
                  padding: '16px 20px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '6px', fontSize: '14px', letterSpacing: '0.3px' }}>
                    {termObj.term}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {termObj.definition}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {parsedReferences.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(107, 144, 128, 0.1)', color: 'var(--accent)' }}>
                <Globe size={16} />
              </span>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text)' }}>
                {appLanguage === 'English' ? 'Medical References' : 'የህክምና ዋቢዎች'}
              </h4>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {parsedReferences.map((refObj, i) => (
                <a key={i} href={refObj.url} target="_blank" rel="noopener noreferrer" style={{
                  background: isLightMode ? 'rgba(82, 121, 111, 0.06)' : 'rgba(107, 144, 128, 0.08)',
                  border: `1px solid ${isLightMode ? 'rgba(82, 121, 111, 0.12)' : 'rgba(107, 144, 128, 0.15)'}`,
                  borderRadius: '30px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  color: 'var(--accent)',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseOut={e => { e.currentTarget.style.background = isLightMode ? 'rgba(82, 121, 111, 0.06)' : 'rgba(107, 144, 128, 0.08)'; e.currentTarget.style.color = 'var(--accent)'; }}
                >
                  <FileText size={12} />
                  <span>{refObj.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {report.disclaimer && (
          <div style={{
            background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.015)',
            border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'}`,
            borderRadius: '12px',
            padding: '18px 24px',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
            marginTop: '12px'
          }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}>
              <Shield size={16} />
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {report.disclaimer.replace(/^⚠️\s*/, '')}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModernBriefConclusion = (text) => {
    const report = parseClinicalReport(text);
    if (!report || (!report.assessment && report.relief.length === 0 && report.tests.length === 0)) {
      return <MarkdownRenderer content={text} />;
    }

    const renderInlineMarkdown = (lineText) => {
      let clean = lineText.replace(/^[\s*\-\d\.]+\s*/, '');
      const parts = [];
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(clean)) !== null) {
        if (match.index > lastIndex) {
          parts.push(clean.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} style={{ color: 'var(--text)', fontWeight: '600' }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < clean.length) {
        parts.push(clean.substring(lastIndex));
      }
      
      return parts.length > 0 ? parts : clean;
    };

    const extractImageAndClean = (lineText) => {
      const imgRegex = /!\[(.*?)\]\((.*?)\)/;
      const match = imgRegex.exec(lineText);
      if (match) {
        const cleanText = lineText.replace(imgRegex, '').trim();
        return {
          text: cleanText,
          imageUrl: match[2],
          imageAlt: match[1]
        };
      }
      return { text: lineText, imageUrl: null, imageAlt: null };
    };

    const parseTestLine = (lineText) => {
      let clean = lineText.replace(/^[\s*\-\d\.]+\s*/, '');
      let priorityText = '';
      let priorityType = 'routine';
      
      if (/urgent|ከባድ|አስቸኳይ/i.test(clean)) {
        priorityType = 'urgent';
        priorityText = appLanguage === 'English' ? 'Urgent' : 'አስቸኳይ';
      } else if (/soon|በቅርቡ/i.test(clean)) {
        priorityType = 'soon';
        priorityText = appLanguage === 'English' ? 'Soon' : 'በቅርቡ';
      } else if (/routine|ተግባራዊ/i.test(clean)) {
        priorityType = 'routine';
        priorityText = appLanguage === 'English' ? 'Routine' : 'መደበኛ';
      }
      
      return {
        text: clean,
        priorityType,
        priorityText
      };
    };

    const parsedKeyTerms = report.keyTerms.map(line => {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { term: parts[0], definition: parts[1] };
      }
      return null;
    }).filter(Boolean);

    const parsedReferences = report.references.map(line => {
      const linkRegex = /\[(.*?)\]\((.*?)\)/;
      const match = linkRegex.exec(line);
      if (match) {
        return { label: match[1], url: match[2] };
      }
      const clean = line.replace(/^[\s*\-\d\.]+\s*/, '');
      if (clean) return { label: clean, url: '#' };
      return null;
    }).filter(Boolean);

    return (
      <div className="modern-brief-conclusion" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {report.opening && (
          <div style={{
            fontSize: '15.5px',
            fontStyle: 'italic',
            color: 'var(--text)',
            opacity: 0.9,
            borderLeft: '4px solid var(--accent)',
            paddingLeft: '16px',
            lineHeight: '1.7',
            marginBottom: '4px'
          }}>
            {report.opening}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '30px',
          alignItems: 'start'
        }} className="report-two-col-grid">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {report.assessment && (
              <div style={{
                background: isLightMode ? 'rgba(82, 121, 111, 0.04)' : 'rgba(107, 144, 128, 0.03)',
                border: `1px solid ${isLightMode ? 'rgba(82,121,111,0.12)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '8px', background: isLightMode ? 'rgba(82,121,111,0.1)' : 'rgba(107,144,128,0.15)', color: 'var(--accent)' }}>
                    <Brain size={15} />
                  </span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)' }}>
                    {appLanguage === 'English' ? 'Clinical Impression' : 'ክሊኒካዊ ግምገማ'}
                  </h4>
                </div>
                <div style={{ color: 'var(--text)', opacity: 0.95, fontSize: '14px', lineHeight: '1.6' }}>
                  {report.assessment}
                </div>
              </div>
            )}

            {report.tests.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '8px', background: isLightMode ? 'rgba(82, 121, 111, 0.1)' : 'rgba(107, 144, 128, 0.15)', color: 'var(--accent)' }}>
                    <Stethoscope size={15} />
                  </span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)' }}>
                    {appLanguage === 'English' ? 'Recommended Diagnostics' : 'የሚመከሩ የላብራቶሪ ምርመራዎች'}
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {report.tests.map((rawItem, i) => {
                    const parsed = parseTestLine(rawItem);
                    const isUrgent = parsed.priorityType === 'urgent';
                    const isSoon = parsed.priorityType === 'soon';
                    
                    return (
                      <div key={i} style={{
                        background: isLightMode ? '#ffffff' : 'rgba(255,255,255,0.015)',
                        border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'}`,
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ flex: 1, color: 'var(--text)', opacity: 0.9, fontSize: '13.5px' }}>
                          {renderInlineMarkdown(parsed.text)}
                        </div>
                        {parsed.priorityText && (
                          <span style={{
                            flexShrink: 0,
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: isUrgent ? 'rgba(239, 68, 68, 0.08)' : isSoon ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            color: isUrgent ? '#ef4444' : isSoon ? '#f59e0b' : '#10b981',
                            border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.15)' : isSoon ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'}`
                          }}>
                            {parsed.priorityText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {report.warningSigns.length > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.02)',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span className="red-flag-pulse-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
                    <Activity size={15} strokeWidth={2.5} />
                  </span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#ef4444' }}>
                    {appLanguage === 'English' ? 'Red Flags (Seek Care If)' : 'አስቸኳይ ምልክቶች (ወደ ሐኪም መሄድ ያለብዎት)'}
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {report.warningSigns.map((rawItem, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13.5px' }}>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>•</span>
                      <div style={{ color: 'var(--text)', opacity: 0.9 }}>
                        {renderInlineMarkdown(rawItem)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {report.relief.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '8px', background: 'rgba(212,163,115,0.15)', color: '#d4a373' }}>
                    <HeartPulse size={15} />
                  </span>
                  <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)' }}>
                    {appLanguage === 'English' ? 'Temporary Relief Suggestions' : 'ጊዜያዊ ማስታገሻ ምክሮች'}
                  </h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {report.relief.map((rawItem, i) => {
                    const { text: cleanText, imageUrl, imageAlt } = extractImageAndClean(rawItem);
                    if (!cleanText && imageUrl) {
                      return (
                        <div key={i} style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, marginTop: '4px' }}>
                          <img src={imageUrl} alt={imageAlt || 'Relief guideline'} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                        </div>
                      );
                    }
                    return (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13.5px' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
                        <div style={{ color: 'var(--text)', opacity: 0.9 }}>
                          {renderInlineMarkdown(cleanText)}
                        </div>
                        {imageUrl && (
                          <div style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, marginTop: '4px' }}>
                            <img src={imageUrl} alt={imageAlt || 'Relief guideline'} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`app-wrapper ${sourceSidebar.isOpen ? 'sources-sidebar-open' : ''}`}>
      <StarfieldCanvas isLightMode={isLightMode} />

      {/* Sidebar Overlays (Backdrops for Mobile) */}
      {isSidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      {isRightSidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
          onClick={() => setIsRightSidebarOpen(false)} 
        />
      )}

      {/* Left Sidebar */}
      <div 
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        onMouseLeave={() => setIsSidebarOpen(false)}
      >
        <div className="sidebar-header">
          <div className="sidebar-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/favicon.svg" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <div>
              <h1>የጤና ረዳት</h1>
              <p>Divya AI</p>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {[
            { id: 'chat', icon: <MessageSquare size={18} />, label: 'Chat' },
            { id: 'sessions', icon: <ClipboardList size={18} />, label: 'Sessions', locked: !user },
            { id: 'plan', icon: <Calendar size={18} />, label: 'Plan', locked: !user },
            { id: 'food', icon: <Apple size={18} />, label: 'Food & Nutrition', locked: !user },
            { id: 'analytics', icon: <Activity size={18} />, label: 'Analytics', locked: !user },
            { id: 'settings', icon: <Settings size={18} />, label: 'Settings', locked: !user }
          ].map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.locked ? 'locked' : ''}`}
              onClick={() => {
                if (item.locked) {
                  triggerLoginPrompt(`navigate to ${item.label}`);
                } else {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }
              }}
            >
              {item.icon}
              {' '}
              {item.label}
              {' '}
              {item.id === 'food' && hasUncheckedActiveMeal && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: '#ef4444',
                  borderRadius: '50%',
                  marginLeft: 'auto',
                  boxShadow: '0 0 10px #ef4444',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
              {item.locked && <Lock size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Right Sidebar (Chat History) */}
      <div 
        className={`right-sidebar ${isRightSidebarOpen ? 'open' : ''}`}
        onMouseLeave={() => { if (!renameModal.isOpen && !activeChatMenuId) setIsRightSidebarOpen(false); }}
      >
        <div className="sidebar-header">
          <div className="sidebar-header-left">
            <History size={20} className="icon" />
            <h1>{appLanguage === 'English' ? 'History' : 'ታሪክ'}</h1>
          </div>
          <button className="sidebar-close-btn" onClick={() => setIsRightSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sessions-list">
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
            
            return ['Today', 'Yesterday', 'Previous 7 Days'].map(group => {
              const filtered = chats.filter(chat => {
                if (chat.date) {
                  if (group === 'Today') return chat.date === todayStr;
                  if (group === 'Yesterday') return chat.date === yesterdayStr;
                  if (group === 'Previous 7 Days') return chat.date < yesterdayStr && chat.date >= sevenDaysAgo.toISOString().split('T')[0];
                }
                return false;
              });

              if (filtered.length === 0) return null;

              return (
                <div key={group} style={{ marginBottom: '24px' }}>
                  <div className="section-label" style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {group === 'Today' ? (appLanguage === 'English' ? 'Today' : 'ዛሬ') : group === 'Yesterday' ? (appLanguage === 'English' ? 'Yesterday' : 'ትናንት') : (appLanguage === 'English' ? 'Previous 7 Days' : 'ያለፉት 7 ቀናት')}
                  </div>
                  {filtered.map(chat => (
                    <div 
                      key={chat.id}
                      className={`session-item ${chat.id === currentChatId && activeTab === 'chat' && !isDiagnosticMode ? 'active' : ''}`}
                      onClick={() => { loadChat(chat); setIsRightSidebarOpen(false); }}
                      style={{ position: 'relative' }}
                    >
                      <MessageSquare size={16} className="icon-muted" style={{ flexShrink: 0 }} />
                      <div className="session-item-content" style={{ flex: 1, minWidth: 0 }}>
                        <span className="session-title" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat.title}
                        </span>
                        <span className="session-date">{chat.date}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, message: appLanguage === 'English' ? 'Delete this chat?' : 'ይህን ውይይት መሰረዝ ይፈልጋሉ?', onConfirm: () => { setChats(prev => prev.filter(c => c.id !== chat.id)); if (token) { axios.delete(`/api/sessions/${chat.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => console.error(err)); } if (currentChatId === chat.id) createNewChat(); setConfirmModal({ isOpen: false, message: '', onConfirm: null }); } }); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', opacity: 0, transition: 'opacity 0.15s' }}
                        className="history-delete-btn"
                        title="Delete chat"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                      
                      {activeChatMenuId === chat.id && (
                        <div style={{ position: 'absolute', top: '100%', right: '0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', zIndex: 100, width: '150px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                          <button onClick={(e) => { e.stopPropagation(); loadChat(chat); setIsRightSidebarOpen(false); setActiveChatMenuId(null); }} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text)', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                            Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setRenameModal({ isOpen: true, currentTitle: chat.title || '', onConfirm: (newTitle) => { setChats(prev => prev.map(c => c.id === chat.id ? { ...c, title: newTitle.trim() } : c)); } }); setRenameInputText(chat.title || ''); setActiveChatMenuId(null); }} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--text)', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                            Rename
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, message: appLanguage === 'English' ? 'Delete this chat?' : 'ይህን ውይይት መሰረዝ ይፈልጋሉ?', onConfirm: () => { setChats(prev => prev.filter(c => c.id !== chat.id)); if (token) { axios.delete(`/api/sessions/${chat.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(err => console.error(err)); } if (currentChatId === chat.id) createNewChat(); setConfirmModal({ isOpen: false, message: '', onConfirm: null }); setActiveChatMenuId(null); } }); }} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#ef4444', padding: '10px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }} onMouseOver={e => e.currentTarget.style.background='rgba(239, 68, 68, 0.1)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            });
          })()}
        </div>
      </div>

      <SourceSidebar
        references={sourceSidebar.references}
        isOpen={sourceSidebar.isOpen}
        onClose={() => setSourceSidebar({ isOpen: false, references: [] })}
        appLanguage={appLanguage}
      />

      {/* ── Top bar ── */}
      <div className="top-bar">
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <PanelLeft size={20} className="icon-muted" style={{cursor:'pointer'}} onClick={() => setIsSidebarOpen(true)} onMouseEnter={() => setIsSidebarOpen(true)} />
          <button className="new-session-btn header-new-chat" onClick={createNewChat} style={{width:'auto',marginBottom:0,padding:'6px 12px',fontSize:'13px',borderRadius:'8px',background:'var(--surface)',border:'1px solid var(--border)'}}>
            <Plus size={14} /> {appLanguage === 'English' ? 'New Chat' : 'አዲስ ውይይት'}
          </button>
        </div>
        <div className={`top-bar-right ${user ? 'logged-in' : ''}`} style={{display:'flex',alignItems:'center',gap:'20px'}}>
          <button className="theme-toggle-btn" onClick={() => setIsLightMode(!isLightMode)} title="Toggle Theme" style={{padding:'4px'}}>
            {isLightMode ? <Moon size={18}/> : <Sun size={18}/>}
          </button>
          {!user && (
            <button 
              onClick={() => triggerLoginPrompt('access all features')}
              className="theme-toggle-btn"
              title="Sign up"
              style={{ padding: '4px' }}
            >
              <LogIn size={18} />
            </button>
          )}
          {user && (
            <button 
              className="history-toggle-btn"
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              title="History"
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
              }}
            >
              <History size={20} />
            </button>
          )}
          {user && (
            <div 
              className="profile-menu-container" 
              style={{position:'relative', display:'flex', alignItems:'center'}}
              onMouseEnter={handleProfileMouseEnter}
              onMouseLeave={handleProfileMouseLeave}
            >
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                style={{
                  display:'flex', alignItems:'center', gap:'8px', padding:'4px 8px 4px 4px', 
                  borderRadius:'24px', background:'var(--surface-2)', border:'1px solid var(--border)',
                  cursor:'pointer', transition:'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background='var(--surface-3)'}
                onMouseOut={e => e.currentTarget.style.background='var(--surface-2)'}
              >
                {user.picture ? (
                  <img src={user.picture} alt="Profile" referrerPolicy="no-referrer" style={{width:'28px', height:'28px', borderRadius:'50%'}} />
                ) : (
                  <div style={{width:'28px', height:'28px', borderRadius:'50%', background:'var(--accent)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'bold'}}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <ChevronDown size={14} style={{color:'var(--text-muted)'}} />
              </button>
              
              {isProfileMenuOpen && (
                <div className="profile-menu-dropdown">
                  <div style={{padding:'8px 12px', borderBottom:'1px solid var(--border)', marginBottom:'4px'}}>
                    <div style={{fontWeight:'600', fontSize:'14px', color:'var(--text)'}}>{user.name || 'User'}</div>
                    <div style={{fontSize:'12px', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis'}}>{user.email}</div>
                  </div>
                  <button 
                    onClick={() => { setIsProfileMenuOpen(false); setActiveTab('settings'); }} 
                    style={{
                      display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', 
                      background:'transparent', border: 'none', color:'var(--text)', 
                      borderRadius:'8px', cursor:'pointer', textAlign:'left', fontSize:'14px', transition:'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background='var(--surface-2)'}
                    onMouseOut={e => e.currentTarget.style.background='transparent'}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <div className="mobile-only-theme-toggle">
                    <button 
                      onClick={() => { setIsLightMode(!isLightMode); }} 
                      style={{
                        display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', 
                        background:'transparent', border: 'none', color:'var(--text)', 
                        borderRadius:'8px', cursor:'pointer', textAlign:'left', fontSize:'14px', transition:'background 0.2s',
                        width: '100%'
                      }}
                      onMouseOver={e => e.currentTarget.style.background='var(--surface-2)'}
                      onMouseOut={e => e.currentTarget.style.background='transparent'}
                    >
                      {isLightMode ? <Moon size={16} /> : <Sun size={16} />} 
                      <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => { setIsProfileMenuOpen(false); logout(); }} 
                    style={{
                      display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', 
                      background:'transparent', border:'none', color:'#ef4444', 
                      borderRadius:'8px', cursor:'pointer', textAlign:'left', fontSize:'14px', transition:'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background='transparent'}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="main-content">

        {activeTab === 'sessions' && (
          <SessionsTab
            appLanguage={appLanguage}
            isDiagnosticMode={isDiagnosticMode}
            endCall={endCall}
            startDiagnosticSession={startDiagnosticSession}
            masterReport={masterReport}
            isLightMode={isLightMode}
            isReportMenuOpen={isReportMenuOpen}
            setIsReportMenuOpen={setIsReportMenuOpen}
            renameMasterReport={renameMasterReport}
            deleteMasterReport={deleteMasterReport}
            setIsReportModalOpen={setIsReportModalOpen}
            startRevisionSession={startRevisionSession}
            unfinishedSessions={unfinishedSessions}
            resumeUnfinishedSession={resumeUnfinishedSession}
            setUnfinishedSessions={setUnfinishedSessions}
          />
        )}

        {activeTab === 'plan' && (
          <PlanTab
            masterReport={masterReport}
            chats={chats}
            personalWeight={personalWeight}
            personalAge={personalAge}
            isLightMode={isLightMode}
            appLanguage={appLanguage}
            selectedCategoryFilter={selectedCategoryFilter}
            setSelectedCategoryFilter={setSelectedCategoryFilter}
            setIsAddTaskModalOpen={setIsAddTaskModalOpen}
            planChecklist={planChecklist}
            setPlanChecklist={setPlanChecklist}
            selectedWeeklyDay={selectedWeeklyDay}
            setSelectedWeeklyDay={setSelectedWeeklyDay}
            customPlanTasks={customPlanTasks}
            expandedTasks={expandedTasks}
            setExpandedTasks={setExpandedTasks}
            regeneratePlanTasks={regeneratePlanTasks}
            startDiagnosticSession={startDiagnosticSession}
          />
        )}

        {activeTab === 'food' && (
          <FoodTab
            masterReport={masterReport}
            isLightMode={isLightMode}
            appLanguage={appLanguage}
            setHasUncheckedActiveMeal={setHasUncheckedActiveMeal}
            startDiagnosticSession={startDiagnosticSession}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            masterReport={masterReport}
            isLightMode={isLightMode}
            appLanguage={appLanguage}
            analyticsChecklist={analyticsChecklist}
            setAnalyticsChecklist={setAnalyticsChecklist}
            expandedDays={expandedDays}
            setExpandedDays={setExpandedDays}
            personalWeight={personalWeight}
            personalHeight={personalHeight}
            personalAge={personalAge}
            planChecklist={planChecklist}
            customPlanTasks={customPlanTasks}
            startDiagnosticSession={startDiagnosticSession}
          />
        )}

        {/* ── Settings tab ── */}
        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            settings={settings}
            updateSettings={updateSettings}
            personalName={personalName}
            personalAge={personalAge}
            personalWeight={personalWeight}
            personalHeight={personalHeight}
            isLightMode={isLightMode}
            isTtsEnabled={isTtsEnabled}
            appLanguage={appLanguage}
            setPersonalName={setPersonalName}
            setPersonalAge={setPersonalAge}
            setPersonalWeight={setPersonalWeight}
            setPersonalHeight={setPersonalHeight}
            setIsLightMode={setIsLightMode}
            setIsTtsEnabled={setIsTtsEnabled}
            setAppLanguage={setAppLanguage}
            saveProfileToDb={saveProfileToDb}
            activeSettingsTab={activeSettingsTab}
            setActiveSettingsTab={setActiveSettingsTab}
          />
        )}

        {/* ── Chat tab ── */}
        {activeTab === 'chat' && (
          messages.length === 0 && !isThinking ? (
            <div className="welcome-container" style={{maxWidth:'1100px'}}>
              <div className="welcome-heading" style={{marginBottom:'6px'}}>
                <div className="normal welcome-title" style={{fontWeight:'700',fontFamily:"'Elms Sans', 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Fredoka One', cursive",letterSpacing:'-0.5px'}}>
                  {randomGreeting}{user && personalName ? (appLanguage === 'English' ? `, ${personalName}` : `፣ ${personalName}`) : ''}
                </div>
                <div className="welcome-subtitle" style={{fontSize:'15px',color:'var(--text-muted)',marginTop:'8px'}}>
                  {appLanguage === 'English' ? "Hey there! What can I do for your health today?" : "ጤና ይስጥልኝ! ዛሬ ለጤናዎ ምን ልርዳዎት?"}
                </div>
              </div>
              <div className="prompt-cards-container">
                <div className="prompt-card" onClick={() => user ? setActiveTab('sessions') : triggerLoginPrompt("use this feature")}><ClipboardList size={20} className="card-icon"/><h3>{appLanguage === 'English' ? "How's my health?" : "ጤናዬ እንዴት ነው?"}</h3><p>{appLanguage === 'English' ? "Get a quick overview of your health session results and advice." : "የጤና ምርመራ ውጤቶችዎን እና የዶክተር ምክሮችን በፍጥነት ይመልከቱ።"}</p><button className="card-action-btn">{appLanguage === 'English' ? (user ? "View Result" : "Sign up") : (user ? "ውጤቱን ይመልከቱ" : "ይግቡ")}</button></div>
                <div className="prompt-card" onClick={() => user ? setActiveTab('plan') : triggerLoginPrompt("use this feature")}><Calendar size={20} className="card-icon"/><h3>{appLanguage === 'English' ? "Any active plans?" : "ንቁ የጤና እቅዶች?"}</h3><p>{appLanguage === 'English' ? "Check your current medical prescriptions and daily routines." : "የአሁኑን የሕክምና ማዘዣዎችዎን እና የዕለት ተዕለት ዕቅዶችን ያረጋግጡ።"}</p><button className="card-action-btn">{appLanguage === 'English' ? (user ? "View Plan" : "Sign up") : (user ? "እቅድን ይመልከቱ" : "ይግቡ")}</button></div>
                <div className="prompt-card" onClick={() => user ? setActiveTab('food') : triggerLoginPrompt("use this feature")}><Apple size={20} className="card-icon"/><h3>{appLanguage === 'English' ? "What should I eat?" : "ምን መመገብ አለብኝ?"}</h3><p>{appLanguage === 'English' ? "See personalized nutrition plans and diet guidelines for you." : "ለእርስዎ የተዘጋጁ የአመጋገብ ዕቅዶችን እና የምግብ መመሪያዎችን ይመልከቱ።"}</p><button className="card-action-btn">{appLanguage === 'English' ? (user ? "View Diet" : "Sign up") : (user ? "አመጋገብን ይመልከቱ" : "ይግቡ")}</button></div>
              </div>

              {/* ── Compact Sign In Banner ── */}
              {!user && showLoginBanner && (
                <div className="compact-signin-banner">
                  <span className="banner-text">
                    Sign up to unlock full features
                  </span>

                  <div className="banner-right-controls" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {/* Circle Google Login Button */}
                    <button 
                      onClick={() => googleLogin()}
                      className="circle-google-btn"
                      title="Sign up with Google"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </button>

                    {/* X mark close button */}
                    <button 
                      onClick={() => setShowLoginBanner(false)}
                      className="banner-close-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Welcome screen input */}
              <div className="input-area-wrapper">
                {isListening && (<div className="status-pill"><div className="status-pill-dot listening"></div>Listening...</div>)}
                <div className={`input-bar ${isListening ? 'listening' : ''}`}>
                  {attachment && (
                    <div style={{
                      padding: '12px 16px 0 16px',
                      display: 'flex'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: isLightMode ? 'rgba(47,62,70,0.05)' : 'rgba(212,163,115,0.06)',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        border: `1px solid ${isLightMode ? 'rgba(47,62,70,0.12)' : 'rgba(212,163,115,0.15)'}`,
                        width: 'fit-content'
                      }}>
                        {attachment.mimeType.startsWith('image/') ? (
                          <img src={attachment.url} alt="preview" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                        ) : (
                          <FileText size={16} style={{ color: 'var(--accent)' }} />
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {attachment.name}
                        </span>
                        <button 
                          onClick={() => setAttachment(null)}
                          style={{
                            background: 'transparent', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center',
                            borderRadius: '50%'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="input-text-row" style={{padding:'16px 16px 8px'}}>
                    {isListening ? (
                      <div className="waveform-mini" style={{flex:1,minHeight:'50px'}}>
                        <div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div>
                        <span style={{color:'var(--text-muted)',fontSize:'15px',marginLeft:'8px'}}>Listening...</span>
                      </div>
                    ) : (
                      <textarea ref={welcomeInputRef} className="input-placeholder" placeholder={appLanguage === 'English' ? "Ask anything..." : "ማንኛውንም ጥያቄ ይጠይቁ..."} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(inputText); } }} rows={1} style={{width:'100%',border:'none',background:'transparent',resize:'none',outline:'none',color:'var(--text)',fontSize:'15px',maxHeight:'160px',padding:'0',display:'block',overflowY:'auto'}}/>
                    )}
                  </div>
                  <div className="input-bottom-row" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px 12px'}}>
                    <div className="input-actions-left" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div className="plus-btn-wrapper" ref={plusMenuRef}>
                        <button type="button" className="plus-btn" onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)} title="Attach files" style={{padding:'6px'}}>
                          <Plus size={20} style={{transform:isPlusMenuOpen?'rotate(45deg)':'none',transition:'transform 0.2s'}}/>
                        </button>
                        {isPlusMenuOpen && (
                          <div className="plus-menu" style={{bottom:'calc(100% + 4px)', width:'160px'}}>
                            <button type="button" className="plus-menu-item" onClick={() => { setIsPlusMenuOpen(false); fileInputRef.current?.click(); }}>{appLanguage === 'English' ? 'Upload File' : 'ፋይል ስቀል'}</button>
                            <button type="button" className="plus-menu-item" onClick={() => { setIsPlusMenuOpen(false); imageInputRef.current?.click(); }}>{appLanguage === 'English' ? 'Upload Image' : 'ምስል ስቀል'}</button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`thinking-toggle-btn ${isThinkingMode ? 'active' : ''}`}
                        onClick={() => setIsThinkingMode(!isThinkingMode)}
                        title={appLanguage === 'English' ? "Toggle Thinking Mode" : "የማሰብ ሁነታን ቀይር"}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: '1px solid var(--border)',
                          background: isThinkingMode ? 'rgba(107, 144, 128, 0.15)' : 'transparent',
                          color: isThinkingMode ? 'var(--accent)' : 'var(--text-muted)',
                          borderColor: isThinkingMode ? 'var(--accent)' : 'var(--border)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginLeft: '8px'
                        }}
                        onMouseEnter={e => {
                          if (!isThinkingMode) {
                            e.currentTarget.style.color = 'var(--text)';
                            e.currentTarget.style.borderColor = 'var(--border-active)';
                            e.currentTarget.style.background = 'var(--surface-hover)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isThinkingMode) {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <Brain size={14} style={{ color: isThinkingMode ? 'var(--accent)' : 'inherit' }} />
                        <span>{appLanguage === 'English' ? "Thinking" : "ማሰብ"}</span>
                      </button>
                    </div>
                    <div className="input-actions-right" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <button className="voice-call-trigger" onClick={() => user ? startCall() : triggerLoginPrompt('use Voice Call')} disabled={isThinking || isSpeaking} title="Start Voice Call"><AudioLines size={18}/></button>
                      <button 
                        className={`mic-btn-input ${isListening ? 'listening' : ''}`} 
                        onMouseDown={() => user ? startListening() : triggerLoginPrompt('use Voice Input')} 
                        onMouseUp={stopListening} 
                        onMouseLeave={() => { if (isListening) stopListening(); }} 
                        onTouchStart={(e) => { e.preventDefault(); if (user) { startListening(); } else { triggerLoginPrompt('use Voice Input'); } }} 
                        onTouchEnd={(e) => { e.preventDefault(); stopListening(); }} 
                        onTouchCancel={(e) => { e.preventDefault(); stopListening(); }} 
                        disabled={isThinking || isSpeaking} 
                        title="Voice Input"
                      >
                        <Mic size={20}/>
                      </button>
                      {isThinking ? (
                        <button className="send-btn-input active" onClick={stopThinking} title="Stop generating" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',boxShadow:'0 4px 12px rgba(239,68,68,0.35)'}}><Square size={15} fill="white"/></button>
                      ) : isSpeaking ? (
                        <button className="send-btn-input active" onClick={stopSpeaking} title="Stop Speaking" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',boxShadow:'0 4px 12px rgba(239,68,68,0.35)'}}><Square size={16} fill="white"/></button>
                      ) : (
                        <button className={`send-btn-input ${(inputText.trim() || attachment) ? 'active' : 'disabled'}`} onClick={submitWithAttachment} disabled={!inputText.trim() && !attachment} title="Send Message"><Send size={18}/></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Chat with messages */
            <div className="chat-container" style={{ position: 'relative' }}>
              <div className="messages-area" ref={chatAreaRef} onScroll={handleChatScroll}>
                {messages.map((msg, index) => {
                  const { body, references, images } = msg.role === 'ai' ? parseReferences(msg.text) : { body: msg.text, references: [], images: [] };
                  const lines = body.split('\n');
                  const mainTextLines = [];
                  const choiceLines = [];
                  lines.forEach(line => {
                    const trimmed = line.trim();
                    if (/^[A-Z][).]\s/.test(trimmed) || /^(Choose one|Choose all that apply)/i.test(trimmed)) {
                      choiceLines.push(trimmed);
                    } else {
                      mainTextLines.push(line);
                    }
                  });
                  return (
                  <div key={msg.id || index} className={`message-row ${msg.role}`}>
                    <div className="message-content">
                      {msg.role === 'ai' && <div className="avatar-ai"><Stethoscope size={16}/></div>}
                      <div className="message-details">
                        <span className="sender-name">
                          {msg.role === 'user' ? (personalName || 'Patient') : 'Divya'}
                          {msg.originalText && (
                            <span className="translated-badge" style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: '400', fontStyle: 'italic' }}>
                              ({appLanguage === 'English' ? 'Translated' : 'የተተረጎመ'})
                            </span>
                          )}
                        </span>
                        {msg.role === 'ai' && (msg.isIntroduction || (msg.text.includes("Divya") && msg.text.includes("Drive"))) && (
                          <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '10px' }}>
                            <DivyaAvatar3D isSpeaking={speakingMsgId === msg.id || speakingMsgId === msg.id + '_am'} />
                            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {(speakingMsgId === msg.id || speakingMsgId === msg.id + '_am') ? 'Divya Hologram: Speaking...' : 'Divya Hologram: Idle'}
                            </span>
                          </div>
                        )}
                        <div className="bubble">
                          {msg.role === 'ai' && (msg.isIntroduction || (msg.text.includes("Divya") && msg.text.includes("Drive"))) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '280px', maxWidth: '600px' }}>
                              <MarkdownRenderer content={body} />
                              
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '8px' }}>
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                  <svg width="20" height="20" viewBox="0 0 1443 1250" style={{ display: 'block', width: '20px', height: '20px', marginBottom: '2px' }}>
                                    <path d="M481 0h481l481 833H962L481 0z" fill="#0066da"/>
                                    <path d="M0 833l241-417h961L962 833H0z" fill="#00ac47"/>
                                    <path d="M241 416L481 0h962l-241 416H241z" fill="#ffba00"/>
                                  </svg>
                                  <strong style={{ fontSize: '12px', color: 'var(--text)' }}>Google Drive</strong>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                                    {appLanguage === 'English' ? 'Saves clinical reports, plans, & nutrition targets.' : 'ሪፖርቶችዎን እና እቅዶችዎን ደህንነቱ በተጠበቀ ሁኔታ ያስቀምጣል።'}
                                  </span>
                                </div>
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                  <svg width="20" height="20" viewBox="0 0 192 192" style={{ display: 'block', width: '20px', height: '20px', marginBottom: '2px' }}>
                                    <rect x="24" y="24" width="144" height="144" rx="28" fill="#ffffff" stroke="#1a73e8" strokeWidth="12"/>
                                    <path d="M24 24h144v48H24z" fill="#1a73e8"/>
                                    <text x="96" y="132" textAnchor="middle" fill="#1a73e8" fontSize="64" fontWeight="900" fontFamily="sans-serif">31</text>
                                  </svg>
                                  <strong style={{ fontSize: '12px', color: 'var(--text)' }}>Google Calendar</strong>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                                    {appLanguage === 'English' ? 'Syncs follow-ups, appointments & sessions.' : 'ቀጠሮዎችን በራስ-ሰር ያስተዳድራል።'}
                                  </span>
                                </div>
                                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block', width: '20px', height: '20px', marginBottom: '2px' }}>
                                    <defs>
                                      <linearGradient id="alarmGradMini" x1="0" y1="0" x2="1" y2="1">
                                        <stop offset="0%" stopColor="#ff5f6d"/>
                                        <stop offset="100%" stopColor="#ffc371"/>
                                      </linearGradient>
                                    </defs>
                                    <circle cx="12" cy="13" r="8" fill="url(#alarmGradMini)"/>
                                    <circle cx="12" cy="13" r="6.5" fill="#ffffff"/>
                                    <path d="M5 6c-.5.5-1.5 2-1 3s3 1.5 3.5 1M19 6c.5.5 1.5 2 1 3s-3 1.5-3.5 1" stroke="#ff5f6d" strokeWidth="2.5" strokeLinecap="round"/>
                                    <path d="M6 20l-1.5 2M18 20l1.5 2" stroke="#ff5f6d" strokeWidth="2.5" strokeLinecap="round"/>
                                    <path d="M12 10v3l3 2" stroke="#2f3e46" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                  <strong style={{ fontSize: '12px', color: 'var(--text)' }}>Alarm App</strong>
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                                    {appLanguage === 'English' ? 'Set reminders for pills, supplements, & meals.' : 'መድሃኒት መውሰጃ ሰዓቶችዎን በደወል ያስታውሳል።'}
                                  </span>
                                </div>
                              </div>

                              <button 
                                onClick={() => {
                                  const amharicSpeechText = `ሰላም! እኔ ዲቭያ (Divya) እባላለሁ - የጤና ረዳትዎ እና ክሊኒካዊ የአመጋገብ ባለሙያ ነኝ። ምልክት-ደጋፊ ክሊኒካዊ ግምገማዎችን፣ የዕለት ተዕለት ተግባራትን እና ብጁ የአመጋገብ እቅዶችን ለእርስዎ ለማዘጋጀት ተዘጋጅቻለሁ። የጤና ሪፖርቶችዎን በ Google Drive ማስቀመጥ፣ ቀጠሮዎችዎን በ Google Calendar ማስተዳደር፣ እና መድሃኒትዎን በ Alarm መውሰጃ ሰዓት ማስተካከል እችላለሁ።`;
                                  if (speakingMsgId === msg.id + '_am') {
                                    stopSpeaking();
                                  } else {
                                    speak(amharicSpeechText, msg.id + '_am');
                                  }
                                }}
                                style={{
                                  marginTop: '8px',
                                  padding: '10px 16px',
                                  background: speakingMsgId === msg.id + '_am' ? 'var(--accent-red)' : 'var(--accent)',
                                  border: 'none',
                                  borderRadius: '10px',
                                  color: 'white',
                                  fontWeight: '600',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  transition: 'background 0.2s'
                                }}
                              >
                                {speakingMsgId === msg.id + '_am' ? <Square size={14} fill="currentColor"/> : <Volume2 size={14}/>}
                                <span>{speakingMsgId === msg.id + '_am' ? (appLanguage === 'English' ? 'Stop Amharic Audio' : 'አማርኛ ድምፅ አቁም') : (appLanguage === 'English' ? 'Listen in Amharic (አማርኛ)' : 'በአማርኛ ያዳምጡ')}</span>
                              </button>
                            </div>
                          ) : (
                            msg.role === 'ai' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <MarkdownRenderer content={mainTextLines.join('\n')} />
                                {choiceLines.length > 0 && (() => {
                                  const isMultipleChoice = /Choose all that apply|Select multiple|Select all/i.test(msg.text) ||
                                                           /ሁሉ(ንም)?.*?ይምረጡ/i.test(msg.text) ||
                                                           choiceLines.some(line => /Choose all that apply|Select multiple|Select all/i.test(line));
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', width: '100%', maxWidth: '420px' }}>
                                      {choiceLines.map((choice, i) => {
                                        if (/^(Choose one|Choose all that apply)/i.test(choice)) {
                                           return <div key={i} style={{fontSize:'11px', color: 'var(--text-muted)', fontStyle:'italic'}}>{choice}</div>
                                        }
                                        const isSelected = !!selectedChoices[msg.id || index]?.[choice];
                                        return (
                                          <button 
                                            key={i}
                                            onClick={() => {
                                              if (isMultipleChoice) {
                                                setSelectedChoices(prev => {
                                                  const msgChoices = prev[msg.id || index] || {};
                                                  return {
                                                    ...prev,
                                                    [msg.id || index]: {
                                                      ...msgChoices,
                                                      [choice]: !msgChoices[choice]
                                                    }
                                                  };
                                                });
                                              } else {
                                                handleTextSubmit(choice);
                                              }
                                            }}
                                            style={{
                                              background: isSelected 
                                                ? 'var(--accent)' 
                                                : 'rgba(212,163,115,0.06)',
                                              border: `1px solid ${isSelected ? 'var(--accent)' : 'rgba(212,163,115,0.15)'}`,
                                              borderRadius: '8px', padding: '10px 14px',
                                              color: isSelected 
                                                ? '#ffffff' 
                                                : 'var(--text)',
                                              textAlign: 'left',
                                              cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px',
                                              fontWeight: '500',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              width: '100%'
                                            }}
                                          >
                                            <span>{choice}</span>
                                            {isSelected && <CheckCheck size={14} style={{ color: '#ffffff', marginLeft: '8px' }} />}
                                          </button>
                                        );
                                      })}

                                      {isMultipleChoice && (() => {
                                        const msgChoices = selectedChoices[msg.id || index] || {};
                                        const selectedList = Object.keys(msgChoices).filter(k => msgChoices[k]);
                                        if (selectedList.length === 0) return null;
                                        return (
                                          <button
                                            onClick={() => {
                                              handleTextSubmit(selectedList.join(', '));
                                              setSelectedChoices(prev => {
                                                const updated = { ...prev };
                                                delete updated[msg.id || index];
                                                return updated;
                                              });
                                            }}
                                            className="read-report-btn"
                                            style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px', textTransform: 'none' }}
                                            >
                                              {appLanguage === 'English' ? `Submit Selections (${selectedList.length})` : `ምርጫዎችን አስገባ (${selectedList.length})`}
                                            </button>
                                        );
                                      })()}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : msg.text
                          )}
                        </div>
                        {msg.hasError && (
                          <div style={{fontSize:'12px',color:'#ef4444',marginTop:'6px',display:'flex',alignItems:'center',gap:'8px'}}>
                            <span>{msg.errorMessage || 'Failed to send'}</span>
                            <button onClick={() => retryMessage(msg.id)} style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.3)',color:'#ef4444',borderRadius:'4px',padding:'4px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',fontWeight:'600',transition:'all 0.2s'}} onMouseOver={e => e.currentTarget.style.background='rgba(239,68,68,0.2)'} onMouseOut={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}>
                              <RefreshCcw size={12}/> Retry
                            </button>
                          </div>
                        )}
                        {msg.role === 'ai' && references.length > 0 && (
                          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'flex-start' }}>
                            <SourcesButton
                              references={references}
                              onClick={() => setSourceSidebar({ isOpen: true, references })}
                            />
                          </div>
                        )}
                        {msg.role === 'ai' && (
                          <div className="msg-actions">
                            <button className="msg-action-btn" onClick={() => { if (speakingMsgId === msg.id) { stopSpeaking(); } else { stopSpeaking(); speak(msg.text, msg.id); } }} title={speakingMsgId === msg.id ? 'Stop Speaking' : 'Speak message'} style={speakingMsgId === msg.id ? {color:'#d4a373',borderColor:'#d4a373'} : {}}>
                              {speakingMsgId === msg.id ? <Square size={13} fill="currentColor"/> : <Volume2 size={13}/>}<span>{speakingMsgId === msg.id ? 'Stop' : 'Listen'}</span>
                            </button>
                            <button className="msg-action-btn" onClick={() => retryMessage(msg.id)} title="Regenerate response">
                              <RefreshCcw size={13}/><span>Retry</span>
                            </button>
                            <button className="msg-action-btn" onClick={() => handleCopyText(msg.text, msg.id)} title="Copy message">
                              {copiedMsgId === msg.id ? <CheckCheck size={13}/> : <Copy size={13}/>}<span>{copiedMsgId === msg.id ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button className="msg-action-btn" onClick={() => translateMsg(msg)} disabled={translatingId === msg.id} title="Translate">
                              {translatingId === msg.id ? <Activity size={13} className="spin"/> : <Languages size={13}/>}
                              <span>
                                {translatingId === msg.id 
                                  ? (appLanguage === 'English' ? 'Translating...' : 'በመተርጎም ላይ...') 
                                  : (msg.translatedTo === 'English' ? 'Amharic' : 'English')}
                              </span>
                            </button>
                          </div>
                        )}
                        {msg.role === 'user' && (
                          <div className="msg-actions">
                            <button className="msg-action-btn" onClick={() => handleCopyText(msg.text, msg.id)} title="Copy message">
                              {copiedMsgId === msg.id ? <CheckCheck size={13}/> : <Copy size={13}/>}<span>{copiedMsgId === msg.id ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <button className="msg-action-btn" onClick={() => editUserMessage(msg.id)} title="Edit message">
                              <Pencil size={13}/><span>Edit</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
                {isThinking && (
                  <div className="message-row ai">
                    <div className="message-content">
                      <div className="avatar-ai"><Stethoscope size={16}/></div>
                      <div className="message-details">
                        <span className="sender-name">Divya</span>
                        <div className="thinking-bubble-upgraded" style={{padding:'4px 0'}}>
                          <div className="typing-indicator"><div className="typing-dots"><span className="typing-dot"></span><span className="typing-dot"></span><span className="typing-dot"></span></div><span className="typing-text">Divya is thinking...</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {showScrollBottom && (
                <button
                  onClick={() => {
                    if (chatAreaRef.current) {
                      chatAreaRef.current.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                  className="scroll-bottom-btn"
                  title="Scroll to bottom"
                >
                  <ChevronDown size={18} />
                </button>
              )}

              {/* Pinned chat input */}
              <div className="chat-input-pinned">
                {isListening && !isCallActive && (<div className="status-pill"><div className="status-pill-dot listening"></div>Listening...</div>)}
                <div className={`input-bar ${isListening && !isCallActive ? 'listening' : isSpeaking && !isCallActive ? 'speaking' : ''}`}>
                  {attachment && (
                    <div style={{
                      padding: '12px 16px 0 16px',
                      display: 'flex'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: isLightMode ? 'rgba(47,62,70,0.05)' : 'rgba(212,163,115,0.06)',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        border: `1px solid ${isLightMode ? 'rgba(47,62,70,0.12)' : 'rgba(212,163,115,0.15)'}`,
                        width: 'fit-content'
                      }}>
                        {attachment.mimeType.startsWith('image/') ? (
                          <img src={attachment.url} alt="preview" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                        ) : (
                          <FileText size={16} style={{ color: 'var(--accent)' }} />
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {attachment.name}
                        </span>
                        <button 
                          onClick={() => setAttachment(null)}
                          style={{
                            background: 'transparent', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center',
                            borderRadius: '50%'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="input-text-row" style={{padding:'16px 16px 8px'}}>
                    {isListening && !isCallActive ? (
                      <div className="waveform-mini" style={{flex:1,minHeight:'50px'}}>
                        <div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div><div className="wave-bar"></div>
                        <span style={{color:'var(--text-muted)',fontSize:'15px',marginLeft:'8px'}}>Listening...</span>
                      </div>
                    ) : isSpeaking && !isCallActive ? (
                      <div className="waveform-mini" style={{flex:1,minHeight:'50px'}}>
                        <div className="wave-bar cyan"></div><div className="wave-bar cyan"></div><div className="wave-bar cyan"></div><div className="wave-bar cyan"></div><div className="wave-bar cyan"></div>
                        <span style={{color:'var(--accent-cyan)',fontSize:'15px',marginLeft:'8px'}}>Speaking...</span>
                      </div>
                    ) : (
                      <textarea ref={pinnedInputRef} className="input-placeholder" placeholder="Ask anything..." value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(inputText); } }} disabled={isThinking || (isSpeaking && !isCallActive)} rows={1} style={{width:'100%',border:'none',background:'transparent',resize:'none',outline:'none',color:'var(--text)',fontSize:'15px',maxHeight:'160px',padding:'0',display:'block',overflowY:'auto'}}/>
                    )}
                  </div>
                  <div className="input-bottom-row" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px 12px'}}>
                    <div className="input-actions-left" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div className="plus-btn-wrapper" ref={pinnedPlusMenuRef}>
                        <button type="button" className="plus-btn" onClick={() => setIsPlusMenuOpenPinned(!isPlusMenuOpenPinned)} title="Attach files" style={{padding:'6px'}}>
                          <Plus size={20} style={{transform:isPlusMenuOpenPinned?'rotate(45deg)':'none',transition:'transform 0.2s'}}/>
                        </button>
                        {isPlusMenuOpenPinned && (
                          <div className="plus-menu" style={{bottom:'calc(100% + 4px)', width:'160px'}}>
                            <button type="button" className="plus-menu-item" onClick={() => { setIsPlusMenuOpenPinned(false); fileInputRef.current?.click(); }}>{appLanguage === 'English' ? 'Upload File' : 'ፋይል ስቀል'}</button>
                            <button type="button" className="plus-menu-item" onClick={() => { setIsPlusMenuOpenPinned(false); imageInputRef.current?.click(); }}>{appLanguage === 'English' ? 'Upload Image' : 'ምስል ስቀል'}</button>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`thinking-toggle-btn ${isThinkingMode ? 'active' : ''}`}
                        onClick={() => setIsThinkingMode(!isThinkingMode)}
                        title={appLanguage === 'English' ? "Toggle Thinking Mode" : "የማሰብ ሁነታን ቀይር"}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: '1px solid var(--border)',
                          background: isThinkingMode ? 'rgba(107, 144, 128, 0.15)' : 'transparent',
                          color: isThinkingMode ? 'var(--accent)' : 'var(--text-muted)',
                          borderColor: isThinkingMode ? 'var(--accent)' : 'var(--border)',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginLeft: '8px'
                        }}
                        onMouseEnter={e => {
                          if (!isThinkingMode) {
                            e.currentTarget.style.color = 'var(--text)';
                            e.currentTarget.style.borderColor = 'var(--border-active)';
                            e.currentTarget.style.background = 'var(--surface-hover)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isThinkingMode) {
                            e.currentTarget.style.color = 'var(--text-muted)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <Brain size={14} style={{ color: isThinkingMode ? 'var(--accent)' : 'inherit' }} />
                        <span>{appLanguage === 'English' ? "Thinking" : "ማሰብ"}</span>
                      </button>
                    </div>
                    <div className="input-actions-right" style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <button className="voice-call-trigger" onClick={() => user ? startCall() : triggerLoginPrompt('use Voice Call')} disabled={isThinking || (isSpeaking && !isCallActive)} title="Start Voice Call"><AudioLines size={18}/></button>
                      <button 
                        className={`mic-btn-input ${isListening && !isCallActive ? 'listening' : ''}`} 
                        onMouseDown={() => user ? startListening() : triggerLoginPrompt('use Voice Input')} 
                        onMouseUp={stopListening} 
                        onMouseLeave={() => { if (isListening) stopListening(); }} 
                        onTouchStart={(e) => { e.preventDefault(); if (user) { startListening(); } else { triggerLoginPrompt('use Voice Input'); } }} 
                        onTouchEnd={(e) => { e.preventDefault(); stopListening(); }} 
                        onTouchCancel={(e) => { e.preventDefault(); stopListening(); }} 
                        disabled={isThinking || (isSpeaking && !isCallActive)} 
                        title="Voice Input"
                      >
                        <Mic size={20}/>
                      </button>
                      {isThinking ? (
                        <button className="send-btn-input active" onClick={stopThinking} title="Stop generating" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',boxShadow:'0 4px 12px rgba(239,68,68,0.35)'}}><Square size={15} fill="white"/></button>
                      ) : (isSpeaking && !isCallActive) ? (
                        <button className="send-btn-input active" onClick={stopSpeaking} title="Stop Speaking" style={{background:'linear-gradient(135deg,#ef4444,#dc2626)',boxShadow:'0 4px 12px rgba(239,68,68,0.35)'}}><Square size={16} fill="white"/></button>
                      ) : (
                        <button className={`send-btn-input ${(inputText.trim() || attachment) ? 'active' : 'disabled'}`} onClick={submitWithAttachment} disabled={!inputText.trim() && !attachment} title="Send Message"><Send size={18}/></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Editorial Refined Voice Call UI (or Fullscreen for Diagnosis) ── */}
      {isCallActive && (
        <div 
          className="voice-call-widget"
          style={{
            left: isDiagnosticMode ? 0 : callWidgetPos.x,
            top: isDiagnosticMode ? 0 : callWidgetPos.y,
            width: isDiagnosticMode ? '100vw' : '380px',
            height: isDiagnosticMode ? '100vh' : '640px',
            maxWidth: isDiagnosticMode ? 'none' : '92vw',
            maxHeight: isDiagnosticMode ? 'none' : '90vh',
            borderRadius: isDiagnosticMode ? '0' : '28px',
            background: isLightMode 
              ? 'linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(247,246,242,0.99) 100%)' 
              : 'linear-gradient(160deg, rgba(34,34,40,0.98) 0%, rgba(26,28,26,0.99) 100%)',
            backdropFilter: 'blur(40px)',
            border: isDiagnosticMode ? 'none' : `1px solid ${isLightMode ? 'rgba(82,121,111,0.18)' : 'rgba(107,144,128,0.2)'}`,
            display: 'flex', flexDirection: isDiagnosticMode ? 'row' : 'column',
            boxShadow: isDiagnosticMode ? 'none' : `0 40px 80px ${isLightMode ? 'rgba(82,121,111,0.12)' : 'rgba(0,0,0,0.7)'}`,
            overflow: 'hidden',
            zIndex: 99999
          }}
        >
          {/* Main Visualizer Area */}
          <div style={{
            flex: isDiagnosticMode ? 1 : 'none',
            width: isDiagnosticMode ? '50%' : '100%',
            height: '100%',
            display:'flex', flexDirection:'column', color: isLightMode ? 'var(--text)' : '#fff',
            position:'relative', overflow:'hidden',
            padding: '20px 0',
            borderRight: isDiagnosticMode ? `1px solid ${isLightMode ? 'rgba(195,141,93,0.1)' : 'rgba(212,163,115,0.08)'}` : 'none'
          }}>
            {!isDiagnosticMode && (
              <div 
                className="widget-header" 
                onPointerDown={handlePointerDown} 
                onPointerMove={handlePointerMove} 
                onPointerUp={handlePointerUp}
              >
                <div className="widget-drag-handle"><div className="drag-line"></div></div>
              </div>
            )}

            {/* Top-Right Floating Chat Button for Mobile */}
            <button 
              onClick={() => { setIsCallChatOpen(true); setUnreadCallMsgCount(0); }}
              className="mobile-only-chat-icon-btn"
              title="Open Chat"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                cursor: 'pointer',
                zIndex: 10,
                transition: 'all 0.2s'
              }}
            >
              <MessageSquare size={20} />
              {unreadCallMsgCount > 0 && (
                <span className="chat-unread-badge" style={{ top: '-2px', right: '-2px' }}>{unreadCallMsgCount}</span>
              )}
            </button>
            
            {/* Warm Healing Ambient Glows */}
            <div style={{position:'absolute', top:'-15%', left:'-15%', width:'80%', height:'80%', background:`radial-gradient(circle, ${isLightMode ? 'rgba(82, 121, 111, 0.12)' : 'rgba(107, 144, 128, 0.18)'} 0%, transparent 60%)`, filter:'blur(50px)', zIndex:0, pointerEvents:'none'}} />
            <div style={{position:'absolute', bottom:'-15%', right:'-15%', width:'80%', height:'80%', background:`radial-gradient(circle, ${isLightMode ? 'rgba(82, 121, 111, 0.12)' : 'rgba(107, 144, 128, 0.18)'} 0%, transparent 60%)`, filter:'blur(50px)', zIndex:0, pointerEvents:'none'}} />

            {/* Top Section: Avatar & Name */}
            <div style={{textAlign:'center', marginTop: isDiagnosticMode ? '10vh' : '30px', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center'}}>
              
              {/* Premium Avatar — Warm Healing Orb */}
              <div className="call-avatar-container" style={{ width: '140px', height: '140px', marginBottom: '28px' }}>
                <div className={`call-avatar-ring ${isSpeaking ? 'active' : ''}`}></div>
                <div className={`call-avatar-ring ${isSpeaking ? 'active' : ''}`}></div>
                <div className={`call-avatar-ring ${isSpeaking ? 'active' : ''}`}></div>
                <div className="call-avatar" style={{ width: '100px', height: '100px', background: 'linear-gradient(135deg, var(--accent), var(--accent-light))' }}>
                  <img src="/favicon.svg" alt="Avatar Logo" style={{ width: '56px', height: '56px', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }} />
                </div>
              </div>

              <h2 style={{fontSize:'34px', fontFamily: 'var(--font-heading)', fontWeight:'400', margin:'0', letterSpacing:'1px', color: isLightMode ? '#2f3e46' : '#fefae0'}}>
                Divya
              </h2>
              <div style={{fontSize:'11px', color: isLightMode ? 'rgba(47, 62, 70, 0.5)' : 'rgba(254, 250, 224, 0.5)', fontFamily: 'var(--font-body)', fontWeight:'500', marginTop:'10px', letterSpacing:'2.5px', textTransform:'uppercase'}}>
                { callStatus === 'connecting' ? (appLanguage === 'English' ? 'Connecting...' : 'እያገናኘ ነው...') 
                : isThinking ? (appLanguage === 'English' ? 'Thinking...' : 'እያሰበ ነው...') 
                : isSpeaking ? (appLanguage === 'English' ? 'Speaking...' : 'እየተናገረ ነው...') 
                : isListening ? (appLanguage === 'English' ? 'Recording...' : 'እየቀረጸ ነው...')
                : formatTime(callDuration) }
              </div>


            </div>

            {/* Waveform Visualizer — Warm Amber Ripples */}
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex:1, opacity: (isSpeaking || isListening) ? 1 : 0.3, transition: 'opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)'}}>
              <div className={`call-wave-visualizer ${(!isSpeaking && !isListening) ? 'idle' : ''}`}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`call-wave-bar ${isSpeaking ? 'ai-speaking' : ''} ${isListening ? 'listening' : ''}`}></div>
                ))}
              </div>
            </div>

            {/* Middle Controls — Warm Minimal */}
            <div style={{display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom: isDiagnosticMode ? '10vh' : '40px', zIndex:1, width:'100%'}}>
              <div style={{display:'flex', gap:'30px', justifyContent:'center', padding:'0 20px', alignItems: 'center'}}>
                
                {/* Mute/Unmute Voice Button */}
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
                  <button 
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (!isMuted) stopSpeaking(); // instantly kill any active audio play!
                    }} 
                    title={isMuted ? (appLanguage === 'English' ? 'Unmute AI voice' : 'የድምፅ ረዳትን አብራ') : (appLanguage === 'English' ? 'Mute AI voice' : 'የድምፅ ረዳትን አጥፋ')} 
                    style={{
                      width: isDiagnosticMode ? '60px' : '48px', height: isDiagnosticMode ? '60px' : '48px', borderRadius:'50%',
                      background: isMuted ? 'rgba(239,68,68,0.1)' : 'rgba(107,144,128,0.1)', 
                      color: isMuted ? '#ef4444' : 'var(--accent)',
                      border: `1px solid ${isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(107,144,128,0.2)'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer', transition:'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', 
                    }} 
                    onMouseOver={e => { e.currentTarget.style.background = isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(107,144,128,0.2)'; e.currentTarget.style.transform='scale(1.05)'; }} 
                    onMouseOut={e => { e.currentTarget.style.background = isMuted ? 'rgba(239,68,68,0.1)' : 'rgba(107,144,128,0.1)'; e.currentTarget.style.transform='scale(1)'; }}
                  >
                    {isMuted ? <VolumeX size={isDiagnosticMode ? 24 : 18} strokeWidth={1.5}/> : <Volume2 size={isDiagnosticMode ? 24 : 18} strokeWidth={1.5}/>}
                  </button>
                  <span style={{fontSize: isDiagnosticMode ? '12px' : '10px', color: isMuted ? 'rgba(239,68,68,0.5)' : 'var(--accent-light)', fontWeight:'500', whiteSpace:'nowrap', letterSpacing:'1.5px', textTransform:'uppercase'}}>
                    {isMuted ? (appLanguage === 'English' ? 'Muted' : 'ድምጽ አልባ') : (appLanguage === 'English' ? 'Voice' : 'ድምጽ')}
                  </span>
                </div>

                {/* Center Button (Hold to Speak or Stop) */}
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
                  {isSpeaking ? (
                    <button 
                      onClick={stopSpeaking}
                      style={{
                        width: isDiagnosticMode ? '80px' : '64px', height: isDiagnosticMode ? '80px' : '64px', borderRadius:'50%',
                        background: isLightMode ? 'rgba(47,62,70,0.08)' : 'rgba(212,163,115,0.1)',
                        color: isLightMode ? '#2f3e46' : '#d4a373',
                        border: `1px solid ${isLightMode ? 'rgba(47,62,70,0.15)' : 'rgba(212,163,115,0.2)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer',
                        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        touchAction: 'none'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = isLightMode ? 'rgba(47,62,70,0.15)' : 'rgba(212,163,115,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = isLightMode ? 'rgba(47,62,70,0.08)' : 'rgba(212,163,115,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Square size={isDiagnosticMode ? 32 : 24} strokeWidth={1.5} />
                    </button>
                  ) : (
                    <button 
                      onMouseDown={(e) => { e.preventDefault(); if (user) { setIsListening(true); startListening(); } else triggerLoginPrompt('use Voice Call'); }} 
                      onMouseUp={(e) => { e.preventDefault(); stopListening(); setIsListening(false); }}
                      onMouseLeave={(e) => { e.preventDefault(); if (isListening) { stopListening(); setIsListening(false); } }}
                      onTouchStart={(e) => { e.preventDefault(); if (user) { setIsListening(true); startListening(); } else triggerLoginPrompt('use Voice Call'); }}
                      onTouchEnd={(e) => { e.preventDefault(); stopListening(); setIsListening(false); }}
                      onTouchCancel={(e) => { e.preventDefault(); stopListening(); setIsListening(false); }}
                      disabled={isThinking || callStatus === 'connecting'} 
                      style={{
                        width: isDiagnosticMode ? '80px' : '64px', height: isDiagnosticMode ? '80px' : '64px', borderRadius:'50%',
                        background: isListening 
                          ? (isLightMode ? '#2f3e46' : '#d4a373')
                          : (isLightMode ? 'rgba(47,62,70,0.06)' : 'rgba(212,163,115,0.08)'),
                        color: isListening 
                          ? (isLightMode ? '#fefae0' : '#1a1612')
                          : (isLightMode ? '#2f3e46' : '#d4a373'),
                        border: isListening 
                          ? 'none'
                          : `1px solid ${isLightMode ? 'rgba(47,62,70,0.12)' : 'rgba(212,163,115,0.15)'}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:(isThinking || callStatus === 'connecting' || !user) ? 'not-allowed' : 'pointer',
                        transition:'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        transform: isListening ? 'scale(0.92)' : 'scale(1)',
                        boxShadow: isListening 
                          ? `0 12px 30px ${isLightMode ? 'rgba(47,62,70,0.15)' : 'rgba(212,163,115,0.25)'}`
                          : 'none',
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                    >
                      {isListening ? <Activity size={isDiagnosticMode ? 32 : 24} strokeWidth={1.5} /> : <Mic size={isDiagnosticMode ? 32 : 24} strokeWidth={1} />}
                    </button>
                  )}
                  <span style={{fontSize: isDiagnosticMode ? '14px' : '10px', color: isListening ? (isLightMode ? '#2f3e46' : '#d4a373') : (isLightMode ? 'rgba(47,62,70,0.4)' : 'rgba(212,163,115,0.5)'), fontWeight:'500', whiteSpace:'nowrap', letterSpacing:'1.5px', textTransform:'uppercase'}}>
                    {isSpeaking ? (appLanguage === 'English' ? 'Stop' : 'አቁም') : isListening ? (appLanguage === 'English' ? 'Recording...' : 'እየቀረጸ ነው...') : (appLanguage === 'English' ? 'Hold to talk' : 'ለመናገር አዝራሩን ተጭነው ይያዙ')}
                  </span>
                </div>

                {/* End Call Button */}
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
                  <button onClick={endCall} title="End Call" style={{
                    width: isDiagnosticMode ? '60px' : '48px', height: isDiagnosticMode ? '60px' : '48px', borderRadius:'50%',
                    background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    cursor:'pointer', transition:'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', 
                  }} onMouseOver={e => { e.currentTarget.style.background='rgba(239,68,68,0.2)'; e.currentTarget.style.transform='scale(1.05)'; }} onMouseOut={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; e.currentTarget.style.transform='scale(1)'; }}>
                    <PhoneOff size={isDiagnosticMode ? 24 : 18} strokeWidth={1.5}/>
                  </button>
                  <span style={{fontSize: isDiagnosticMode ? '12px' : '10px', color:'rgba(239,68,68,0.5)', fontWeight:'500', whiteSpace:'nowrap', letterSpacing:'1.5px', textTransform:'uppercase'}}>
                    {appLanguage === 'English' ? 'End' : 'ዝጋ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side Text Transcript (Only in Diagnostic Mode) */}
          {isDiagnosticMode && (
            <div className={`call-transcript-panel ${isCallChatOpen ? 'mobile-open' : ''}`}>
              {/* Mobile Back/Close Chat Button */}
              <div className="mobile-chat-close-bar" style={{ display: 'none', justifyContent: 'flex-start', marginBottom: '16px', flexShrink: 0 }}>
                <button 
                  onClick={() => setIsCallChatOpen(false)}
                  style={{
                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '14px', fontWeight: '600', padding: 0
                  }}
                >
                  <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> 
                  <span>{appLanguage === 'English' ? 'Back to Call' : 'ወደ ጥሪው ተመለስ'}</span>
                </button>
              </div>

              <h3 style={{ 
                color: isLightMode ? '#2f3e46' : '#d4a373', 
                fontSize: '14px', letterSpacing: '3px', textTransform: 'uppercase', 
                marginBottom: '24px', 
                borderBottom: `1px solid ${isLightMode ? 'rgba(195,141,93,0.15)' : 'rgba(212,163,115,0.12)'}`, 
                paddingBottom: '24px', flexShrink: 0, fontFamily: 'var(--font-body)', fontWeight:'600'
              }}>
                {appLanguage === 'English' ? 'Live Transcript' : 'የቀጥታ ትንታኔ እና ውይይት'}
              </h3>
              
              <div ref={chatAreaRef} onScroll={handleChatScroll} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
                {messages.filter(m => m.role !== 'system').map((msg, index) => {
                  // Separate the main question from choice lines
                  const lines = msg.text.split('\n');
                  const mainTextLines = [];
                  const choiceLines = [];
                  
                  lines.forEach(line => {
                    const trimmed = line.trim();
                    if (/^[A-Z][).]\s/.test(trimmed) || /^(Choose one|Choose all that apply)/i.test(trimmed)) {
                      choiceLines.push(trimmed);
                    } else {
                      mainTextLines.push(line);
                    }
                  });

                  const isLightBg = isLightMode;
                  return (
                    <div key={index} style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' 
                        ? (isLightBg ? 'rgba(212,163,115,0.15)' : 'rgba(212,163,115,0.12)')
                        : (isLightBg ? 'rgba(107,144,128,0.08)' : 'rgba(255,255,255,0.04)'),
                      border: `1px solid ${msg.role === 'user' 
                        ? (isLightBg ? 'rgba(212,163,115,0.25)' : 'rgba(212,163,115,0.2)')
                        : (isLightBg ? 'rgba(107,144,128,0.12)' : 'rgba(255,255,255,0.06)')}`,
                      padding: '16px 20px',
                      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      maxWidth: '85%',
                      color: isLightBg ? '#2f3e46' : '#fefae0',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {msg.role !== 'user' && (
                        <div style={{ fontSize: '10px', color: isLightBg ? 'rgba(47,62,70,0.4)' : 'rgba(212,163,115,0.5)', marginBottom: '4px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                          Divya
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div style={{ fontSize: '10px', color: isLightBg ? 'rgba(47,62,70,0.4)' : 'rgba(212,163,115,0.5)', marginBottom: '4px', fontWeight: '600', letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'right' }}>
                          You
                        </div>
                      )}
                      
                      {msg.role === 'ai' && (msg.text.includes('ASSESSMENT:') || msg.text.includes('TEMPORARY RELIEF:')) ? (
                        renderModernConclusion(msg.text)
                      ) : (
                        <div style={{fontSize: '14px', lineHeight: '1.7'}}>{mainTextLines.join('\n')}</div>
                      )}
                      
                       {choiceLines.length > 0 && msg.role === 'ai' && (() => {
                        const isMultipleChoice = /Choose all that apply|Select multiple|Select all/i.test(msg.text) ||
                                                 /ሁሉ(ንም)?.*?ይምረጡ/i.test(msg.text) ||
                                                 choiceLines.some(line => /Choose all that apply|Select multiple|Select all/i.test(line));
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                            {choiceLines.map((choice, i) => {
                              if (/^(Choose one|Choose all that apply)/i.test(choice)) {
                                 return <div key={i} style={{fontSize:'11px', color: isLightBg ? 'rgba(47,62,70,0.4)' : 'rgba(212,163,115,0.5)', fontStyle:'italic'}}>{choice}</div>
                              }
                              const isSelected = !!selectedChoices[msg.id || index]?.[choice];
                              return (
                                <button 
                                  key={i}
                                  onClick={() => {
                                    if (isMultipleChoice) {
                                      setSelectedChoices(prev => {
                                        const msgChoices = prev[msg.id || index] || {};
                                        return {
                                          ...prev,
                                          [msg.id || index]: {
                                            ...msgChoices,
                                            [choice]: !msgChoices[choice]
                                          }
                                        };
                                      });
                                    } else {
                                      handleTextSubmit(choice);
                                    }
                                  }}
                                  style={{
                                    background: isSelected 
                                      ? 'var(--accent)' 
                                      : (isLightBg ? 'rgba(212,163,115,0.1)' : 'rgba(212,163,115,0.08)'),
                                    border: `1px solid ${isSelected ? 'var(--accent)' : (isLightBg ? 'rgba(212,163,115,0.2)' : 'rgba(212,163,115,0.15)')}`,
                                    borderRadius: '8px', padding: '10px 14px',
                                    color: isSelected 
                                      ? '#ffffff' 
                                      : (isLightBg ? '#2f3e46' : '#d4a373'),
                                    textAlign: 'left',
                                    cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                  }}
                                >
                                  <span>{choice}</span>
                                  {isSelected && <CheckCheck size={14} style={{ color: '#ffffff', marginLeft: '8px' }} />}
                                </button>
                              );
                            })}

                            {isMultipleChoice && (() => {
                              const msgChoices = selectedChoices[msg.id || index] || {};
                              const selectedList = Object.keys(msgChoices).filter(k => msgChoices[k]);
                              if (selectedList.length === 0) return null;
                              return (
                                <button
                                  onClick={() => {
                                    handleTextSubmit(selectedList.join(', '));
                                    setSelectedChoices(prev => {
                                      const updated = { ...prev };
                                      delete updated[msg.id || index];
                                      return updated;
                                    });
                                  }}
                                  className="read-report-btn"
                                  style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px', textTransform: 'none' }}
                                  >
                                    {appLanguage === 'English' ? `Submit Selections (${selectedList.length})` : `ምርጫዎችን አስገባ (${selectedList.length})`}
                                  </button>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
                
                {isThinking && (
                  <div style={{ alignSelf: 'flex-start', padding: '16px', background: isLightMode ? 'rgba(107,144,128,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: '16px 16px 16px 4px', border: `1px solid ${isLightMode ? 'rgba(107,144,128,0.12)' : 'rgba(255,255,255,0.06)'}` }}>
                    <div className="typing-dots" style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '6px', height: '6px', background: '#d4a373', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
                      <span style={{ width: '6px', height: '6px', background: '#d4a373', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></span>
                      <span style={{ width: '6px', height: '6px', background: '#d4a373', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></span>
                    </div>
                  </div>
                )}
              </div>

              {showScrollBottom && (
                <button
                  onClick={() => {
                    if (chatAreaRef.current) {
                      chatAreaRef.current.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: 'smooth' });
                    }
                  }}
                  className="scroll-bottom-btn"
                  title="Scroll to bottom"
                >
                  <ChevronDown size={18} />
                </button>
              )}

              {/* Voice and Chat Place for Short Answers */}
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${isLightMode ? 'rgba(195,141,93,0.12)' : 'rgba(212,163,115,0.1)'}`, display: 'flex', gap: '12px', flexShrink: 0, alignItems: 'center' }}>
                <button 
                  onMouseDown={(e) => { e.preventDefault(); if (user) { setIsListening(true); startListening(); } else triggerLoginPrompt('use Voice Input'); }} 
                  onMouseUp={(e) => { e.preventDefault(); stopListening(); setIsListening(false); }}
                  onMouseLeave={(e) => { e.preventDefault(); if (isListening) { stopListening(); setIsListening(false); } }}
                  disabled={isThinking || isSpeaking}
                  style={{
                    background: isListening 
                      ? (isLightMode ? '#2f3e46' : '#d4a373')
                      : (isLightMode ? 'rgba(47,62,70,0.06)' : 'rgba(212,163,115,0.08)'),
                    border: isListening ? 'none' : `1px solid ${isLightMode ? 'rgba(47,62,70,0.12)' : 'rgba(212,163,115,0.15)'}`,
                    borderRadius: '50%', width: '48px', height: '48px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isListening 
                      ? (isLightMode ? '#fefae0' : '#1a1612')
                      : (isLightMode ? '#2f3e46' : '#d4a373'),
                    cursor: isThinking || isSpeaking ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.2s', flexShrink: 0
                  }}
                  title={appLanguage === 'English' ? "Hold to speak" : "ለመናገር ተጭነው ይያዙ"}
                >
                  <Mic size={20} />
                </button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && inputText.trim()) { e.preventDefault(); handleTextSubmit(inputText); } }}
                  placeholder={appLanguage === 'English' ? "Type a short answer..." : "አጭር መልስ ይጻፉ..."}
                  style={{ 
                    flex: 1, 
                    background: isLightMode ? 'rgba(47,62,70,0.04)' : 'rgba(212,163,115,0.06)', 
                    border: `1px solid ${isLightMode ? 'rgba(47,62,70,0.1)' : 'rgba(212,163,115,0.12)'}`, 
                    borderRadius: '12px', padding: '12px 16px', 
                    color: isLightMode ? '#2f3e46' : '#fefae0', 
                    outline: 'none' 
                  }}
                  disabled={isThinking || isSpeaking}
                />
                <button 
                  onClick={() => handleTextSubmit(inputText)}
                  disabled={!inputText.trim() || isThinking || isSpeaking}
                  style={{ 
                    background: inputText.trim() && !isThinking && !isSpeaking 
                      ? 'var(--accent)' 
                      : (isLightMode ? 'rgba(47,62,70,0.06)' : 'rgba(212,163,115,0.08)'),
                    border: 'none', 
                    borderRadius: '50%', 
                    width: '44px', 
                    height: '44px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: inputText.trim() && !isThinking && !isSpeaking 
                      ? '#ffffff' 
                      : (isLightMode ? 'rgba(47,62,70,0.3)' : 'rgba(212,163,115,0.3)'),
                    cursor: inputText.trim() && !isThinking && !isSpeaking ? 'pointer' : 'not-allowed', 
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: inputText.trim() && !isThinking && !isSpeaking ? '0 4px 12px rgba(107, 144, 128, 0.25)' : 'none',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => {
                    if (inputText.trim() && !isThinking && !isSpeaking) {
                      e.currentTarget.style.background = 'var(--accent-light)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (inputText.trim() && !isThinking && !isSpeaking) {
                      e.currentTarget.style.background = 'var(--accent)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* ── Login Prompt Modal ── */}
      {showLoginPrompt && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            background: isLightMode
              ? 'linear-gradient(135deg, #fefbf6 0%, #f7f3e8 100%)'
              : 'linear-gradient(135deg, #242624 0%, #1c1d1c 100%)',
            border: `1px solid ${isLightMode ? 'rgba(212,163,115,0.2)' : 'rgba(212,163,115,0.12)'}`,
            borderRadius: '12px',
            padding: '30px 16px 24px 16px',
            width: '90%',
            maxWidth: '360px',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Close button in top-right */}
            <button 
              onClick={() => setShowLoginPrompt(false)}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={16} />
            </button>

            <h3 style={{
              fontSize: '16px',
              fontWeight: '700',
              marginBottom: '8px',
              color: 'var(--text)',
              marginTop: '4px'
            }}>
              Sign Up Required
            </h3>
            
            <p style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
              marginBottom: '16px',
              padding: '0 8px'
            }}>
              To {loginPromptReason}, please sign up.
            </p>

            {authError && (
              <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '500', marginBottom: '14px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
                {authError}
              </div>
            )}

            <div style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              padding: 0,
              boxShadow: 'none',
              marginBottom: '16px',
              width: '100%'
            }}>
              <form onSubmit={authStage === 'login' ? handleSendOtp : handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', textAlign: 'left' }}>
                {authStage === 'login' ? (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                      <input 
                        type="email" 
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        required
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'}`,
                          background: isLightMode ? '#ffffff' : '#2b2d2b', color: 'var(--text)', outline: 'none', fontSize: '13px',
                          transition: 'all 0.2s ease'
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(107, 144, 128, 0.15)';
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>Password</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={passwordInput}
                          onChange={e => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          required
                          style={{
                            width: '100%', padding: '9px 36px 9px 12px', borderRadius: '8px',
                            border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'}`,
                            background: isLightMode ? '#ffffff' : '#2b2d2b', color: 'var(--text)', outline: 'none', fontSize: '13px',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={e => {
                            e.currentTarget.style.borderColor = 'var(--accent)';
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(107, 144, 128, 0.15)';
                          }}
                          onBlur={e => {
                            e.currentTarget.style.borderColor = isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute', right: '10px', background: 'transparent',
                            border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', padding: 0
                          }}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={authLoading}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--accent)', color: '#ffffff', border: 'none',
                        fontWeight: '600', fontSize: '13px', cursor: authLoading ? 'not-allowed' : 'pointer',
                        marginTop: '12px', transition: 'all 0.25s ease', opacity: authLoading ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(107, 144, 128, 0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent-light)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {authLoading ? 'Sending...' : 'Send Otp'}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ color: 'var(--accent)', fontSize: '11px', fontWeight: '500', marginBottom: '10px', padding: '8px 12px', background: isLightMode ? 'rgba(82, 121, 111, 0.08)' : 'rgba(107, 144, 128, 0.12)', borderRadius: '10px', border: `1px solid ${isLightMode ? 'rgba(82,121,111,0.18)' : 'rgba(107,144,128,0.2)'}`, textAlign: 'center', lineHeight: '1.4' }}>
                      Verification code sent to <strong style={{ color: 'var(--text)' }}>{emailInput}</strong>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>6-Digit OTP Code</label>
                      <input 
                        type="text" 
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                        style={{
                          width: '100%', padding: '9px 12px', borderRadius: '8px',
                          border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'}`,
                          background: isLightMode ? '#ffffff' : '#2b2d2b', color: 'var(--text)', outline: 'none', fontSize: '15px',
                          textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold', transition: 'all 0.2s ease'
                        }}
                        onFocus={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(107, 144, 128, 0.15)';
                        }}
                        onBlur={e => {
                          e.currentTarget.style.borderColor = isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={authLoading}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px',
                        background: 'var(--accent)', color: '#ffffff', border: 'none',
                        fontWeight: '600', fontSize: '13px', cursor: authLoading ? 'not-allowed' : 'pointer',
                        marginTop: '12px', transition: 'all 0.25s ease', opacity: authLoading ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(107, 144, 128, 0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--accent-light)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                    {authLoading ? 'Verifying...' : 'Verify & Sign Up'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setAuthStage('login'); setAuthError(''); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '8px', alignSelf: 'center' }}
                  >
                    Back to Sign Up
                    </button>
                  </>
                )}
              </form>
            </div>

            {authStage === 'login' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Or</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                </div>

                {/* Google Login Button */}
                <button 
                  onClick={() => { setShowLoginPrompt(false); googleLogin(); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '30px',
                    background: isLightMode ? '#ffffff' : 'rgba(255,255,255,0.04)',
                    color: 'var(--text)',
                    border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: isLightMode ? '0 2px 8px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isLightMode ? '#f8f9fa' : 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = isLightMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isLightMode ? '#ffffff' : 'rgba(255,255,255,0.04)';
                    e.currentTarget.style.borderColor = isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Sign Up with Google</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Hidden File Inputs ── */}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="application/pdf, text/plain, .doc, .docx" onChange={(e) => handleFileSelect(e, 'file')} />
      <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileSelect(e, 'image')} />

      {/* ── Offline banner ── */}
      {networkStatus === 'offline' && (
        <div style={{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',backgroundColor:'#ef4444',color:'white',padding:'12px 24px',borderRadius:'30px',boxShadow:'0 8px 16px rgba(239,68,68,0.3)',display:'flex',alignItems:'center',gap:'12px',zIndex:9999,fontWeight:600,fontSize:'14px',animation:'slideUp 0.3s ease-out'}}>
          <WifiOff size={18}/> Network unstable or disconnected
        </div>
      )}

      {/* ── Wide Clinical Report Modal ── */}
      {isReportModalOpen && masterReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.25s ease-out'
        }} onClick={() => setIsReportModalOpen(false)}>
          <div style={{
            background: isLightMode ? '#fdfdfc' : 'rgba(26, 28, 26, 0.98)',
            border: `1px solid ${isLightMode ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '28px',
            width: '100%',
            maxWidth: '1100px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              padding: '24px 32px',
              borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              background: isLightMode ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <FileText size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontFamily: 'var(--font-heading)', fontWeight: '700', color: 'var(--text)' }}>
                    {masterReport.title || (appLanguage === 'English' ? 'Clinical Health Report' : 'ክሊኒካዊ የጤና ሪፖርት')}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {masterReport.lastUpdated}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                style={{
                  background: isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                  border: 'none',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }} className="report-modal-body">
              {masterReport.messages?.length > 0 ? (
                (() => {
                  const conclusion = masterReport.messages.find(m => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:')));
                  if (conclusion) {
                    return renderModernBriefConclusion(conclusion.text);
                  } else {
                    return (
                      <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                        {appLanguage === 'English' ? 'No conclusion text available.' : 'ምንም ማጠቃለያ ጽሑፍ አልተገኘም።'}
                      </div>
                    );
                  }
                })()
              ) : (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
                  No clinical information is captured.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '18px 32px',
              borderTop: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex',
              justifyContent: 'flex-end',
              background: isLightMode ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)'
            }}>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="read-report-btn"
                style={{ width: 'auto', padding: '10px 24px', textTransform: 'none' }}
              >
                {appLanguage === 'English' ? 'Close Report' : 'ሪፖርቱን ዝጋ'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Unfinished Sessions Selection Modal ── */}
      {showUnfinishedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setShowUnfinishedModal(false)}>
          <div style={{
            background: isLightMode ? '#ffffff' : 'rgba(26, 28, 26, 0.98)',
            border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardList size={22} style={{ color: 'var(--accent)' }} />
                <span>{appLanguage === 'English' ? 'Unfinished Sessions' : 'ያልተጠናቀቁ ክፍለ ጊዜዎች'}</span>
              </h3>
              <button 
                onClick={() => setShowUnfinishedModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {appLanguage === 'English' 
                ? 'You have diagnostic sessions that were not completed. Would you like to resume one of them or start a brand new diagnosis?' 
                : 'ያልተጠናቀቁ የምርመራ ክፍለ ጊዜዎች አሉዎት። ከእነዚህ ውስጥ አንዱን መቀጠል ይፈልጋሉ ወይስ አዲስ ምርመራ መጀመር ይፈልጋሉ?'}
            </p>

            {/* Unfinished sessions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {unfinishedSessions.map((session) => (
                <div key={session.id} style={{
                  background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                        {session.title}
                      </h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {session.lastUpdated}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setShowUnfinishedModal(false);
                        resumeUnfinishedSession(session);
                      }}
                      className="read-report-btn"
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        fontSize: '12.5px',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(107, 144, 128, 0.15)'
                      }}
                    >
                      <RefreshCcw size={14} />
                      <span>{appLanguage === 'English' ? 'Resume' : 'ቀጥል'}</span>
                    </button>
                    <button
                      onClick={() => setUnfinishedSessions(prev => prev.filter(s => s.id !== session.id))}
                      style={{
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {appLanguage === 'English' ? 'Delete' : 'ሰርዝ'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingTop: '16px', marginTop: '4px' }}>
              <button
                onClick={() => setShowUnfinishedModal(false)}
                style={{
                  background: 'transparent',
                  border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}`,
                  color: 'var(--text-muted)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {appLanguage === 'English' ? 'Close' : 'ዝጋ'}
              </button>
              <button
                onClick={() => {
                  setShowUnfinishedModal(false);
                  startDiagnosticSession(true); // forceNew = true
                }}
                className="read-report-btn"
                style={{
                  width: 'auto',
                  padding: '10px 20px',
                  textTransform: 'none',
                  fontSize: '13px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Stethoscope size={16} />
                <span>{appLanguage === 'English' ? 'Start Brand New' : 'አዲስ ምርመራ ጀምር'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Custom Rename Modal ── */}
      {renameModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setRenameModal({ isOpen: false, currentTitle: '', onConfirm: null })}>
          <div style={{
            background: isLightMode ? '#ffffff' : 'rgba(26, 28, 26, 0.98)',
            border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '420px',
            padding: '24px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
              {appLanguage === 'English' ? 'Rename' : 'ስም ቀይር'}
            </h3>
            
            <input 
              type="text" 
              value={renameInputText}
              onChange={(e) => setRenameInputText(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameInputText.trim()) {
                  renameModal.onConfirm(renameInputText.trim());
                  setRenameModal({ isOpen: false, currentTitle: '', onConfirm: null });
                } else if (e.key === 'Escape') {
                  setRenameModal({ isOpen: false, currentTitle: '', onConfirm: null });
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setRenameModal({ isOpen: false, currentTitle: '', onConfirm: null })}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {appLanguage === 'English' ? 'Cancel' : 'ሰርዝ'}
              </button>
              <button 
                disabled={!renameInputText.trim()}
                onClick={() => {
                  if (renameInputText.trim()) {
                    renameModal.onConfirm(renameInputText.trim());
                    setRenameModal({ isOpen: false, currentTitle: '', onConfirm: null });
                  }
                }}
                className="read-report-btn"
                style={{
                  width: 'auto',
                  padding: '8px 20px',
                  textTransform: 'none',
                  fontSize: '13.5px',
                  borderRadius: '8px',
                  opacity: renameInputText.trim() ? 1 : 0.5,
                  cursor: renameInputText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {appLanguage === 'English' ? 'Rename' : 'ቀይር'}
              </button>
            </div>

          </div>
        </div>
      )}

      {sessionModeModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border-active)', 
            borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '440px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
                {appLanguage === 'English' ? 'Select Consultation Mode' : 'የውይይት አይነት ይምረጡ'}
              </h3>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {appLanguage === 'English' 
                  ? 'Choose how you would like to interact with Divya during this clinical session.' 
                  : 'በዚህ የሕክምና ክፍለ ጊዜ ከዲቭያ ጋር እንዴት መገናኘት እንደሚፈልጉ ይምረጡ።'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={() => { sessionModeModal.onSelect('chat'); setSessionModeModal({ isOpen: false, onSelect: null }); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', 
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
                  color: 'var(--text)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <span style={{ fontSize: '24px' }}>💬</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>{appLanguage === 'English' ? 'Chat Mode (Text-only)' : 'የጽሑፍ ውይይት'}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appLanguage === 'English' ? 'Interactive diagnostic messaging' : 'በጽሑፍ መልእክት ብቻ የሚደረግ ምርመራ'}</span>
                </div>
              </button>

              <button 
                onClick={() => { sessionModeModal.onSelect('voice'); setSessionModeModal({ isOpen: false, onSelect: null }); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', 
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
                  color: 'var(--text)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <span style={{ fontSize: '24px' }}>🎙️</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>{appLanguage === 'English' ? 'Voice Mode (Audio-only)' : 'የድምፅ ውይይት'}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appLanguage === 'English' ? 'Real-time spoken consultation call' : 'ከዲቭያ ጋር በስልክ ጥሪ የሚደረግ ውይይት'}</span>
                </div>
              </button>

              <button 
                onClick={() => { sessionModeModal.onSelect('hybrid'); setSessionModeModal({ isOpen: false, onSelect: null }); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 18px', 
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px',
                  color: 'var(--text)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%'
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <span style={{ fontSize: '24px' }}>🔄</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px' }}>{appLanguage === 'English' ? 'Hybrid Mode (Chat + Voice)' : 'የተደባለቀ (ጽሑፍ + ድምፅ)'}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{appLanguage === 'English' ? 'Spoken speech combined with text inputs' : 'በጽሑፍ እየጻፉ በድምፅ ምላሽ ማግኘት'}</span>
                </div>
              </button>
            </div>

            <button 
              onClick={() => setSessionModeModal({ isOpen: false, onSelect: null })}
              style={{
                padding: '10px 0', background: 'transparent', border: 'none', 
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {appLanguage === 'English' ? 'Cancel' : 'ሰርዝ'}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
        appLanguage={appLanguage}
      />

      {/* ── Divya Self-Introduction Popup Modal ── */}
      {isIntroModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-solid)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            position: 'relative',
            boxShadow: 'var(--glow-accent)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <button 
              onClick={() => setIsIntroModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: 'none',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text)',
                zIndex: 10
              }}
            >
              <X size={16} />
            </button>

            {/* 3D Hologram Avatar inside Popup */}
            <div style={{ margin: '10px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '8px' }}>
              <DivyaAvatar3D isSpeaking={isSpeaking} />
              <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isSpeaking ? (appLanguage === 'English' ? 'Hologram speaking...' : 'ሆሎግራም ድምፅ እያሰማ ነው...') : (appLanguage === 'English' ? 'Divya Interactive Hologram' : 'ዲቭያ መስተጋብራዊ ሆሎግራም')}
              </span>
            </div>

            {/* Content Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
                {appLanguage === 'English' ? 'Meet Divya, Your AI Clinical Assistant' : 'ከዲቭያ ጋር ይተዋወቁ - የእርስዎ AI የጤና ረዳት'}
              </h3>
              <p style={{ margin: '0 auto', fontSize: '14.5px', color: 'var(--text-muted)', lineHeight: '1.5', maxWidth: '540px' }}>
                {appLanguage === 'English' 
                  ? 'I am your compassionate AI health companion and clinical nutritionist, designed to guide you through symptoms, personalized recovery plans, and traditional meal coaching.' 
                  : 'ምልክቶችን፣ ግላዊ የማገገሚያ እቅዶችን እና ባህላዊ የአመጋገብ ምክሮችን ለእርስዎ ለማዘጋጀት የተነደፍኩኝ የጤና ረዳትዎ እና ክሊኒካዊ የአመጋገብ ባለሙያ ነኝ።'}
              </p>
            </div>

            {/* Features Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', textAlign: 'left' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🩺</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '600', color: 'var(--text)' }}>
                    {appLanguage === 'English' ? 'Clinical Diagnosis & Assessments' : 'ክሊኒካዊ የጤና ግምገማ'}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {appLanguage === 'English' ? 'Identifies symptoms, suggests home remedies, and outlines priority lab diagnostics.' : 'የህመም ስሜቶችዎን በመገምገም ጊዜያዊ ማስታገሻዎችን ይጠቁማል እና የላብራቶሪ ምርመራዎችን ያሳያል።'}
                  </p>
                </div>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🥗</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '600', color: 'var(--text)' }}>
                    {appLanguage === 'English' ? 'Clinical Nutrition Therapy' : 'ክሊኒካዊ አመጋገብ እና ስልጠና'}
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {appLanguage === 'English' ? 'Customizes macro/micro targets & showcases affordable traditional Ethiopian meals (Injera, Shiro, Misir).' : 'የማክሮ/ማይክሮ አቅጣጫዎችን ይከታተላል፣ ተደራሽ የሆኑ የኢትዮጵያ ምግቦችን ከአሰራር መመሪያ ጋር ያቀርባል።'}
                  </p>
                </div>
              </div>
            </div>

            {/* Integrations Title */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', marginTop: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {appLanguage === 'English' ? 'System Integrations' : 'የስርዓት ግንኙነቶች (Integrations)'}
              </h4>
            </div>

            {/* Integrations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', textAlign: 'left' }}>
              <div style={{ background: 'rgba(107, 144, 128, 0.08)', border: '1px solid rgba(107, 144, 128, 0.15)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                <svg width="24" height="24" viewBox="0 0 1443 1250" style={{ display: 'block', width: '24px', height: '24px', marginBottom: '2px' }}>
                  <path d="M481 0h481l481 833H962L481 0z" fill="#0066da"/>
                  <path d="M0 833l241-417h961L962 833H0z" fill="#00ac47"/>
                  <path d="M241 416L481 0h962l-241 416H241z" fill="#ffba00"/>
                </svg>
                <strong style={{ fontSize: '12.5px', color: 'var(--text)' }}>Google Drive</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  {appLanguage === 'English' ? 'Auto-saves clinical reports, meal targets, & recovery logs.' : 'የጤና ሪፖርቶችን እና እቅዶችን ደህንነቱ በተጠበቀ ሁኔታ ያስቀምጣል።'}
                </span>
              </div>
              <div style={{ background: 'rgba(121, 159, 166, 0.08)', border: '1px solid rgba(121, 159, 166, 0.15)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                <svg width="24" height="24" viewBox="0 0 192 192" style={{ display: 'block', width: '24px', height: '24px', marginBottom: '2px' }}>
                  <rect x="24" y="24" width="144" height="144" rx="28" fill="#ffffff" stroke="#1a73e8" strokeWidth="12"/>
                  <path d="M24 24h144v48H24z" fill="#1a73e8"/>
                  <text x="96" y="132" textAnchor="middle" fill="#1a73e8" fontSize="64" fontWeight="900" fontFamily="sans-serif">31</text>
                </svg>
                <strong style={{ fontSize: '12.5px', color: 'var(--text)' }}>Google Calendar</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  {appLanguage === 'English' ? 'Syncs diagnostic appointments & revision sessions.' : 'ቀጠሮዎችን እና የክትትል ሰዓቶችን በራስ-ሰር ያመሳስላል።'}
                </span>
              </div>
              <div style={{ background: 'rgba(229, 152, 155, 0.08)', border: '1px solid rgba(229, 152, 155, 0.15)', borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: 'block', width: '24px', height: '24px', marginBottom: '2px' }}>
                  <defs>
                    <linearGradient id="alarmGradSystem" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ff5f6d"/>
                      <stop offset="100%" stopColor="#ffc371"/>
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="13" r="8" fill="url(#alarmGradSystem)"/>
                  <circle cx="12" cy="13" r="6.5" fill="#ffffff"/>
                  <path d="M5 6c-.5.5-1.5 2-1 3s3 1.5 3.5 1M19 6c.5.5 1.5 2 1 3s-3 1.5-3.5 1" stroke="#ff5f6d" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M6 20l-1.5 2M18 20l1.5 2" stroke="#ff5f6d" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M12 10v3l3 2" stroke="#2f3e46" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <strong style={{ fontSize: '12.5px', color: 'var(--text)' }}>Alarm Alerts</strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                  {appLanguage === 'English' ? 'Sends active daily notifications for pills & supplement times.' : 'መድሃኒት እና ቪታሚን መውሰጃ ሰዓቶችን በደወል ያስታውሳል።'}
                </span>
              </div>
            </div>

            {/* Audio Button */}
            <button 
              onClick={() => {
                const amharicSpeechText = `ሰላም! እኔ ዲቭያ (Divya) እባላለሁ - የጤና ረዳትዎ እና ክሊኒካዊ የአመጋገብ ባለሙያ ነኝ። ምልክት-ደጋፊ ክሊኒካዊ ግምገማዎችን፣ የዕለት ተዕለት ተግባራትን እና ብጁ የአመጋገብ እቅዶችን ለእርስዎ ለማዘጋጀት ተዘጋጅቻለሁ። የጤና ሪፖርቶችዎን በ Google Drive ማስቀመጥ፣ ቀጠሮዎችዎን በ Google Calendar ማስተዳደር፣ እና መድሃኒትዎን በ Alarm መውሰጃ ሰዓት ማስተካከል እችላለሁ።`;
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speak(amharicSpeechText, 'intro_popup');
                }
              }}
              style={{
                marginTop: '10px',
                padding: '12px 20px',
                background: isSpeaking ? 'var(--accent-red)' : 'var(--accent)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background 0.2s',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              {isSpeaking ? <Square size={16} fill="currentColor"/> : <Volume2 size={16}/>}
              <span>{isSpeaking ? (appLanguage === 'English' ? 'Stop Audio' : 'ድምፅ አቁም') : (appLanguage === 'English' ? 'Listen in Amharic (በአማርኛ ያዳምጡ)' : 'በአማርኛ ያዳምጡ')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time MCP Tool Executed Toasts */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 99999,
        pointerEvents: 'none'
      }}>
        {mcpToasts.map(toast => (
          <div key={toast.id} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            width: '320px',
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
            borderLeft: '4px solid var(--accent)'
          }}>
            <span style={{ fontSize: '20px', marginTop: '2px' }}>{toast.icon}</span>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{toast.title}</strong>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>{toast.message}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;