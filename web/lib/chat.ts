// Chat utility functions and real-time subscriptions
import { createClient } from './supabase/client';
import type { 
  ChatRoom, 
  Message, 
  MessageWithSender, 
  ChatRoomWithLastMessage,
  SendMessageRequest,
  CreateDirectMessageRequest,
  GetGroupChatRoomRequest
} from './types/chat';

const supabase = createClient();

// Chat room operations
export async function getGroupChatRoom(groupId: string): Promise<ChatRoom | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_or_create_group_chat_room', { p_group_id: groupId });
    
    if (error) throw error;
    
    // Get the room details
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', data)
      .single();
    
    if (roomError) throw roomError;
    return room;
  } catch (error) {
    console.error('Error getting group chat room:', error);
    return null;
  }
}

export async function createDirectMessageRoom(
  otherUserId: string, 
  groupId: string
): Promise<ChatRoom | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_or_create_direct_message_room', { 
        other_user_id: otherUserId, 
        group_id: groupId 
      });
    
    if (error) throw error;
    
    // Get the room details
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', data)
      .single();
    
    if (roomError) throw roomError;
    return room;
  } catch (error) {
    console.error('Error creating direct message room:', error);
    return null;
  }
}

export async function getUserChatRooms(): Promise<ChatRoomWithLastMessage[]> {
  try {
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_room_members!inner (
          user_id
        )
      `)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    
    // Get last messages for each room
    const roomsWithLastMessage: ChatRoomWithLastMessage[] = await Promise.all(
      rooms.map(async (room) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        let otherUser = null;
        if (room.type === 'direct') {
          // Get the other user in the direct message
          const currentUser = await supabase.auth.getUser();
          const { data: members } = await supabase
            .from('chat_room_members')
            .select('user_id')
            .eq('room_id', room.id)
            .neq('user_id', currentUser.data.user?.id);
          
          if (members && members.length > 0) {
            // Get user details from auth.users
            const { data: userData } = await supabase.auth.admin.getUserById(members[0].user_id);
            if (userData.user) {
              otherUser = {
                id: userData.user.id,
                email: userData.user.email || 'Unknown'
              };
            }
          }
        }
        
        return {
          ...room,
          last_message: lastMessage || undefined,
          other_user: otherUser || undefined
        };
      })
    );
    
    return roomsWithLastMessage;
  } catch (error) {
    console.error('Error getting user chat rooms:', error);
    return [];
  }
}

// Message operations
export async function sendMessage(
  roomId: string, 
  content: string, 
  messageType: 'text' | 'image' | 'file' = 'text'
): Promise<Message | null> {
  try {
    const { data, error } = await supabase
      .rpc('send_message', { 
        room_id: roomId, 
        content, 
        message_type: messageType 
      });
    
    if (error) throw error;
    
    // Get the created message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', data)
      .single();
    
    if (messageError) throw messageError;
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

export async function getRoomMessages(
  roomId: string, 
  limit: number = 50,
  before?: string
): Promise<MessageWithSender[]> {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (before) {
      query = query.lt('created_at', before);
    }
    
    const { data: messages, error } = await query;
    
    if (error) throw error;
    
    // Get unique sender IDs
    const senderIds = [...new Set(messages?.map(m => m.sender_id) || [])];
    
    // Get sender details (simplified approach)
    const sendersMap = new Map();
    for (const senderId of senderIds) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(senderId);
        if (userData.user) {
          sendersMap.set(senderId, {
            id: userData.user.id,
            email: userData.user.email || 'Unknown'
          });
        }
      } catch {
        // Fallback for cases where user data isn't accessible
        sendersMap.set(senderId, {
          id: senderId,
          email: 'Unknown User'
        });
      }
    }
    
    // Combine messages with sender data
    const messagesWithSender: MessageWithSender[] = (messages || []).map(message => ({
      ...message,
      sender: sendersMap.get(message.sender_id) || {
        id: message.sender_id,
        email: 'Unknown User'
      }
    }));
    
    return messagesWithSender.reverse(); // Reverse to show oldest first
  } catch (error) {
    console.error('Error getting room messages:', error);
    return [];
  }
}

export async function editMessage(messageId: string, content: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ 
        content, 
        edited_at: new Date().toISOString() 
      })
      .eq('id', messageId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error editing message:', error);
    return false;
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
}

// Real-time subscriptions
export function subscribeToRoomMessages(
  roomId: string,
  onMessage: (message: Message) => void,
  onEdit: (message: Message) => void,
  onDelete: (messageId: string) => void
) {
  const subscription = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        onEdit(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        onDelete(payload.old.id);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

export function subscribeToUserChatRooms(
  onRoomUpdate: (room: ChatRoom) => void
) {
  const subscription = supabase
    .channel('user-chat-rooms')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_rooms'
      },
      (payload) => {
        if (payload.new) {
          onRoomUpdate(payload.new as ChatRoom);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// Utility functions
export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 168) { // Less than a week
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}

export function getDirectMessageDisplayName(
  room: ChatRoomWithLastMessage,
  currentUserId: string
): string {
  if (room.type === 'group') {
    return room.name || 'Group Chat';
  }
  
  return room.other_user?.email || 'Unknown User';
} 