
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'register';

const AuthForm = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // For demo purposes, we'll simulate authentication
      // In a real app, you would connect to your auth service here
      if (mode === 'login') {
        // Login logic would go here
        console.log('Logging in with:', { email, password });
        
        // Simulate successful login
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: 'Successfully logged in',
          description: 'Welcome back!',
        });
        navigate('/chat');
      } else {
        // Registration logic would go here
        console.log('Registering with:', { email, username, password });
        
        // Simulate successful registration
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: 'Account created',
          description: 'Your account has been created successfully.',
        });
        navigate('/chat');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Authentication failed',
        description: 'Please check your credentials and try again.',
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
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="yourusername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === 'login' && (
              <a 
                href="#" 
                className="text-xs text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  // Handle forgot password
                  toast({
                    title: 'Password reset',
                    description: 'Password reset functionality coming soon',
                  });
                }}
              >
                Forgot password?
              </a>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading
            ? 'Please wait...'
            : mode === 'login'
              ? 'Sign In'
              : 'Create Account'
          }
        </Button>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex gap-4">
          <Button 
            variant="outline"
            className="w-full" 
            disabled={isLoading}
            onClick={() => {
              toast({
                title: 'Coming soon',
                description: 'OAuth integration coming soon',
              });
            }}
          >
            Google
          </Button>
          <Button 
            variant="outline"
            className="w-full"  
            disabled={isLoading}
            onClick={() => {
              toast({
                title: 'Coming soon',
                description: 'OAuth integration coming soon',
              });
            }}
          >
            Discord
          </Button>
        </div>
        
        <p className="text-center mt-6 text-sm">
          {mode === 'login' 
            ? "Don't have an account? "
            : "Already have an account? "
          }
          <a
            href="#"
            className="text-primary hover:underline font-medium"
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === 'login' ? 'register' : 'login');
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
