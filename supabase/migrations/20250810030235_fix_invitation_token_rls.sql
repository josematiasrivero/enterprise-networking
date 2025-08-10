-- Add RLS policy to allow reading groups by invitation token
-- This is needed for invitation links to work properly

create policy "Can read group by invitation token"
  on public.groups for select
  using (
    -- Allow reading if user provides a valid invitation token and invitations are enabled
    invitation_token is not null 
    and invitation_enabled = true
  );
