import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, MapPin, Calendar, Mail, CheckCircle2, ChevronRight, 
  Activity, Trash2, Search, Clock, ListChecks, Stethoscope, AlertCircle 
} from 'lucide-react';
import { mcpManager } from '../../utils/mcpManager';
import { parseClinicalReport, cleanItemText } from '../../utils/clinicalParser';

// Dual-language localized strings
const textTranslations = {
  English: {
    title: 'Clinical Action Center',
    subtitle: 'Execute real-time Model Context Protocol (MCP) actions directly on your active medical plan tasks and chat requests.',
    all: 'All Actions',
    appointments: 'Appointments & Scheduling',
    searchPlaces: 'Places to Search',
    routine: 'Routine & Custom Care',
    noTasks: 'No Active Action Tasks',
    noTasksDesc: 'Tasks will appear here once generated from your Health Plan, or when you ask Divya to save them in chat!',
    noAppointments: 'No Appointments Scheduled',
    noAppointmentsDesc: 'Ask Divya to schedule a checkup or add an appointment task in the chat.',
    noSearch: 'No Search Locations Required',
    noSearchDesc: 'No pharmacy or facility search actions are needed at this time.',
    noRoutine: 'No Routine Tasks',
    noRoutineDesc: 'Your general daily actions and custom tasks will appear here.',
    locationLabel: 'Search Area/City:',
    searchButton: 'Find Nearby on Map (MCP)',
    scheduleButton: 'Schedule on Calendar (MCP)',
    emailButton: 'Send Email Summary (MCP)',
    searching: 'Searching...',
    booking: 'Booking...',
    emailing: 'Emailing...',
    liveResult: 'MCP Live Service Execution Result',
    enterLocation: 'Type location...',
    customTask: 'Custom Health Task'
  },
  Amharic: {
    title: 'የጤና ተግባራት ማዕከል',
    subtitle: 'በጤና እቅድዎ ወይም በውይይት የጠየቋቸውን የ-MCP ውጫዊ የቴክኖሎጂ ተግባራትን በቀጥታ እዚህ ይተግብሩ።',
    all: 'ሁሉንም ተግባራት',
    appointments: 'ቀጠሮዎች እና ምርመራዎች',
    searchPlaces: 'የሚፈለጉ የጤና ቦታዎች',
    routine: 'የዕለት ተዕለት ተግባራት',
    noTasks: 'ምንም ንቁ የድርጊት ተግባር የለም',
    noTasksDesc: 'የጤና እቅድ ሲወጣ ወይም ለዲቭያ በውይይት ተግባር እንዲመዘግብልዎ ሲጠይቁ እዚህ ይታያሉ።',
    noAppointments: 'ምንም ቀጠሮዎች አልተያዙም',
    noAppointmentsDesc: 'ቀጠሮ ወይም ምርመራ እንዲመዘግብልዎ ዲቭያን በውይይት ይጠይቁ።',
    noSearch: 'ምንም የሚፈለግ የጤና ቦታ የለም',
    noSearchDesc: 'በዚህ ሰዓት ምንም የመድኃኒት ቤት ወይም የሆስፒታል ፍለጋ አያስፈልግም።',
    noRoutine: 'ምንም የዕለት ተዕለት ተግባራት የሉም',
    noRoutineDesc: 'የዕለት ተዕለት ጤና እና ብጁ ተግባራት እዚህ ይታያሉ።',
    locationLabel: 'የፍለጋ ቦታ:',
    searchButton: 'በካርታ ላይ ፈልግ (MCP)',
    scheduleButton: 'በቀን መቁጠሪያ ላይ መርሐግብር (MCP)',
    emailButton: 'የኢሜል ማጠቃለያ ላክ (MCP)',
    searching: 'እየፈለገ ነው...',
    booking: 'እየያዘ ነው...',
    emailing: 'ኢሜይል እየላከ ነው...',
    liveResult: 'የ-MCP የቀጥታ አገልግሎት አፈፃፀም ውጤት',
    enterLocation: 'ቦታ ይጻፉ...',
    customTask: 'ብጁ የጤና ተግባር'
  }
};

