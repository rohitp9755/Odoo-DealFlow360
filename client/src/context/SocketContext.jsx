import React, { createContext, useContext, useEffect, useState } from 'react';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('OFFLINE'); // LIVE, CONNECTING, RECONNECTING, OFFLINE

  useEffect(() => {
    const token = localStorage.getItem('df360_token');
    
    // Only connect if the user is fully logged in and we have a token
    if (user && token) {
      setConnectionStatus('CONNECTING');
      const newSocket = initSocket(token);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setConnectionStatus('LIVE');
      });

      newSocket.on('disconnect', () => {
        setConnectionStatus('OFFLINE');
      });

      newSocket.on('connect_error', () => {
        setConnectionStatus('RECONNECTING');
      });

      return () => {
        disconnectSocket();
        setSocket(null);
        setConnectionStatus('OFFLINE');
      };
    } else {
      // Disconnect if user logs out
      disconnectSocket();
      setSocket(null);
      setConnectionStatus('OFFLINE');
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connectionStatus }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
