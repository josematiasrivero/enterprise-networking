-- Fix RLS policies to allow proper group member visibility

-- Update group_members policy to allow members to see other members in the same group
drop policy if exists "Can view group members if member or owner" on public.group_members;
create policy "Can view group members if member or owner"
  on public.group_members for select
  using (
    -- Allow if you are the member yourself
    user_id = auth.uid() 
    or 
    -- Allow if you are the group owner
    group_id in (
      select id from public.groups where owner = auth.uid()
    )
    or
    -- Allow if you are a member of the same group
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- Update groups policy to allow members to view groups they belong to
drop policy if exists "Can select own groups" on public.groups;
create policy "Can select own groups"
  on public.groups for select
  using (
    -- Allow if you are the owner
    owner = auth.uid()
    or
    -- Allow if you are a member of the group
    id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );
