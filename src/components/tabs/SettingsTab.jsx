import { useState, useEffect } from 'react';
import { User, Palette, Info, Moon, Sun, Languages, Volume2, VolumeX, Shield, Cpu, Globe, Lock } from 'lucide-react';
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
      let url = settings[urlKey] || "http://localhost:3001/mcp/updates";
      if (url.includes("your-api.com") || url.includes("gdrive") || url.includes("calendar") || url.includes("device-alarm")) {
        url = "http://localhost:3001/mcp/updates";
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
      <div className="settings-sidebar" style={{ width: '220px', borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[
          { id: 'Account', label: appLanguage === 'English' ? 'Account Profile' : 'የመገለጫ አካውንት', icon: <User size={16} /> },
          { id: 'Customization', label: appLanguage === 'English' ? 'App Preferences' : 'መተግበሪያ ምርጫዎች', icon: <Palette size={16} /> },
          { id: 'ModelCustomization', label: appLanguage === 'English' ? 'Model Customization' : 'የሞዴል ማስተካከያ', icon: <Cpu size={16} /> },
          { id: 'MCP', label: appLanguage === 'English' ? 'MCP Integrations' : 'የ-MCP ግንኙነቶች', icon: <Globe size={16} /> },
          { id: 'About', label: appLanguage === 'English' ? 'About Assistant' : 'ስለ ረዳቱ መግለጫ', icon: <Info size={16} /> },
          { id: 'Privacy', label: appLanguage === 'English' ? 'Policy & Terms' : 'ምስጢራዊነት እና የአጠቃቀም ውል', icon: <Shield size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 24px',
              background: activeSettingsTab === tab.id ? 'var(--surface-hover)' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${activeSettingsTab === tab.id ? 'var(--accent)' : 'transparent'}`,
              color: activeSettingsTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings Content Area */}
      <div style={{ flex: 1, padding: '16px 40px', overflowY: 'auto', textAlign: 'left' }}>
        {activeSettingsTab === 'Account' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
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
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              {appLanguage === 'English' ? 'App Preferences' : 'የመተግበሪያ ምርጫዎች'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setAppLanguage(appLanguage === 'English' ? 'Amharic' : 'English')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <Languages size={18} />
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--text)' }}>{appLanguage === 'English' ? 'Response Language' : 'የምላሽ ቋንቋ'}</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{appLanguage === 'English' ? 'Switch between English and Amharic' : 'በእንግሊዝኛ እና በአማርኛ መካከል ይቀያይሩ'}</span>
                  </div>
                </div>
                <label className="settings-toggle-switch" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={appLanguage === 'Amharic'} onChange={() => setAppLanguage(appLanguage === 'English' ? 'Amharic' : 'English')} />
                  <span className="settings-toggle-thumb"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setIsLightMode(!isLightMode)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: !isLightMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: !isLightMode ? '#6366f1' : '#f59e0b' }}>
                    {!isLightMode ? <Moon size={18} /> : <Sun size={18} />}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--text)' }}>{appLanguage === 'English' ? 'Dark Mode' : 'ጨለማ ገጽታ'}</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{appLanguage === 'English' ? 'Use the dark theme across the app' : 'ጨለማ ገጽታን በመላው መተግበሪያ ይጠቀሙ'}</span>
                  </div>
                </div>
                <label className="settings-toggle-switch" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={!isLightMode} onChange={() => setIsLightMode(!isLightMode)} />
                  <span className="settings-toggle-thumb"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setIsTtsEnabled(!isTtsEnabled)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', background: isTtsEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: isTtsEnabled ? '#22c55e' : '#64748b' }}>
                    {isTtsEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '14.5px', color: 'var(--text)' }}>{appLanguage === 'English' ? 'Text-to-Speech' : 'ጽሑፍን ወደ ድምጽ'}</strong>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{appLanguage === 'English' ? 'Automatically read AI responses aloud' : 'የ AI ምላሾችን በራስ-ሰር ድምጽ ያንብቡ'}</span>
                  </div>
                </div>
                <label className="settings-toggle-switch" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={isTtsEnabled} onChange={() => setIsTtsEnabled(!isTtsEnabled)} />
                  <span className="settings-toggle-thumb"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeSettingsTab === 'Privacy' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              {appLanguage === 'English' ? 'Policy & Terms' : 'ምስጢራዊነት እና የአጠቃቀም ውል'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* HIPAA Security Banner */}
              <div style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ color: '#10b981', display: 'flex', padding: '4px' }}><Shield size={18} /></span>
                <div>
                  <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--text)', marginBottom: '4px' }}>{appLanguage === 'English' ? 'HIPAA Compliant & Fully Encrypted' : 'የ-HIPAA ደንብን የጠበቀ እና ሙሉ በሙሉ የተመሰጠረ'}</strong>
                  <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                    {appLanguage === 'English'
                      ? 'Your medical sessions, transcripts, and recovery plans are fully encrypted using military-grade AES-256 standard and stored securely in accordance with strict healthcare privacy regulations.'
                      : 'የእርስዎ የህክምና ክፍለ ጊዜዎች፣ የድምጽ ቅጂዎች እና የህክምና እቅዶች በከፍተኛ የAES-256 የደህንነት ደረጃ መሰረት ሙሉ በሙሉ የተመሰጠሩ እና በጤና ጥበቃ ምስጢራዊነት ደንቦች መሰረት ደህንነታቸው የተጠበቀ ናቸው።'}
                  </p>
                </div>
              </div>

              {/* 1. Privacy Policy Text Block */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {appLanguage === 'English' ? '1. Privacy Policy' : '1. የምስጢራዊነት ፖሊሲ'}
                </div>
                <div style={{
                  maxHeight: '120px',
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
                      <strong>Data Ownership:</strong> You retain full ownership of all medical queries, chat logs, and diagnostic recordings entered into Divya AI. We never sell, lease, or rent your clinical records to insurance agencies, pharmaceutical corporations, or advertising networks.<br/><br/>
                      <strong>Data Transmission:</strong> All communications between your device and the Gemini clinical reasoning engine are executed via secure TLS/SSL tunnels.<br/><br/>
                      <strong>Data Retention:</strong> You can completely erase your entire clinical history and delete your diagnostic master reports at any time from the "Diagnostic Sessions" panel.
                    </>
                  ) : (
                    <>
                      <strong>የመረጃ ባለቤትነት:</strong> በዲቭያ AI ውስጥ የሚያስገቧቸው ማናቸውም የህክምና ጥያቄዎች፣ የውይይት መዝገቦች እና የምርመራ ቅጂዎች ሙሉ ባለቤትነት የእርስዎ ብቻ ነው። የእርስዎን ክሊኒካዊ መዛግብት ለኢንሹራንስ ድርጅቶች፣ ለመድኃኒት አምራች ኩባንያዎች ወይም ለማስታገሻ ወኪሎች አናጋራም።<br/><br/>
                      <strong>የመረጃ ማስተላለፍ የደህንነት ደረጃ:</strong> በእርስዎ መሣሪያ እና በጀሚኒ ክሊኒካዊ አስተሳሰብ ሞተር መካከል የሚደረጉ ማናቸውም ግንኙነቶች በTLS/SSL የደህንነት መስመሮች በኩል ብቻ ይከናወናሉ።<br/><br/>
                      <strong>መረጃን የማስወገድ መብት:</strong> ከ"የምርመራ ክፍለ ጊዜዎች" ሰሌዳ ላይ የእርስዎን አጠቃላይ የህክምና ታሪክ እና ዋና የምርመራ ሪፖርቶች በማንኛውም ጊዜ ሙሉ በሙሉ መሰረዝ ይችላሉ።
                    </>
                  )}
                </div>
              </div>

              {/* 2. Terms of Service Text Block */}
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  {appLanguage === 'English' ? '2. Terms of Service' : '2. የአጠቃቀም ውል እና ስምምነቶች'}
                </div>
                <div style={{
                  maxHeight: '120px',
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



            </div>
          </div>
        )}

        {activeSettingsTab === 'ModelCustomization' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
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
                  <option value="gemini-2.5-flash" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 2.5 Flash (Default/Recommended)</option>
                  <option value="gemini-1.5-flash" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 1.5 Flash</option>
                  <option value="gemini-1.5-pro" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 1.5 Pro (Expert Diagnostics)</option>
                  <option value="gemini-2.0-flash" style={{ background: isLightMode ? '#ffffff' : '#1e242b', color: isLightMode ? '#1a202c' : '#ffffff' }}>Gemini 2.0 Flash (Fast Response)</option>
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

        {activeSettingsTab === 'MCP' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              {appLanguage === 'English' ? 'Model Context Protocol (MCP) Integrations' : 'የ-MCP ውጫዊ ግንኙነቶች'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Google Drive Integration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '18px', 
                    background: 'var(--surface-2)', 
                    borderRadius: '16px', 
                    border: `1px solid ${settings.mcpGoogleDrive ? 'var(--accent)' : 'var(--border)'}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: settings.mcpGoogleDrive ? 'var(--glow-accent)' : 'none'
                  }} 
                  onClick={() => triggerConnectionFlow('mcpGoogleDrive', settings.mcpGoogleDrive)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: isLightMode ? '#f8f9fa' : 'rgba(255,255,255,0.03)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 1443 1250" style={{ display: 'block', width: '24px', height: '24px' }}>
                        <path d="M481 0h481l481 833H962L481 0z" fill="#0066da"/>
                        <path d="M0 833l241-417h961L962 833H0z" fill="#00ac47"/>
                        <path d="M241 416L481 0h962l-241 416H241z" fill="#ffba00"/>
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text)' }}>
                        {appLanguage === 'English' ? 'Google Drive Link' : 'የ Google Drive ግንኙነት'}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {appLanguage === 'English' ? 'Auto-save diagnostic reports & clinical summaries' : 'የጤና ሪፖርቶችን በ Drive ውስጥ በራስ-ሰር ያስቀምጡ'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    {settings.mcpGoogleDrive ? (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        CONNECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.03)', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` }}>
                        DISCONNECTED
                      </span>
                    )}
                    <label className="settings-toggle-switch" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={settings.mcpGoogleDrive} onChange={() => triggerConnectionFlow('mcpGoogleDrive', settings.mcpGoogleDrive)} />
                      <span className="settings-toggle-thumb"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Google Calendar Integration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '18px', 
                    background: 'var(--surface-2)', 
                    borderRadius: '16px', 
                    border: `1px solid ${settings.mcpGoogleCalendar ? 'var(--accent)' : 'var(--border)'}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: settings.mcpGoogleCalendar ? 'var(--glow-accent)' : 'none'
                  }} 
                  onClick={() => triggerConnectionFlow('mcpGoogleCalendar', settings.mcpGoogleCalendar)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: isLightMode ? '#f8f9fa' : 'rgba(255,255,255,0.03)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 192 192" style={{ display: 'block', width: '24px', height: '24px' }}>
                        <rect x="24" y="24" width="144" height="144" rx="28" fill="#ffffff" stroke="#1a73e8" strokeWidth="12"/>
                        <path d="M24 24h144v48H24z" fill="#1a73e8"/>
                        <text x="96" y="132" textAnchor="middle" fill="#1a73e8" fontSize="64" fontWeight="900" fontFamily="sans-serif">31</text>
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text)' }}>
                        {appLanguage === 'English' ? 'Google Calendar Link' : 'የ Google Calendar ግንኙነት'}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {appLanguage === 'English' ? 'Ambiently schedule physical checkups & diagnostic appointments' : 'የህክምና ቀጠሮዎችን በራስ-ሰር ያመሳስሉ'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    {settings.mcpGoogleCalendar ? (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        CONNECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.03)', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` }}>
                        DISCONNECTED
                      </span>
                    )}
                    <label className="settings-toggle-switch" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={settings.mcpGoogleCalendar} onChange={() => triggerConnectionFlow('mcpGoogleCalendar', settings.mcpGoogleCalendar)} />
                      <span className="settings-toggle-thumb"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Email Integration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '18px', 
                    background: 'var(--surface-2)', 
                    borderRadius: '16px', 
                    border: `1px solid ${settings.mcpEmail ? 'var(--accent)' : 'var(--border)'}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: settings.mcpEmail ? 'var(--glow-accent)' : 'none'
                  }} 
                  onClick={() => triggerConnectionFlow('mcpEmail', settings.mcpEmail)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: isLightMode ? '#f8f9fa' : 'rgba(255,255,255,0.03)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', width: '24px', height: '24px' }}>
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text)' }}>
                        {appLanguage === 'English' ? 'Email Notifications' : 'የኢሜል ማሳወቂያዎች'}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {appLanguage === 'English' ? 'Send medical reports and daily summaries straight to your inbox' : 'የጤና ሪፖርቶችን እና ዕለታዊ መግለጫዎችን በኢሜልዎ ይቀበሉ'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    {settings.mcpEmail ? (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        CONNECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.03)', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` }}>
                        DISCONNECTED
                      </span>
                    )}
                    <label className="settings-toggle-switch" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={settings.mcpEmail} onChange={() => triggerConnectionFlow('mcpEmail', settings.mcpEmail)} />
                      <span className="settings-toggle-thumb"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Google Maps Integration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '18px', 
                    background: 'var(--surface-2)', 
                    borderRadius: '16px', 
                    border: `1px solid ${settings.mcpGoogleMaps ? 'var(--accent)' : 'var(--border)'}`, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: settings.mcpGoogleMaps ? 'var(--glow-accent)' : 'none'
                  }} 
                  onClick={() => triggerConnectionFlow('mcpGoogleMaps', settings.mcpGoogleMaps)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '12px', background: isLightMode ? '#f8f9fa' : 'rgba(255,255,255,0.03)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', width: '24px', height: '24px' }}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '15px', color: 'var(--text)' }}>
                        {appLanguage === 'English' ? 'Google Maps Finder' : 'የ Google Maps መፈለጊያ'}
                      </strong>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {appLanguage === 'English' ? 'Locate nearby clinics, specialists, and 24/7 pharmacies automatically' : 'በአቅራቢያዎ ያሉ ክሊኒኮችን እና ፋርማሲዎችን በካርታ ላይ ያግኙ'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    {settings.mcpGoogleMaps ? (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.08)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                        CONNECTED
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.03)', padding: '4px 10px', borderRadius: '12px', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` }}>
                        DISCONNECTED
                      </span>
                    )}
                    <label className="settings-toggle-switch" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={settings.mcpGoogleMaps} onChange={() => triggerConnectionFlow('mcpGoogleMaps', settings.mcpGoogleMaps)} />
                      <span className="settings-toggle-thumb"></span>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
        {activeSettingsTab === 'About' && (
          <div className="settings-card-premium" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '640px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              {appLanguage === 'English' ? 'About Assistant' : 'ስለ ረዳቱ መግለጫ'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: 'white', fontSize: '24px' }}>🛡️</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '16px', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>Divya AI — Health Companion</strong>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Bilingual Diagnostic Assistant (Amharic & English)</span>
                </div>
              </div>

              <div style={{ padding: '16px 20px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.12)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ color: '#6366f1', display: 'flex', padding: '4px' }}><Info size={16} /></span>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: 'var(--text)', opacity: 0.95 }}>
                  {appLanguage === 'English'
                    ? 'This AI is an educational clinical assistant designed to support wellness awareness. It does not replace professional clinical diagnosis or consultation from a certified medical doctor.'
                    : 'ይህ AI የጤና ግንዛቤን ለማሳደግ የተዘጋጀ የትምህርት ረዳት ሲሆን፣ የባለሙያ ሀኪም ምርመራን ወይም ምክርን አይተካም።'}
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderTop: `1px solid ${isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`, paddingTop: '16px' }}>
                {['HIPAA Compliant', 'Real-time Streaming', 'Privacy & Terms'].map(badge => (
                  <span key={badge} style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', background: isLightMode ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}` }}>
                    {badge}
                  </span>
                ))}
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
            {activeConnectingService === 'mcpGoogleMaps' && (
              <span style={{ fontSize: '48px' }}>📍</span>
            )}

            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text)' }}>
                {activeConnectingService === 'mcpEmail' 
                  ? (appLanguage === 'English' ? 'Authorize Email Access' : 'የኢሜል ፈቃድ ጠይቅ')
                  : activeConnectingService === 'mcpGoogleMaps'
                  ? (appLanguage === 'English' ? 'Authorize Maps Locator' : 'የካርታ አገልግሎት ፍቃድ ጠይቅ')
                  : (appLanguage === 'English' ? 'Sign in with Google' : 'በ Google ይግቡ')}
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {activeConnectingService === 'mcpGoogleDrive' && (appLanguage === 'English' ? 'Divya requires access to read & write clinical PDF/CSV health records in your Drive.' : 'ዲቭያ በ Drive ውስጥ የክሊኒካል መዛግብትን ለማስቀመጥ ፈቃድ ይፈልጋል።')}
                {activeConnectingService === 'mcpGoogleCalendar' && (appLanguage === 'English' ? 'Divya requires access to manage clinical follow-ups and schedules in your Google Calendar.' : 'ዲቭያ በካላንደርዎ ላይ ቀጠሮዎችን ለማቀናጀት ፈቃድ ይፈልጋል።')}
                {activeConnectingService === 'mcpEmail' && (appLanguage === 'English' ? 'Divya requires permission to dispatch clinical treatment reports and daily wellness plans to your inbox.' : 'ዲቭያ የጤና ሪፖርቶችን እና ዕለታዊ መግለጫዎችን በኢሜልዎ ለመላክ ፍቃድ ይፈልጋል።')}
                {activeConnectingService === 'mcpGoogleMaps' && (appLanguage === 'English' ? 'Divya requires location permission to search for nearby medical clinics, pharmacies, and specialists.' : 'ዲቭያ በአቅራቢያዎ ያሉ የህክምና ተቋማትን እና ፋርማሲዎችን ለመፈለግ ፍቃድ ይፈልጋል።')}
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
