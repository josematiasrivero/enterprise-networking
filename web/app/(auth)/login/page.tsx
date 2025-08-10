import { createClient as createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import LoginForm from "./login-form";
import { Navigation } from "@/components/navigation";
import { Card } from "@/lib/ui";
import { Shield, Users } from "lucide-react";

export const dynamic = "force-dynamic";

async function requireAnon() {
  // Check if Supabase environment variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables are not configured. Please set up your .env.local file.");
  }
  
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/groups");
}

async function signIn(formData: FormData) {
  "use server";
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: "Application is not properly configured. Please contact support." };
  }
  
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  
  const supabase = createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    return { error: "Invalid email or password. Please try again." };
  }
  
  revalidatePath("/groups");
  redirect("/groups");
}

async function signUp(formData: FormData) {
  "use server";
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { error: "Application is not properly configured. Please contact support." };
  }
  
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  
  if (!email || !password) {
    return { error: "Email and password are required" };
  }
  
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }
  
  const supabase = createServerClient();
  const { error } = await supabase.auth.signUp({ email, password });
  
  if (error) {
    return { error: error.message || "Failed to create account. Please try again." };
  }
  
  revalidatePath("/groups");
  redirect("/groups");
}

function EnvironmentErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation user={null} />
      <div className="flex items-center justify-center px-4 pt-16">
        <Card className="w-full max-w-md">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
              <p className="text-gray-600">
                Supabase environment variables are not configured.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg text-left">
              <p className="font-medium mb-3 text-gray-900">To fix this:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Create a <code className="bg-gray-200 px-2 py-1 rounded text-xs">.env.local</code> file in the web/ directory</li>
                <li>Add your Supabase project URL and API key:</li>
              </ol>
              <div className="mt-4 bg-gray-100 p-3 rounded text-xs font-mono">
                <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              You can test the toast functionality at{" "}
              <a href="/toast-demo" className="text-blue-600 hover:text-blue-700 underline">
                /toast-demo
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default async function LoginPage() {
  try {
    await requireAnon();
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation user={null} />
        
        <div className="flex items-center justify-center px-4 pt-16">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                <p className="text-gray-600">Sign in to your enterprise account</p>
              </div>
            </div>

            {/* Login Form Card */}
            <Card>
              <LoginForm signIn={signIn} signUp={signUp} />
            </Card>

            {/* Additional info */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Need help? Contact{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <EnvironmentErrorPage />;
  }
} 