
import React, { useState, useEffect, useRef } from 'react';
import VoiceUser from '@/components/voice/VoiceUser';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff,
  MonitorSmartphone,
  Users,
  PhoneOff
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import ScreenShareView from '@/components/voice/ScreenShareView';

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

// Create a global voice channel store that's accessible from window object
declare global {
  interface Window {
    voiceChannelStore: {
      isConnected: boolean;
      isConnecting: boolean;
      audioStream: MediaStream | null;
      screenShareStream: MediaStream | null;
      isScreenSharing: boolean;
      microphoneAccess: boolean | null;
      voiceUsers: VoiceUserType[];
      isMuted: boolean;
      hasInitialized: boolean;
      audioContext: AudioContext | null;
      analyser: AnalyserNode | null;
      audioSource: MediaStreamAudioSourceNode | null;
      disconnect: () => void;
    };
  }
}

// Initialize global store if it doesn't exist
if (typeof window !== 'undefined' && !window.voiceChannelStore) {
  window.voiceChannelStore = {
    isConnected: false,
    isConnecting: false,
    audioStream: null,
    screenShareStream: null,
    isScreenSharing: false,
    microphoneAccess: null,
    voiceUsers: [],
    isMuted: false,
    hasInitialized: false,
    audioContext: null,
    analyser: null,
    audioSource: null,
    disconnect: () => {
      const store = window.voiceChannelStore;
      
      if (store.audioStream) {
        store.audioStream.getTracks().forEach(track => track.stop());
      }
      if (store.screenShareStream) {
        store.screenShareStream.getTracks().forEach(track => track.stop());
      }
      
      if (store.audioContext && store.audioContext.state !== 'closed') {
        store.audioContext.close();
      }
      
      store.analyser = null;
      store.audioSource = null;
      store.isConnected = false;
      store.isConnecting = false;
      store.audioStream = null;
      store.screenShareStream = null;
      store.microphoneAccess = null;
      store.voiceUsers = [{
        id: 'currentUser',
        username: localStorage.getItem('username') || 'User',
        tag: '#1234',
        isSpeaking: false,
        isMuted: false,
        isLocalMuted: false,
        volume: 100,
      }];
      store.hasInitialized = false;
      
      // Notify subscribers
      window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
    }
  };
}

const CURRENT_USER: VoiceUserType = {
  id: 'currentUser',
  username: localStorage.getItem('username') || 'User',
  tag: '#1234',
  isSpeaking: false,
  isMuted: false,
  isLocalMuted: false,
  volume: 100,
};

