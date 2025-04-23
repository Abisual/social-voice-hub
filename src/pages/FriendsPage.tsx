
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import FriendCard from '@/components/friends/FriendCard';
import AddFriendForm from '@/components/friends/AddFriendForm';
import { PlusCircle, UserPlus, Users } from 'lucide-react';

// Изменим тип status на разрешенные значения
type FriendStatus = "online" | "offline" | "idle" | "dnd";

// Демо-данные друзей с правильной типизацией
const MOCK_FRIENDS = [
  {
    id: 'user1',
    username: 'TechGuru',
    tag: '#4253',
    status: "online" as FriendStatus,
    avatar: '',
    isFriend: true,
  },
  {
    id: 'user2',
    username: 'GameMaster',
    tag: '#7890',
    status: "idle" as FriendStatus,
    avatar: '',
    isFriend: true,
  }
];

// Демо-данные для входящих запросов
const MOCK_REQUESTS = [
  {
    id: 'user3',
    username: 'PixelArtist',
    tag: '#1122',
    status: "online" as FriendStatus,
    avatar: '',
    isFriend: false,
  }
];

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const handleAddFriend = (username: string) => {
    if (!username.includes('#')) {
      toast({
        title: 'Invalid format',
        description: 'Please enter a username with tag (e.g., Friend#1234)',
      });
      return;
    }
    
    toast({
      title: 'Friend request sent!',
      description: `Your request to ${username} has been sent.`,
    });
  };
  
  const filteredFriends = MOCK_FRIENDS.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">Friends</h1>
        <Tabs
          defaultValue="friends"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-4"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>All Friends</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Requests</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Add Friend</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Search friends..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="grid gap-4">
              {filteredFriends.length > 0 ? (
                filteredFriends.map(friend => (
                  <FriendCard 
                    key={friend.id} 
                    {...friend}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No friends found</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <h2 className="text-lg font-semibold">Friend Requests</h2>
            <div className="grid gap-4">
              {MOCK_REQUESTS.map(request => (
                <FriendCard 
                  key={request.id}
                  {...request}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="add">
            <AddFriendForm onAddFriend={handleAddFriend} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FriendsPage;
