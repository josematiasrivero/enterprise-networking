-- Fix ambiguous user_id reference in join_group_via_invitation function

-- Drop and recreate the function with properly named variables
drop function if exists public.join_group_via_invitation(text);

create or replace function public.join_group_via_invitation(token text)
returns uuid as $$
declare
  group_record record;
  current_user_id uuid;
begin
  -- Get current user (renamed variable to avoid ambiguity)
  select auth.uid() into current_user_id;
  if current_user_id is null then
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
  
  -- Check if user is already a member (using table alias to be explicit)
  if exists (
    select 1 from public.group_members gm
    where gm.group_id = group_record.id and gm.user_id = current_user_id
  ) then
    raise exception 'You are already a member of this group';
  end if;
  
  -- Add user to group
  insert into public.group_members (group_id, user_id, role)
  values (group_record.id, current_user_id, 'member');
  
  return group_record.id;
end;
$$ language plpgsql security definer;
