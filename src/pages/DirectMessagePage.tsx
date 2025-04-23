
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatMessage, { ChatMessageProps } from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Информация о пользователях для имитации переписки
const USER_INFO: Record<string, { username: string, tag: string }> = {
  'user1': { username: 'TechGuru', tag: '#4253' },
  'user2': { username: 'GameMaster', tag: '#7890' },
};

const DirectMessagePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string, tag: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Загрузка информации о пользователе
  useEffect(() => {
    if (!userId || !USER_INFO[userId]) {
      // Если пользователь не найден, возвращаемся
      toast({
        title: "Пользователь не найден",
        description: "Возвращаемся к списку друзей",
        variant: "destructive"
      });
      navigate('/friends');
      return;
    }
    
    setUserInfo(USER_INFO[userId]);
    
    // Создаем приветственное сообщение
    setMessages([
      {
        id: '1',
        content: `Это начало личной переписки с пользователем ${USER_INFO[userId].username}`,
        sender: {
          id: 'system',
          username: 'Система',
          tag: '#0000',
        },
        timestamp: new Date(),
      }
    ]);
  }, [userId, navigate, toast]);
  
  // Автопрокрутка вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Отправка сообщения
  const handleSendMessage = (content: string) => {
    setLoading(true);
    
    // Создаем новое сообщение
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
    
    // Имитация ответа от собеседника с вероятностью 80%
    if (Math.random() > 0.2 && userInfo) {
      setTimeout(() => {
        const responses = [
          "Привет! Как дела?",
          "Интересно, расскажи подробнее.",
          "Согласен с тобой.",
          "Что планируешь делать дальше?",
          "Отличная идея!",
          "Я не уверен насчет этого...",
          "Давай встретимся в голосовом чате?",
          "Хорошо, я подумаю об этом.",
          "Спасибо за информацию!"
        ];
        
        const responseMessage: ChatMessageProps = {
          id: Date.now().toString(),
          content: responses[Math.floor(Math.random() * responses.length)],
          sender: {
            id: userId || '',
            username: userInfo.username,
            tag: userInfo.tag,
          },
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }, Math.random() * 3000 + 1000); // Задержка от 1 до 4 секунд
    }
  };
  
  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Загрузка...</p>
      </div>
    );
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

export default DirectMessagePage;
