
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Fullscreen, Minimize } from 'lucide-react';

interface ScreenShareViewProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const ScreenShareView: React.FC<ScreenShareViewProps> = ({ stream, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      // Only set the video source, don't touch audio
      videoRef.current.srcObject = stream;
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stream]);
  
  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  if (!isActive || !stream) {
    return null;
  }
  
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-card relative">
      <div className="absolute top-2 right-2 z-10">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={toggleFullscreen}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Fullscreen className="h-4 w-4" />
          )}
        </Button>
      </div>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        className="w-full h-auto"
      />
      <div className="p-2 bg-card/80 backdrop-blur-sm text-xs font-medium">
        Screen sharing active
      </div>
    </div>
  );
};

export default ScreenShareView;
