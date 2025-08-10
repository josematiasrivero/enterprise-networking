-- Fix ambiguous column reference in get_or_create_group_chat_room function
drop function if exists public.get_or_create_group_chat_room(uuid);
create function public.get_or_create_group_chat_room(p_group_id uuid)
returns uuid as $$
declare
  room_id uuid;
  group_name text;
begin
  -- Check if user can access the group
  if not public.user_can_access_group(p_group_id, auth.uid()) then
    raise exception 'Access denied: You must be a member of this group';
  end if;
  
  -- Check if group chat room already exists
  select id into room_id
  from public.chat_rooms 
  where type = 'group' and group_id = p_group_id;
  
  if found then
    return room_id;
  end if;
  
  -- Get group name for the chat room
  select name into group_name from public.groups where id = p_group_id;
  
  -- Create new group chat room
  insert into public.chat_rooms (type, name, group_id, created_by)
  values ('group', group_name || ' - General Chat', p_group_id, auth.uid())
  returning id into room_id;
  
  return room_id;
end;
$$ language plpgsql security definer; 