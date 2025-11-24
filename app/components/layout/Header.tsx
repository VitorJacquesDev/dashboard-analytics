'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

export function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-8 sticky top-0 z-10 transition-colors duration-300">
            <div className="flex items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                    Overview
                </h2>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4 pl-6 border-l border-slate-200/50 dark:border-slate-700/50">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {user?.role || 'Viewer'}
                        </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 ring-2 ring-white/10">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
