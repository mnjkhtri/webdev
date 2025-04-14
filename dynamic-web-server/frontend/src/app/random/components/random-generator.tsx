"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import useWebSocket from '@/hooks/use-websocket';

const WebSocketVisualizer = () => {
  const [message, setMessage] = useState('');
  const [clientId] = useState(`user-${Math.floor(Math.random() * 10000)}`);
  const [messageBroadcast, setMessageBroadcast] = useState<any[]>([]);
  
  const { isConnected, sendMessage, connectionError, connect, disconnect } = useWebSocket({
    endpoint: '/test',
    clientId,
    onMessage: (data) => processWebSocketMessage(data),
  });
  
  // Process incoming WebSocket messages
  const processWebSocketMessage = (data: any) => {
    const timestamp = Date.now();
    
    if (data.type === 'broadcast') {
      // Add to broadcast messages list
      setMessageBroadcast(prevMessages => {
        const newMessages = [...prevMessages, {
          id: Date.now(),
          time: new Date(timestamp).toLocaleTimeString(),
          content: data.content,
          client_id: data.client_id
        }];
        
        return newMessages.length > 10 ? newMessages.slice(-10) : newMessages;
      });
    }
  };
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    if (sendMessage(message)) {
      setMessage('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return (
    <div className="min-h-screen">
      {/* Control Panel */}
      <Card className="mb-6 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              The Protocol
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Client ID: {clientId}
              </Badge>
              {isConnected ? (
                <>
                  <Badge variant="outline" className="flex items-center gap-1 bg-success/10 text-success">
                    Connected
                  </Badge>
                  <Button size="sm" variant="destructive" onClick={disconnect}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="flex items-center gap-1 bg-destructive/10 text-destructive">
                    Disconnected
                  </Badge>
                  <Button size="sm" variant="default" onClick={connect}>
                    Connect
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardFooter className="border-t p-3 flex flex-col gap-2">
          {connectionError && (
            <div className="w-full text-destructive text-sm">
              Connection Error. The websocket is not available.
            </div>
          )}
          <div className="flex w-full space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={!isConnected}
            />
          </div>
        </CardFooter>
      </Card>
      
      {/* Visualization Area - Charts stacked vertically */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Echo Messages List */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              Chat with your nigga
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messageBroadcast.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No messages yet. Send a message to see the echo here.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {messageBroadcast.map(msg => (
                  <div key={msg.id} className="mb-3">
                    {msg.client_id === clientId ? (
                      // Current user's message (right-aligned)
                      <>
                        <div className="flex justify-end mb-1 text-xs text-muted-foreground">
                          <div>{msg.time}</div>
                        </div>
                        <div className="flex justify-end">
                          <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg rounded-tr-none p-2 text-sm">
                            {msg.content}
                          </div>
                        </div>
                      </>
                    ) : (
                      // Other users' messages (left-aligned)
                      <>
                        <div className="flex justify-start mb-1 text-xs text-muted-foreground">
                          <div>{msg.client_id}</div>
                        </div>
                        <div className="flex justify-start">
                          <div className="max-w-[80%] bg-secondary text-secondary-foreground rounded-lg rounded-tl-none p-2 text-sm">
                            {msg.content}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebSocketVisualizer;