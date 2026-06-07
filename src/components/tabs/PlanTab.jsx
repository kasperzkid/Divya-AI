import { useState, useEffect } from 'react';
import {
  Plus, ChevronRight, CheckCheck, Activity, Apple, Brain, HeartPulse, Moon, Stethoscope, Sparkles, RefreshCcw
} from 'lucide-react';
import { parseClinicalReport, cleanItemText } from '../../utils/clinicalParser';

export default function PlanTab({
  masterReport,
  chats,
  personalWeight,
  personalAge,
  isLightMode,
  appLanguage,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  setIsAddTaskModalOpen,
  planChecklist,
  setPlanChecklist,
  selectedWeeklyDay,
  setSelectedWeeklyDay,
  customPlanTasks,
  expandedTasks,
  setExpandedTasks,
  regeneratePlanTasks,
  startDiagnosticSession,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasReport = masterReport?.messages?.some(
    (m) => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:'))
  );

  if (!hasReport) {
    return (
      <div className="sample-page" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '48px 32px', 
        textAlign: 'center', 
        height: '100%',
        minHeight: '400px'
      }}>
        <div style={{
          background: 'var(--surface)',
          border: `1px dashed ${isLightMode ? 'rgba(82, 121, 111, 0.3)' : 'rgba(107, 144, 128, 0.25)'}`,
          borderRadius: '24px',
          padding: '56px 40px',
          maxWidth: '480px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
        }}>
          <span style={{ fontSize: '56px', filter: 'drop-shadow(0 8px 16px rgba(107, 144, 128, 0.25))' }}>📋</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
              {appLanguage === 'English' ? 'First, start a session with Divya' : 'በመጀመሪያ ከዲቭያ ጋር ውይይት ይጀምሩ'}
            </h3>
            <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {appLanguage === 'English' 
                ? 'When your consultation session finishes, Divya AI will automatically generate your personalized daily health recovery routines.' 
                : 'የምክር ክፍለ ጊዜዎ ሲጠናቀቅ፣ ዲቭያ AI በህክምና ግምገማዎ ላይ በመመስረት ግላዊ የዕለት ተዕለት የጤና ማገገሚያ እቅድዎን በራስ-ሰር ያመነጫል።'}
            </p>
          </div>
          <button
            onClick={startDiagnosticSession}
            className="read-report-btn"
            style={{ 
              width: 'auto', 
              padding: '12px 28px', 
              textTransform: 'none', 
              fontSize: '14px', 
              fontWeight: '700',
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(107, 144, 128, 0.2)'
            }}
          >
            <Stethoscope size={18} />
            <span>{appLanguage === 'English' ? 'Start a Session with Divya' : 'ከዲቭያ ጋር ውይይት ጀምር'}</span>
          </button>
        </div>
      </div>
    );
  }

  const conclusion = masterReport?.messages?.find(
    (m) => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:'))
  );
  const reportData = conclusion ? parseClinicalReport(conclusion.text) : null;

  // Compile raw tasks from master clinical report
  const activeTests = reportData ? reportData.tests.map((t) => cleanItemText(t)).filter(Boolean) : [];
  const activeRelief = reportData
    ? reportData.relief
        .map((r) => {
          const clean = cleanItemText(r);
          if (clean.startsWith('![') || clean.includes('](')) return null;
          return clean;
        })
        .filter(Boolean)
    : [];

  const baseTasks = [];
  const hasRealData = activeTests.length > 0 || activeRelief.length > 0;

  if (hasRealData) {
    activeTests.forEach((test) =>
      baseTasks.push({
        title: appLanguage === 'English' ? 'Hospital Diagnostic' : 'የሆስፒታል ምርመራ',
        desc: test,
        category: 'Medication',
        time: '09:00',
      })
    );
    activeRelief.forEach((relief) => {
      const lower = relief.toLowerCase();
      let cat = 'Movement';
      let iconTime = '08:00';
      if (/diet|food|water|nutrition|drink|tea|broth|soup|meal|ብላ|ውሃ|ሻይ|ምግብ/i.test(lower)) {
        cat = 'Nutrition';
        iconTime = '12:00';
      } else if (/pill|capsule|tablet|medicine|medication|paracetamol|panadol|acetaminophen|dosage|mg|መድሃኒት/i.test(lower)) {
        cat = 'Medication';
        iconTime = '08:00';
      } else if (/relax|evaluate|status|rest|mental|stress|anxiety/i.test(lower)) {
        cat = 'Mental Health';
        iconTime = '21:00';
      }
      baseTasks.push({ title: relief.substring(0, 30) + '...', desc: relief, category: cat, time: iconTime });
    });
  }

  // Combine with user custom tasks
  const allPlanTasks = [...baseTasks, ...customPlanTasks];

  // Filter by category chip
  const filteredTasks =
    selectedCategoryFilter === 'All'
      ? allPlanTasks
      : allPlanTasks.filter((t) => t.category === selectedCategoryFilter);

  // Get calendar date of the selected day of the week (Sunday to Saturday)
  const getCalendarDateForDayOfWeek = (dayKey) => {
    const currentDay = new Date().getDay();
    const diff = dayKey - currentDay;
    const date = new Date();
    date.setDate(date.getDate() + diff);
    return date.toISOString().split('T')[0];
  };

  const selectedDateStr = getCalendarDateForDayOfWeek(selectedWeeklyDay);

  const togglePlanTask = (taskText) => {
    setPlanChecklist((prev) => ({
      ...prev,
      [`${selectedDateStr}-${taskText}`]: !prev[`${selectedDateStr}-${taskText}`],
    }));
  };

  const isPlanChecked = (taskText) => !!planChecklist[`${selectedDateStr}-${taskText}`];

  // Overall calculations
  const completedCount = allPlanTasks.filter((t) => isPlanChecked(t.desc)).length;
  const totalCount = allPlanTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Helper category icons
  const getCategoryIcon = (cat) => {
    if (cat === 'Nutrition') return <Apple size={18} />;
    if (cat === 'Movement') return <Activity size={18} />;
    if (cat === 'Medication') return <HeartPulse size={18} />;
    if (cat === 'Mental Health') return <Brain size={18} />;
    if (cat === 'Sleep') return <Moon size={18} />;
    return <Activity size={18} />;
  };

  // Category Colors
  const getCategoryColor = (cat) => {
    if (cat === 'Nutrition') return '#10b981';
    if (cat === 'Movement') return '#3b82f6';
    if (cat === 'Medication') return '#ef4444';
    if (cat === 'Mental Health') return '#a855f7';
    if (cat === 'Sleep') return '#d4a373';
    return 'var(--accent)';
  };

  // Real-time calculated progress status for each weekday
  const getDayProgressStatus = (dayKey) => {
    const dayDateStr = getCalendarDateForDayOfWeek(dayKey);
    const todayStr = new Date().toISOString().split('T')[0];

    const dayTasks = [...baseTasks, ...customPlanTasks];
    if (dayTasks.length === 0) return 'upcoming';

    const completedForDay = dayTasks.filter((t) => !!planChecklist[`${dayDateStr}-${t.desc}`]).length;
    const totalForDay = dayTasks.length;

    if (dayDateStr > todayStr) {
      return 'upcoming';
    }
    if (completedForDay === totalForDay && totalForDay > 0) {
      return 'completed';
    }
    if (completedForDay > 0) {
      return 'partial';
    }
    return 'unstarted';
  };

  const getCalendarDayOfMonth = (dayKey) => {
    const currentDay = new Date().getDay();
    const diff = dayKey - currentDay;
    const date = new Date();
    date.setDate(date.getDate() + diff);
    return date.getDate();
  };

  const weeklyDays = [
    { key: 0, label: appLanguage === 'English' ? 'S' : 'እ', date: getCalendarDayOfMonth(0), status: getDayProgressStatus(0) },
    { key: 1, label: appLanguage === 'English' ? 'M' : 'ሰ', date: getCalendarDayOfMonth(1), status: getDayProgressStatus(1) },
    { key: 2, label: appLanguage === 'English' ? 'T' : 'ማ', date: getCalendarDayOfMonth(2), status: getDayProgressStatus(2) },
    { key: 3, label: appLanguage === 'English' ? 'W' : 'ረ', date: getCalendarDayOfMonth(3), status: getDayProgressStatus(3) },
    { key: 4, label: appLanguage === 'English' ? 'T' : 'ሐ', date: getCalendarDayOfMonth(4), status: getDayProgressStatus(4) },
    { key: 5, label: appLanguage === 'English' ? 'F' : 'ዓ', date: getCalendarDayOfMonth(5), status: getDayProgressStatus(5) },
    { key: 6, label: appLanguage === 'English' ? 'S' : 'ቅ', date: getCalendarDayOfMonth(6), status: getDayProgressStatus(6) },
  ];

  // Real calculated consecutive active days streak
  const calculateActiveStreak = () => {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const dayTasks = [...baseTasks, ...customPlanTasks];
      const completedCount = dayTasks.filter((t) => !!planChecklist[`${dateStr}-${t.desc}`]).length;

      if (completedCount > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  };
  const realStreak = calculateActiveStreak();

  // Extract vitals
  const extractVitalsAndMetrics = () => {
    let parsedBpm = null;
    let parsedSteps = null;
    let parsedKcal = null;

    const allMessages = [];
    if (masterReport?.messages) allMessages.push(...masterReport.messages);
    chats.forEach((c) => {
      if (c.messages) allMessages.push(...c.messages);
    });

    allMessages.forEach((msg) => {
      const text = msg.text.toLowerCase();
      const bpmMatch = text.match(/(\d+)\s*(?:bpm|heart\s*rate|pulse)/i);
      if (bpmMatch && !parsedBpm) parsedBpm = parseInt(bpmMatch[1], 10);

      const stepsMatch = text.match(/(\d{3,5})\s*(?:steps|step)/i);
      if (stepsMatch && !parsedSteps) parsedSteps = parseInt(stepsMatch[1], 10);

      const kcalMatch = text.match(/(\d{2,4})\s*(?:kcal|calories|calorie)/i);
      if (kcalMatch && !parsedKcal) parsedKcal = parseInt(kcalMatch[1], 10);
    });

    const weightNum = parseFloat(personalWeight) || 70;
    const ageNum = parseInt(personalAge, 10) || 30;

    const completedMovement = allPlanTasks.filter((t) => t.category === 'Movement' && isPlanChecked(t.desc)).length;
    const completedOthers = allPlanTasks.filter((t) => t.category !== 'Movement' && isPlanChecked(t.desc)).length;

    const finalBpm = parsedBpm || Math.round(72 + (weightNum - 70) * 0.1 + (ageNum > 50 ? 2 : 0));
    const finalSteps = parsedSteps || 3000 + completedMovement * 1500 + completedOthers * 300;
    const finalKcal = parsedKcal || Math.round(completedMovement * 80 + completedOthers * 15 + weightNum * 0.1);

    return { bpm: finalBpm, steps: finalSteps, kcal: finalKcal };
  };

  const vitals = extractVitalsAndMetrics();

  // Task details and illustrations
  const getTaskDetails = (task) => {
    const cat = task.category;
    let benefit = '';
    let steps = [];
    let iconSvg = null;

    if (cat === 'Nutrition') {
      benefit =
        appLanguage === 'English'
          ? 'Maintains hydration levels and reduces systemic inflammatory biomarkers.'
          : 'የፈሳሽ አቅርቦትን በመጠበቅ በሰውነት ውስጥ ያሉ ብግነቶችን ለመቀነስ ይረዳል።';
      steps =
        appLanguage === 'English'
          ? ['Sip slowly at room temperature', 'Avoid sugary or processed drinks', 'Take consistent small breaks to hydrate']
          : ['ለብ ያለ ውሃ ቀስ እያሉ ይጠጡ', 'ጣፋጭ ወይም የተቀነባበሩ መጠጦችን ያስወግዱ', 'የፈሳሽ አቅርቦትን ለመጠበቅ አጫጭር እረፍቶችን ይውሰዱ'];
      iconSvg = (
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.25))', strokeWidth: 2.5 }}>
          <path d="M16 24C16 20 20 16 24 16H40C44 16 48 20 48 24V40C48 46 42 52 36 52H28C22 52 16 46 16 40V24Z" fill="var(--surface-hover)" stroke="#10b981" />
          <path d="M48 22H52C55 22 58 25 58 28V34C58 37 55 40 52 40H48" stroke="#10b981" strokeLinecap="round" />
          <path d="M26 12C26 8 28 6 28 2" stroke="#10b981" strokeLinecap="round" />
          <path d="M34 12C34 8 36 6 36 2" stroke="#10b981" strokeLinecap="round" />
          <circle cx="32" cy="34" r="5" fill="#10b981" opacity="0.8" />
        </svg>
      );
    } else if (cat === 'Movement') {
      benefit =
        appLanguage === 'English'
          ? 'Enhances localized blood circulation and relieves musculoskeletal joint pressure.'
          : 'የደም ዝውውርን በማሻሻል በጡንቻዎች እና በመገጣጠሚያዎች ላይ ያለውን ጫና ይቀንሳል።';
      steps =
        appLanguage === 'English'
          ? ['Perform stretches smoothly and slowly', 'Never bounce or force joints into pain', 'Hold each posture stretch for 15-20 seconds']
          : ['የዝርጋታ እንቅስቃሴዎችን በቀስታ ያከናውኑ', 'ህመም በሚሰማዎት መጠን መገጣጠሚያዎችን አይጫኑ', 'እያንዳንዱን ዝርጋታ ለ 15-20 ሰከንዶች ይያዙ'];
      iconSvg = (
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.25))', strokeWidth: 3 }}>
          <circle cx="32" cy="14" r="5" fill="#3b82f6" />
          <path d="M32 20C32 20 22 28 14 36M32 20C32 20 42 28 50 36" stroke="#3b82f6" strokeLinecap="round" />
          <path d="M32 20V36M32 36L20 54M32 36L44 54" stroke="#3b82f6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 42C22 42 42 42 52 42" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      );
    } else if (cat === 'Medication') {
      benefit =
        appLanguage === 'English'
          ? 'Maintains precise biochemical control over active physiological symptoms.'
          : 'ህመሞችን በባዮኬሚካላዊ ቁጥጥር ስር ለማዋል እና ምልክቶችን ለማስታገስ ይረዳል።';
      benefit =
        appLanguage === 'English'
          ? 'Maintaining scheduled medication timings ensures stable plasma drug levels, boosting overall therapy efficacy.'
          : 'የታዘዙ መድኃኒቶችን በትክክለኛው ሰዓት መውሰድ በደም ውስጥ ያለውን የመድኃኒት መጠን በማመጣጠን ፈጣን ፈውስ ያስገኛል።';
      steps =
        appLanguage === 'English'
          ? ['Take at the exact scheduled intervals', 'Always take with a full glass of water', 'Note any unusual secondary reactions']
          : ['በታዘዘው ትክክለኛ የጊዜ ልዩነት መሠረት ይውሰዱ', 'ሁል ጊዜ በአንድ ሙሉ ብርጭቆ ውሃ ይውሰዱ', 'ማንኛውንም ያልተለመዱ ምልክቶችን ይመዝግቡ'];
      iconSvg = (
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.25))', strokeWidth: 2.5 }}>
          <rect x="22" y="14" width="20" height="36" rx="10" transform="rotate(45 32 32)" fill="var(--surface-hover)" stroke="#ef4444" />
          <path d="M25 25L39 39" stroke="#ef4444" />
          <path d="M12 32H18M46 32H52M32 12V18M32 46V52" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    } else if (cat === 'Mental Health') {
      benefit =
        appLanguage === 'English'
          ? 'Calms sympathetic nervous system and triggers deep cellular restoration.'
          : 'ውጥረትን በመቀነስ የአእምሮ እረፍት እና የተሟላ ሰላምን ይሰጣል።';
      steps =
        appLanguage === 'English'
          ? ['Focus deeply on rhythmic box breathing', 'Find a completely quiet and comfortable space', 'Acknowledge and gently release stray thoughts']
          : ['በትንፋሽ ስልቶች ላይ ትኩረት ያድርጉ', 'ሙሉ በሙሉ ጸጥተኛ እና ምቹ ቦታ ያግኙ', 'ሀሳቦችዎን በቀስታ ያስተካክሉ'];
      iconSvg = (
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(168, 85, 247, 0.25))', strokeWidth: 2.5 }}>
          <path d="M32 46C24 46 16 40 16 30C16 20 24 16 32 16M32 46C40 46 48 40 48 30C48 20 40 16 32 16" fill="var(--surface-hover)" stroke="#a855f7" />
          <path d="M32 16V46" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 24C18 26 18 32 22 34M42 24C46 26 46 32 42 34" stroke="#a855f7" strokeWidth="2" />
          <circle cx="12" cy="16" r="1.5" fill="#a855f7" />
          <circle cx="52" cy="16" r="1.5" fill="#a855f7" />
        </svg>
      );
    } else {
      // Sleep
      benefit =
        appLanguage === 'English'
          ? 'Enables neurological toxin clearance and overnight muscular rebuilding.'
          : 'የአንጎል መርዛማ ንጥረ ነገሮችን በማስወገድ የሰውነት ማገገምን ያረጋግጣል።';
      steps =
        appLanguage === 'English'
          ? ['Disconnect from all screens 30 mins before sleep', 'Ensure the room is completely dark and cool', 'Keep a highly consistent daily sleep schedule']
          : ['ከመተኛትዎ 30 ደቂቃ በፊት ከማንኛውም ስክሪን ይራቁ', 'የመኝታ ክፍሉ ጨለማ እና ቀዝቃዛ መሆኑን ያረጋግጡ', 'ወጥ የሆነ የእንቅልፍ መርሐግብር ይከተሉ'];
      iconSvg = (
        <svg width="60" height="60" viewBox="0 0 64 64" fill="none" style={{ filter: 'drop-shadow(0 4px 12px rgba(212, 163, 115, 0.25))', strokeWidth: 2.5 }}>
          <path d="M46 38C40 46 28 46 20 38C12 30 12 18 20 10C21 9 22.5 10 22 11.5C18 20 22 30 30.5 34C32 34.5 32.5 36 31 37" fill="var(--surface-hover)" stroke="#d4a373" />
          <path d="M44 14L46 18L50 14" stroke="#d4a373" strokeWidth="2" strokeLinecap="round" />
          <path d="M52 24L54 27L57 24" stroke="#d4a373" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    }

    return { benefit, steps, iconSvg };
  };

  const hasRecoveryPlan = allPlanTasks.length > 0;

  return (
    <div className="sample-page" style={{ padding: isMobile ? '16px 12px' : '24px 32px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', height: '100%', overflowY: 'auto' }}>
      
      {/* Responsive Layout container */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: isMobile ? '20px' : '30px',
        width: '100%',
        alignItems: 'flex-start',
        justifyContent: 'flex-start'
      }}>
        
        {/* Left Column: Weekly Strip, Categories & Today's Plan */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: isMobile ? '1 1 100%' : '1.4 1 450px', maxWidth: 'none', width: '100%' }}>
          
          {/* 1. Daily Plan Header */}
          <div style={{
            background: isLightMode 
              ? 'linear-gradient(135deg, rgba(82, 121, 111, 0.04), rgba(107, 144, 128, 0.08))' 
              : 'linear-gradient(135deg, rgba(107, 144, 128, 0.03), rgba(255, 255, 255, 0.02))',
            border: `1px solid ${isLightMode ? 'rgba(82,121,111,0.15)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '20px',
            padding: isMobile ? '16px' : '24px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
                {appLanguage === 'English' 
                  ? `Hello, Health Companion!` 
                  : `ሰላም፣ የጤና ረዳት!`}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {appLanguage === 'English' ? 'Small steps, big progress 🎯' : 'ትናንሽ እርምጃዎች፣ ታላቅ ውጤት ያመጣሉ 🎯'}
              </p>
              <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)', background: 'rgba(107,144,128,0.08)', padding: '2px 8px', borderRadius: '10px', marginTop: '10px' }}>
                {new Date().toLocaleDateString(appLanguage === 'English' ? 'en-US' : 'am-ET', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Progress Indicator */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="60" height="60" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'} strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--accent)" strokeWidth="3.2" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.3s ease' }} />
                </svg>
                <span style={{ position: 'absolute', fontSize: '13px', fontWeight: '800', color: 'var(--text)' }}>{percentage}%</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{appLanguage === 'English' ? 'Today' : 'ዛሬ'}</span>
            </div>
          </div>

          {/* 2. Quick Category Filters (Chips) */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="category-scroll-chips">
            {['All', 'Medication', 'Movement', 'Nutrition', 'Mental Health', 'Sleep'].map((cat) => {
              const isActive = selectedCategoryFilter === cat;
              return (
                <button
                  key={`chip-${cat}`}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  style={{
                    flexShrink: 0,
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    background: isActive ? 'var(--accent)' : (isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'),
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat === 'All' ? (appLanguage === 'English' ? 'All' : 'ሁሉም') : cat}
                </button>
              );
            })}
          </div>

          {hasRecoveryPlan ? (
            <>
              {/* 3. Today\'s Plan Tasks stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '6px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{appLanguage === 'English' ? 'Today\'s Actions' : 'የዛሬ የክትትል ተግባራት'}</span>
                  <button 
                    onClick={() => setIsAddTaskModalOpen(true)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={14} /> {appLanguage === 'English' ? 'Add Task' : 'ተግባር ጨምር'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task, idx) => {
                      const checked = isPlanChecked(task.desc);
                      const isExpanded = !!expandedTasks[task.desc];
                      const details = getTaskDetails(task);

                      return (
                        <div 
                          key={`task-card-${idx}`}
                          style={{
                            background: 'var(--surface)',
                            border: `1px solid ${checked ? (isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)') : 'var(--border)'}`,
                            borderRadius: '16px',
                            transition: 'all 0.25s',
                            opacity: checked ? 0.75 : 1,
                            overflow: 'hidden'
                          }}
                        >
                          {/* Task Card Header Area */}
                          <div 
                            onClick={() => setExpandedTasks(prev => ({ ...prev, [task.desc]: !prev[task.desc] }))}
                            style={{
                              padding: '16px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '16px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '38px',
                                height: '38px',
                                borderRadius: '12px',
                                background: checked ? (isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)') : `${getCategoryColor(task.category)}12`,
                                color: checked ? 'var(--text-muted)' : getCategoryColor(task.category),
                                flexShrink: 0
                              }}>
                                {getCategoryIcon(task.category)}
                              </span>
                              <div style={{ minWidth: 0 }}>
                                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700', color: 'var(--text)', textDecoration: checked ? 'line-through' : 'none' }}>
                                  {task.title}
                                </h4>
                                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {task.desc}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                              {task.time && (
                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '6px' }}>
                                  {task.time}
                                </span>
                              )}
                              
                              {/* Expand Chevron */}
                              <span 
                                onClick={() => setExpandedTasks(prev => ({ ...prev, [task.desc]: !prev[task.desc] }))}
                                style={{ display: 'flex', color: 'var(--text-muted)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', cursor: 'pointer', padding: '4px' }}
                              >
                                <ChevronRight size={14} />
                              </span>

                              {/* Checkbox Trigger */}
                              <div 
                                onClick={() => togglePlanTask(task.desc)}
                                style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  border: `2px solid ${checked ? 'var(--accent)' : 'var(--border-active)'}`,
                                  background: checked ? 'var(--accent)' : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  transition: 'all 0.15s',
                                  cursor: 'pointer'
                                }}
                              >
                                {checked && <CheckCheck size={12} />}
                              </div>
                            </div>
                          </div>

                          {/* Task Card Expandable Details Panel */}
                          {isExpanded && (
                            <div style={{
                              padding: '0 20px 20px 20px',
                              borderTop: `1px solid ${isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}`,
                              background: isLightMode ? 'rgba(0,0,0,0.005)' : 'rgba(255,255,255,0.005)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '16px',
                              animation: 'fadeIn 0.2s ease'
                            }}>
                              {/* Layout with Illustration and Clinical Insights */}
                              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', alignItems: isMobile ? 'flex-start' : 'center', marginTop: '16px' }}>
                                {/* Inline Vector Image/Illustration */}
                                <div style={{ flexShrink: 0, width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {details.iconSvg}
                                </div>

                                {/* Clinical Insight */}
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: getCategoryColor(task.category), marginBottom: '4px' }}>
                                    {appLanguage === 'English' ? 'Clinical Benefit' : 'ክሊኒካዊ ጥቅም'}
                                  </div>
                                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4', opacity: 0.9 }}>
                                    {details.benefit}
                                  </div>
                                </div>
                              </div>

                              {/* Step-by-Step Guideline Steps */}
                              <div style={{
                                background: isLightMode ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)',
                                border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}`,
                                borderRadius: '12px',
                                padding: '12px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  {appLanguage === 'English' ? 'Guidance Steps' : 'የአፈጻጸም ቅደም-ተከተል'}
                                </div>
                                {details.steps.map((step, sIdx) => (
                                  <div key={sIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12.5px' }}>
                                    <span style={{ color: getCategoryColor(task.category), fontWeight: 'bold' }}>{sIdx + 1}.</span>
                                    <div style={{ color: 'var(--text)', opacity: 0.85 }}>{step}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: '16px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {appLanguage === 'English' ? 'No tasks found for this category filter.' : 'በዚህ መደብ የተመደበ ምንም ተግባር የለም።'}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* No Recovery Plan Generated card */
            <div style={{
              background: 'var(--surface)',
              border: `1px dashed ${isLightMode ? 'rgba(82, 121, 111, 0.3)' : 'rgba(107, 144, 128, 0.25)'}`,
              borderRadius: '20px',
              padding: '48px 32px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
            }}>
              <span style={{ fontSize: '48px', filter: 'drop-shadow(0 4px 12px rgba(107, 144, 128, 0.25))' }}>📋</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>
                  {appLanguage === 'English' ? 'No Recovery Plan Generated' : 'ምንም የህክምና እቅድ አልተፈጠረም'}
                </h3>
                <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '380px' }}>
                  {appLanguage === 'English' 
                    ? 'Start a diagnostic session and consult with Divya to build your personalized daily health recovery routines.' 
                    : 'የእርስዎን ግላዊ የጤና ማገገሚያ እቅድ ለመፍጠር አዲስ የምርመራ ክፍለ ጊዜ በመጀመር ከዲቭያ ጋር ይወያዩ።'}
                </p>
              </div>
              <button
                onClick={startDiagnosticSession}
                className="read-report-btn"
                style={{ width: 'auto', padding: '10px 24px', textTransform: 'none', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Stethoscope size={16} />
                <span>{appLanguage === 'English' ? 'Start Diagnostics' : 'ምርመራ ጀምር'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Aesthetic Vertical Separator Line (Desktop Only) */}
        <div style={{
          width: '1px',
          alignSelf: 'stretch',
          minHeight: '500px',
          background: isLightMode 
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 100%)' 
            : 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.015) 100%)',
          margin: '0 10px',
          display: isMobile ? 'none' : 'block'
        }} className="plan-vertical-divider" />

        {/* Right Side: WeeklyProgress, Streaks & Upcoming Plan Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', flex: isMobile ? '1 1 100%' : '1 1 320px', maxWidth: 'none', width: '100%' }}>
          
          {/* 4. Weekly Progress Strip Section */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingBottom: '6px', width: '100%' }}>
              {appLanguage === 'English' ? 'Weekly Progress' : 'የሳምንቱ አፈፃፀም'}
            </div>

            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Consecutive active streak widget */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px', filter: 'drop-shadow(0 4px 10px rgba(245,158,11,0.2))' }}>🔥</span>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>
                      {appLanguage === 'English' ? `${realStreak} Day Streak` : `${realStreak} ቀን ተከታታይ`}
                    </h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {appLanguage === 'English' ? 'Consistent recovery action' : 'ወጥነት ያለው የማገገም ጥረት'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekly strip calendar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {weeklyDays.map((day) => {
                  const isSelected = selectedWeeklyDay === day.key;
                  let borderClr = 'transparent';
                  let bgClr = isLightMode ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)';
                  let textColor = 'var(--text)';

                  if (day.status === 'completed') {
                    bgClr = 'rgba(16, 185, 129, 0.1)';
                    borderClr = 'rgba(16, 185, 129, 0.2)';
                    textColor = '#10b981';
                  } else if (day.status === 'partial') {
                    bgClr = 'rgba(245, 158, 11, 0.1)';
                    borderClr = 'rgba(245,158,11,0.2)';
                    textColor = '#f59e0b';
                  }

                  if (isSelected) {
                    borderClr = 'var(--accent)';
                  }

                  return (
                    <div 
                      key={`weekly-day-${day.key}`}
                      onClick={() => setSelectedWeeklyDay(day.key)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 4px',
                        borderRadius: '12px',
                        background: bgClr,
                        border: `1.5px solid ${borderClr}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        opacity: isSelected ? 1 : 0.85
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.transform = 'translateY(0)' }}
                    >
                      <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{day.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: textColor }}>{day.date}</span>
                    </div>
                  );
                })}
              </div>

              {/* Vitals Summary Widget Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, paddingTop: '16px' }}>
                <div style={{ background: isLightMode ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#ef4444', display: 'flex' }}><HeartPulse size={16} /></span>
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{appLanguage === 'English' ? 'Pulse' : 'የልብ ምት'}</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{vitals.bpm} BPM</strong>
                  </div>
                </div>
                <div style={{ background: isLightMode ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#3b82f6', display: 'flex' }}><Activity size={16} /></span>
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>{appLanguage === 'English' ? 'Steps' : 'እርምጃዎች'}</span>
                    <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{vitals.steps}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Health Insight Dynamic Quote Widget */}
          <div style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} /> <span>{appLanguage === 'English' ? 'Bilingual Clinical Insight' : 'ክሊኒካዊ ግንዛቤ እና ምክር'}</span>
            </div>
            <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text)', opacity: 0.9 }}>
              {selectedCategoryFilter === 'All' 
                ? (appLanguage === 'English' ? 'Consistency is the foundation of lasting health transformation. Complete tasks daily to solidify your recovery.' : 'ወጥነት ያለው ተግባር ለዘላቂ ጤና መሠረት ነው። የእለት ተእለት ተግባራትዎን በማከናወን ጤናዎን ያረጋግጡ።')
                : selectedCategoryFilter === 'Medication'
                ? (appLanguage === 'English' ? 'Maintaining scheduled medication timings ensures stable plasma drug levels, boosting overall therapy efficacy.' : 'የታዘዙ መድኃኒቶችን በትክክለኛው ሰዓት መውሰድ በደም ውስጥ ያለውን የመድኃኒት መጠን በማመጣጠን ፈጣን ፈውስ ያስገኛል።')
                : selectedCategoryFilter === 'Movement'
                ? (appLanguage === 'English' ? 'Short, frequent light stretching blocks can reduce muscular strain and mitigate physical posture fatigue.' : 'አጫጭር እና ተከታታይ የሆኑ የዝርጋታ እንቅስቃሴዎች የጡንቻዎች ድካምን በመቀነስ የአኳኋን መሻሻልን ያፋጥናሉ።')
                : selectedCategoryFilter === 'Nutrition'
                ? (appLanguage === 'English' ? 'Active hydration is essential for cellular transport, efficient metabolic processes, and internal toxin flushing.' : 'ንቁ የሆነ የፈሳሽ አቅርቦት ለሕዋሳት እንቅስቃሴ፣ ለሜታቦሊዝም ሂደት እና ለሰውነት መርዛማ ንጥረ ነገሮች መወገጃ ወሳኝ ነው።')
                : selectedCategoryFilter === 'Mental Health'
                ? (appLanguage === 'English' ? 'Even 3-5 minutes of intentional, deep box breathing can actively down-regulate body cortisol levels.' : 'ከ3-5 ደቂቃዎች የሚደረጉ ጥልቅ ትንፋሽ መውሰዶች በሰውነት ውስጥ ያለውን የውጥረት ሆርሞን (cortisol) ለመቀነስ ይረዳሉ።')
                : (appLanguage === 'English' ? 'Quality deep sleep triggers the glymphatic system to actively clear neurological wastes gathered during the day.' : 'ጥራት ያለው ጥልቅ እንቅልፍ በቀን ውስጥ የተጠራቀሙ የአንጎል ቆሻሻዎችን ለማስወገድ እና እረፍት ለመስጠት ይረዳል።')
              }
            </p>
          </div>

          {/* 6. Diagnostic Timeline / Prescription List Card */}
          <div style={{
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`, paddingBottom: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--accent)', display: 'flex' }}><Stethoscope size={16} /></span>
              <h5 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text)' }}>
                {appLanguage === 'English' ? 'Active Diagnoses & Care' : 'ንቁ የህክምና ክትትል እቅድ'}
              </h5>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTests.length > 0 ? (
                activeTests.map((test, tIdx) => (
                  <div key={`timeline-test-${tIdx}`} style={{ background: isLightMode ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--accent)', display: 'flex' }}><Stethoscope size={16} /></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>
                        {appLanguage === 'English' ? 'Hospital Diagnostic Test' : 'የሆስፒታል ምርመራ/ፈተና'}
                      </h5>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{test}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>09:00</span>
                  </div>
                ))
              ) : (
                <div style={{ background: isLightMode ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.015)', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#ef4444', display: 'flex' }}><HeartPulse size={16} /></span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>
                      {appLanguage === 'English' ? 'Therapeutic Care Routine' : 'የማስታገሻ/የህክምና የክትትል ተግባር'}
                    </h5>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{appLanguage === 'English' ? 'Apply warm compress to sore neck' : 'በአንገትዎ ህመም ላይ ለብ ያለ መጭመቂያ ማድረግ'}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>14:00</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
