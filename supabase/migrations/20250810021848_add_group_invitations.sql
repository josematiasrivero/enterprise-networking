-- Add invitation_token to groups table
alter table public.groups 
add column invitation_token text unique default encode(gen_random_bytes(32), 'hex'),
add column invitation_enabled boolean default true;

-- Create group_members table to track who belongs to which groups
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  unique(group_id, user_id)
);

-- Enable RLS on group_members
alter table public.group_members enable row level security;

-- Policies for group_members
create policy "Can view group members if member or owner"
  on public.group_members for select
  using (
    user_id = auth.uid() 
    or 
    group_id in (
      select id from public.groups where owner = auth.uid()
    )
  );

create policy "Group owners can insert members"
  on public.group_members for insert
  with check (
    group_id in (
      select id from public.groups where owner = auth.uid()
    )
  );

create policy "Group owners can update member roles"
  on public.group_members for update
  using (
    group_id in (
      select id from public.groups where owner = auth.uid()
    )
  );

create policy "Group owners and members can leave groups"
  on public.group_members for delete
  using (
    user_id = auth.uid() 
    or 
    group_id in (
      select id from public.groups where owner = auth.uid()
    )
  );

-- Create function to automatically add group owner as member
create or replace function public.add_group_owner_as_member()
returns trigger as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.owner, 'owner');
  return new;
end;
$$ language plpgsql;

-- Trigger to add owner as member when group is created
drop trigger if exists add_owner_to_group_members on public.groups;
create trigger add_owner_to_group_members
  after insert on public.groups
  for each row execute function public.add_group_owner_as_member();

-- Function to regenerate invitation token
create or replace function public.regenerate_group_invitation_token(group_id uuid)
returns text as $$
declare
  new_token text;
begin
  -- Check if user owns the group
  if not exists (
    select 1 from public.groups 
    where id = group_id and owner = auth.uid()
  ) then
    raise exception 'Access denied: You must be the group owner';
  end if;
  
  -- Generate new token
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Update the group
  update public.groups 
  set invitation_token = new_token 
  where id = group_id;
  
  return new_token;
end;
$$ language plpgsql security definer;

-- Function to join group via invitation token
create or replace function public.join_group_via_invitation(token text)
returns uuid as $$
declare
  group_record record;
  user_id uuid;
begin
  -- Get current user
  select auth.uid() into user_id;
  if user_id is null then
    raise exception 'Authentication required';
  end if;
  
  -- Find group by token
  select id, name, invitation_enabled into group_record
  from public.groups 
  where invitation_token = token;
  
  if not found then
    raise exception 'Invalid invitation token';
  end if;
  
  if not group_record.invitation_enabled then
    raise exception 'Invitations are disabled for this group';
  end if;
  
  -- Check if user is already a member
  if exists (
    select 1 from public.group_members 
    where group_id = group_record.id and user_id = user_id
  ) then
    raise exception 'You are already a member of this group';
  end if;
  
  -- Add user to group
  insert into public.group_members (group_id, user_id, role)
  values (group_record.id, user_id, 'member');
  
  return group_record.id;
end;
$$ language plpgsql security definer;

-- Update groups policies to allow members to view groups they belong to
drop policy if exists "Can select own groups" on public.groups;
create policy "Can select own groups"
  on public.groups for select
  using (owner = auth.uid());

-- Add existing group owners as members (migration data)
insert into public.group_members (group_id, user_id, role)
select id, owner, 'owner' 
from public.groups 
where id not in (
  select group_id from public.group_members where role = 'owner'
);
