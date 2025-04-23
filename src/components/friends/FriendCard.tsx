
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

export interface FriendProps {
  id: string;
  username: string;
  tag: string;
  avatar?: string;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  isFriend: boolean;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
};

const FriendCard: React.FC<FriendProps> = ({
  id,
  username,
  tag,
  avatar,
  status,
  isFriend,
}) => {
  const navigate = useNavigate();
  
  const handleMessage = () => {
    // Navigate to DM with this friend
    navigate(`/dm/${id}`);
  };
  
  const handleRemoveFriend = () => {
    console.log('Remove friend:', id);
    // In a real app, you would handle friend removal here
    // and update the UI accordingly
  };
  
  return (
    <div className="p-3 bg-card rounded-lg hover:bg-accent/20 transition-colors">
      <div className="flex items-center justify-between">
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
            <span 
              className={`absolute bottom-0 right-0 h-3 w-3 ${statusColors[status]} rounded-full border-2 border-background`}
            />
          </div>
          
          <div className="ml-3">
            <div className="flex items-center">
              <span className="font-medium">{username}</span>
              <span className="ml-1 text-xs text-muted-foreground">{tag}</span>
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {status}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleMessage}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleMessage}
                className="cursor-pointer"
              >
                Message
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleRemoveFriend}
                className="cursor-pointer text-destructive"
              >
                Remove Friend
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default FriendCard;
