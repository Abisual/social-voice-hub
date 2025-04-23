
import React, { useState, useEffect, useRef } from 'react';
import ChatMessage, { ChatMessageProps } from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Создадим более реалистичный пользовательский интерфейс
const currentUser = {
  id: 'currentUser',
  username: 'CurrentUser',
  tag: '#1234',
};

const ChatPage = () => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Имитация получения начальных сообщений
  useEffect(() => {
    // Отображаем приветственное сообщение
    setMessages([{
      id: '1',
      content: 'Добро пожаловать в общий чат! Начните общение прямо сейчас.',
      sender: {
        id: 'system',
        username: 'Система',
        tag: '#0000',
      },
      timestamp: new Date(),
    }]);
  }, []);
  
  // Автопрокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Обработка отправки сообщения
  const handleSendMessage = (content: string) => {
    if (!connected) {
      toast({
        title: "Соединение потеряно",
        description: "Невозможно отправить сообщение. Пробуем переподключиться...",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Создаем новое сообщение
    const newMessage: ChatMessageProps = {
      id: Date.now().toString(),
      content,
      sender: {
        id: currentUser.id,
        username: currentUser.username,
        tag: currentUser.tag,
      },
      timestamp: new Date(),
    };
    
    // Добавляем сообщение в список
    setMessages((prev) => [...prev, newMessage]);
    setLoading(false);
    
    // Имитация ответа от другого пользователя после случайной задержки
    if (Math.random() > 0.7) {
      setTimeout(() => {
        const botMessage: ChatMessageProps = {
          id: Date.now().toString(),
          content: "Привет! Это имитация ответа от другого пользователя.",
          sender: {
            id: 'user1',
            username: 'TechGuru',
            tag: '#4253',
          },
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, Math.random() * 10000 + 1000); // От 1 до 11 секунд
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
