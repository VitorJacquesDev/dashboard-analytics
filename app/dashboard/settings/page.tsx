'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/app/components/layout/MainLayout';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore, NotificationSettings } from '@/store/useSettingsStore';

interface ProfileSettings {
    displayName: string;
    email: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
    const { 
        theme, 
        language, 
        notifications, 
        setTheme, 
        setLanguage, 
        setNotifications 
    } = useSettingsStore();
    
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'security'>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    
    const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
        displayName: user?.name || '',
        email: user?.email || '',
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (user) {
            setProfileSettings({
                displayName: user.name || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        
        try {
            // Simular salvamento do perfil (as outras configs já são salvas automaticamente nos cookies)
            await new Promise(resolve => setTimeout(resolve, 500));
            setSaveMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        } catch {
            setSaveMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const tabs = [
        { id: 'profile' as const, label: 'Perfil', icon: '👤' },
        { id: 'notifications' as const, label: 'Notificações', icon: '🔔' },
        { id: 'appearance' as const, label: 'Aparência', icon: '🎨' },
        { id: 'security' as const, label: 'Segurança', icon: '🔒' },
    ];

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-200">
                        Configurações
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gerencie suas preferências e configurações da conta
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                    {activeTab === 'profile' && (
                        <ProfileSettingsTab 
                            settings={profileSettings} 
                            setSettings={setProfileSettings}
                            language={language}
                            setLanguage={setLanguage}
                        />
                    )}
                    {activeTab === 'notifications' && (
                        <NotificationSettingsTab 
                            notifications={notifications} 
                            setNotifications={setNotifications} 
                        />
                    )}
                    {activeTab === 'appearance' && (
                        <AppearanceSettingsTab theme={theme} setTheme={setTheme} />
                    )}
                    {activeTab === 'security' && (
                        <SecuritySettings />
                    )}
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-between">
                    {saveMessage && (
                        <p className={`text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {saveMessage.text}
                        </p>
                    )}
                    <div className="ml-auto">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}


// Profile Settings Component
function ProfileSettingsTab({ 
    settings, 
    setSettings,
    language,
    setLanguage,
}: { 
    settings: ProfileSettings; 
    setSettings: React.Dispatch<React.SetStateAction<ProfileSettings>>;
    language: string;
    setLanguage: (language: string) => void;
}) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-200">
                Informações do Perfil
            </h2>
            
            <div className="grid gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nome de Exibição
                    </label>
                    <input
                        type="text"
                        value={settings.displayName}
                        onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Seu nome"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="seu@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Idioma
                    </label>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es">Español</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// Notification Settings Component
function NotificationSettingsTab({ 
    notifications, 
    setNotifications 
}: { 
    notifications: NotificationSettings; 
    setNotifications: (notifications: Partial<NotificationSettings>) => void;
}) {
    const toggleNotification = (key: keyof NotificationSettings) => {
        setNotifications({ [key]: !notifications[key] });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-200">
                Preferências de Notificação
            </h2>
            
            <div className="space-y-4">
                <ToggleItem
                    label="Notificações por Email"
                    description="Receba atualizações importantes por email"
                    checked={notifications.email}
                    onChange={() => toggleNotification('email')}
                />
                
                <ToggleItem
                    label="Notificações Push"
                    description="Receba notificações em tempo real no navegador"
                    checked={notifications.push}
                    onChange={() => toggleNotification('push')}
                />
                
                <ToggleItem
                    label="Resumo Semanal"
                    description="Receba um resumo semanal das suas métricas"
                    checked={notifications.weekly}
                    onChange={() => toggleNotification('weekly')}
                />
            </div>
        </div>
    );
}

// Appearance Settings Component
function AppearanceSettingsTab({ 
    theme, 
    setTheme 
}: { 
    theme: 'light' | 'dark' | 'system'; 
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}) {
    const themes = [
        { id: 'light' as const, label: 'Claro', icon: '☀️' },
        { id: 'dark' as const, label: 'Escuro', icon: '🌙' },
        { id: 'system' as const, label: 'Sistema', icon: '💻' },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-200">
                Aparência
            </h2>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    Tema
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {themes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                theme === t.id
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <span className="text-2xl">{t.icon}</span>
                            <span className={`text-sm font-medium ${
                                theme === t.id
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-600 dark:text-slate-400'
                            }`}>
                                {t.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Security Settings Component
function SecuritySettings() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-200">
                Segurança
            </h2>
            
            <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-gray-200">Alterar Senha</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Atualize sua senha regularmente para maior segurança
                            </p>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                            Alterar
                        </button>
                    </div>
                </div>
                
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-gray-200">Autenticação de Dois Fatores</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Adicione uma camada extra de segurança à sua conta
                            </p>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                            Configurar
                        </button>
                    </div>
                </div>
                
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-slate-900 dark:text-gray-200">Sessões Ativas</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Gerencie os dispositivos conectados à sua conta
                            </p>
                        </div>
                        <button className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                            Ver Sessões
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Toggle Item Component
function ToggleItem({ 
    label, 
    description, 
    checked, 
    onChange 
}: { 
    label: string; 
    description: string; 
    checked: boolean; 
    onChange: () => void;
}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div>
                <h3 className="font-medium text-slate-900 dark:text-gray-200">{label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
            <button
                onClick={onChange}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                role="switch"
                aria-checked={checked}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
}
