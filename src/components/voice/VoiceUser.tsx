
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';

interface VoiceUserProps {
  id: string;
  username: string;
  tag: string;
  avatar?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocalMuted: boolean;
  volume: number;
  onToggleMute: (userId: string) => void;
  onToggleLocalMute: (userId: string) => void;
  onVolumeChange: (userId: string, volume: number) => void;
}

const VoiceUser: React.FC<VoiceUserProps> = ({
  id,
  username,
  tag,
  avatar,
  isSpeaking,
  isMuted,
  isLocalMuted,
  volume,
  onToggleMute,
  onToggleLocalMute,
  onVolumeChange,
}) => {
  return (
    <div className={`p-3 rounded-lg ${isSpeaking ? 'bg-accent/30' : ''} transition-colors`}>
      <div className="flex items-center">
        <div className="relative">
          <Avatar className="h-10 w-10">
            {avatar ? (
              <img src={avatar} alt={username} className="h-full w-full object-cover" />
            ) : (
              <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                <span className="font-medium text-primary">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Avatar>
          {isSpeaking && !isMuted && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></span>
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <span className="font-medium">{username}</span>
            <span className="ml-1 text-xs text-muted-foreground">{tag}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => onToggleMute(id)}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4 text-destructive" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isMuted ? 'Unmute' : 'Mute'}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => onToggleLocalMute(id)}
              >
                {isLocalMuted ? (
                  <VolumeX className="h-4 w-4 text-destructive" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isLocalMuted ? 'Unmute for you' : 'Mute for you'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      
      {!isLocalMuted && (
        <div className="mt-2 px-2">
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => onVolumeChange(id, value[0])}
            className="h-2"
          />
        </div>
      )}
    </div>
  );
};

export default VoiceUser;
