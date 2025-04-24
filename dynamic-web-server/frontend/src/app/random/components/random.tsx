"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useWebSocket from '@/websocket/use-websocket';
import { MessageSquare, Send, Wifi, WifiOff, AlertCircle } from 'lucide-react';

export default function WebSocketVisualizer() {
  const [message, setMessage] = useState('');
  const [clientId] = useState(() => `user-${Math.floor(Math.random() * 10000)}`);
  const [messages, setMessages] = useState<any[]>([]);

  const {
    isConnected,
    sendMessage,
    connectionError,
    connect,
    disconnect,
  } = useWebSocket({
    endpoint: '/test',
    clientId,
    onMessage: (data) => {
      if (data.type === 'broadcast') {
        setMessages(prev => {
          const next = [...prev, {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            client: data.client_id,
            content: data.content,
          }];
          return next.slice(-50);
        });
      }
    },
  });

  const handleSend = () => {
    if (!message.trim() || !isConnected) return;
    if (sendMessage(message)) {
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 gap-4">
      {/* Control Panel */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>The Protocol</CardTitle>
              <span className={`flex items-center text-xs px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                ID: {clientId}
              </span>
              {isConnected ? (
                <Button size="sm" variant="destructive" onClick={disconnect} className="h-8">
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={connect} className="h-8">
                  Connect
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {connectionError && (
          <div className="px-6 pb-3 flex items-center text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mr-2" />
            Connection Error: Unable to reach WS.
          </div>
        )}
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col shadow-sm">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Chat Room
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                No messages yet. Start chatting!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.client === clientId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-xs">
                    <div 
                      className={`inline-block px-3 py-2 rounded-lg ${
                        msg.client === clientId 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-br-none' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                    </div>
                    <div className="flex mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`${msg.client === clientId ? 'ml-auto' : ''}`}>
                        {msg.client === clientId ? msg.time : `${msg.client} · ${msg.time}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t p-3">
          <div className="flex items-center space-x-2 w-full">
            <Input
              className="flex-1"
              placeholder="Type a message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected}
            />
            <Button 
              onClick={handleSend} 
              disabled={!isConnected}
              className="px-4"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}