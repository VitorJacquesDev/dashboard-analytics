import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthToken } from '@/lib/types';
import { apiClient } from '@/lib/api-client';

interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (credentials) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await apiClient.post<AuthToken>('/auth/login', credentials);
                    set({
                        user: data.user,
                        token: data.token,
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
                set({ user: null, token: null, isAuthenticated: false });
                // Optional: Call logout API if exists
            },

            checkAuth: async () => {
                const { token } = get();
                if (!token) return;

                try {
                    const user = await apiClient.get<User>('/auth/me');
                    set({ user, isAuthenticated: true });
                } catch (error) {
                    // If check fails (e.g. token expired), logout
                    get().logout();
                }
            },

            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
