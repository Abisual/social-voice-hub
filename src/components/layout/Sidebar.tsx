import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { 
  User, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  X,
  Mic,
  MicOff,
  PhoneOff
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';

// Use environment variables or fallback to empty strings initially
// This prevents the error, but will need proper values to function correctly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client only if we have the required values
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || 'User';
  });
  
  const [userTag, setUserTag] = useState('#1234');
  const [activeUsers, setActiveUsers] = useState(0);
  
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    
    const fetchUserInfo = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('username, tag')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        if (userData) {
          setUsername(userData.username);
          localStorage.setItem('username', userData.username);
          setUserTag(userData.tag);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };
    
    fetchUserInfo();
  }, [navigate]);
  
  useEffect(() => {
    const fetchActiveUsers = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }
      
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact' })
          .gt('last_active', new Date(Date.now() - 5 * 60 * 1000).toISOString());
          
        if (error) throw error;
        
        if (count !== null) {
          setActiveUsers(count);
        }
      } catch (error) {
        console.error('Error fetching active users count:', error);
      }
    };
    
    fetchActiveUsers();
    
    if (supabase) {
      const channel = supabase.channel('users_presence');
      
      channel
        .on('presence', { event: 'sync' }, () => {
          fetchActiveUsers();
        })
        .subscribe();
        
      return () => {
        channel.unsubscribe();
      };
    }
  }, []);
  
  useEffect(() => {
    const handleUsernameUpdate = () => {
      setUsername(localStorage.getItem('username') || 'User');
    };
    
    window.addEventListener('usernameUpdated', handleUsernameUpdate);
    return () => window.removeEventListener('usernameUpdated', handleUsernameUpdate);
  }, []);
  
  useEffect(() => {
    const updateVoiceState = () => {
      if (!window.voiceChannelStore) return;
      
      setIsVoiceConnected(window.voiceChannelStore.isConnected);
      setIsVoiceConnecting(window.voiceChannelStore.isConnecting);
      setIsMicMuted(window.voiceChannelStore.isMuted);
      
      const currentUser = window.voiceChannelStore.voiceUsers?.find(u => u.id === localStorage.getItem('userId'));
      if (currentUser) {
        setIsSpeaking(currentUser.isSpeaking);
      }
    };
    
    updateVoiceState();
    
    window.addEventListener('voiceStateUpdated', updateVoiceState);
    
    const intervalId = setInterval(updateVoiceState, 500);
    
    return () => {
      window.removeEventListener('voiceStateUpdated', updateVoiceState);
      clearInterval(intervalId);
    };
  }, []);
  
  const handleToggleMute = () => {
    if (!isVoiceConnected || !window.voiceChannelStore) return;
    
    window.voiceChannelStore.toggleMute();
    
    toast({
      title: isMicMuted ? "Микрофон включен" : "Микрофон выключен",
    });
  };
  
  const handleDisconnect = () => {
    if (!isVoiceConnected || !window.voiceChannelStore) return;
    
    window.voiceChannelStore.disconnect();
    
    toast({
      title: "Отключено от голосового чата",
    });
  };
  
  const handleGoToVoice = () => {
    navigate('/voice');
    if (onClose) onClose();
  };
  
  const handleConnectVoice = async () => {
    if (!window.voiceChannelStore) return;
    
    toast({
      title: "Подключение к голосовому чату",
      description: "Пожалуйста, подождите...",
    });
    
    const success = await window.voiceChannelStore.reconnect();
    
    if (success) {
      toast({
        title: "Подключено к голосовому чату",
      });
      navigate('/voice');
      if (onClose) onClose();
    } else {
      toast({
        title: "Ошибка подключения",
        description: "Не удалось подключиться к голосовому чату",
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = async () => {
    const userId = localStorage.getItem('userId');
    if (userId && supabase) {
      try {
        await supabase
          .from('users')
          .update({ status: 'offline' })
          .eq('id', userId);
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
    
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    navigate('/login');
  };
  
  return (
    <aside className="bg-sidebar h-full w-64 flex flex-col">
      {isMobile && (
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <div className="flex items-center justify-center mt-6">
        <h1 className="text-xl font-bold text-primary">VoiceHub</h1>
      </div>
      
      <nav className="mt-8 flex-1 px-4 space-y-2">
        <NavLink 
          to="/chat" 
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            isActive 
              ? "bg-accent text-primary" 
              : "text-foreground/80 hover:bg-accent hover:text-primary"
          )}
          onClick={onClose}
        >
          <MessageSquare className="h-5 w-5" />
          <span>General Chat</span>
          <span className="ml-auto text-xs text-muted-foreground">{activeUsers}</span>
        </NavLink>
        
        <NavLink 
          to="/voice" 
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            isActive 
              ? "bg-accent text-primary" 
              : "text-foreground/80 hover:bg-accent hover:text-primary"
          )}
          onClick={onClose}
        >
          <Users className="h-5 w-5" />
          <span>Voice Room</span>
          {isVoiceConnected && location.pathname !== '/voice' && (
            <span className={cn(
              "ml-auto flex h-2 w-2 rounded-full",
              isSpeaking && !isMicMuted ? "bg-green-500 animate-pulse" : "bg-green-500"
            )}></span>
          )}
        </NavLink>
        
        <NavLink 
          to="/friends" 
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
            isActive 
              ? "bg-accent text-primary" 
              : "text-foreground/80 hover:bg-accent hover:text-primary"
          )}
          onClick={onClose}
        >
          <User className="h-5 w-5" />
          <span>Friends</span>
        </NavLink>
      </nav>
      
      <div className="p-4">
        <Separator className="mb-4" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-primary relative">
              <div className={cn(
                "bg-accent rounded-full h-full w-full flex items-center justify-center",
                isVoiceConnected && isSpeaking && !isMicMuted && "animate-pulse"
              )}>
                <span className="font-medium text-xs">{username.charAt(0).toUpperCase()}</span>
              </div>
              {isVoiceConnected && (
                <div className={cn(
                  "absolute -bottom-1 -right-1 rounded-full bg-background p-0.5",
                  isMicMuted ? "text-red-500" : "text-green-500"
                )}>
                  {isMicMuted ? (
                    <MicOff className="h-3 w-3" />
                  ) : (
                    <Mic className="h-3 w-3" />
                  )}
                </div>
              )}
            </Avatar>
            <div>
              <p className="text-sm font-medium line-clamp-1">{username}</p>
              <p className="text-xs text-muted-foreground">{username + userTag}</p>
            </div>
          </div>
          
          <div className="flex gap-1">
            {isVoiceConnected && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={isMicMuted ? "destructive" : "ghost"}
                      size="icon" 
                      className={cn("h-8 w-8", isMicMuted ? "bg-red-500/20 hover:bg-red-500/30" : "")}
                      onClick={handleToggleMute}
                    >
                      {isMicMuted ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className={cn("h-4 w-4", isSpeaking ? "text-green-500" : "")} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isMicMuted ? "Включить микрофон" : "Выключить микрофон"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {isVoiceConnected && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:bg-red-500/20"
                      onClick={handleDisconnect}
                    >
                      <PhoneOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Отключиться от голосового чата
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {!isVoiceConnected && !isVoiceConnecting && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-green-500 hover:bg-green-500/20"
                      onClick={handleConnectVoice}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Подключиться к голосовому чату
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => {
                      navigate('/settings');
                      if (onClose) onClose();
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Настройки
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Выйти
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
