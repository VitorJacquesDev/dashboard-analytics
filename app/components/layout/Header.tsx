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
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center">
                {/* Breadcrumbs or Title could go here */}
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                    Overview
                </h2>
            </div>

            <div className="flex items-center space-x-4">
                {/* Theme Toggle could go here */}

                <div className="flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {user?.role || 'Viewer'}
                        </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
