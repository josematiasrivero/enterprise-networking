import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatInterface from './chat-interface';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login');
  }

  // Check if user can access the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('id', params.id)
    .single();

  if (groupError || !group) {
    redirect('/groups');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{group.name} - Chat</h1>
                <p className="text-gray-600">Group conversation and direct messages</p>
              </div>
              <a
                href={`/groups/${group.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Group
              </a>
            </div>
          </div>
        </div>
        
        <ChatInterface groupId={group.id} currentUserId={user.id} />
      </div>
    </div>
  );
} 