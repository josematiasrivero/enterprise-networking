import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
  const { supabase } = await requireUser();
  const { data: groups, error } = await supabase
    .from("groups")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Groups</h1>
        <form action={signOut}>
          <button className="rounded-md border px-3 py-1.5">Sign out</button>
        </form>
      </div>

      <form action={createGroup} className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="New group name"
          required
          className="flex-1 rounded-md border p-2 bg-transparent"
        />
        <button className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-2">
          Create
        </button>
      </form>

      <ul className="space-y-2">
        {(groups || []).map((g) => (
          <li key={g.id} className="flex items-center gap-2">
            <form action={updateGroup} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={g.id} />
              <input
                name="name"
                defaultValue={g.name}
                className="flex-1 rounded-md border p-2 bg-transparent"
              />
              <button className="rounded-md border px-3 py-2">Save</button>
            </form>
            <form action={deleteGroup}>
              <input type="hidden" name="id" value={g.id} />
              <button className="rounded-md border px-3 py-2 text-red-600">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
} 