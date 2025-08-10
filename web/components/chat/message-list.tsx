'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageWithSender } from '@/lib/types/chat';
import { formatMessageTime } from '@/lib/chat';

interface MessageListProps {
  messages: MessageWithSender[];
  currentUserId: string;
  onEditMessage?: (messageId: string, content: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export default function MessageList({ 
  messages, 
  currentUserId, 
  onEditMessage, 
  onDeleteMessage 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleEditClick = (message: MessageWithSender) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const handleEditSave = () => {
    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, editContent);
      setEditingMessageId(null);
      setEditContent('');
    }
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">💬</div>
          <p>No messages yet. Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === currentUserId;
        const isEditing = editingMessageId === message.id;

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwnMessage
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {/* Sender name (only for others' messages) */}
              {!isOwnMessage && (
                <div className="text-xs text-gray-600 mb-1 font-medium">
                  {message.sender.email}
                </div>
              )}

              {/* Message content */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-2 text-sm border rounded text-gray-900 resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleEditCancel}
                      className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSave}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {message.content}
                  {message.edited_at && (
                    <span className="text-xs opacity-75 italic ml-2">
                      (edited)
                    </span>
                  )}
                </div>
              )}

              {/* Message actions and timestamp */}
              <div className={`flex items-center justify-between mt-2 text-xs ${
                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span>{formatMessageTime(message.created_at)}</span>
                
                {/* Message actions for own messages */}
                {isOwnMessage && !isEditing && (
                  <div className="flex gap-1 ml-2">
                    {onEditMessage && (
                      <button
                        onClick={() => handleEditClick(message)}
                        className="hover:text-white opacity-75 hover:opacity-100"
                        title="Edit message"
                      >
                        ✏️
                      </button>
                    )}
                    {onDeleteMessage && (
                      <button
                        onClick={() => onDeleteMessage(message.id)}
                        className="hover:text-white opacity-75 hover:opacity-100"
                        title="Delete message"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
} 