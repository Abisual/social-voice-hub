
import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import FriendCard, { FriendProps } from '@/components/friends/FriendCard';
import AddFriendForm from '@/components/friends/AddFriendForm';
import { Users, UserPlus } from 'lucide-react';

// Mock data for demonstration
const MOCK_FRIENDS: FriendProps[] = [
  {
    id: 'admin',
    username: 'Admin',
    tag: '#0001',
    status: 'online',
    isFriend: true,
  },
  {
    id: 'user1',
    username: 'TechGuru',
    tag: '#4253',
    status: 'online',
    isFriend: true,
  },
  {
    id: 'user2',
    username: 'GameMaster',
    tag: '#7890',
    status: 'idle',
    isFriend: true,
  },
  {
    id: 'user3',
    username: 'CodeNinja',
    tag: '#5678',
    status: 'offline',
    isFriend: true,
  },
  {
    id: 'user4',
    username: 'PixelArtist',
    tag: '#1122',
    status: 'dnd',
    isFriend: true,
  },
];

const MOCK_PENDING_REQUESTS = [
  {
    id: 'user5',
    username: 'MusicLover',
    tag: '#3344',
    status: 'online',
    isFriend: false,
  },
  {
    id: 'user6',
    username: 'BookWorm',
    tag: '#5566',
    status: 'offline',
    isFriend: false,
  },
];

const FriendsPage = () => {
  const [friends] = useState<FriendProps[]>(MOCK_FRIENDS);
  const [pendingRequests] = useState<FriendProps[]>(MOCK_PENDING_REQUESTS);
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">Friends</h1>
        <p className="text-sm text-muted-foreground">
          Manage your friends and requests
        </p>
      </div>
      
      <div className="p-4 flex-1 overflow-hidden">
        <Tabs defaultValue="all" className="h-full flex flex-col">
          <div className="border-b pb-2">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                <span>All Friends</span>
                <span className="bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {friends.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Pending</span>
                {pendingRequests.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="add">Add Friend</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="overflow-y-auto pt-4 flex-1">
            <TabsContent value="all" className="h-full">
              <div className="grid gap-3">
                {friends.length > 0 ? (
                  friends.map(friend => (
                    <FriendCard key={friend.id} {...friend} />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-lg font-medium">No friends yet</p>
                    <p className="text-muted-foreground">
                      Add some friends to start chatting
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="h-full">
              <div className="grid gap-3">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map(request => (
                    <FriendCard key={request.id} {...request} />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <p className="text-lg font-medium">No pending requests</p>
                    <p className="text-muted-foreground">
                      You don't have any pending friend requests
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="add" className="h-full">
              <AddFriendForm />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default FriendsPage;
