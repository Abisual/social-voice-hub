
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  
  // Automatically redirect to login page
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-3xl w-full text-center space-y-8 animate-fade-in">
        <h1 className="text-4xl sm:text-6xl font-bold text-primary">VoiceHub</h1>
        <p className="text-xl sm:text-2xl text-foreground">
          A modern Discord-like platform for communication
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button 
            size="lg" 
            className="px-8"
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>
          <Button 
            variant="outline"
            size="lg" 
            onClick={() => navigate('/chat')}
          >
            Explore Demo
          </Button>
        </div>
        
        <div className="max-w-2xl mx-auto mt-12">
          <p className="text-muted-foreground">
            Featuring text chat, voice communication, screen sharing, 
            profiles, and direct messaging - all in a beautiful, 
            responsive interface.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
