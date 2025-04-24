
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || 'User';
  });
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [noiseSuppression, setNoiseSuppression] = useState(() => {
    const settings = localStorage.getItem('noiseSuppression');
    if (settings) {
      return JSON.parse(settings).enabled;
    }
    return false;
  });
  const [noiseThreshold, setNoiseThreshold] = useState(() => {
    const settings = localStorage.getItem('noiseSuppression');
    if (settings) {
      return JSON.parse(settings).threshold;
    }
    return 50;
  });
  
  // Added voice chat settings
  const [echoCancel, setEchoCancel] = useState(() => {
    return localStorage.getItem('echoCancel') === 'true';
  });
  
  const { toast } = useToast();
  
  // Update the username in the sidebar when component mounts
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password && password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your passwords match',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // Save username globally
      localStorage.setItem('username', username);
      window.dispatchEvent(new Event('usernameUpdated'));
      
      // Save noise suppression settings
      localStorage.setItem('noiseSuppression', JSON.stringify({
        enabled: noiseSuppression,
        threshold: noiseThreshold
      }));
      
      // Save echo cancellation setting
      localStorage.setItem('echoCancel', echoCancel.toString());
      
      // If in voice chat and settings changed, need to update the audio constraints
      const audioStream = window.navigator.mediaDevices.getSupportedConstraints().noiseSuppression && 
                         window.navigator.mediaDevices.getSupportedConstraints().echoCancellation;
      
      if (audioStream) {
        // Dispatch custom event to notify voice chat of settings changes
        window.dispatchEvent(new CustomEvent('voiceSettingsChanged', { 
          detail: { 
            noiseSuppression, 
            noiseThreshold, 
            echoCancel 
          }
        }));
      }
      
      toast({
        title: 'Settings saved',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setPassword('');
      setConfirmPassword('');
    }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real app, you would upload the file to your server/storage
    toast({
      title: 'Avatar upload',
      description: 'Avatar upload functionality coming soon',
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">User Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Profile</h2>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <div className="bg-primary/20 h-full w-full flex items-center justify-center">
                      <span className="font-bold text-2xl text-primary">
                        {username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Avatar>
                  
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 16v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1"></path>
                      <polyline points="4 16 9 11 13 15"></polyline>
                      <polyline points="15 9 15 3 21 3 21 9"></polyline>
                      <line x1="17" y1="6" x2="19" y2="6"></line>
                    </svg>
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
                
                <div className="space-y-2 flex-1">
                  <Label htmlFor="username">Display Name</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={saving}
                  />
                  <p className="text-xs text-muted-foreground">
                    This is how others will see you
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Account</h2>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Change Password</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={saving}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Audio Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="noise-suppression">Noise Suppression</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically reduce background noise
                    </p>
                  </div>
                  <Switch
                    id="noise-suppression"
                    checked={noiseSuppression}
                    onCheckedChange={(checked) => {
                      setNoiseSuppression(checked);
                    }}
                  />
                </div>
                
                {noiseSuppression && (
                  <div className="space-y-2">
                    <Label>Noise Suppression Sensitivity</Label>
                    <div className="pt-2">
                      <Slider
                        value={[noiseThreshold]}
                        onValueChange={([value]) => setNoiseThreshold(value)}
                        max={100}
                        step={1}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {noiseThreshold < 30 ? 'Low' : noiseThreshold < 70 ? 'Medium' : 'High'} sensitivity
                    </p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="echo-cancel">Echo Cancellation</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduces echo from your speakers
                    </p>
                  </div>
                  <Switch
                    id="echo-cancel"
                    checked={echoCancel}
                    onCheckedChange={setEchoCancel}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
