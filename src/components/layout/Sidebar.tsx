
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { 
  User, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  X 
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || 'User';
  });
  
  useEffect(() => {
    const handleUsernameUpdate = () => {
      setUsername(localStorage.getItem('username') || 'User');
    };
    
    window.addEventListener('usernameUpdated', handleUsernameUpdate);
    return () => window.removeEventListener('usernameUpdated', handleUsernameUpdate);
  }, []);
  
  const handleLogout = () => {
    // Handle logout logic here
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
            <Avatar className="h-10 w-10 border-2 border-primary">
              <div className="bg-accent rounded-full h-full w-full flex items-center justify-center">
                <span className="font-medium text-xs">{username.charAt(0).toUpperCase()}</span>
              </div>
            </Avatar>
            <div>
              <p className="text-sm font-medium line-clamp-1">{username}</p>
              <p className="text-xs text-muted-foreground">{username}#1234</p>
            </div>
          </div>
          
          <div className="flex gap-1">
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
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
