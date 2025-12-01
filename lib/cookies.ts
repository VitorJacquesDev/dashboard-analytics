/**
 * Utilitário para gerenciar cookies no navegador
 */

export interface CookieOptions {
    expires?: number; // dias
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}

const DEFAULT_OPTIONS: CookieOptions = {
    expires: 365, // 1 ano
    path: '/',
    sameSite: 'lax',
};

export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
    if (typeof document === 'undefined') return;

    const opts = { ...DEFAULT_OPTIONS, ...options };
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (opts.expires) {
        const date = new Date();
        date.setTime(date.getTime() + opts.expires * 24 * 60 * 60 * 1000);
        cookieString += `; expires=${date.toUTCString()}`;
    }

    if (opts.path) {
        cookieString += `; path=${opts.path}`;
    }

    if (opts.domain) {
        cookieString += `; domain=${opts.domain}`;
    }

    if (opts.secure) {
        cookieString += '; secure';
    }

    if (opts.sameSite) {
        cookieString += `; samesite=${opts.sameSite}`;
    }

    document.cookie = cookieString;
}

export function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }

    return null;
}

export function deleteCookie(name: string, options: Pick<CookieOptions, 'path' | 'domain'> = {}): void {
    setCookie(name, '', { ...options, expires: -1 });
}

/**
 * Storage personalizado para Zustand persist usando cookies
 */
export const cookieStorage = {
    getItem: (name: string): string | null => {
        return getCookie(name);
    },
    setItem: (name: string, value: string): void => {
        setCookie(name, value);
    },
    removeItem: (name: string): void => {
        deleteCookie(name);
    },
};
