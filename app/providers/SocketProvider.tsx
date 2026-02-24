'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientIO, Socket } from 'socket.io-client';

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

function resolveSocketServerUrl(): string {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (wsUrl) {
        return wsUrl;
    }

    const legacySiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (legacySiteUrl) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                '[SocketProvider] NEXT_PUBLIC_SITE_URL is deprecated for socket client. Use NEXT_PUBLIC_WS_URL.'
            );
        }
        return legacySiteUrl;
    }

    return 'http://localhost:3000';
}

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketInstance = new (ClientIO as any)(resolveSocketServerUrl(), {
            path: '/api/socket/io',
            addTrailingSlash: false,
        });

        socketInstance.on('connect', () => {
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
