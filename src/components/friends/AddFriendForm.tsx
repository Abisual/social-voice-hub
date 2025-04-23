
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const AddFriendForm = () => {
  const [friendId, setFriendId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input (basic check)
    if (!friendId.includes('#')) {
      toast({
        title: 'Invalid format',
        description: 'Please enter a valid ID (e.g., username#1234)',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Friend request sent',
        description: `Friend request sent to ${friendId}`,
      });
      setFriendId('');
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="friendId">Add Friend</Label>
        <div className="flex gap-2">
          <Input
            id="friendId"
            placeholder="Enter a username#1234"
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !friendId}>
            {isLoading ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          You can add friends by entering their Discord-style ID
        </p>
      </div>
    </form>
  );
};

export default AddFriendForm;
