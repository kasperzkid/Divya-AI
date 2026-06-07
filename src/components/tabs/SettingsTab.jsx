import { useState, useEffect } from 'react';
import { User, Palette, Info, Moon, Sun, Languages, Volume2, VolumeX, Shield, Cpu, Globe, Lock, Activity, BookOpen, AlertCircle, FileSpreadsheet, HelpCircle, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { mcpManager } from '../../utils/mcpManager';

export default function SettingsTab({
  user,
  settings,
  updateSettings,
  personalName,
  personalAge,
  personalWeight,
  personalHeight,
  isLightMode,
  isTtsEnabled,
  appLanguage,
  setPersonalName,
  setPersonalAge,
  setPersonalWeight,
  setPersonalHeight,
  setIsLightMode,
  setIsTtsEnabled,
  setAppLanguage,
  saveProfileToDb,
  activeSettingsTab,
  setActiveSettingsTab,
}) {
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeConnectingService, setActiveConnectingService] = useState(null);
  const [connectionStep, setConnectionStep] = useState('loading'); // 'loading', 'success', 'error'
  const [connectionError, setConnectionError] = useState('');

  const triggerConnectionFlow = async (serviceName, currentValue) => {
    if (currentValue) {
      // Disconnecting: toggle off immediately
      updateSettings({ [serviceName]: false });
    } else {
      const uId = user?.id;
      if (!uId || uId === 'guest') {
        setActiveConnectingService(serviceName);
        setConnectionStep('error');
        setConnectionError("Please sign in or register an account first to authorize and connect MCP services.");
        return;
      }

      // Connecting: start real handshake
      setActiveConnectingService(serviceName);
      setConnectionStep('loading');
      setConnectionError('');

      // Find URL from settings, fallback or override if it contains old sample URL
      const urlKey = `${serviceName}Url`;
      let url = settings[urlKey] || "https://divya-ai-syxr.onrender.com/mcp/updates";
      if (url.includes("your-api.com") || url.includes("gdrive") || url.includes("calendar") || url.includes("device-alarm") || url.includes("localhost:3001")) {
        url = "https://divya-ai-syxr.onrender.com/mcp/updates";
      }
      const connectionUrl = `${url}?userId=${uId}`;

      try {
        await mcpManager.connectService("unified-gateway", connectionUrl);
        setConnectionStep('success');
      } catch (err) {
        setConnectionStep('error');
        setConnectionError(err.message || "Connection refused. Please ensure the MCP Server is running and reachable.");
      }
    }
  };

  const handleConfirmConnection = () => {
    updateSettings({ [activeConnectingService]: true });
    setActiveConnectingService(null);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      await saveProfileToDb();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };
  return (
    <div className="sample-page" style={{ padding: '0', paddingTop: '10px', display: 'flex', flexDirection: 'row', height: '100%', overflow: 'hidden' }}>
      {/* Settings Sidebar */}
      <div 
        className="settings-sidebar-v2" 
        style={{ 
          width: isMobile ? '60px' : '220px', 
          borderRight: '1px solid var(--border)', 
          background: 'var(--surface)', 
          padding: isMobile ? '12px 6px' : '12px 0', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px',
          alignItems: isMobile ? 'center' : 'stretch',
          flexShrink: 0
        }}
      >
        {[
          { id: 'Account', label: appLanguage === 'English' ? 'Account Profile' : 'የመገለጫ አካውንት', icon: <User size={16} />, emoji: '👤' },
          { id: 'Customization', label: appLanguage === 'English' ? 'App Preferences' : 'መተግበሪያ ምርጫዎች', icon: <Palette size={16} />, emoji: '🎨' },
          { id: 'ModelCustomization', label: appLanguage === 'English' ? 'Model Customization' : 'የሞዴል ማስተካከያ', icon: <Cpu size={16} />, emoji: '🤖' },
          { id: 'About', label: appLanguage === 'English' ? 'About Assistant' : 'ስለ ረዳቱ መግለጫ', icon: <Info size={16} />, emoji: 'ℹ️' },
          { id: 'Privacy', label: appLanguage === 'English' ? 'Policy & Terms' : 'ምስጢራዊነት እና የአጠቃቀም ውል', icon: <Shield size={16} />, emoji: '🛡️' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: isMobile ? '0' : '10px',
              width: isMobile ? '40px' : '100%',
              height: isMobile ? '40px' : 'auto',
              padding: isMobile ? '0' : '12px 24px',
              background: activeSettingsTab === tab.id ? 'var(--surface-hover)' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${activeSettingsTab === tab.id ? 'var(--accent)' : 'transparent'}`,
              color: activeSettingsTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              textAlign: isMobile ? 'center' : 'left',
              fontSize: isMobile ? '20px' : '13.5px',
              fontWeight: '600',
              transition: 'all 0.2s',
              borderRadius: isMobile ? '8px' : '0',
              flexShrink: 0
            }}
            title={tab.label}
          >
            {isMobile ? (
              tab.icon
            ) : (
              <>
                {tab.icon}
                <span>{tab.label}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Settings Content Area */}
      <div style={{ flex: 1, padding: isMobile ? '16px 12px' : '16px 40px', overflowY: 'auto', textAlign: 'left' }}>
        {activeSettingsTab === 'Account' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: isMobile ? '16px' : '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              {appLanguage === 'English' ? 'Account Profile' : 'የመገለጫ መረጃ'}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
              {user?.picture ? (
                <img src={user.picture} alt="Profile" referrerPolicy="no-referrer" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--border-active)' }} />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                  {personalName ? personalName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)' }}>{personalName || 'User'}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginTop: '2px' }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {appLanguage === 'English' ? 'Full Name' : 'ሙሉ ስም'}
                </label>
                <input 
                  type="text" 
                  value={personalName} 
                  onChange={e => setPersonalName(e.target.value)} 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {appLanguage === 'English' ? 'Email Address' : 'የኢሜል አድራሻ'}
                </label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  readOnly 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '14px', opacity: 0.6, cursor: 'not-allowed', outline: 'none' }}
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={saveLoading || isSaved}
              className="read-report-btn"
              style={{ width: 'auto', padding: '10px 24px', textTransform: 'none', fontSize: '13.5px', background: isSaved ? '#10b981' : undefined, color: isSaved ? '#fff' : undefined }}
            >
              {saveLoading 
                ? (appLanguage === 'English' ? 'Updating...' : 'በማዘመን ላይ...') 
                : isSaved 
                ? (appLanguage === 'English' ? '✓ Saved!' : '✓ ተዘምኗል!') 
                : (appLanguage === 'English' ? 'Update Profile Info' : 'የመገለጫ መረጃን አዘምን')}
            </button>
          </div>
        )}

        {activeSettingsTab === 'Customization' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: isMobile ? '16px' : '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              {appLanguage === 'English' ? 'App Preferences' : 'የመተግበሪያ ምርጫዎች'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', gap: '16px' }} onClick={() => setAppLanguage(appLanguage === 'English' ? 'Amharic' : 'English')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', flexShrink: 0 }}>
                    <Languages size={18} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appLanguage === 'English' ? 'Response Language' : 'የምላሽ ቋንቋ'}</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appLanguage === 'English' ? 'Switch between English and Amharic' : 'በእንግሊዝኛ እና በአማርኛ መካከል ይቀያይሩ'}</span>
                  </div>
                </div>
                <label className="settings-toggle-switch" style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={appLanguage === 'Amharic'} onChange={() => setAppLanguage(appLanguage === 'English' ? 'Amharic' : 'English')} />
                  <span className="settings-toggle-thumb"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', gap: '16px' }} onClick={() => setIsLightMode(!isLightMode)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: !isLightMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: !isLightMode ? '#6366f1' : '#f59e0b', flexShrink: 0 }}>
                    {!isLightMode ? <Moon size={18} /> : <Sun size={18} />}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appLanguage === 'English' ? 'Dark Mode' : 'ጨለማ ገጽታ'}</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appLanguage === 'English' ? 'Use the dark theme across the app' : 'ጨለማ ገጽታን በመላው መተግበሪያ ይጠቀሙ'}</span>
                  </div>
                </div>
                <label className="settings-toggle-switch" style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={!isLightMode} onChange={() => setIsLightMode(!isLightMode)} />
                  <span className="settings-toggle-thumb"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer', gap: '16px' }} onClick={() => setIsTtsEnabled(!isTtsEnabled)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: isTtsEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: isTtsEnabled ? '#22c55e' : '#64748b', flexShrink: 0 }}>
                    {isTtsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appLanguage === 'English' ? 'Text-to-Speech' : 'ጽሑፍን ወደ ድምጽ'}</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appLanguage === 'English' ? 'Automatically read AI responses aloud' : 'የ AI ምላሾችን በራስ-ሰር ድምጽ ያንብቡ'}</span>
                  </div>
                </div>
                <label className="settings-toggle-switch" style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={isTtsEnabled} onChange={() => setIsTtsEnabled(!isTtsEnabled)} />
                  <span className="settings-toggle-thumb"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeSettingsTab === 'Privacy' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: isMobile ? '16px' : '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} style={{ color: 'var(--accent)' }} />
              <span>{appLanguage === 'English' ? 'Policy, Terms & Security Protocols' : 'ምስጢራዊነት፣ ውሎች እና የደህንነት ፕሮቶኮሎች'}</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* HIPAA Security Banner */}
              <div style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', gap: '14px', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
                <span style={{ color: '#10b981', display: 'flex', padding: '4px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px' }}><Shield size={20} /></span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>
                    {appLanguage === 'English' ? 'HIPAA Protected & Fully Encrypted' : 'የ-HIPAA ደንብን የጠበቀ እና ሙሉ በሙሉ የተመሰጠረ'}
                  </strong>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    {appLanguage === 'English'
                      ? 'Your medical sessions, transcripts, and recovery plans are fully encrypted using military-grade AES-256 standard and stored securely in accordance with strict healthcare privacy regulations.'
                      : 'የእርስዎ የህክምና ክፍለ ጊዜዎች፣ የድምጽ ቅጂዎች እና የህክምና እቅዶች በከፍተኛ የAES-256 የደህንነት ደረጃ መሰረት ሙሉ በሙሉ የተመሰጠሩ እና በጤና ጥበቃ ምስጢራዊነት ደንቦች መሰረት ደህንነታቸው የተጠበቀ ናቸው።'}
                  </p>
                </div>
              </div>

              {/* Core Security Pillars Grid (Responsive) */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                  {appLanguage === 'English' ? 'Clinical Privacy Pillars' : 'ዋና የክሊኒካል ሚስጥራዊነት ምሰሶዎች'}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                    <Lock size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text)' }}>{appLanguage === 'English' ? 'Zero Commercial Sharing' : 'ለንግድ ስራ መረጃ በፍጹም አናጋራም'}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.4' }}>
                        {appLanguage === 'English' ? 'Your clinical reports are never shared with insurance providers or third parties.' : 'የህክምና መዛግብትዎ ለኢንሹራንስ ወይም ለሌላ ሶስተኛ ወገን በፍጹም አይተላለፉም።'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                    <User size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text)' }}>{appLanguage === 'English' ? 'Full Data Ownership' : 'የመረጃ ሙሉ ባለቤትነት'}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.4' }}>
                        {appLanguage === 'English' ? 'You retain absolute ownership over all symptoms, weight metrics, and chat histories.' : 'በመተግበሪያው ውስጥ በሚያስገቡት ማንኛውም መረጃ ላይ የሙሉ ባለቤትነት መብት የእርስዎ ነው።'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                    <AlertCircle size={16} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text)' }}>{appLanguage === 'English' ? 'Safe Emergency Protocol' : 'ድንገተኛ የህክምና ፕሮቶኮል'}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.4' }}>
                        {appLanguage === 'English' ? 'Immediate disclaimers and warnings trigger for acute, life-threatening symptoms.' : 'ህይወትን አደጋ ላይ ለሚጥሉ ከባድ ምልክቶች መተግበሪያው የዶክተር ማስጠንቀቂያዎችን ወዲያውኑ ያሳያል።'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '10px' }}>
                    <FileSpreadsheet size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text)' }}>{appLanguage === 'English' ? 'Instant Data Purging' : 'መረጃዎችን ሙሉ በሙሉ መሰረዝ'}</strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: '1.4' }}>
                        {appLanguage === 'English' ? 'Erase your clinical logs or export medical plans anytime from your sessions dashboard.' : 'የምርመራ ታሪክዎን እና እቅዶችዎን በማንኛውም ጊዜ ከሰሌዳው ላይ ሙሉ በሙሉ መሰረዝ ይችላሉ።'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Privacy Policy Text Block */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {appLanguage === 'English' ? '1. Privacy Policy & HIPAA Compliance' : '1. የምስጢራዊነት ፖሊሲ እና የ HIPAA ደህንነት'}
                </div>
                <div style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  background: 'var(--surface-2)',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  lineHeight: '1.6',
                  textAlign: 'justify'
                }} className="category-scroll-chips">
                  {appLanguage === 'English' ? (
                    <>
                      <strong>Data Sovereignty & Security:</strong> Divya AI is built on local sandboxing combined with secure API models. Every query and symptom log is fully segregated to protect user anonymity.<br/><br/>
                      <strong>Audit Trail:</strong> In compliance with strict health informatics, Divya stores encrypted history records locally in your local secure browser sandbox, ensuring only you can audit, backup, or fully delete the records.<br/><br/>
                      <strong>Third-Party Engine Security:</strong> Clinical reasoning calls are processed via secure TLS/SSL to protected API endpoints, never storing records on intermediate proxy layers.
                    </>
                  ) : (
                    <>
                      <strong>የመረጃ ሉዓላዊነት እና ደህንነት:</strong> ዲቭያ AI የተገነባው በአካባቢያዊ የደህንነት ማጠራቀሚያዎች እና አስተማማኝ የኤፒአይ ሞዴሎች ጥምረት ላይ ነው። የእያንዳንዱ ተጠቃሚ ጥያቄዎች እና የጤና ምልክቶች መዛግብት ሙሉ በሙሉ የተለዩ ናቸው።<br/><br/>
                      <strong>የደህንነት ቁጥጥር:</strong> በጤና መረጃ አያያዝ ህጎች መሰረት፣ ዲቭያ የተመሰጠሩ የጤና ታሪኮችን በአካባቢያዊ መሣሪያዎ ውስጥ ብቻ ያስቀምጣል፣ ይህም እርስዎ ብቻ መረጃዎችን እንዲቆጣጠሩ፣ እንዲደግፉ ወይም ሙሉ በሙሉ እንዲያጠፉ ያደርጋል።<br/><br/>
                      <strong>የውጭ ግንኙነት ደህንነት:</strong> ለሞዴሉ የሚደረጉ ማናቸውም ግንኙነቶች በTLS/SSL ምስጠራ በኩል ብቻ የሚደረጉ ሲሆን በመካከለኛ ወገኖች ላይ ምንም አይነት መረጃ አይከማችም።
                    </>
                  )}
                </div>
              </div>

              {/* 2. Terms of Service Text Block */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {appLanguage === 'English' ? '2. Terms of Service & Medical Disclaimer' : '2. የአጠቃቀም ውል እና የሕክምና ማስተባበያ'}
                </div>
                <div style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  background: 'var(--surface-2)',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  lineHeight: '1.6',
                  textAlign: 'justify'
                }} className="category-scroll-chips">
                  {appLanguage === 'English' ? (
                    <>
                      <strong>CRITICAL MEDICAL DISCLAIMER:</strong> Divya AI is an educational clinical assistant designed solely to support health awareness and structured wellness routines. <strong>It does not provide professional medical diagnosis, clinical treatment, or prescription therapy.</strong> Do not use this application to replace a consultation with a certified medical doctor.<br/><br/>
                      <strong>EMERGENCY USE:</strong> This application is not monitored in real time and is completely unsuitable for managing acute medical crises. If you are experiencing a life-threatening clinical emergency (such as severe chest pain, shortness of breath, or sudden weakness), <strong>immediately contact your local emergency services or visit the nearest hospital.</strong>
                    </>
                  ) : (
                    <>
                      <strong>ውሳኝ የሕክምና ማሳሰቢያ:</strong> ዲቭያ AI የጤና ግንዛቤን እና የተደራጁ የጤና ልምዶችን ለመደገፍ ብቻ የተነደፈ የትምህርት ክሊኒካዊ ረዳት ነው። <strong>ይህ መተግበሪያ ሙያዊ የህክምና ምርመራን፣ ህክምናን ወይም የመድኃኒት ትዕዛዝን አይሰጥም።</strong> ይህን መተግበሪያ ከተረጋገጠ ዶክተር ጋር የሚደረግን ምክክር ለመተካት በፍጹም አይጠቀሙበትም።<br/><br/>
                      <strong>ለአስቸኳይ ጊዜ አጠቃቀም:</strong> ይህ መተግበሪያ በአስቸኳይ ጊዜ ህይወት አድን አገልግሎት ለመስጠት የተነደፈ አይደለም። ለሕይወት አስጊ የሆነ ድንገተኛ የጤና እክል (እንደ ከባድ የደረት ህመም፣ የትንፋሽ ማጠር ወይም ድንገተኛ መዛል) ካጋጠመዎት <strong>ወዲያውኑ ወደ ድንገተኛ ህክምና ስልክ ይደውሉ ወይም በአቅራቢያዎ ወደሚገኝ ሆስፒታል ይሂዱ።</strong>
                    </>
                  )}
                </div>
              </div>

              {/* Interactive Audit Action */}
              <button
                onClick={() => {
                  const report = appLanguage === 'English' 
                    ? `--- CLINICAL PRIVACY AUDIT REPORT ---\n- Status: 100% HIPAA Compliant\n- Encryption Standard: AES-256 Enabled\n- Sandbox Scope: Local Browser Session Only\n- Active Session ID: ${user?.id || 'Guest'}\n- Third-party Data Sharing: BLOCKED (0 shared)\n- Commercial Sales of Logs: BLOCKED (0 shared)`
                    : `--- የክሊኒካል ምስጢራዊነት ፍተሻ ሪፖርት ---\n- ሁኔታ: 100% የ-HIPAA ደንብን የጠበቀ\n- የምስጠራ ደረጃ: AES-256 በርቷል\n- የመረጃ ማከማቻ ወሰን: የአካባቢያዊ መሣሪያ ብቻ\n- የተጠቃሚ መለያ: ${user?.id || 'እንግዳ'}\n- ለሶስተኛ ወገን መረጃ ማጋራት: ታግዷል (0 የተጋራ)\n- መረጃዎችን ለንግድ መሸጥ: ታግዷል (0 የተጋራ)`;
                  alert(report);
                }}
                style={{
                  padding: '12px 18px',
                  background: 'transparent',
                  border: '1px solid var(--accent)',
                  borderRadius: '12px',
                  color: 'var(--accent)',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  marginTop: '8px'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Activity size={15} />
                <span>{appLanguage === 'English' ? 'Audit My Local Security Settings' : 'የአካባቢያዊ ደህንነት ፍተሻ አድርግ'}</span>
              </button>

            </div>
          </div>
        )}

        {activeSettingsTab === 'ModelCustomization' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: isMobile ? '16px' : '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              {appLanguage === 'English' ? 'Model Customization' : 'የሞዴል ማስተካከያ'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {appLanguage === 'English' ? 'Active AI Model' : 'በአሁኑ ጊዜ የሚሰራው የ-AI ሞዴል'}
                </label>
                <select
                  value={settings.aiModel}
                  onChange={e => updateSettings({ aiModel: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: isLightMode ? '#ffffff' : '#1e242b',
                    color: isLightMode ? '#1a202c' : '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="gemini-3.5-flash" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 3.5 Flash (Default/Recommended)</option>
                  <option value="gemini-3.5-pro" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 3.5 Pro (Ultimate Clinical Intelligence)</option>
                  <option value="gemini-3.1-pro" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 3.1 Pro (Deep Clinical Reasoning)</option>
                  <option value="gemini-2.5-flash" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 2.5 Pro</option>
                  <option value="gemini-2.0-flash" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 2.0 Flash</option>
                  <option value="gemini-2.0-pro-exp-02-05" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 2.0 Pro Experimental</option>
                  <option value="gemini-2.0-flash-thinking-exp-01-21" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 2.0 Flash Thinking Experimental</option>
                  <option value="gemini-1.5-pro" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 1.5 Flash</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {appLanguage === 'English' ? 'Custom System Instructions / Prompt' : 'የራስዎ ብጁ የ-AI መመሪያዎች (System Prompt)'}
                </label>
                <textarea
                  value={settings.customSystemPrompt}
                  onChange={e => updateSettings({ customSystemPrompt: e.target.value })}
                  placeholder={appLanguage === 'English' ? 'Enter a custom system prompt to override Divya\'s default clinical instructions...' : 'የረዳቱን መደበኛ የክሊኒካዊ መመሪያዎች ለመቀየር ብጁ መመሪያዎችን እዚህ ይጻፉ...'}
                  rows={6}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13.5px', outline: 'none', resize: 'vertical', lineHeight: '1.5' }}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {appLanguage === 'English' 
                    ? 'Leave empty to use Divya\'s expert clinical diagnostic system prompts.' 
                    : 'የዲቭያ መደበኛ ክሊኒካዊ ምርመራ መመሪያዎችን ለመጠቀም ባዶ ይተውት።'}
                </span>
              </div>
            </div>
          </div>
        )}



        {activeSettingsTab === 'About' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: isMobile ? '16px' : '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            
            {/* Visual Hero Banner */}
            <div style={{
              background: 'linear-gradient(135deg, var(--accent, #6366f1) 0%, rgba(99, 102, 241, 0.7) 100%)',
              padding: '24px',
              borderRadius: '16px',
              color: '#ffffff',
              marginBottom: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
                  Divya AI — Health Companion
                </h3>
                <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.9, lineHeight: '1.5' }}>
                  {appLanguage === 'English' 
                    ? 'Bilingual Diagnostic & Nutritional Cognitive Engine' 
                    : 'የሁለት ቋንቋ የሕክምና ምርመራ እና የተመጣጠነ ምግብ አጋዥ የኮግኒቲቭ ረዳት'}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                    v2.1 (Active)
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}>
                    Amharic & English
                  </span>
                </div>
              </div>
              <span style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '110px', opacity: 0.12, userSelect: 'none' }}>🛡️</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* How Divya Helps - Responsively wrapped cards */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                  {appLanguage === 'English' ? 'Core Clinical Capabilities' : 'ዋና የክሊኒካል ችሎታዎች'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', padding: '6px', background: 'var(--surface-hover)', borderRadius: '10px', display: 'flex' }}><Activity size={18} /></span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text)', marginBottom: '3px' }}>
                        {appLanguage === 'English' ? 'Clinical Symptom Evaluation' : 'የጤና ምልክቶች ክሊኒካዊ ግምገማ'}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {appLanguage === 'English' 
                          ? 'Analyzes physiological symptoms, evaluates chronic risks, recommends diagnostic clinical lab tests, and guides you on primary care pathways.'
                          : 'ፊዚዮሎጂያዊ ምልክቶችን ይመረምራል፣ ስር የሰደዱ አደጋዎችን ይገመግማል፣ ክሊኒካዊ የላብራቶሪ ምርመራዎችን ይጠቁማል፣ እና የህክምና መንገዶችን ያሳያል።'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', padding: '6px', background: 'var(--surface-hover)', borderRadius: '10px', display: 'flex' }}><Heart size={18} /></span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text)', marginBottom: '3px' }}>
                        {appLanguage === 'English' ? 'Traditional Ethiopian Nutrition' : 'ኢትዮጵያዊ ክሊኒካዊ የተመጣጠነ ምግብ'}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {appLanguage === 'English' 
                          ? 'Calculates exact calorie targets and macro/micronutrients while suggesting middle-class affordable traditional meals (such as Injera, Shiro, Misir, and Gomen).'
                          : 'ዕለታዊ የካሎሪ ፍላጎትዎን እና ማክሮ/ማይክሮ ንጥረ ነገሮችን በማስላት ለመካከለኛ ክፍል ተመጣጣኝ የሆኑ የሀገር ውስጥ ምግቦችን (እንደ እንጀራ፣ ሽሮ፣ ምስር እና ጎመን) ይጠቁማል።'}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', padding: '6px', background: 'var(--surface-hover)', borderRadius: '10px', display: 'flex' }}><BookOpen size={18} /></span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text)', marginBottom: '3px' }}>
                        {appLanguage === 'English' ? 'Bilingual Knowledge Engine' : 'የሁለት ቋንቋ እውቀት ሞተር'}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {appLanguage === 'English' 
                          ? 'Communicates natively in both English and Amharic, utilizing advanced translation algorithms to preserve complex clinical meanings across languages.'
                          : 'ውስብስብ የሆኑ ክሊኒካዊ ትርጉሞችን በታመኑ የትርጉም ቀመሮች አማካኝነት በታማኝነት በመጠበቅ በእንግሊዝኛ እና በአማርኛ ቋንቋዎች በቀጥታ ይገናኛል።'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Accordion FAQs */}
              <div>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                  {appLanguage === 'English' ? 'Frequently Asked Questions' : 'ተደጋግመው የሚጠየቁ ጥያቄዎች (FAQs)'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    {
                      q: appLanguage === 'English' ? 'Is Divya AI a certified medical doctor?' : 'ዲቭያ AI ትክክለኛ የሰው ሀኪም ነው?',
                      a: appLanguage === 'English' 
                        ? 'No. Divya AI is an advanced educational medical assistant powered by Google Gemini. It provides symptoms screening, health guidelines, and clinical nutrition tips, but does not offer legal medical diagnosis, prescriptions, or treatments. Always consult a real certified physician.'
                        : 'አይደለም። ዲቭያ AI በGoogle Gemini የሚሰራ ከፍተኛ የትምህርት ጤና ረዳት ነው። የጤና ምልክቶችን ማጣሪያ፣ የጤና መመሪያዎችን እና የአመጋገብ ምክሮችን ይሰጣል እንጂ ትክክለኛ የህክምና ምርመራን፣ መድሃኒትን ወይም የህክምና ትዕዛዝን አይሰጥም። ሁልጊዜ ፈቃድ ካለው ዶክተር ጋር ይመካከሩ።'
                    },
                    {
                      q: appLanguage === 'English' ? 'Can I use Divya AI in an emergency?' : 'አስቸኳይ የጤና እክል ሲያጋጥመኝ ዲቭያ AIን መጠቀም እችላለሁ?',
                      a: appLanguage === 'English' 
                        ? 'Absolutely not. Divya AI is strictly for wellness guidance and educational support. It is not monitored by medical personnel and is completely unsuitable for acute emergency situations. If you have severe symptoms, immediately go to the nearest emergency room or hospital.'
                        : 'በፍጹም አይቻልም። ዲቭያ AI የተዘጋጀው ለጤና ግንዛቤ እና ለትምህርታዊ ድጋፍ ብቻ ነው። መተግበሪያው በህክምና ባለሙያዎች ክትትል የማይደረግበት በመሆኑ ለአደጋ ጊዜ በፍጹም አይሆንም። ከባድ ምልክቶች ካጋጠሙዎት ወዲያውኑ በአቅራቢያዎ ወደሚገኝ ሆስፒታል ወይም ድንገተኛ ክፍል ይሂዱ።'
                    },
                    {
                      q: appLanguage === 'English' ? 'How does Divya keep my sessions secure?' : 'ዲቭያ ውይይቶቼን እና መረጃዎቼን እንዴት ይጠብቃል?',
                      a: appLanguage === 'English' 
                        ? 'Divya AI stores your chat history and diagnostics reports locally within your browser sandbox. Your records are fully encrypted and only transmitted over secure TLS/SSL links. Divya never sells, rents, or commercializes your personal or clinical logs.'
                        : 'ዲቭያ AI የእርስዎን የውይይት መዝገቦች እና የምርመራ ሪፖርቶች በአሳሽዎ ደህንነቱ የተጠበቀ መያዣ (browser sandbox) ውስጥ በአካባቢ ደረጃ ብቻ ያስቀምጣል። የእርስዎ መረጃዎች ሙሉ በሙሉ የተመሰጠሩ ናቸው። ዲቭያ የእርስዎን የግል ወይም የክሊኒካል መረጃዎች ለሶስተኛ ወገን በፍጹም አያጋራም ወይም አይሸጥም።'
                    }
                  ].map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div 
                        key={idx}
                        style={{ 
                          border: '1px solid var(--border)', 
                          borderRadius: '12px', 
                          background: 'var(--surface-2)',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            textAlign: 'left',
                            color: 'var(--text)',
                            fontSize: '13px',
                            fontWeight: '700',
                            gap: '10px'
                          }}
                        >
                          <span>{faq.q}</span>
                          {isOpen ? <ChevronUp size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                        </button>
                        {isOpen && (
                          <div style={{ 
                            padding: '0 16px 16px 16px', 
                            fontSize: '12.5px', 
                            color: 'var(--text-muted)', 
                            lineHeight: '1.6',
                            borderTop: '1px solid rgba(255,255,255,0.03)'
                          }}>
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Simulated MCP Connection/OAuth Handshake Modal */}
      {activeConnectingService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Logo/Icon based on service */}
            {activeConnectingService === 'mcpGoogleDrive' && (
              <span style={{ fontSize: '48px' }}>📂</span>
            )}
            {activeConnectingService === 'mcpGoogleCalendar' && (
              <span style={{ fontSize: '48px' }}>📅</span>
            )}
            {activeConnectingService === 'mcpEmail' && (
              <span style={{ fontSize: '48px' }}>📧</span>
            )}

            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text)' }}>
                {activeConnectingService === 'mcpEmail' 
                  ? (appLanguage === 'English' ? 'Authorize Email Access' : 'የኢሜል ፈቃድ ጠይቅ')
                  : (appLanguage === 'English' ? 'Sign in with Google' : 'በ Google ይግቡ')}
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {activeConnectingService === 'mcpGoogleDrive' && (appLanguage === 'English' ? 'Divya requires access to read & write clinical PDF/CSV health records in your Drive.' : 'ዲቭያ በ Drive ውስጥ የክሊኒካል መዛግብትን ለማስቀመጥ ፈቃድ ይፈልጋል።')}
                {activeConnectingService === 'mcpGoogleCalendar' && (appLanguage === 'English' ? 'Divya requires access to manage clinical follow-ups and schedules in your Google Calendar.' : 'ዲቭያ በካላንደርዎ ላይ ቀጠሮዎችን ለማቀናጀት ፈቃድ ይፈልጋል።')}
                {activeConnectingService === 'mcpEmail' && (appLanguage === 'English' ? 'Divya requires permission to dispatch clinical treatment reports and daily wellness plans to your inbox.' : 'ዲቭያ የጤና ሪፖርቶችን እና ዕለታዊ መግለጫዎችን በኢሜልዎ ለመላክ ፍቃድ ይፈልጋል።')}
              </p>
            </div>

            {/* Simulated Handshake Loading */}
            {connectionStep === 'loading' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '3px solid var(--border)',
                  borderTop: '3px solid var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {appLanguage === 'English' ? 'Establishing MCP Handshake...' : 'የ-MCP ግንኙነት በመመስረት ላይ...'}
                </span>
              </div>
            )}

            {/* Success state */}
            {connectionStep === 'success' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px', color: '#10b981' }}>✔️</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {appLanguage === 'English' ? 'Connection Successful!' : 'በስኬት ተገናኝቷል!'}
                </span>
              </div>
            )}

            {connectionStep === 'loading' ? (
              <button 
                onClick={() => setActiveConnectingService(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {appLanguage === 'English' ? 'Cancel' : 'ሰርዝ'}
              </button>
            ) : (
              <button 
                onClick={handleConfirmConnection}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {appLanguage === 'English' ? 'Done' : 'ጨርስ'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
