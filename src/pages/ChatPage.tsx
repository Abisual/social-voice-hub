
import React, { useState, useEffect, useRef } from 'react';
import ChatMessage, { ChatMessageProps } from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Инициализируем клиент Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [loading, setIsLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentUsername, setCurrentUsername] = useState(() => {
    return localStorage.getItem('username') || 'User';
  });
  const currentUserId = localStorage.getItem('userId');
  
  // Проверяем авторизацию
  useEffect(() => {
    if (!currentUserId || !currentUsername) {
      navigate('/login');
    }
  }, [navigate, currentUserId, currentUsername]);

  // Загружаем сообщения и подписываемся на новые
  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (!supabase) {
          // If Supabase is not initialized, use local messages
          setMessages([{
            id: '1',
            content: 'Welcome to the chat! (Local Mode - Supabase not connected)',
            sender: {
              id: 'system',
              username: 'System',
              tag: '#0000',
            },
            timestamp: new Date(),
          }]);
          setConnected(true);
          return;
        }

        // Получаем последние 50 сообщений из канала общего чата
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            users (
              id,
              username,
              tag
            )
          `)
          .eq('channel', 'general')
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        if (data) {
          // Преобразуем данные из БД в формат наших компонентов
          const formattedMessages: ChatMessageProps[] = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: {
              id: msg.user_id,
              // Fix: Correctly access the nested object's properties
              username: msg.users ? msg.users.username : 'Unknown User',
              tag: msg.users ? msg.users.tag : '#0000',
            },
            timestamp: new Date(msg.created_at),
          }));

          setMessages(formattedMessages);
        }

        // Если сообщений нет, показываем приветствие
        if (!data || data.length === 0) {
          setMessages([{
            id: '1',
            content: 'Welcome to the general chat! Start chatting now.',
            sender: {
              id: 'system',
              username: 'System',
              tag: '#0000',
            },
            timestamp: new Date(),
          }]);
        }

        setConnected(true);
      } catch (error) {
        console.error('Error loading messages:', error);
        setConnected(false);
        toast({
          title: "Error loading messages",
          description: "Please check your connection and try again.",
          variant: "destructive"
        });
      }
    };

    loadMessages();

    // Подписка на новые сообщения через Supabase Realtime
    let subscription: any;
    
    if (supabase) {
      subscription = supabase
        .channel('public:messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: 'channel=eq.general'
          }, 
          async (payload) => {
            // Получаем информацию о пользователе
            const { data: userData } = await supabase
              .from('users')
              .select('username, tag')
              .eq('id', payload.new.user_id)
              .single();
              
            // Добавляем сообщение в список
            const newMessage: ChatMessageProps = {
              id: payload.new.id,
              content: payload.new.content,
              sender: {
                id: payload.new.user_id,
                username: userData?.username || 'Unknown User',
                tag: userData?.tag || '#0000',
              },
              timestamp: new Date(payload.new.created_at),
            };
            
            setMessages(prev => [...prev, newMessage]);
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [toast, navigate]);

  // Update username when it changes in settings
  useEffect(() => {
    const handleUsernameUpdate = () => {
      setCurrentUsername(localStorage.getItem('username') || 'User');
    };

    window.addEventListener('usernameUpdated', handleUsernameUpdate);
    return () => window.removeEventListener('usernameUpdated', handleUsernameUpdate);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending messages
  const handleSendMessage = async (content: string) => {
    if (!connected || !currentUserId) {
      toast({
        title: "Connection lost",
        description: "Cannot send message. Trying to reconnect...",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (!supabase) {
        // Local mode - just add to local messages
        const newMessage: ChatMessageProps = {
          id: Date.now().toString(),
          content,
          sender: {
            id: currentUserId,
            username: currentUsername,
            tag: localStorage.getItem('userTag') || '#0000',
          },
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, newMessage]);
        setIsLoading(false);
        return;
      }
      
      // Отправляем сообщение в Supabase
      const { error } = await supabase
        .from('messages')
        .insert([{
          user_id: currentUserId,
          content: content,
          channel: 'general',
        }]);
        
      if (error) throw error;
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
