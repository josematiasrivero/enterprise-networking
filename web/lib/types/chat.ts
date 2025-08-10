// Chat system types for Enterprise Networking

export type ChatRoomType = 'group' | 'direct';
export type MessageType = 'text' | 'image' | 'file';

export interface ChatRoom {
  id: string;
  type: ChatRoomType;
  name: string | null;
  group_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  edited_at: string | null;
  created_at: string;
}

// Extended types with user information
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    email: string;
    // Add other user fields as needed
  };
}

export interface ChatRoomWithLastMessage extends ChatRoom {
  last_message?: Message;
  other_user?: {
    id: string;
    email: string;
  };
}

// Real-time subscription types
export interface ChatSubscriptionPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Message | null;
  old: Message | null;
}

// API request/response types
export interface SendMessageRequest {
  room_id: string;
  content: string;
  message_type?: MessageType;
}

export interface CreateDirectMessageRequest {
  other_user_id: string;
  group_id: string;
}

export interface GetGroupChatRoomRequest {
  group_id: string;
} 