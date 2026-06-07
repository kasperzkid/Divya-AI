import { useState, useEffect } from 'react';

const defaultSettings = {
  personalName: 'Guest',
  personalAge: '30',
  personalWeight: '70',
  personalHeight: '175',
  appLanguage: 'Amharic',
  isLightMode: false,
  isTtsEnabled: true,
  contextLimit: '8192',
  webSearchIntegration: true,
  aiModel: 'gemini-2.5-flash',
  customSystemPrompt: '',
  mcpGoogleDrive: false,
  mcpGoogleDriveUrl: 'https://divya-ai-syxr.onrender.com/mcp/updates',
  mcpGoogleCalendar: false,
  mcpGoogleCalendarUrl: 'https://divya-ai-syxr.onrender.com/mcp/updates',
  mcpEmail: false,
  mcpEmailUrl: 'https://divya-ai-syxr.onrender.com/mcp/updates',
  mcpGoogleMaps: false,
  mcpGoogleMapsUrl: 'https://divya-ai-syxr.onrender.com/mcp/updates',
  privacyDiagnostics: true,
  privacyDataShare: false,
  securityTwoFactor: false,
};

export function useSettings() {
  const [settings, setSettingsState] = useState(() => {
    const saved = localStorage.getItem('health_ai_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSettings = (updates) => {
    setSettingsState(prev => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem('health_ai_settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  useEffect(() => {
    if (settings.isLightMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [settings.isLightMode]);

  return [settings, updateSettings];
}
