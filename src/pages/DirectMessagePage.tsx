
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatMessage, { ChatMessageProps } from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Mock data for conversations
const MOCK_CONVERSATIONS: Record<string, ChatMessageProps[]> = {
  'user1': [
    {
      id: '1',
      content: 'Hey there! How are you?',
      sender: {
        id: 'user1',
        username: 'TechGuru',
        tag: '#4253',
      },
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: '2',
      content: "I'm doing great! Just working on this Discord clone.",
      sender: {
        id: 'currentUser',
        username: 'CurrentUser',
        tag: '#1234',
      },
      timestamp: new Date(Date.now() - 3500000), // 58 minutes ago
    },
    {
      id: '3',
      content: "That's awesome! The UI looks really good so far.",
      sender: {
        id: 'user1',
        username: 'TechGuru',
        tag: '#4253',
      },
      timestamp: new Date(Date.now() - 3400000), // 56 minutes ago
    }
  ],
  'user2': [
    {
      id: '1',
      content: 'Have you tried the voice chat yet?',
      sender: {
        id: 'user2',
        username: 'GameMaster',
        tag: '#7890',
      },
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    },
    {
      id: '2',
      content: "Not yet, but I'm excited to test it out soon!",
      sender: {
        id: 'currentUser',
        username: 'CurrentUser',
        tag: '#1234',
      },
      timestamp: new Date(Date.now() - 7100000), // 1 hour 58 minutes ago
    }
  ]
};

const USER_INFO: Record<string, { username: string, tag: string }> = {
  'user1': { username: 'TechGuru', tag: '#4253' },
  'user2': { username: 'GameMaster', tag: '#7890' },
};

const DirectMessagePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string, tag: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load conversation based on userId
  useEffect(() => {
    if (!userId || !USER_INFO[userId]) {
      // Handle invalid user ID
      navigate('/friends');
      return;
    }
    
    setUserInfo(USER_INFO[userId]);
    
    // Set messages from mock data or empty array if none exists
    setMessages(MOCK_CONVERSATIONS[userId] || []);
  }, [userId, navigate]);
  
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
  
  if (!userInfo) {
    return <div className="p-4">Loading...</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2"
            onClick={() => navigate('/friends')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div>
            <h1 className="text-xl font-bold">{userInfo.username}</h1>
            <p className="text-sm text-muted-foreground">
              {userInfo.tag}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((message) => (
            <ChatMessage key={message.id} {...message} />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-muted-foreground">
                Send a message to start the conversation
              </p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <ChatInput onSendMessage={handleSendMessage} isLoading={loading} />
    </div>
  );
};

export default DirectMessagePage;
