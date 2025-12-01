import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { cookieStorage } from '@/lib/cookies';

export interface NotificationSettings {
    email: boolean;
    push: boolean;
    weekly: boolean;
}

export interface SettingsState {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: NotificationSettings;

    // Actions
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setLanguage: (language: string) => void;
    setNotifications: (notifications: Partial<NotificationSettings>) => void;
    toggleNotification: (key: keyof NotificationSettings) => void;
    resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
    theme: 'system' as const,
    language: 'pt-BR',
    notifications: {
        email: true,
        push: true,
        weekly: false,
    },
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...DEFAULT_SETTINGS,

            setTheme: (theme) => set({ theme }),

            setLanguage: (language) => set({ language }),

            setNotifications: (notifications) =>
                set((state) => ({
                    notifications: { ...state.notifications, ...notifications },
                })),

            toggleNotification: (key) =>
                set((state) => ({
                    notifications: {
                        ...state.notifications,
                        [key]: !state.notifications[key],
                    },
                })),

            resetSettings: () => set(DEFAULT_SETTINGS),
        }),
        {
            name: 'user-settings',
            storage: createJSONStorage(() => cookieStorage),
        }
    )
);
