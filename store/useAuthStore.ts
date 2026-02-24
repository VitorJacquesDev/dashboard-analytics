import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthSession } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    logoutServer: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await apiClient.post<AuthSession>('/auth/login', credentials);
                    set({
                        user: data.user,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (error: any) {
                    set({
                        error: error.message || 'Login failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: () => {
                set({ user: null, isAuthenticated: false, error: null, isLoading: false });
            },

            logoutServer: async () => {
                try {
                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include',
                    });
                } finally {
                    get().logout();
                }
            },

            checkAuth: async () => {
                set({ isLoading: true });

                try {
                    const user = await apiClient.get<User>('/auth/me');
                    set({ user, isAuthenticated: true, error: null });
                } catch (error) {
                    // If check fails (e.g. token expired), logout
                    get().logout();
                } finally {
                    set({ isLoading: false });
                }
            },

            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
