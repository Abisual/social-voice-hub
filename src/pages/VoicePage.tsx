import React, { useState, useEffect, useRef } from 'react';
import VoiceUser from '@/components/voice/VoiceUser';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff,
  MonitorSmartphone,
  Users,
  Volume2,
  PhoneOff
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import ScreenShareView from '@/components/voice/ScreenShareView';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

const CURRENT_USER: VoiceUserType = {
  id: 'currentUser',
  username: 'You',
  tag: '#1234',
  isSpeaking: false,
  isMuted: false,
  isLocalMuted: false,
  volume: 100,
};

const VoicePage = () => {
  const [voiceUsers, setVoiceUsers] = useState<VoiceUserType[]>([CURRENT_USER]);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [microphoneAccess, setMicrophoneAccess] = useState<boolean | null>(null);
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  
  const handleDisconnect = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setAudioStream(null);
    setScreenShareStream(null);
    setMicrophoneAccess(null);
    setVoiceUsers([CURRENT_USER]);
    
    toast({
      title: "Отключено от голосового чата",
    });
  };

  useEffect(() => {
    if (!isConnected && !isConnecting) {
      setIsConnecting(true);
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
        
        checkMicrophoneAccess();
        
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
      }, 2000);
    }
    
    return () => {
      handleDisconnect();
    };
  }, []);

  const checkMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setMicrophoneAccess(true);
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyzeMicrophoneLevel();
      
      const updatedUser = { ...CURRENT_USER, isMuted: false };
      updateVoiceUser(updatedUser);
      
      toast({
        title: "Доступ к микрофону получен",
        description: "Ваш микрофон работает и готов к использованию",
      });
    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      setMicrophoneAccess(false);
      
      const updatedUser = { ...CURRENT_USER, isMuted: true };
      updateVoiceUser(updatedUser);
      
      toast({
        title: "Нет доступа к микрофону",
        description: "Пожалуйста, разрешите доступ к микрофону в настройках браузера",
        variant: "destructive",
      });
    }
  };

  const analyzeMicrophoneLevel = () => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      const normalizedLevel = Math.min(100, Math.max(0, average * 1.5));
      
      setMicrophoneLevel(normalizedLevel);
      
      const isSpeakingThreshold = 15;
      const isSpeaking = normalizedLevel > isSpeakingThreshold && !isMuted;
      
      setVoiceUsers((prevUsers) => 
        prevUsers.map(user => 
          user.id === 'currentUser' 
            ? { ...user, isSpeaking } 
            : user
        )
      );
      
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };

  const startSimulation = () => {
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

  const updateVoiceUser = (updatedUser: VoiceUserType) => {
    setVoiceUsers((prevUsers) =>
      prevUsers.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      )
    );
  };

  const handleToggleMute = (userId: string) => {
    if (userId !== 'currentUser') return;
    
    const user = voiceUsers.find(u => u.id === userId);
    if (!user) return;
    
    const newMutedState = !user.isMuted;
    
    updateVoiceUser({
      ...user,
      isMuted: newMutedState,
      isSpeaking: false
    });
    
    setIsMuted(newMutedState);
    
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        track.enabled = !newMutedState;
      });
    }
    
    toast({
      title: newMutedState ? "Микрофон выключен" : "Микрофон включен",
    });
  };

  const handleToggleLocalMute = (userId: string) => {
    if (userId === 'currentUser') return;
    
    const user = voiceUsers.find(u => u.id === userId);
    if (!user) return;
    
    const newLocalMutedState = !user.isLocalMuted;
    
    updateVoiceUser({
      ...user,
      isLocalMuted: newLocalMutedState
    });
    
    toast({
      title: newLocalMutedState 
        ? `Звук от ${user.username} выключен` 
        : `Звук от ${user.username} включен`,
    });
  };

  const handleVolumeChange = (userId: string, volume: number) => {
    const user = voiceUsers.find(u => u.id === userId);
    if (!user) return;
    
    updateVoiceUser({
      ...user,
      volume
    });
  };

  const handleScreenShare = async () => {
    if (isScreenSharing && screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
      setScreenShareStream(null);
      setIsScreenSharing(false);
      
      toast({
        title: 'Демонстрация экрана остановлена',
      });
      return;
    }
    
    toast({
      title: 'Запрос на доступ к экрану',
      description: 'Разрешите доступ в браузере',
    });
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: false 
      });
      
      setScreenShareStream(stream);
      setIsScreenSharing(true);
      
      toast({
        title: 'Демонстрация экрана запущена',
        description: 'Другие пользователи видят ваш экран',
      });
      
      stream.getVideoTracks()[0].onended = () => {
        setScreenShareStream(null);
        setIsScreenSharing(false);
        
        toast({
          title: 'Демонстрация экрана остановлена',
        });
      };
    } catch (error) {
      console.error('Ошибка при демонстрации экрана:', error);
      
      toast({
        title: 'Ошибка демонстрации экрана',
        description: 'Доступ не был предоста��лен',
        variant: 'destructive',
      });
    }
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
            {isConnected && (
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="gap-2"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="hidden sm:inline">Отключиться</span>
              </Button>
            )}
            
            <Button
              variant={isMuted ? 'destructive' : 'default'}
              onClick={() => handleToggleMute('currentUser')}
              className="gap-2"
              disabled={!isConnected || microphoneAccess === false}
            >
              {isMuted ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Включить</span>
                </>
              ) : (
                <>
                  <Mic className={`h-4 w-4 ${voiceUsers.find(u => u.id === 'currentUser')?.isSpeaking ? 'animate-pulse text-green-400' : ''}`} />
                  <span className="hidden sm:inline">Выключить</span>
                </>
              )}
            </Button>
            
            <Button
              variant={isScreenSharing ? 'destructive' : 'outline'}
              onClick={handleScreenShare}
              className="gap-2"
              disabled={!isConnected}
            >
              <MonitorSmartphone className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isScreenSharing ? 'Остановить' : 'Демонстрация'}
              </span>
            </Button>
          </div>
        </div>
        
        {microphoneAccess && !isMuted && (
          <div className="mt-4 px-2">
            <div className="flex items-center gap-2 mb-1">
              <Mic className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Уровень микрофона</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100 ease-out"
                style={{ width: `${microphoneLevel}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {isScreenSharing && screenShareStream && (
          <div className="p-4 border-b">
            <ScreenShareView stream={screenShareStream} isActive={isScreenSharing} />
          </div>
        )}
        
        <ScrollArea className="h-full p-4">
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
                  isSelf={user.id === 'currentUser'}
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
            
            {isConnected && (
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium">Настройки голосового чата</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reduce-noise">Шумоподавление</Label>
                    <p className="text-sm text-muted-foreground">
                      Автоматически уменьшает фоновый шум
                    </p>
                  </div>
                  <Switch id="reduce-noise" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="echo-cancel">Эхоподавление</Label>
                    <p className="text-sm text-muted-foreground">
                      Подавляет эхо от динамиков
                    </p>
                  </div>
                  <Switch id="echo-cancel" defaultChecked />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default VoicePage;
