'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createDirectMessageRoom } from '@/lib/chat';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  user_id: string;
  role: string;
  user: {
    id: string;
    email: string;
  };
}

interface MemberListProps {
  groupId: string;
  currentUserId: string;
  onDirectMessageClick: (roomId: string) => void;
}

export default function MemberList({ groupId, currentUserId, onDirectMessageClick }: MemberListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadMembers();
  }, [groupId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      // Get group members
      const { data: membersData, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      // Get user details for each member
      const membersWithUserData: Member[] = [];
      for (const member of membersData || []) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
          if (userData.user) {
            membersWithUserData.push({
              ...member,
              user: {
                id: userData.user.id,
                email: userData.user.email || 'Unknown'
              }
            });
          }
        } catch (error) {
          console.error('Error fetching user data for member:', member.user_id, error);
          // Add member with fallback data
          membersWithUserData.push({
            ...member,
            user: {
              id: member.user_id,
              email: 'Unknown User'
            }
          });
        }
      }

      setMembers(membersWithUserData);
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectMessage = async (memberId: string) => {
    if (memberId === currentUserId) {
      toast.error("You can't message yourself!");
      return;
    }

    try {
      const room = await createDirectMessageRoom(memberId, groupId);
      if (room) {
        onDirectMessageClick(room.id);
        toast.success('Direct message conversation opened');
      } else {
        toast.error('Failed to create direct message');
      }
    } catch (error) {
      console.error('Error creating direct message:', error);
      toast.error('Failed to create direct message');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return '👑';
      case 'admin':
        return '⭐';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-600';
      case 'admin':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-4">
        Group Members ({members.length})
      </h3>
      
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {member.user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {member.user.email}
                  </span>
                  <span className={`text-xs ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)} {member.role}
                  </span>
                  {member.user_id === currentUserId && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      You
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {member.user_id !== currentUserId && (
              <button
                onClick={() => handleDirectMessage(member.user_id)}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                title="Send direct message"
              >
                💬 Message
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 