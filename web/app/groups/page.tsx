import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Navigation } from "@/components/navigation";
import GroupsClient from "./groups-client";

export const dynamic = "force-dynamic";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user } as const;
}

async function createGroup(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("groups").insert({ name, owner: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

async function updateGroup(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

async function deleteGroup(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/groups");
}

async function signOut() {
  "use server";
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function GroupsPage() {
  const { supabase, user } = await requireUser();
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} onSignOut={signOut} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GroupsClient 
          groups={groups || []} 
          createGroup={createGroup}
          updateGroup={updateGroup}
          deleteGroup={deleteGroup}
        />
      </main>
    </div>
  );
} 