-- Fix ambiguous column reference in the helper function

-- First drop the policies that depend on the function
drop policy if exists "Users can view accessible groups" on public.groups;
drop policy if exists "Users can view members of accessible groups" on public.group_members;

-- Then drop and recreate the function
drop function if exists public.user_can_access_group(uuid, uuid);
create function public.user_can_access_group(group_id_param uuid, user_id_param uuid)
returns boolean as $$
begin
  -- Check if user is owner or member (using explicit parameter names to avoid ambiguity)
  return exists (
    select 1 from public.groups g where g.id = group_id_param and g.owner = user_id_param
  ) or exists (
    select 1 from public.group_members gm where gm.group_id = group_id_param and gm.user_id = user_id_param
  );
end;
$$ language plpgsql security definer;

-- Now recreate the policies

create policy "Users can view accessible groups"
  on public.groups for select
  using (public.user_can_access_group(id, auth.uid()));

create policy "Users can view members of accessible groups"
  on public.group_members for select
  using (public.user_can_access_group(group_id, auth.uid()));
