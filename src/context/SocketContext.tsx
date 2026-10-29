import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';
import { NotificationItem } from '../types.ts';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  latestNotification: NotificationItem | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  latestNotification: null,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    // Initialize client socket connection
    const socketInstance = io(window.location.origin, {
      reconnectionAttempts: 2,
      reconnectionDelay: 2000,
      autoConnect: true,
      timeout: 3000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      if (user) {
        socketInstance.emit('join_user', user._id);
        socketInstance.emit('join_role', user.role);
      }
    });

    socketInstance.on('connect_error', () => {
      // Graceful demo fallback: node operates locally with event bus
      setIsConnected(false);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('notification', (notif: NotificationItem) => {
      setLatestNotification(notif);
    });

    // Client-side demo event bus integration
    const handleStoreUpdate = (e: any) => {
      if (user && e.detail?.notifications?.length) {
        const notif = e.detail.notifications[0];
        if (notif && (notif.recipientId === user._id || !notif.recipientId)) {
          setLatestNotification(notif);
        }
      }
    };
    window.addEventListener('mealbridge_demo_store_updated', handleStoreUpdate);

    setSocket(socketInstance);

    return () => {
      window.removeEventListener('mealbridge_demo_store_updated', handleStoreUpdate);
      socketInstance.disconnect();
    };
  }, [user?._id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, latestNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  return useContext(SocketContext);
}