export default function ActionTab({
  masterReport,
  user,
  appLanguage,
  isLightMode,
  customPlanTasks = []
}) {
  const [dbTasks, setDbTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [mcpStatus, setMcpStatus] = useState({}); // taskId -> { toolName: 'loading' | 'success' | 'error', result: string }
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'appointments' | 'search_places' | 'routine'
  const [locations, setLocations] = useState({}); // taskId -> string

  const t = textTranslations[appLanguage] || textTranslations['English'];

  // Parse tasks from masterReport
  const conclusion = masterReport?.messages?.find(
    (m) => m.role === 'ai' && (m.text.includes('ASSESSMENT:') || m.text.includes('TEMPORARY RELIEF:'))
  );
  const reportData = conclusion ? parseClinicalReport(conclusion.text) : null;
  const activeTests = reportData ? reportData.tests.map((t) => cleanItemText(t)).filter(Boolean) : [];
  const activeRelief = reportData ? reportData.relief.map((r) => cleanItemText(r)).filter(Boolean) : [];

  // Fetch custom chat-added tasks from backend DB
  const fetchCustomTasks = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      const response = await fetch('/api/custom-tasks', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDbTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch custom tasks:', err);
    }
  };

  useEffect(() => {
    fetchCustomTasks();
    const interval = setInterval(fetchCustomTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compile tasks list on load
  useEffect(() => {
    const list = [];

    // 1. Add appointment if we find follow-up checkups or doctor recommendations from the Plan
    if (activeTests.length > 0) {
      activeTests.forEach((test, idx) => {
        list.push({
          id: `report-test-${idx}`,
          title: appLanguage === 'English' ? 'Clinical Appointment / Checkup' : 'ክሊኒካዊ ቀጠሮ እና ምርመራ',
          desc: test,
          category: 'Appointment',
          time: '10:00'
        });
      });
    }

    // 2. Add relief plan tasks generated by the Plan
    activeRelief.forEach((relief, idx) => {
      const lower = relief.toLowerCase();
      let cat = 'Routine';
      if (/pill|capsule|tablet|medicine|medication|paracetamol|dosage|mg|pharmacy/i.test(lower)) {
        cat = 'Pharmacy';
      } else if (/appointment|consultation|doctor|visit|hospital|clinic/i.test(lower)) {
        cat = 'Appointment';
      }
      list.push({
        id: `report-relief-${idx}`,
        title: relief.substring(0, 40) + '...',
        desc: relief,
        category: cat,
        time: '12:00'
      });
    });

    // 3. Add user custom plan tasks generated by the Plan
    customPlanTasks.forEach((ct, idx) => {
      list.push({
        id: `custom-${idx}`,
        title: ct.title || (appLanguage === 'English' ? 'Custom Health Task' : 'ብጁ የጤና ተግባር'),
        desc: ct.desc || '',
        category: ct.category || 'Routine',
        time: ct.time || '08:00'
      });
    });

    // 4. Add dynamic chat-specified tasks loaded from the Database
    dbTasks.forEach(dbTask => {
      list.push({
        id: `db-${dbTask.id}`,
        title: dbTask.title,
        desc: dbTask.description || dbTask.title,
        category: dbTask.category,
        time: dbTask.time || '08:00',
        isDbTask: true
      });
    });

    setTasks(list);
  }, [masterReport, customPlanTasks, dbTasks, appLanguage]);

  // Separate tasks into distinct semantic categories
  const { appointmentTasks, searchTasks, routineTasks } = useMemo(() => {
    const appts = [];
    const searches = [];
    const routines = [];

    tasks.forEach(task => {
      const isPharmacy = task.category === 'Pharmacy' || 
                         task.title.toLowerCase().includes('pharmacy') || 
                         task.title.toLowerCase().includes('medication') || 
                         task.title.toLowerCase().includes('buy') ||
                         task.category === 'Medication';
      
      const isAppointment = task.category === 'Appointment' || 
                            task.title.toLowerCase().includes('appointment') || 
                            task.title.toLowerCase().includes('checkup') || 
                            task.title.toLowerCase().includes('visit') || 
                            task.title.toLowerCase().includes('doctor') || 
                            task.title.toLowerCase().includes('hospital') ||
                            task.category === 'Clinical';

      if (isAppointment) {
        appts.push(task);
      } else if (isPharmacy) {
        searches.push(task);
      } else {
        routines.push(task);
      }
    });

    return { appointmentTasks: appts, searchTasks: searches, routineTasks: routines };
  }, [tasks]);

  // Execute MCP actions
  const triggerMcpAction = async (taskId, toolName, args) => {
    setMcpStatus(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [toolName]: 'loading' }
    }));

    try {
      const res = await mcpManager.executeTool(toolName, args);
      const textResult = res?.content?.[0]?.text || JSON.stringify(res);
      
      setMcpStatus(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], [toolName]: 'success', result: textResult }
      }));
    } catch (err) {
      console.error(err);
      setMcpStatus(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], [toolName]: 'error', result: err.message || 'Execution failed' }
      }));
    }
  };

  const handleDeleteTask = async (id) => {
    if (typeof id === 'string' && id.startsWith('db-')) {
      const numericId = id.split('-')[1];
      try {
        const storedToken = localStorage.getItem('token');
        await fetch(`/api/custom-tasks/${numericId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        fetchCustomTasks();
      } catch (err) {
        console.error('Failed to delete custom task:', err);
      }
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  // Helper to render a task card beautifully
  const renderTaskCard = (task, type) => {
    const isPharmacy = type === 'search' || task.category === 'Pharmacy';
    const isAppointment = type === 'appointment' || task.category === 'Appointment';
    const status = mcpStatus[task.id] || {};
    const currentLoc = locations[task.id] || 'Addis Ababa';

    // Badge styling config
    let badgeBg = 'rgba(245, 158, 11, 0.08)';
    let badgeColor = '#f59e0b';
    let badgeBorder = 'rgba(245, 158, 11, 0.15)';
    let cardAccentColor = 'var(--accent)';

    if (isAppointment) {
      badgeBg = 'rgba(99, 102, 241, 0.08)';
      badgeColor = '#6366f1';
      badgeBorder = 'rgba(99, 102, 241, 0.15)';
      cardAccentColor = '#6366f1';
    } else if (isPharmacy) {
      badgeBg = 'rgba(16, 185, 129, 0.08)';
      badgeColor = '#10b981';
      badgeBorder = 'rgba(16, 185, 129, 0.15)';
      cardAccentColor = '#10b981';
    }

    return (
      <div 
        key={task.id} 
        style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '16px', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle top indicator bar representing task type */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: cardAccentColor, opacity: 0.8 }} />

        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                background: badgeBg,
                color: badgeColor,
                border: `1px solid ${badgeBorder}`
              }}>
                {task.category || (isAppointment ? 'Appointment' : isPharmacy ? 'Pharmacy' : 'Routine')}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {task.time}
              </span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginTop: '8px', fontFamily: 'var(--font-heading)' }}>
              {task.title}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' }}>
              {task.desc}
            </p>
          </div>
          <button 
            onClick={() => handleDeleteTask(task.id)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-red)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Customizable search area/city configuration (Only for map-enabled search & appointment tasks) */}
        {(isPharmacy || isAppointment) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: isLightMode ? '#f5f3e9' : 'rgba(255, 255, 255, 0.02)', 
            padding: '8px 12px', 
            borderRadius: '10px', 
            border: '1px solid var(--border)',
            flexWrap: 'wrap',
            marginTop: '4px'
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'var(--text-muted)' }}>{t.locationLabel}</span>
            <input 
              type="text" 
              placeholder={t.enterLocation} 
              value={locations[task.id] !== undefined ? locations[task.id] : 'Addis Ababa'} 
              onChange={(e) => setLocations({ ...locations, [task.id]: e.target.value })}
              style={{
                background: isLightMode ? '#fff' : 'rgba(0,0,0,0.15)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text)',
                outline: 'none',
                minWidth: '160px',
                flex: 1
              }}
            />
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0 0 0' }} />

        {/* Action Buttons Panel */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>

          {/* 3. Google Calendar Action */}
          {isAppointment && (
            <button
              disabled={status['schedule_routine_event'] === 'loading'}
              onClick={() => triggerMcpAction(task.id, 'schedule_routine_event', {
                summary: task.title,
                startTime: new Date(Date.now() + 24*60*60*1000).toISOString(), // Tomorrow
                endTime: new Date(Date.now() + 24*60*60*1000 + 30*60*1000).toISOString(),
              })}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', 
                background: 'rgba(99, 102, 241, 0.06)', color: '#6366f1', border: '1px solid rgba(99, 102, 241, 0.15)',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (status['schedule_routine_event'] !== 'loading') e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.06)'; }}
            >
              <Calendar size={14} />
              {status['schedule_routine_event'] === 'loading' ? t.booking : `${t.scheduleButton}`}
            </button>
          )}

          {/* 4. Send Email Action */}
          <button
            disabled={status['send_health_email'] === 'loading'}
            onClick={() => triggerMcpAction(task.id, 'send_health_email', {
              to: user?.email || 'patient@example.com',
              subject: `Divya AI: Clinical Alert - ${task.title}`,
              body: `<h3>Clinical Action Alert</h3><p>Hello,</p><p>This is a reminder from your assistant Divya to fulfill your action task:</p><p><strong>${task.title}</strong></p><p>Description: ${task.desc}</p>`
            })}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.06)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.15)',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { if (status['send_health_email'] !== 'loading') e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; }}
          >
            <Mail size={14} />
            {status['send_health_email'] === 'loading' ? t.emailing : `${t.emailButton}`}
          </button>
        </div>

        {/* Real-time MCP Result Box */}
        {Object.values(status).some(s => s === 'success' || s === 'error') && status.result && (
          <div style={{ marginTop: '8px', background: isLightMode ? '#f0ede4' : 'var(--surface-2)', border: '1px dashed var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <CheckCircle2 size={14} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t.liveResult}
              </span>
            </div>
            <pre style={{ margin: 0, fontSize: '12px', lineHeight: '1.6', color: 'var(--text)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', opacity: 0.95 }}>
              {status.result}
            </pre>
          </div>
        )}

      </div>
    );
  };

  // Sections config mapping
  const sectionGroups = [
    {
      id: 'appointments',
      title: t.appointments,
      icon: <Calendar size={18} style={{ color: '#6366f1' }} />,
      tasksList: appointmentTasks,
      emptyStateTitle: t.noAppointments,
      emptyStateDesc: t.noAppointmentsDesc
    },
    {
      id: 'search_places',
      title: t.searchPlaces,
      icon: <MapPin size={18} style={{ color: '#10b981' }} />,
      tasksList: searchTasks,
      emptyStateTitle: t.noSearch,
      emptyStateDesc: t.noSearchDesc
    },
    {
      id: 'routine',
      title: t.routine,
      icon: <ListChecks size={18} style={{ color: 'var(--accent)' }} />,
      tasksList: routineTasks,
      emptyStateTitle: t.noRoutine,
      emptyStateDesc: t.noRoutineDesc
    }
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', textAlign: 'left', height: '100%', overflowY: 'auto' }}>
      
      {/* Top Banner */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-heading)' }}>
            <Sparkles size={24} style={{ color: 'var(--accent)' }} />
            {t.title}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.5' }}>
            {t.subtitle}
          </p>
        </div>
      </div>

      {/* Categories & Filter Tabs Control */}
      {tasks.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '12px', 
          padding: '6px', 
          flexWrap: 'wrap',
          alignSelf: 'flex-start'
        }}>
          {/* All Actions Pill */}
          <button
            onClick={() => setActiveSection('all')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: activeSection === 'all' ? 'var(--accent)' : 'transparent',
              color: activeSection === 'all' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Activity size={14} />
            <span>{t.all}</span>
            <span style={{ 
              fontSize: '10.5px', 
              background: activeSection === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--border-active)', 
              color: activeSection === 'all' ? '#fff' : 'var(--text)', 
              padding: '2px 6px', 
              borderRadius: '10px',
              fontWeight: '800'
            }}>
              {tasks.length}
            </span>
          </button>

          {/* Section Pill Filters */}
          {sectionGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveSection(group.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: activeSection === group.id ? 'var(--accent)' : 'transparent',
                color: activeSection === group.id ? '#fff' : 'var(--text-muted)',
                border: 'none',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {group.icon}
              <span>{group.title}</span>
              <span style={{ 
                fontSize: '10.5px', 
                background: activeSection === group.id ? 'rgba(255,255,255,0.2)' : 'var(--border-active)', 
                color: activeSection === group.id ? '#fff' : 'var(--text)', 
                padding: '2px 6px', 
                borderRadius: '10px',
                fontWeight: '800'
              }}>
                {group.tasksList.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Tasks Render List Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {tasks.length === 0 ? (
          /* Global Empty State */
          <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '16px', padding: '50px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Activity size={36} style={{ margin: '0 auto 12px', color: 'var(--accent)', opacity: 0.8 }} />
            <strong style={{ display: 'block', fontSize: '16px', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
              {t.noTasks}
            </strong>
            <span style={{ display: 'block', fontSize: '13.5px', marginTop: '6px', maxWidth: '450px', margin: '6px auto 0', lineHeight: '1.5' }}>
              {t.noTasksDesc}
            </span>
          </div>
        ) : (
          /* Render Section Blocks */
          sectionGroups.map((group) => {
            // Skip this block if it's not active in filter
            if (activeSection !== 'all' && activeSection !== group.id) return null;

            // Skip rendering if block is empty and we are in "All" view to avoid clutter
            if (activeSection === 'all' && group.tasksList.length === 0) return null;

            return (
              <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Section Title Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  {group.icon}
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
                    {group.title}
                  </h3>
                  <span style={{ 
                    fontSize: '11px', 
                    background: 'var(--surface)', 
                    color: 'var(--text-muted)', 
                    border: '1px solid var(--border)', 
                    padding: '2px 8px', 
                    borderRadius: '10px',
                    fontWeight: '800'
                  }}>
                    {group.tasksList.length}
                  </span>
                </div>

                {/* Section Cards */}
                {group.tasksList.length === 0 ? (
                  /* Section-Specific Empty State (Only visible when explicitly viewing this tab) */
                  <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '16px', padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertCircle size={24} style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text)' }}>
                      {group.emptyStateTitle}
                    </strong>
                    <span style={{ display: 'block', fontSize: '12.5px', marginTop: '4px' }}>
                      {group.emptyStateDesc}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {group.tasksList.map(task => renderTaskCard(task, group.id === 'appointments' ? 'appointment' : group.id === 'search_places' ? 'search' : 'routine'))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}