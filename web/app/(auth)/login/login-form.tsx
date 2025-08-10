"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button, Input } from "@/lib/ui";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  signIn: (formData: FormData) => Promise<{ error?: string } | void>;
  signUp: (formData: FormData) => Promise<{ error?: string } | void>;
  inviteToken?: string;
}

export default function LoginForm({ signIn, signUp, inviteToken }: LoginFormProps) {
  const [isSigningIn, startSignInTransition] = useTransition();
  const [isSigningUp, startSignUpTransition] = useTransition();
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const handleSignIn = async (formData: FormData) => {
    startSignInTransition(async () => {
      try {
        const result = await signIn(formData);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  const handleSignUp = async (formData: FormData) => {
    startSignUpTransition(async () => {
      try {
        const result = await signUp(formData);
        if (result?.error) {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  if (isSignUpMode) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Create Account</h2>
          <p className="text-sm text-gray-600 mt-1">Join our enterprise platform</p>
        </div>

        <form action={handleSignUp} className="space-y-4">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                disabled={isSigningUp}
                required
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                name="password"
                type={showSignUpPassword ? "text" : "password"}
                placeholder="Create a password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                disabled={isSigningUp}
                required
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSignUpPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="submit"
              disabled={isSigningUp}
              className="w-full"
            >
              {isSigningUp ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUpMode(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Already have an account? Sign in
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Sign In</h2>
        <p className="text-sm text-gray-600 mt-1">Access your enterprise dashboard</p>
      </div>

      <form action={handleSignIn} className="space-y-4">
        {inviteToken && (
          <input type="hidden" name="inviteToken" value={inviteToken} />
        )}
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              name="email"
              type="email"
              placeholder="Enter your email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              disabled={isSigningIn}
              required
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              name="password"
              type={showSignInPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              disabled={isSigningIn}
              required
              className="pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSignInPassword(!showSignInPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSignInPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isSigningIn}
            className="w-full"
          >
            {isSigningIn ? "Signing In..." : "Sign In"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">New to our platform?</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsSignUpMode(true)}
            className="w-full"
          >
            Create Account
          </Button>
        </div>
      </form>

      {/* Demo credentials info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <div><span className="font-medium">Email:</span> dev@local.com</div>
          <div><span className="font-medium">Password:</span> password</div>
        </div>
      </div>
    </div>
  );
} 