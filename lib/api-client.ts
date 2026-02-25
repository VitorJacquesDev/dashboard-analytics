import { useAuthStore } from '@/store/useAuthStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiClient {
    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { logout } = useAuthStore.getState();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const config: RequestInit = {
            ...options,
            headers,
            credentials: options.credentials ?? 'include',
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);

            if (!response.ok) {
                const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
                const rawErrorBody = await response.text().catch(() => '');

                let errorMessage = '';

                if (rawErrorBody && contentType.includes('application/json')) {
                    try {
                        const errorData = JSON.parse(rawErrorBody);
                        errorMessage = errorData.message ||
                            (typeof errorData.error === 'string' ? errorData.error : errorData.error?.message) ||
                            '';
                    } catch {
                        // Fall back to status/text parsing below when a server mislabels HTML as JSON.
                    }
                }

                if (!errorMessage && rawErrorBody && !contentType.includes('text/html')) {
                    errorMessage = rawErrorBody.trim().slice(0, 300);
                }

                if (!errorMessage) {
                    errorMessage = `Request failed (${response.status}${response.statusText ? ` ${response.statusText}` : ''})`;
                }

                if (response.status === 401) {
                    logout();
                }

                throw new Error(errorMessage);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return {} as T;
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    get<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    put<T>(endpoint: string, body: any, options?: RequestOptions) {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        });
    }

    delete<T>(endpoint: string, options?: RequestOptions) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }
}

export const apiClient = new ApiClient();
