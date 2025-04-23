
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

// Реальный список друзей будет пустым - убираем моковые данные
const MOCK_FRIENDS: {
  id: string;
  username: string;
  tag: string;
  status: FriendStatus;
  avatar: string;
  isFriend: boolean;
}[] = [];

// Пустой список входящих запросов
const MOCK_REQUESTS: {
  id: string;
  username: string;
  tag: string;
  status: FriendStatus;
  avatar: string;
  isFriend: boolean;
}[] = [];

const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
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
                  <p className="text-muted-foreground">No friends found. Add some friends to see them here.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-4">
            <h2 className="text-lg font-semibold">Friend Requests</h2>
            <div className="grid gap-4">
              {MOCK_REQUESTS.length > 0 ? (
                MOCK_REQUESTS.map(request => (
                  <FriendCard 
                    key={request.id}
                    {...request}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending friend requests</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="add">
            <AddFriendForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FriendsPage;
