'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/reports', label: 'Reports', icon: '📑' },
        { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <aside className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 text-slate-900 dark:text-white h-screen flex flex-col fixed left-0 top-0 z-20 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 transition-colors duration-300">
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent tracking-tight">
                    Analytics
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`group flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 translate-x-1'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-white hover:translate-x-1'
                                }`}
                        >
                            <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {link.icon}
                            </span>
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="px-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Version</p>
                    <p className="text-xs text-slate-600 dark:text-slate-500">v1.0.0</p>
                </div>
            </div>
        </aside>
    );
}
