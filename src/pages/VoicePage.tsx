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
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { VoiceUserType } from '@/types/voice';

// Инициализируем клиент Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверяем наличие значений и инициализируем клиент только при их наличии
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Выводим информацию о подключении к Supabase для отладки
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);
console.log('Supabase client initialized:', !!supabase);

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
      peerConnections: Record<string, RTCPeerConnection>;
      roomId: string;
      disconnect: () => void;
      reconnect: () => Promise<boolean>;
      toggleMute: () => void;
      stopScreenShare: () => void;
      startScreenShare: () => Promise<boolean>;
      joinVoiceChannel: (roomId: string) => Promise<boolean>;
      leaveVoiceChannel: () => void;
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
    peerConnections: {},
    roomId: 'general',
    
    disconnect: () => {
      const store = window.voiceChannelStore;
      
      store.leaveVoiceChannel();
      
      if (store.audioContext && store.audioContext.state !== 'closed') {
        store.audioContext.suspend().catch(err => {
          console.error('Error suspending audio context:', err);
        });
      }
      
      if (store.screenShareStream) {
        store.screenShareStream.getTracks().forEach(track => track.stop());
        store.screenShareStream = null;
        store.isScreenSharing = false;
      }
      
      if (store.audioStream) {
        store.audioStream.getTracks().forEach(track => track.stop());
        store.audioStream = null;
      }
      
      store.isConnected = false;
      store.isConnecting = false;
      store.microphoneAccess = null;
      store.voiceUsers = [];
      store.hasInitialized = false;
      store.peerConnections = {};
      
      window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
    },
    
    reconnect: async () => {
      const store = window.voiceChannelStore;
      
      if (store.isConnecting) return false;
      
      if (store.isConnected) {
        store.isConnected = false;
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
      }
      
      store.isConnecting = true;
      window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
      
      try {
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
        
        if (store.audioContext && store.audioContext.state === 'suspended') {
          await store.audioContext.resume();
        }
        
        store.audioStream = stream;
        store.isConnected = true;
        store.isConnecting = false;
        store.microphoneAccess = true;
        store.hasInitialized = true;
        
        stream.getAudioTracks().forEach(track => {
          track.enabled = !store.isMuted;
        });
        
        await store.joinVoiceChannel(store.roomId);
        
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
        return true;
      } catch (error) {
        console.error('Error reconnecting to voice chat:', error);
        store.isConnecting = false;
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
        return false;
      }
    },
    
    joinVoiceChannel: async (roomId) => {
      const store = window.voiceChannelStore;
      
      if (!store.audioStream) return false;
      
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return false;
      
      store.roomId = roomId;
      
      try {
        if (supabase) {
          await supabase
            .from('users')
            .update({ 
              voice_status: 'active',
              voice_channel: roomId,
              last_active: new Date()
            })
            .eq('id', currentUserId);
        }
        
        const username = localStorage.getItem('username') || 'User';
        const currentUser = {
          id: currentUserId,
          username,
          tag: '#1234',
          isSpeaking: false,
          isMuted: store.isMuted,
          isLocalMuted: false,
          volume: 100
        };
        
        store.voiceUsers = [currentUser];
        
        if (!supabase) {
          window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
          return true;
        }
        
        const voiceChannel = supabase.channel(`voice:${roomId}`);
        
        voiceChannel.on('presence', { event: 'join' }, async ({ key, newPresences }) => {
          for (const presence of newPresences) {
            if (presence.user_id === currentUserId) continue;
            
            const { data: userData } = await supabase
              .from('users')
              .select('username, tag')
              .eq('id', presence.user_id)
              .single();
              
            if (!userData) continue;
            
            const newUser = {
              id: presence.user_id,
              username: userData.username,
              tag: userData.tag,
              isSpeaking: false,
              isMuted: presence.is_muted || false,
              isLocalMuted: false,
              volume: 100
            };
            
            store.voiceUsers.push(newUser);
            
            createPeerConnection(presence.user_id);
            
            window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
          }
        });
        
        voiceChannel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          for (const presence of leftPresences) {
            store.voiceUsers = store.voiceUsers.filter(user => user.id !== presence.user_id);
            
            if (store.peerConnections[presence.user_id]) {
              store.peerConnections[presence.user_id].close();
              delete store.peerConnections[presence.user_id];
            }
            
            window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
          }
        });
        
        voiceChannel.on('broadcast', { event: 'webrtc' }, async (payload) => {
          const { type, from, to, data } = payload;
          
          if (to !== currentUserId) return;
          
          if (type === 'offer' as string) {
            if (!store.peerConnections[from]) {
              createPeerConnection(from);
            }
            
            const pc = store.peerConnections[from];
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            voiceChannel.send({
              type: 'broadcast',
              event: 'webrtc',
              payload: {
                type: 'answer',
                from: currentUserId,
                to: from,
                data: answer
              }
            });
          }
          else if (type === 'answer' as string) {
            const pc = store.peerConnections[from];
            if (pc) {
              await pc.setRemoteDescription(new RTCSessionDescription(data));
            }
          }
          else if (type === 'ice-candidate' as string) {
            const pc = store.peerConnections[from];
            if (pc) {
              await pc.addIceCandidate(new RTCIceCandidate(data));
            }
          }
        });
        
        voiceChannel.track({
          user_id: currentUserId,
          is_muted: store.isMuted
        });
        
        await voiceChannel.subscribe();
        
        async function createPeerConnection(remoteUserId: string) {
          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          });
          
          store.audioStream!.getTracks().forEach(track => {
            pc.addTrack(track, store.audioStream!);
          });
          
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              voiceChannel.send({
                type: 'broadcast',
                event: 'webrtc',
                payload: {
                  type: 'ice-candidate',
                  from: currentUserId,
                  to: remoteUserId,
                  data: event.candidate
                }
              });
            }
          };
          
          pc.ontrack = (event) => {
            const audioEl = new Audio();
            audioEl.srcObject = event.streams[0];
            audioEl.autoplay = true;
            audioEl.dataset.userId = remoteUserId;
            
            document.body.appendChild(audioEl);
            
            event.track.onended = () => {
              document.querySelectorAll(`audio[data-user-id="${remoteUserId}"]`).forEach(el => el.remove());
            };
          };
          
          store.peerConnections[remoteUserId] = pc;
          
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          voiceChannel.send({
            type: 'broadcast',
            event: 'webrtc',
            payload: {
              type: 'offer',
              from: currentUserId,
              to: remoteUserId,
              data: offer
            }
          });
          
          return pc;
        }
        
        return true;
      } catch (error) {
        console.error('Error joining voice channel:', error);
        return false;
      }
    },
    
    leaveVoiceChannel: () => {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return;
      
      try {
        if (supabase) {
          const voiceChannel = supabase.channel(`voice:${window.voiceChannelStore.roomId}`);
          voiceChannel.unsubscribe();
          
          supabase
            .from('users')
            .update({ 
              voice_status: 'inactive',
              voice_channel: null,
              last_active: new Date()
            })
            .eq('id', currentUserId)
            .then(() => {
              document.querySelectorAll('audio[data-user-id]').forEach(el => el.remove());
            });
        }
        
        for (const userId in window.voiceChannelStore.peerConnections) {
          window.voiceChannelStore.peerConnections[userId].close();
        }
        
        window.voiceChannelStore.peerConnections = {};
      } catch (error) {
        console.error('Error leaving voice channel:', error);
      }
    },
    
    toggleMute: () => {
      const store = window.voiceChannelStore;
      const newMutedState = !store.isMuted;
      
      store.isMuted = newMutedState;
      
      if (store.audioStream) {
        store.audioStream.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }
      
      store.voiceUsers = store.voiceUsers.map(user => 
        user.id === localStorage.getItem('userId')
          ? { ...user, isMuted: newMutedState, isSpeaking: false } 
          : user
      );
      
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId && supabase) {
        const voiceChannel = supabase.channel(`voice:${store.roomId}`);
        voiceChannel.track({
          user_id: currentUserId,
          is_muted: newMutedState
        });
      }
      
      window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
    },
    
    stopScreenShare: () => {
      const store = window.voiceChannelStore;
      
      if (store.screenShareStream) {
        store.screenShareStream.getTracks().forEach(track => track.stop());
        store.screenShareStream = null;
        store.isScreenSharing = false;
        
        window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
      }
    },
    
    startScreenShare: async () => {
      const store = window.voiceChannelStore;
      
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false
        });
        
        store.screenShareStream = stream;
        store.isScreenSharing = true;
        
        stream.getVideoTracks()[0].onended = () => {
          store.screenShareStream = null;
          store.isScreenSharing = false;
          window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
        };
        
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
  const navigate = useNavigate();
  
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');
    
    if (!userId || !username) {
      navigate('/login');
    }
  }, [navigate]);
  
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
  
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
      
      if (store.isConnected && store.audioStream && !animationFrameRef.current) {
        setupAudioAnalysis(store.audioStream);
      }
    };
    
    window.addEventListener('voiceStateUpdated', handleVoiceStateUpdated);
    return () => {
      window.removeEventListener('voiceStateUpdated', handleVoiceStateUpdated);
    };
  }, []);
  
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
      
      window.voiceChannelStore.voiceUsers = window.voiceChannelStore.voiceUsers.map(user => 
        user.id === 'currentUser' 
          ? { ...user, username } 
          : user
      );
    };
    
    window.addEventListener('usernameUpdated', handleUsernameUpdate);
    return () => window.removeEventListener('usernameUpdated', handleUsernameUpdate);
  }, []);
  
  const handleDisconnect = () => {
    stopAudioAnalysis();
    
    window.voiceChannelStore.disconnect();
    
    toast({
      title: "Отключено от голосового чата",
    });
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    stopAudioAnalysis();
    
    if (!stream || stream.getAudioTracks().length === 0) {
      console.error('No audio tracks in stream');
      return;
    }
    
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        window.voiceChannelStore.audioContext = audioContext;
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      }
      
      let analyser: AnalyserNode;
      analyser = audioContextRef.current.createAnalyser();
      analyserRef.current = analyser;
      window.voiceChannelStore.analyser = analyser;
      analyser.fftSize = 256;
      
      let source: MediaStreamAudioSourceNode;
      source = audioContextRef.current.createMediaStreamSource(stream);
      audioSourceRef.current = source;
      window.voiceChannelStore.audioSource = source;
      
      const noiseSuppressionSettings = localStorage.getItem('noiseSuppression');
      try {
        if (noiseSuppressionSettings) {
          const { enabled, threshold } = JSON.parse(noiseSuppressionSettings);
          
          if (enabled) {
            const compressor = audioContextRef.current.createDynamicsCompressor();
            compressor.threshold.value = -80 + threshold * 0.8;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;
            
            source.connect(compressor);
            compressor.connect(analyser);
          } else {
            source.connect(analyser);
          }
        } else {
          source.connect(analyser);
        }
      } catch (error) {
        console.error('Failed to apply noise suppression:', error);
        source.connect(analyser);
      }
      
      analyzeMicrophoneLevel();
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
    }
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
            user.id === localStorage.getItem('userId')
              ? { ...user, isSpeaking } 
              : user
          )
        );
        
        window.voiceChannelStore.voiceUsers = window.voiceChannelStore.voiceUsers.map(user => 
          user.id === localStorage.getItem('userId')
            ? { ...user, isSpeaking } 
            : user
        );
        
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      } catch (error) {
        console.error('Error analyzing microphone level:', error);
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
    
    window.voiceChannelStore.voiceUsers = window.voiceChannelStore.voiceUsers.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    
    window.dispatchEvent(new CustomEvent('voiceStateUpdated'));
  };

  const handleToggleMute = (userId: string) => {
    if (userId !== localStorage.getItem('userId')) return;
    
    window.voiceChannelStore.toggleMute();
    
    toast({
      title: !isMuted ? "Микрофон выключено" : "Микрофон включен",
    });
  };

  const handleToggleLocalMute = (userId: string) => {
    if (userId === localStorage.getItem('userId')) return;
    
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
    if (isScreenSharing) {
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
              onClick={() => handleToggleMute(localStorage.getItem('userId') || '')}
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
                  <Mic className={`h-4 w-4 ${voiceUsers.find(u => u.id === localStorage.getItem('userId'))?.isSpeaking ? 'animate-pulse text-green-400' : ''}`} />
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
                  isSelf={user.id === localStorage.getItem('userId')}
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
