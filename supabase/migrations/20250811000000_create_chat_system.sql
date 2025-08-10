-- Chat system for Enterprise Networking
-- Supports both group chat and 1:1 direct messages

-- Create chat_rooms table
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('group', 'direct')),
  name text,
  group_id uuid references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create chat_room_members table (for direct messages)
create table if not exists public.chat_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'file')),
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable RLS on all chat tables
alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.messages enable row level security;

-- Add updated_at trigger to chat_rooms
drop trigger if exists set_chat_rooms_updated_at on public.chat_rooms;
create trigger set_chat_rooms_updated_at
  before update on public.chat_rooms
  for each row execute function public.set_updated_at();

-- Create indexes for performance
create index if not exists idx_chat_rooms_group_id on public.chat_rooms(group_id);
create index if not exists idx_chat_rooms_type on public.chat_rooms(type);
create index if not exists idx_chat_room_members_room_id on public.chat_room_members(room_id);
create index if not exists idx_chat_room_members_user_id on public.chat_room_members(user_id);
create index if not exists idx_messages_room_id on public.messages(room_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);

-- Helper function to check if user can access a chat room
create or replace function public.user_can_access_chat_room(room_id uuid, user_id uuid)
returns boolean as $$
declare
  room_record record;
begin
  -- Get room details
  select type, group_id into room_record
  from public.chat_rooms where id = room_id;
  
  if not found then
    return false;
  end if;
  
  -- For group chat rooms, check if user can access the group
  if room_record.type = 'group' then
    return public.user_can_access_group(room_record.group_id, user_id);
  end if;
  
  -- For direct message rooms, check if user is a member
  if room_record.type = 'direct' then
    return exists (
      select 1 from public.chat_room_members 
      where room_id = room_id and user_id = user_id
    );
  end if;
  
  return false;
end;
$$ language plpgsql security definer;

-- RLS Policies for chat_rooms
create policy "Users can view accessible chat rooms"
  on public.chat_rooms for select
  using (public.user_can_access_chat_room(id, auth.uid()));

create policy "Group members can create group chat rooms"
  on public.chat_rooms for insert
  with check (
    (type = 'group' and public.user_can_access_group(group_id, auth.uid()))
    or
    (type = 'direct' and created_by = auth.uid())
  );

create policy "Room creators can update chat rooms"
  on public.chat_rooms for update
  using (created_by = auth.uid());

-- RLS Policies for chat_room_members
create policy "Users can view members of accessible chat rooms"
  on public.chat_room_members for select
  using (public.user_can_access_chat_room(room_id, auth.uid()));

create policy "Users can join direct message rooms"
  on public.chat_room_members for insert
  with check (
    exists (
      select 1 from public.chat_rooms 
      where id = room_id 
      and type = 'direct' 
      and (created_by = auth.uid() or auth.uid() = user_id)
    )
  );

create policy "Users can leave chat rooms"
  on public.chat_room_members for delete
  using (user_id = auth.uid());

-- RLS Policies for messages
create policy "Users can view messages in accessible chat rooms"
  on public.messages for select
  using (public.user_can_access_chat_room(room_id, auth.uid()));

create policy "Users can send messages to accessible chat rooms"
  on public.messages for insert
  with check (
    sender_id = auth.uid() 
    and public.user_can_access_chat_room(room_id, auth.uid())
  );

create policy "Users can update their own messages"
  on public.messages for update
  using (sender_id = auth.uid());

create policy "Users can delete their own messages"
  on public.messages for delete
  using (sender_id = auth.uid());

-- Function to create or get general group chat room
create or replace function public.get_or_create_group_chat_room(group_id uuid)
returns uuid as $$
declare
  room_id uuid;
  group_name text;
begin
  -- Check if user can access the group
  if not public.user_can_access_group(group_id, auth.uid()) then
    raise exception 'Access denied: You must be a member of this group';
  end if;
  
  -- Check if group chat room already exists
  select id into room_id
  from public.chat_rooms 
  where type = 'group' and group_id = group_id;
  
  if found then
    return room_id;
  end if;
  
  -- Get group name for the chat room
  select name into group_name from public.groups where id = group_id;
  
  -- Create new group chat room
  insert into public.chat_rooms (type, name, group_id, created_by)
  values ('group', group_name || ' - General Chat', group_id, auth.uid())
  returning id into room_id;
  
  return room_id;
end;
$$ language plpgsql security definer;

-- Function to create or get direct message room between two users
create or replace function public.get_or_create_direct_message_room(other_user_id uuid, group_id uuid)
returns uuid as $$
declare
  room_id uuid;
  current_user_id uuid;
begin
  -- Get current user
  select auth.uid() into current_user_id;
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  
  -- Check if both users are in the same group
  if not (
    public.user_can_access_group(group_id, current_user_id) 
    and public.user_can_access_group(group_id, other_user_id)
  ) then
    raise exception 'Access denied: Both users must be members of the group';
  end if;
  
  -- Check if direct message room already exists between these users
  select cr.id into room_id
  from public.chat_rooms cr
  where cr.type = 'direct'
    and exists (
      select 1 from public.chat_room_members crm1 
      where crm1.room_id = cr.id and crm1.user_id = current_user_id
    )
    and exists (
      select 1 from public.chat_room_members crm2 
      where crm2.room_id = cr.id and crm2.user_id = other_user_id
    )
    and (
      select count(*) from public.chat_room_members crm3 
      where crm3.room_id = cr.id
    ) = 2;
  
  if found then
    return room_id;
  end if;
  
  -- Create new direct message room
  insert into public.chat_rooms (type, created_by)
  values ('direct', current_user_id)
  returning id into room_id;
  
  -- Add both users as members
  insert into public.chat_room_members (room_id, user_id)
  values 
    (room_id, current_user_id),
    (room_id, other_user_id);
  
  return room_id;
end;
$$ language plpgsql security definer;

-- Function to send a message
create or replace function public.send_message(room_id uuid, content text, message_type text default 'text')
returns uuid as $$
declare
  message_id uuid;
begin
  -- Check if user can access the chat room
  if not public.user_can_access_chat_room(room_id, auth.uid()) then
    raise exception 'Access denied: You cannot send messages to this room';
  end if;
  
  -- Insert the message
  insert into public.messages (room_id, sender_id, content, message_type)
  values (room_id, auth.uid(), content, message_type)
  returning id into message_id;
  
  -- Update the chat room's updated_at timestamp
  update public.chat_rooms 
  set updated_at = now() 
  where id = room_id;
  
  return message_id;
end;
$$ language plpgsql security definer; 