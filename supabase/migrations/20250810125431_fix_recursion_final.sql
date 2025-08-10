-- Complete fix for infinite recursion by using functions instead of complex policies

-- Drop all problematic policies first
drop policy if exists "Can select own groups" on public.groups;
drop policy if exists "Members can view their groups" on public.groups;
drop policy if exists "Can view own membership" on public.group_members;
drop policy if exists "Group owners can view all members" on public.group_members;
drop policy if exists "Members can view other members" on public.group_members;

-- Create helper function to check if user can access group
create or replace function public.user_can_access_group(group_id uuid, user_id uuid)
returns boolean as $$
begin
  -- Check if user is owner or member
  return exists (
    select 1 from public.groups where id = group_id and owner = user_id
  ) or exists (
    select 1 from public.group_members where group_id = group_id and user_id = user_id
  );
end;
$$ language plpgsql security definer;

-- Simple policies using the function
create policy "Users can view accessible groups"
  on public.groups for select
  using (public.user_can_access_group(id, auth.uid()));

create policy "Users can view members of accessible groups"
  on public.group_members for select
  using (public.user_can_access_group(group_id, auth.uid()));
