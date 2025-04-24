
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
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSystemMessage = sender.id === 'system';
  
  // Ensure timestamp is a valid Date object
  const messageTime = timestamp instanceof Date ? timestamp : new Date();
  
  // Format time as HH:MM
  const formattedTime = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(messageTime);

  // Format date if not today
  const today = new Date();
  const isToday = today.toDateString() === messageTime.toDateString();
  const formattedDate = isToday 
    ? 'Сегодня в ' 
    : new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit'
      }).format(messageTime) + ' в ';

  // Profile view handler
  const handleViewProfile = () => {
    toast({
      title: `Просмотр профиля ${sender.username}`,
      description: `В полной версии здесь будет профиль пользователя`,
    });
  };
  
  // Direct message handler
  const handleSendDM = () => {
    navigate(`/dm/${sender.id}`);
  };
  
  // Add friend handler
  const handleAddFriend = () => {
    toast({
      title: `Запрос дружбы отправлен`,
      description: `Вы отправили запрос дружбы пользователю ${sender.username}`,
    });
  };

  // Display system messages differently
  if (isSystemMessage) {
    return (
      <div className="py-2 px-4 text-center">
        <span className="text-sm text-muted-foreground">{content}</span>
      </div>
    );
  }

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
          <span 
            className="font-medium hover:underline cursor-pointer"
            onClick={handleViewProfile}
          >
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
            <DropdownMenuItem 
              className="cursor-pointer" 
              onClick={handleViewProfile}
            >
              <User className="h-4 w-4 mr-2" />
              <span>Профиль</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleSendDM}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              <span>Написать</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleAddFriend}
            >
              Добавить в друзья
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive">
              Пожаловаться
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatMessage;
