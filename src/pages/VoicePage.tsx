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
      reconnect: () => Promise<boolean>;
      toggleMute: () => void;
      stopScreenShare: () => void;
      startScreenShare: () => Promise<boolean>;
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
    
    // Disconnect function
    disconnect: () => {
      const store = window.voiceChannelStore;
      
      // Stop audio analysis first
      if (store.audioContext && store.audioContext.state !== 'closed') {
        store.audioContext.suspend().catch(err => {
          console.error('Error suspending audio context:', err);
        });
      }
      
      // Stop screen share if active
      if (store.screenShareStream) {
        store.screenShareStream.getTracks().forEach(track => track.stop());
        store.screenShareStream = null;
        store.isScreenSharing = false;
      }
      
      // Stop audio stream
      if (store.audioStream) {
        store.audioStream.getTracks().forEach(track => track.stop());
        store.audioStream = null;
      }
      
      // Reset state
      store.isConnected = false;
      store.isConnecting = false;
      store.microphoneAccess = null;
      store.voiceUsers = [];
      store.hasInitialized = false;
      
      // Don't close audio context, just suspend it for faster reconnection
      
      // Notify subscribers
      window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
    },
    
    // Reconnect function
    reconnect: async () => {
      const store = window.voiceChannelStore;
      
      // If already connecting, don't try again
      if (store.isConnecting) return false;
      
      // If already connected, disconnect first
      if (store.isConnected) {
        // Just reset flags but keep resources
        store.isConnected = false;
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
      }
      
      store.isConnecting = true;
      window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
      
      try {
        // Request microphone access
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
        
        // If we have an existing audio context, resume it
        if (store.audioContext && store.audioContext.state === 'suspended') {
          await store.audioContext.resume();
        }
        
        // Update state
        store.audioStream = stream;
        store.isConnected = true;
        store.isConnecting = false;
        store.microphoneAccess = true;
        store.hasInitialized = true;
        
        // Apply muted state
        stream.getAudioTracks().forEach(track => {
          track.enabled = !store.isMuted;
        });
        
        // Setup mock users for now
        const username = localStorage.getItem('username') || 'User';
        store.voiceUsers = [{
          id: 'currentUser',
          username,
          tag: '#1234',
          isSpeaking: false,
          isMuted: store.isMuted,
          isLocalMuted: false,
          volume: 100
        }];
        
        // Notify subscribers
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
        return true;
      } catch (error) {
        console.error('Error reconnecting to voice chat:', error);
        store.isConnecting = false;
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
        return false;
      }
    },
    
    // Toggle mute function
    toggleMute: () => {
      const store = window.voiceChannelStore;
      const newMutedState = !store.isMuted;
      
      store.isMuted = newMutedState;
      
      // Apply to audio tracks
      if (store.audioStream) {
        store.audioStream.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }
      
      // Update user state
      store.voiceUsers = store.voiceUsers.map(user => 
        user.id === 'currentUser' 
          ? { ...user, isMuted: newMutedState, isSpeaking: false } 
          : user
      );
      
      // Notify subscribers
      window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
    },
    
    // Stop screen share
    stopScreenShare: () => {
      const store = window.voiceChannelStore;
      
      if (store.screenShareStream) {
        store.screenShareStream.getTracks().forEach(track => track.stop());
        store.screenShareStream = null;
        store.isScreenSharing = false;
        
        // Notify subscribers
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
      }
    },
    
    // Start screen share
    startScreenShare: async () => {
      const store = window.voiceChannelStore;
      
      try {
        // Request screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false // Important: don't request audio to avoid conflicts
        });
        
        // Update state
        store.screenShareStream = stream;
        store.isScreenSharing = true;
        
        // Setup automatic cleanup when the user stops sharing
        stream.getVideoTracks()[0].onended = () => {
          store.screenShareStream = null;
          store.isScreenSharing = false;
          window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
        };
        
        // Notify subscribers
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
        return true;
      } catch (error) {
        console.error('Error starting screen share:', error);
        return false;
      }
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
  
  // Update global store when state changes
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
  
  // Keep track of component mount state
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update local state when global store changes
  useEffect(() => {
    const handleVoiceStateUpdated = () => {
      if (!isMountedRef.current) return;
      
      const store = window.voiceChannelStore;
      setIsConnected(store.isConnected);
      setIsConnecting(store.isConnecting);
      setAudioStream(store.audioStream);
      setScreenShareStream(store.screenShareStream);
      setIsScreenSharing(store.isScreenSharing);
      setMicrophoneAccess(store.microphoneAccess);
      setVoiceUsers(store.voiceUsers);
      setIsMuted(store.isMuted);
      
      // If connected and we have a stream but no audio analysis, restart it
      if (store.isConnected && store.audioStream && !animationFrameRef.current) {
        setupAudioAnalysis(store.audioStream);
      }
    };
    
    window.addEventListener('voiceStateUpdated', handleVoiceStateUpdated);
    return () => {
      window.removeEventListener('voiceStateUpdated', handleVoiceStateUpdated);
    };
  }, []);
  
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
      
      // Update global store too
      window.voiceChannelStore.voiceUsers = window.voiceChannelStore.voiceUsers.map(user => 
        user.id === 'currentUser' 
          ? { ...user, username } 
          : user
      );
    };
    
    window.addEventListener('usernameUpdated', handleUsernameUpdate);
    return () => window.removeEventListener('usernameUpdated', handleUsernameUpdate);
  }, []);
  
  // Handle disconnect
  const handleDisconnect = () => {
    stopAudioAnalysis();
    
    // Use the global disconnect function
    window.voiceChannelStore.disconnect();
    
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
    // If we're already connected, just ensure audio analysis is running
    if (isConnected && audioStream) {
      if (!animationFrameRef.current) {
        setupAudioAnalysis(audioStream);
      }
      return;
    }
    
    // If we're already connecting, don't do anything
    if (isConnecting) return;
    
    // Try to reconnect with the store's reconnect function
    const connect = async () => {
      setIsConnecting(true);
      
      toast({
        title: "Подключение к голосовому чату",
        description: "Пожалуйста, подождите...",
      });
      
      const success = await window.voiceChannelStore.reconnect();
      
      if (success) {
        toast({
          title: "Подключено к голосовому чату",
          description: "Вы можете начать общение",
        });
        
        // Ensure audio analysis is running
        if (window.voiceChannelStore.audioStream) {
          setupAudioAnalysis(window.voiceChannelStore.audioStream);
        }
      } else {
        toast({
          title: "Ошибка подключения",
          description: "Не удалось подключиться к голосовому чату",
          variant: "destructive",
        });
      }
    };
    
    connect();
  }, []);

  // Handle visibility change to maintain functionality when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;
      
      if (document.visibilityState === 'visible') {
        // Only recreate audio analysis if we're connected but it's not active
        if (isConnected && audioStream && !animationFrameRef.current) {
          setupAudioAnalysis(audioStream);
        }
      } else {
        // When tab is hidden, pause the analysis to save resources
        stopAudioAnalysis();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle focus/blur
    window.addEventListener('focus', () => {
      if (!isMountedRef.current) return;
      if (isConnected && audioStream && !animationFrameRef.current) {
        setupAudioAnalysis(audioStream);
      }
    });

    window.addEventListener('blur', () => {
      if (!isMountedRef.current) return;
      stopAudioAnalysis();
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => {});
      window.removeEventListener('blur', () => {});
    };
  }, [isConnected, audioStream]);

  // Listen for noise suppression settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      if (!isMountedRef.current) return;
      
      if (isConnected && audioStream) {
        // Re-setup audio analysis with new settings
        setupAudioAnalysis(audioStream);
      }
    };

    window.addEventListener('voiceSettingsUpdated', handleSettingsChange);
    return () => window.removeEventListener('voiceSettingsUpdated', handleSettingsChange);
  }, [isConnected, audioStream]);

  // Setup audio analysis with proper error handling
  const setupAudioAnalysis = (stream: MediaStream) => {
    // Stop any existing audio analysis
    stopAudioAnalysis();
    
    // Make sure we have a valid stream with audio tracks
    if (!stream || stream.getAudioTracks().length === 0) {
      console.error('No audio tracks in stream');
      return;
    }
    
    try {
      // If no audio context exists or it's closed, create a new one
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        window.voiceChannelStore.audioContext = audioContext;
      } else if (audioContextRef.current.state === 'suspended') {
        // Resume if suspended
        audioContextRef.current.resume().catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      }
      
      // Create new analyser or reuse existing one
      let analyser: AnalyserNode;
      analyser = audioContextRef.current.createAnalyser();
      analyserRef.current = analyser;
      window.voiceChannelStore.analyser = analyser;
      analyser.fftSize = 256;
      
      // Create new source or disconnect and reuse existing one
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch (error) {
          console.error('Failed to disconnect audio source:', error);
        }
      }
      
      let source: MediaStreamAudioSourceNode;
      source = audioContextRef.current.createMediaStreamSource(stream);
      audioSourceRef.current = source;
      window.voiceChannelStore.audioSource = source;
      
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
      
      // Start analyzing microphone level
      analyzeMicrophoneLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
  };

  // Analyze microphone level with improved error handling
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
        
        // Update global store
        window.voiceChannelStore.voiceUsers = window.voiceChannelStore.voiceUsers.map(user => 
          user.id === 'currentUser' 
            ? { ...user, isSpeaking } 
            : user
        );
        
        // Continue the animation loop
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      } catch (error) {
        console.error('Error analyzing microphone level:', error);
        // Try to restart analysis on error
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Update voice users
  const updateVoiceUser = (updatedUser: VoiceUserType) => {
    setVoiceUsers((prevUsers) =>
      prevUsers.map(user =>
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    
    // Update global store
    window.voiceChannelStore.voiceUsers = window.voiceChannelStore.voiceUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    
    // Notify subscribers
    window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
  };

  // Toggle mute
  const handleToggleMute = (userId: string) => {
    if (userId !== 'currentUser') return;
    
    // Use the global toggleMute function
    window.voiceChannelStore.toggleMute();
    
    toast({
      title: !isMuted ? "Микрофон выключен" : "Микрофон включен",
    });
  };

  // Toggle local mute
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

  // Handle volume change
  const handleVolumeChange = (userId: string, volume: number) => {
    const user = voiceUsers.find(u => u.id === userId);
    if (!user) return;
    
    updateVoiceUser({
      ...user,
      volume
    });
  };

  // Handle screen sharing with improved error handling
  const handleScreenShare = async () => {
    if (isScreenSharing) {
      // Use the global stopScreenShare function
      window.voiceChannelStore.stopScreenShare();
      
      toast({
        title: 'Демонстрация экрана остановлена',
      });
      return;
    }
    
    toast({
      title: 'Запрос на доступ к экрану',
      description: 'Разрешите доступ в браузере',
    });
    
    // Use the global startScreenShare function
    const success = await window.voiceChannelStore.startScreenShare();
    
    if (success) {
      toast({
        title: 'Демонстрация экрана запущена',
        description: 'Другие пользователи видят ваш экран',
      });
    } else {
      toast({
        title: 'Ошибка демонстрации экрана',
        description: 'Доступ не был предоставлен',
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
                  onClick={() => window.voiceChannelStore.reconnect()}
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
