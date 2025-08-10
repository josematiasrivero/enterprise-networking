import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ArrowLeft, Users, Crown, Shield, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Card } from "@/lib/ui";

interface GroupDetailPageProps {
  params: {
    id: string;
  };
}

interface Member {
  id: string;
  role: string;
  joined_at: string;
  user_id: string;
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user } as const;
}

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  // Fetch group details
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, name, created_at, invitation_token, invitation_enabled, owner")
    .eq("id", id)
    .single();

  if (groupError || !group) {
    redirect("/groups");
  }

  // Fetch group members
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("id, role, joined_at, user_id")
    .eq("group_id", id)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("Error fetching members:", membersError);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onSignOut={signOut} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/groups"
              className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Groups
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                <div className="flex items-center text-gray-500 mt-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created {formatDate(group.created_at)}
                </div>
              </div>
            </div>
            
            {/* Chat button */}
            <Link
              href={`/groups/${group.id}/chat`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              💬 Open Chat
            </Link>
          </div>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{members?.length || 0}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {members?.filter(m => m.role === 'admin' || m.role === 'owner').length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                group.invitation_enabled ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Users className={`w-5 h-5 ${
                  group.invitation_enabled ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Invitations</p>
                <p className="text-lg font-semibold text-gray-900">
                  {group.invitation_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Members List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Members</h2>
            <div className="text-sm text-gray-500">
              {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''}
            </div>
          </div>

          {!members || members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No members found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member: Member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {member.user_id.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          User {member.user_id.slice(0, 8)}...
                        </p>
                        <div className="flex items-center space-x-1">
                          {getRoleIcon(member.role)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        Joined {formatDate(member.joined_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
} 