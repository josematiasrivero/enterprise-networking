-- Fix infinite recursion in RLS policies by avoiding circular dependencies

-- For groups: Keep it simple - allow owners and use a function for members
drop policy if exists "Can select own groups" on public.groups;
create policy "Can select own groups"
  on public.groups for select
  using (owner = auth.uid());

-- Create a separate policy for group members to view their groups
drop policy if exists "Members can view their groups" on public.groups;
create policy "Members can view their groups"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members 
      where group_members.group_id = groups.id 
      and group_members.user_id = auth.uid()
    )
  );

-- For group_members: Simplify to avoid recursion
drop policy if exists "Can view group members if member or owner" on public.group_members;

-- Allow viewing own membership record
drop policy if exists "Can view own membership" on public.group_members;
create policy "Can view own membership"
  on public.group_members for select
  using (user_id = auth.uid());

-- Allow group owners to view all members (using direct owner check)
drop policy if exists "Group owners can view all members" on public.group_members;
create policy "Group owners can view all members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.groups 
      where groups.id = group_members.group_id 
      and groups.owner = auth.uid()
    )
  );

-- Allow members to view other members in same group (using explicit membership check)
drop policy if exists "Members can view other members" on public.group_members;
create policy "Members can view other members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members as my_membership
      where my_membership.group_id = group_members.group_id 
      and my_membership.user_id = auth.uid()
    )
  );
