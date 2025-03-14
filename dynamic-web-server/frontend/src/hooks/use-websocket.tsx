import { useState, useRef, useCallback } from 'react';

/**
 * useWebSocket - A React hook for managing WebSocket connections
 * 
 * This hook creates and manages a WebSocket connection, providing a simple interface
 * to connect, send messages, and handle WebSocket events.
 * 
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.endpoint - Endpoint path (e.g., '/test')
 * @param {string} options.clientId - Unique client identifier
 * @param {Function} options.onOpen - Callback when connection opens
 * @param {Function} options.onMessage - Callback when message is received
 * @param {Function} options.onClose - Callback when connection closes
 * @param {Function} options.onError - Callback when error occurs
 */
const useWebSocket = ({
  endpoint = '',
  clientId = '',
  onOpen,
  onMessage,
  onClose,
  onError
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  
  // Base WebSocket URL from environment variable
  const baseWsUrl = process.env.NEXT_PUBLIC_WS_URL;
  
  // Clean connection path
  const getConnectionUrl = useCallback(() => {
    // Ensure baseWsUrl starts with ws:// or wss://
    const wsBase = baseWsUrl.startsWith('ws://') || baseWsUrl.startsWith('wss://') 
      ? baseWsUrl 
      : `ws://${baseWsUrl}`;
      
    // Handle client ID in the path instead of as a query parameter
    // Format: /ws/test/client2 instead of /ws/test?clientId=user-8280
    let path = endpoint;
    
    // Add client ID to the path if provided
    if (clientId) {
      // Ensure we have proper path separators
      if (!path.endsWith('/')) {
        path += '/';
      }
      path += clientId;
    }

    // Ensure path starts with a slash
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
      
    // Build the full path
    let fullPath = `${wsBase}${path}`;
    
    try {
      const url = new URL(fullPath);
      return url.toString();
    } catch (error) {
      console.error('Invalid WebSocket URL:', fullPath);
      throw new Error(`Invalid WebSocket URL: ${fullPath}`);
    }
  }, [baseWsUrl, endpoint, clientId]);

  // Connection setup
  const connect = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }
    
    try {
      const wsUrl = getConnectionUrl();
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = (event) => {
        setIsConnected(true);
        setConnectionError(null);
        if (onOpen) onOpen(event);
      };
      
      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          if (onMessage) onMessage(message, event);
        } catch (error) {
          // Handle case where message isn't valid JSON
          console.warn('Received non-JSON message:', event.data);
          if (onMessage) onMessage(event.data, event);
        }
      };
      
      socketRef.current.onclose = (event) => {
        setIsConnected(false);
        if (onClose) onClose(event);
      };
      
      socketRef.current.onerror = (error) => {
        setConnectionError(error);
        if (onError) onError(error);
      };
    } catch (error) {
      setConnectionError(error);
      if (onError) onError(error);
    }
  }, [getConnectionUrl, onOpen, onMessage, onClose, onError]);

  // Send message function
  const sendMessage = useCallback((data) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      const error = new Error('WebSocket is not connected');
      setConnectionError(error);
      if (onError) onError(error);
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socketRef.current.send(message);
      return true;
    } catch (error) {
      setConnectionError(error);
      if (onError) onError(error);
      return false;
    }
  }, [onError]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connectionError,
    connect,
    disconnect,
  };
};

export default useWebSocket;