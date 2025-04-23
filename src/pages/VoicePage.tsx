
import React, { useState } from 'react';
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

// Mock data for demonstration
const MOCK_VOICE_USERS = [
  {
    id: 'admin',
    username: 'Admin',
    tag: '#0001',
    isSpeaking: true,
    isMuted: false,
    isLocalMuted: false,
    volume: 80,
  },
  {
    id: 'user1',
    username: 'TechGuru',
    tag: '#4253',
    isSpeaking: false,
    isMuted: false,
    isLocalMuted: false,
    volume: 70,
  },
  {
    id: 'user2',
    username: 'GameMaster',
    tag: '#7890',
    isSpeaking: false,
    isMuted: true,
    isLocalMuted: false,
    volume: 60,
  },
  {
    id: 'currentUser',
    username: 'CurrentUser',
    tag: '#1234',
    isSpeaking: false,
    isMuted: false,
    isLocalMuted: false,
    volume: 100,
  }
];

const VoicePage = () => {
  const [voiceUsers, setVoiceUsers] = useState(MOCK_VOICE_USERS);
  const [isMuted, setIsMuted] = useState(false);
  
  const { toast } = useToast();
  
  // Handle toggling mic mute for a user
  const handleToggleMute = (userId: string) => {
    setVoiceUsers(
      voiceUsers.map(user => 
        user.id === userId 
          ? { ...user, isMuted: !user.isMuted, isSpeaking: false }
          : user
      )
    );
    
    // If current user is toggling their own mute status
    if (userId === 'currentUser') {
      setIsMuted(!isMuted);
    }
  };
  
  // Handle toggling local mute for a user
  const handleToggleLocalMute = (userId: string) => {
    setVoiceUsers(
      voiceUsers.map(user => 
        user.id === userId 
          ? { ...user, isLocalMuted: !user.isLocalMuted }
          : user
      )
    );
  };
  
  // Handle changing volume for a user
  const handleVolumeChange = (userId: string, volume: number) => {
    setVoiceUsers(
      voiceUsers.map(user => 
        user.id === userId 
          ? { ...user, volume }
          : user
      )
    );
  };
  
  // Handle screen sharing
  const handleScreenShare = () => {
    toast({
      title: 'Coming soon',
      description: 'Screen sharing functionality will be available soon',
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Voice Room</h1>
            <p className="text-sm text-muted-foreground">
              {voiceUsers.length} connected users
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={isMuted ? 'destructive' : 'default'}
              onClick={() => handleToggleMute('currentUser')}
              className="gap-2"
            >
              {isMuted ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Mute</span>
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleScreenShare}
              className="gap-2"
            >
              <MonitorSmartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Share Screen</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span>Connected Users</span>
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
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Voice functionality is simulated in this MVP.</p>
            <p>WebRTC integration coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePage;
