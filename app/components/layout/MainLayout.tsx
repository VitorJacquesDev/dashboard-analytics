'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated && !pathname.includes('/login')) {
            router.push('/login');
        }
    }, [isAuthenticated, pathname, router]);

    if (!isAuthenticated && !pathname.includes('/login')) {
        return null; // Or a loading spinner
    }

    if (pathname.includes('/login')) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <div className="pl-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
