
import React, { useState, useEffect, useRef } from 'react';
import ChatMessage, { ChatMessageProps } from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';

// Mock data for demonstration
const MOCK_MESSAGES: ChatMessageProps[] = [
  {
    id: '1',
    content: 'Hey everyone! Welcome to our Discord clone. This is the general chat room.',
    sender: {
      id: 'admin',
      username: 'Admin',
      tag: '#0001',
    },
    timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
  },
  {
    id: '2',
    content: 'Thanks! The UI looks great. I love the dark theme.',
    sender: {
      id: 'user1',
      username: 'TechGuru',
      tag: '#4253',
    },
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
  },
  {
    id: '3',
    content: "I'm excited to try out the voice chat feature. Is it working yet?",
    sender: {
      id: 'user2',
      username: 'GameMaster',
      tag: '#7890',
    },
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
  },
  {
    id: '4',
    content: "We're still implementing it. The UI is ready but the WebRTC functionality is coming soon!",
    sender: {
      id: 'admin',
      username: 'Admin',
      tag: '#0001',
    },
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
  }
];

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessageProps[]>(MOCK_MESSAGES);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (content: string) => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const newMessage: ChatMessageProps = {
        id: Date.now().toString(),
        content,
        sender: {
          id: 'currentUser',
          username: 'CurrentUser',
          tag: '#1234',
        },
        timestamp: new Date(),
      };
      
      setMessages([...messages, newMessage]);
      setLoading(false);
    }, 500);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">General Chat</h1>
        <p className="text-sm text-muted-foreground">
          This is the beginning of the main chat room
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <ChatMessage key={message.id} {...message} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} isLoading={loading} />
    </div>
  );
};

export default ChatPage;