const VoicePage = () => {
  // Use the global store for state
  const [voiceUsers, setVoiceUsers] = useState<VoiceUserType[]>(() => {
    return window.voiceChannelStore.voiceUsers.length > 0 
      ? window.voiceChannelStore.voiceUsers 
      : [CURRENT_USER];
  });
  
  const [isMuted, setIsMuted] = useState(window.voiceChannelStore.isMuted);
  const [isConnecting, setIsConnecting] = useState(window.voiceChannelStore.isConnecting);
  const [isConnected, setIsConnected] = useState(window.voiceChannelStore.isConnected);
  const [microphoneAccess, setMicrophoneAccess] = useState<boolean | null>(window.voiceChannelStore.microphoneAccess);
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(window.voiceChannelStore.audioStream);
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(window.voiceChannelStore.screenShareStream);
  const [isScreenSharing, setIsScreenSharing] = useState(window.voiceChannelStore.isScreenSharing);
  
  const audioContextRef = useRef<AudioContext | null>(window.voiceChannelStore.audioContext);
  const analyserRef = useRef<AnalyserNode | null>(window.voiceChannelStore.analyser);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(window.voiceChannelStore.audioSource);
  const animationFrameRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  
  // Update the store when state changes
  useEffect(() => {
    const store = window.voiceChannelStore;
    store.isConnected = isConnected;
    store.isConnecting = isConnecting;
    store.audioStream = audioStream;
    store.screenShareStream = screenShareStream;
    store.isScreenSharing = isScreenSharing;
    store.microphoneAccess = microphoneAccess;
    store.voiceUsers = voiceUsers;
    store.isMuted = isMuted;
    store.audioContext = audioContextRef.current;
    store.analyser = analyserRef.current;
    store.audioSource = audioSourceRef.current;
    
    // Notify subscribers
    window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
  }, [
    isConnected, 
    isConnecting, 
    audioStream, 
    screenShareStream, 
    isScreenSharing,
    microphoneAccess,
    voiceUsers,
    isMuted
  ]);
  
  // Update username when it changes
  useEffect(() => {
    const handleUsernameUpdate = () => {
      const username = localStorage.getItem('username') || 'User';
      
      setVoiceUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === 'currentUser' 
            ? { ...user, username } 
            : user
        )
      );
    };
    
    window.addEventListener('usernameUpdated', handleUsernameUpdate);
    return () => window.removeEventListener('usernameUpdated', handleUsernameUpdate);
  }, []);
  
  const handleDisconnect = () => {
    stopAudioAnalysis();
    
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    audioSourceRef.current = null;
    
    setIsConnected(false);
    setIsConnecting(false);
    setAudioStream(null);
    setScreenShareStream(null);
    setMicrophoneAccess(null);
    setVoiceUsers([{...CURRENT_USER, username: localStorage.getItem('username') || 'User'}]);

    // Reset the initialization flag to ensure we reconnect properly next time
    window.voiceChannelStore.hasInitialized = false;
    
    toast({
      title: "Отключено от голосового чата",
    });
  };

  // Stop audio analysis
  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Setup voice connection
  useEffect(() => {
    // If we're already connected or connecting, don't do anything
    if (isConnected || isConnecting) return;
    
    // If we've already initialized the voice connection, just restore it
    if (window.voiceChannelStore.hasInitialized && window.voiceChannelStore.audioStream) {
      console.log("Restoring voice connection from store");
      setAudioStream(window.voiceChannelStore.audioStream);
      setIsConnected(true);
      setMicrophoneAccess(true);
      
      // Restart audio analysis if needed
      if (window.voiceChannelStore.audioStream && (!analyserRef.current || !animationFrameRef.current)) {
        setupAudioAnalysis(window.voiceChannelStore.audioStream);
      }
      return;
    }
    
    // Otherwise, establish a new connection
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
      
      // Mark that we've initialized
      window.voiceChannelStore.hasInitialized = true;
      checkMicrophoneAccess();
    }, 2000);

    // Cleanup function is intentionally empty - we want to persist the connection
    return () => {};
  }, []);

  // Check if the component is currently mounted
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Focus effect to maintain microphone functionality when returning to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && window.voiceChannelStore.hasInitialized) {
        // Only recreate audio analysis if it's not active
        if (window.voiceChannelStore.audioStream && !animationFrameRef.current && isMountedRef.current) {
          console.log("Restoring audio analysis on visibility change");
          setupAudioAnalysis(window.voiceChannelStore.audioStream);
        }
      } else if (document.visibilityState === 'hidden') {
        // When tab is hidden, pause the analysis to save resources, but don't disconnect
        stopAudioAnalysis();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Add a focus handler to address tab navigation
    window.addEventListener('focus', () => {
      if (window.voiceChannelStore.audioStream && !animationFrameRef.current && isMountedRef.current) {
        console.log("Restoring audio analysis on window focus");
        setupAudioAnalysis(window.voiceChannelStore.audioStream);
      }
    });

    // When the window loses focus, pause analysis but don't disconnect
    window.addEventListener('blur', () => {
      stopAudioAnalysis();
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => {});
      window.removeEventListener('blur', () => {});
    };
  }, []);

  // Listen for noise suppression settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      if (window.voiceChannelStore.audioStream && audioContextRef.current) {
        // Re-setup audio analysis with new settings
        setupAudioAnalysis(window.voiceChannelStore.audioStream);
      }
    };

    window.addEventListener('voiceSettingsUpdated', handleSettingsChange);
    return () => window.removeEventListener('voiceSettingsUpdated', handleSettingsChange);
  }, []);

  const checkMicrophoneAccess = async () => {
    try {
      // If we already have a stream, use it
      if (audioStream) {
        console.log("Using existing audio stream");
        setupAudioAnalysis(audioStream);
        return;
      }
      
      console.log("Requesting new microphone access");
      const noiseSuppressionSettings = localStorage.getItem('noiseSuppression');
      const noiseSuppressionEnabled = noiseSuppressionSettings
        ? JSON.parse(noiseSuppressionSettings).enabled
        : false;

      const echoCancelEnabled = localStorage.getItem('echoCancel') === 'true';

      const constraints = { 
        audio: {
          noiseSuppression: noiseSuppressionEnabled,
          echoCancellation: echoCancelEnabled
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);
      setMicrophoneAccess(true);
      
      // Apply muted state to the new stream
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      
      setupAudioAnalysis(stream);
      
      const updatedUser = { 
        ...CURRENT_USER, 
        isMuted, 
        username: localStorage.getItem('username') || 'User' 
      };
      updateVoiceUser(updatedUser);
      
      toast({
        title: "Доступ к микрофону получен",
        description: "Ваш микрофон работает и готов к использованию",
      });
    } catch (error) {
      console.error('Ошибка доступа к микрофону:', error);
      setMicrophoneAccess(false);
      
      const updatedUser = { 
        ...CURRENT_USER, 
        isMuted: true, 
        username: localStorage.getItem('username') || 'User' 
      };
      updateVoiceUser(updatedUser);
      
      toast({
        title: "Нет доступа к микрофону",
        description: "Пожалуйста, разрешите доступ к микрофону в настройках браузера",
        variant: "destructive",
      });
    }
  };

  // Setup audio analysis
  const setupAudioAnalysis = (stream: MediaStream) => {
    // Stop any existing audio analysis
    stopAudioAnalysis();
    
    // If no audio context exists or it's closed, create a new one
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      try {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
      } catch (error) {
        console.error('Failed to create audio context:', error);
        return;
      }
    } else if (audioContextRef.current.state === 'suspended') {
      // Resume if suspended
      audioContextRef.current.resume().catch(err => {
        console.error('Failed to resume audio context:', err);
      });
    }
    
    // Create new analyser or reuse existing one
    let analyser: AnalyserNode;
    try {
      analyser = audioContextRef.current.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
    } catch (error) {
      console.error('Failed to create analyser:', error);
      return;
    }
    
    // Create new source or disconnect and reuse existing one
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch (error) {
        console.error('Failed to disconnect audio source:', error);
      }
    }
    
    let source: MediaStreamAudioSourceNode;
    try {
      source = audioContextRef.current.createMediaStreamSource(stream);
      audioSourceRef.current = source;
    } catch (error) {
      console.error('Failed to create media stream source:', error);
      return;
    }
    
    // Apply noise suppression settings if enabled
    const noiseSuppressionSettings = localStorage.getItem('noiseSuppression');
    try {
      if (noiseSuppressionSettings) {
        const { enabled, threshold } = JSON.parse(noiseSuppressionSettings);
        
        if (enabled) {
          // Create and configure a dynamic compressor node for noise suppression
          const compressor = audioContextRef.current.createDynamicsCompressor();
          compressor.threshold.value = -80 + threshold * 0.8; // Convert 0-100 scale to appropriate threshold
          compressor.knee.value = 40;
          compressor.ratio.value = 12;
          compressor.attack.value = 0;
          compressor.release.value = 0.25;
          
          // Connect source -> compressor -> analyser
          source.connect(compressor);
          compressor.connect(analyser);
        } else {
          // Connect source directly to analyser
          source.connect(analyser);
        }
      } else {
        // Connect source directly to analyser if no settings
        source.connect(analyser);
      }
    } catch (error) {
      console.error('Failed to apply noise suppression:', error);
      // Fallback to direct connection
      source.connect(analyser);
    }
    
    analyzeMicrophoneLevel();
  };

  const analyzeMicrophoneLevel = () => {
    if (!analyserRef.current || !isMountedRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isMountedRef.current) return;
      
      try {
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
      } catch (error) {
        console.error('Error analyzing microphone level:', error);
        // Try to restart analysis
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
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
        description: 'Доступ не был предоставлен',
        variant: 'destructive',
      });
    }
  };

  // Add cleanup on component unmount to ensure we maintain the connection
  useEffect(() => {
    return () => {
      // Do NOT disconnect on unmount
      // Only stop audio analysis to save resources
      stopAudioAnalysis();
    };
  }, []);

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
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default VoicePage;
