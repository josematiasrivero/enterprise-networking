'use client';

import { useState, useEffect } from 'react';
import { ChatRoom } from '@/lib/types/chat';
import { getGroupChatRoom } from '@/lib/chat';
import ChatRoomComponent from '@/components/chat/chat-room';
import MemberList from '@/components/chat/member-list';
import { toast } from 'react-hot-toast';

interface ChatInterfaceProps {
  groupId: string;
  currentUserId: string;
}

export default function ChatInterface({ groupId, currentUserId }: ChatInterfaceProps) {
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [groupChatRoom, setGroupChatRoom] = useState<ChatRoom | null>(null);
  const [directMessageRooms, setDirectMessageRooms] = useState<ChatRoom[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'members'>('chat');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeChatRooms();
  }, [groupId]);

  const initializeChatRooms = async () => {
    try {
      setLoading(true);
      
      // Get or create the main group chat room
      const groupRoom = await getGroupChatRoom(groupId);
      if (groupRoom) {
        setGroupChatRoom(groupRoom);
        setActiveRoom(groupRoom);
      } else {
        toast.error('Failed to load group chat');
      }
    } catch (error) {
      console.error('Error initializing chat rooms:', error);
      toast.error('Failed to initialize chat');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectMessageClick = (roomId: string) => {
    // This will be called when a direct message room is created
    // For now, we'll just show a success message
    toast.success('Direct message room created');
    setActiveTab('chat');
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        {/* Tab navigation */}
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💬 Chat Rooms
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === 'members'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Members
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chat' ? (
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Chat Rooms</h3>
              
              {/* Group chat room */}
              {groupChatRoom && (
                <div
                  onClick={() => setActiveRoom(groupChatRoom)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                    activeRoom?.id === groupChatRoom.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-semibold">
                      #
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {groupChatRoom.name || 'General Chat'}
                      </h4>
                      <p className="text-sm text-gray-500">Group conversation</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Direct message rooms would go here */}
              {directMessageRooms.length === 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">
                    No direct messages yet. Use the Members tab to start a conversation.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <MemberList
              groupId={groupId}
              currentUserId={currentUserId}
              onDirectMessageClick={handleDirectMessageClick}
            />
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <ChatRoomComponent
            room={activeRoom}
            currentUserId={currentUserId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">💬</div>
              <p>Select a chat room to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 