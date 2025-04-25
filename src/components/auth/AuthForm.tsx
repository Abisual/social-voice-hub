
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AuthForm = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Store username in localStorage
      localStorage.setItem('username', username);
      
      toast({
        title: 'Welcome!',
        description: `You've joined as ${username}`,
      });
      
      // Trigger username update event for other components
      window.dispatchEvent(new Event('usernameUpdated'));
      
      navigate('/chat');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to join. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-card p-8 rounded-lg shadow-lg w-full max-w-md animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2">VoiceHub</h1>
        <p className="text-muted-foreground">
          Enter your nickname to start chatting
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Nickname</Label>
          <Input
            id="username"
            placeholder="Enter your nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            minLength={2}
            maxLength={20}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Joining...' : 'Join Chat'}
        </Button>
      </form>
    </div>
  );
};

export default AuthForm;
