
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import type { AppSettings } from '../lib/actions';
import { getAppSettings, saveAppSettings } from '../lib/actions';

interface AppSettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  setSettings: (newSettings: AppSettings) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);
const SETTINGS_STORAGE_KEY = 'eduarchive_app_settings';

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) setSettingsState(JSON.parse(stored));
        const fresh = await getAppSettings();
        setSettingsState(fresh);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(fresh));
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSetSettings = async (newSettings: AppSettings) => {
    setLoading(true);
    const result = await saveAppSettings(newSettings);
    if (result.success) {
      setSettingsState(newSettings);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    }
    setLoading(false);
  };

  return (
    <AppSettingsContext.Provider value={{ settings, loading, setSettings: handleSetSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return context;
}
