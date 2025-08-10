"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, LoadingSpinner } from "@/lib/ui";
import { Users, ArrowRight, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

interface Group {
  id: string;
  name: string;
  invitation_enabled: boolean;
}

interface User {
  id: string;
  email?: string;
}

interface InviteClientProps {
  token: string;
  group: Group;
  user: User | null;
}

export default function InviteClient({ token, group, user }: InviteClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isJoining, startJoinTransition] = useTransition();
  const [isSigningUp, startSignUpTransition] = useTransition();
  const [showSignUp, setShowSignUp] = useState(false);

  const joinGroup = async () => {
    const supabase = createClient();
    
    try {
      // Call the database function to join group
      const { data, error } = await supabase.rpc('join_group_via_invitation', {
        token: token
      });

      if (error) {
        throw error;
      }

      toast.success(`Successfully joined ${group.name}!`);
      router.push("/groups");
    } catch (error: any) {
      console.error("Error joining group:", error);
      toast.error(error.message || "Failed to join group");
    }
  };

  const handleJoinGroup = () => {
    startJoinTransition(() => {
      joinGroup();
    });
  };

  const handleSignUp = () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    startSignUpTransition(async () => {
      try {
        const supabase = createClient();
        
        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          // After successful signup, join the group
          await joinGroup();
        }
      } catch (error: any) {
        console.error("Error signing up:", error);
        toast.error(error.message || "Failed to create account");
      }
    });
  };

  const handleSignIn = () => {
    // Redirect to login with a return URL that includes the invitation token
    router.push(`/login?invite=${token}`);
  };

  if (user) {
    // User is logged in, show join group option
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Join {group.name}
            </h1>
            
            <p className="text-gray-600 mb-6">
              You've been invited to join <strong>{group.name}</strong>. 
              Click below to accept the invitation and become a member.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Signed in as: <span className="font-medium">{user.email}</span>
              </p>
            </div>

            <Button 
              onClick={handleJoinGroup}
              disabled={isJoining}
              className="w-full flex items-center justify-center space-x-2"
              size="lg"
            >
              {isJoining ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Join Group</span>
                </>
              )}
            </Button>

            <div className="mt-4">
              <button
                onClick={() => router.push("/groups")}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Not you? Sign in with a different account
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // User is not logged in, show sign up/sign in options
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Join {group.name}
            </h1>
            <p className="text-gray-600">
              You've been invited to join <strong>{group.name}</strong>. 
              Create an account or sign in to accept the invitation.
            </p>
          </div>

          {!showSignUp ? (
            <div className="space-y-4">
              <Button 
                onClick={handleSignIn}
                variant="ghost"
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                <span>Sign In to Existing Account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              <Button 
                onClick={() => setShowSignUp(true)}
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                <UserPlus className="w-5 h-5" />
                <span>Create New Account</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button 
                onClick={handleSignUp}
                disabled={isSigningUp || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center space-x-2"
                size="lg"
              >
                {isSigningUp ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>Create Account & Join Group</span>
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setShowSignUp(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to options
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
} 