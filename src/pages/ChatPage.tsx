import React, { useState, useEffect, useRef } from 'react';
import ChatMessage, { ChatMessageProps } from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessageProps[]>(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      return JSON.parse(savedMessages);
    }
    return [{
      id: '1',
      content: 'Welcome to the general chat! Start chatting now.',
      sender: {
        id: 'system',
        username: 'System',
        tag: '#0000',
      },
      timestamp: new Date(),
    }];
  });
  
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Save messages to localStorage when they change
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  // Update username when it changes in settings
  useEffect(() => {
    const handleUsernameUpdate = () => {
      const newUsername = localStorage.getItem('username') || 'CurrentUser';
      // We don't need to update anything here as the Sidebar component
      // will re-render with the new username automatically
    };

    window.addEventListener('usernameUpdated', handleUsernameUpdate);
    return () => window.removeEventListener('usernameUpdated', handleUsernameUpdate);
  }, []);

  // Автопрокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Обработка отправки сообщения
  const handleSendMessage = (content: string) => {
    if (!connected) {
      toast({
        title: "Connection lost",
        description: "Cannot send message. Trying to reconnect...",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    const username = localStorage.getItem('username') || 'CurrentUser';
    
    const newMessage: ChatMessageProps = {
      id: Date.now().toString(),
      content,
      sender: {
        id: 'currentUser',
        username: username,
        tag: '#1234',
      },
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setLoading(false);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">Общий чат</h1>
        <p className="text-sm text-muted-foreground">
          {connected ? "Подключено" : "Отключено"}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <ChatInput onSendMessage={handleSendMessage} isLoading={loading} />
    </div>
  );
};

export default ChatPage;
