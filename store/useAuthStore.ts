import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthToken } from '@/lib/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (data: AuthToken) => void;
    logout: () => void;
    updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            login: (data) => set({ user: data.user, token: data.token, isAuthenticated: true }),
            logout: () => set({ user: null, token: null, isAuthenticated: false }),
            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
