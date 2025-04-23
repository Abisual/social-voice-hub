
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  User,
  MessageSquare,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ChatMessageProps {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
    tag: string;
  };
  timestamp: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  id,
  content,
  sender,
  timestamp,
}) => {
  // Format time as HH:MM
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(timestamp);

  // Format date if not today
  const today = new Date();
  const isToday = today.toDateString() === timestamp.toDateString();
  const formattedDate = isToday 
    ? 'Today at ' 
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric'
      }).format(timestamp) + ' at ';

  return (
    <div className="group py-2 px-4 hover:bg-accent/30 flex message-appear">
      <div className="mr-4 flex-shrink-0 pt-0.5">
        <Avatar className="h-10 w-10">
          {sender.avatar ? (
            <img 
              src={sender.avatar} 
              alt={sender.username} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="bg-primary/20 h-full w-full flex items-center justify-center">
              <span className="font-medium text-primary">
                {sender.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="font-medium hover:underline cursor-pointer">
            {sender.username}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">
            {sender.tag}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
            {formattedDate + formattedTime}
          </span>
        </div>
        
        <div className="mt-1 break-words">
          {content}
        </div>
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              <span>View Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span>Message</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
              Report Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatMessage;
