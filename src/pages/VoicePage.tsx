
import React, { useState, useEffect } from 'react';
import VoiceUser from '@/components/voice/VoiceUser';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff,
  MonitorSmartphone,
  Users
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

// Интерфейс для пользователей голосового чата
interface VoiceUserType {
  id: string;
  username: string;
  tag: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocalMuted: boolean;
  volume: number;
}

// Текущий пользователь
const CURRENT_USER: VoiceUserType = {
  id: 'currentUser',
  username: 'CurrentUser',
  tag: '#1234',
  isSpeaking: false,
  isMuted: false,
  isLocalMuted: false,
  volume: 100,
};

const VoicePage = () => {
  // Управление состоянием участников
  const [voiceUsers, setVoiceUsers] = useState<VoiceUserType[]>([CURRENT_USER]);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const { toast } = useToast();
  
  // Эффект для имитации подключения к голосовому чату
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      setIsConnecting(true);
      // Имитация подключения
      toast({
        title: "Подключение к голосовому чату",
        description: "Пожалуйста, подождите...",
      });
      
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        toast({
          title: "Подключено к голосовому чату",
          description: "Вы можете начать общение",
        });
        
        // Добавляем имитацию других пользователей
        setVoiceUsers([
          CURRENT_USER,
          {
            id: 'user1',
            username: 'TechGuru',
            tag: '#4253',
            isSpeaking: false,
            isMuted: false,
            isLocalMuted: false,
            volume: 80,
          }
        ]);
        
        // Имитируем разговор других пользователей
        startSimulation();
      }, 2000);
    }
    
    return () => {
      // Очистка при размонтировании
      setIsConnected(false);
    };
  }, [toast]);
  
  // Функция для имитации разговора
  const startSimulation = () => {
    // Периодически имитируем разговор пользователей
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        setVoiceUsers((prevUsers) => 
          prevUsers.map(user => {
            if (user.id !== 'currentUser' && !user.isMuted) {
              return {
                ...user,
                isSpeaking: Math.random() > 0.5
              };
            }
            return user;
          })
        );
      }
    }, 2000);
    
    return () => clearInterval(interval);
  };
  
  // Обработчик включения/выключения микрофона
  const handleToggleMute = (userId: string) => {
    setVoiceUsers(
      voiceUsers.map(user => 
        user.id === userId 
          ? { ...user, isMuted: !user.isMuted, isSpeaking: false }
          : user
      )
    );
    
    // Если текущий пользователь включает/выключает свой микрофон
    if (userId === 'currentUser') {
      setIsMuted(!isMuted);
      toast({
        title: !isMuted ? "Микрофон выключен" : "Микрофон включен",
      });
    }
  };
  
  // Обработчик локального заглушения пользователя
  const handleToggleLocalMute = (userId: string) => {
    setVoiceUsers(
      voiceUsers.map(user => 
        user.id === userId 
          ? { ...user, isLocalMuted: !user.isLocalMuted }
          : user
      )
    );
    
    // Находим пользователя, которого заглушаем
    const user = voiceUsers.find(u => u.id === userId);
    if (user) {
      toast({
        title: user.isLocalMuted 
          ? `Звук от ${user.username} включен` 
          : `Звук от ${user.username} выключен`,
      });
    }
  };
  
  // Обработчик изменения громкости
  const handleVolumeChange = (userId: string, volume: number) => {
    setVoiceUsers(
      voiceUsers.map(user => 
        user.id === userId 
          ? { ...user, volume }
          : user
      )
    );
  };
  
  // Обработчик демонстрации экрана
  const handleScreenShare = () => {
    toast({
      title: 'Запрос на доступ к экрану',
      description: 'Разрешите доступ в браузере',
    });
    
    // Имитация запроса на демонстрацию экрана
    setTimeout(() => {
      navigator.mediaDevices.getDisplayMedia?.({ video: true })
        .then(stream => {
          toast({
            title: 'Демонстрация экрана запущена',
            description: 'Другие пользователи видят ваш экран',
          });
        })
        .catch(error => {
          toast({
            title: 'Ошибка демонстрации экрана',
            description: error.message || 'Доступ не был предоставлен',
            variant: 'destructive',
          });
        });
    }, 500);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Голосовой чат</h1>
            <p className="text-sm text-muted-foreground">
              {isConnected 
                ? `${voiceUsers.length} подключено` 
                : isConnecting 
                  ? 'Подключение...' 
                  : 'Не подключено'
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={isMuted ? 'destructive' : 'default'}
              onClick={() => handleToggleMute('currentUser')}
              className="gap-2"
              disabled={!isConnected}
            >
              {isMuted ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Включить</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Выключить</span>
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleScreenShare}
              className="gap-2"
              disabled={!isConnected}
            >
              <MonitorSmartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Демонстрация</span>
            </Button>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span>Участники ({voiceUsers.length})</span>
          </div>
          
          <div className="grid gap-3">
            {voiceUsers.map(user => (
              <VoiceUser
                key={user.id}
                {...user}
                onToggleMute={handleToggleMute}
                onToggleLocalMute={handleToggleLocalMute}
                onVolumeChange={handleVolumeChange}
              />
            ))}
          </div>
          
          <Separator className="my-6" />
          
          {!isConnected && (
            <div className="text-center py-8">
              <p className="text-lg font-medium mb-2">Не подключено к голосовому чату</p>
              <Button 
                onClick={() => setIsConnecting(true)}
                disabled={isConnecting}
              >
                {isConnecting ? 'Подключение...' : 'Подключиться'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VoicePage;
