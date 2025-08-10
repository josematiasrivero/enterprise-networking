'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageWithSender, ChatRoom } from '@/lib/types/chat';
import { 
  getRoomMessages, 
  sendMessage, 
  editMessage, 
  deleteMessage, 
  subscribeToRoomMessages 
} from '@/lib/chat';
import MessageList from './message-list';
import MessageInput from './message-input';
import { toast } from 'react-hot-toast';

interface ChatRoomProps {
  room: ChatRoom;
  currentUserId: string;
}

export default function ChatRoomComponent({ room, currentUserId }: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const roomMessages = await getRoomMessages(room.id);
      setMessages(roomMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [room.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Set up real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToRoomMessages(
      room.id,
      // On new message
      async (newMessage) => {
        // Get sender details and add to messages
        try {
          const messagesWithSender = await getRoomMessages(room.id, 1);
          if (messagesWithSender.length > 0) {
            const latestMessage = messagesWithSender[0];
            if (latestMessage.id === newMessage.id) {
              setMessages(prev => [...prev, latestMessage]);
            }
          }
        } catch (error) {
          console.error('Error handling new message:', error);
        }
      },
      // On message edit
      (editedMessage) => {
        setMessages(prev => prev.map(msg => 
          msg.id === editedMessage.id 
            ? { ...msg, content: editedMessage.content, edited_at: editedMessage.edited_at }
            : msg
        ));
      },
      // On message delete
      (deletedMessageId) => {
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessageId));
      }
    );

    return unsubscribe;
  }, [room.id]);

  const handleSendMessage = async (content: string) => {
    try {
      const newMessage = await sendMessage(room.id, content);
      if (!newMessage) {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      const success = await editMessage(messageId, content);
      if (!success) {
        toast.error('Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const success = await deleteMessage(messageId);
      if (!success) {
        toast.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b bg-white px-4 py-3">
        <h2 className="font-semibold text-gray-900">
          {room.type === 'group' ? room.name : 'Direct Message'}
        </h2>
        <p className="text-sm text-gray-500">
          {room.type === 'group' 
            ? 'Group conversation' 
            : 'Private conversation'
          }
        </p>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
      />

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder={`Message ${room.type === 'group' ? room.name : 'user'}...`}
      />
    </div>
  );
} 