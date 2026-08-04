create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter function public.is_organization_member(uuid) set schema private;
alter function public.has_organization_role(uuid, public.organization_role[]) set schema private;
alter function public.is_organization_owner_user(uuid, uuid) set schema private;

create or replace function public.protect_organization_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_organization_owner_user(old.organization_id, old.user_id)
    and (
      new.organization_id is distinct from old.organization_id
      or new.user_id is distinct from old.user_id
      or new.role is distinct from 'owner'::public.organization_role
    )
  then
    raise exception 'The organization owner membership cannot be changed.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_organization_owner_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'owner'::public.organization_role
    and not private.is_organization_owner_user(new.organization_id, new.user_id)
  then
    raise exception 'Only the organization owner can hold the owner role.';
  end if;

  if private.is_organization_owner_user(new.organization_id, new.user_id)
    and new.role <> 'owner'::public.organization_role
  then
    raise exception 'The organization owner must keep the owner role.';
  end if;

  return new;
end;
$$;

alter policy "members can read organizations"
on public.organizations
using (
  owner_id = (select auth.uid())
  or private.is_organization_member(id)
);

alter policy "users can create owned organizations"
on public.organizations
with check (owner_id = (select auth.uid()));

alter policy "admins can update organizations"
on public.organizations
using (
  owner_id = (select auth.uid())
  or private.has_organization_role(id, array['owner', 'admin']::public.organization_role[])
)
with check (
  owner_id = (select auth.uid())
  or private.has_organization_role(id, array['owner', 'admin']::public.organization_role[])
);

alter policy "owners can delete organizations"
on public.organizations
using (owner_id = (select auth.uid()));

alter policy "members can read memberships"
on public.organization_members
using (private.is_organization_member(organization_id));

alter policy "admins can add memberships"
on public.organization_members
with check (
  role <> 'owner'::public.organization_role
  and not private.is_organization_owner_user(organization_id, user_id)
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

alter policy "admins can update memberships"
on public.organization_members
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  role <> 'owner'::public.organization_role
  and not private.is_organization_owner_user(organization_id, user_id)
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

alter policy "admins can remove memberships"
on public.organization_members
using (
  user_id <> (select auth.uid())
  and not private.is_organization_owner_user(organization_id, user_id)
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

alter policy "members can read projects"
on public.projects
using (private.is_organization_member(organization_id));

alter policy "contributors can create projects"
on public.projects
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
);

alter policy "contributors can update projects"
on public.projects
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
);

alter policy "admins can delete projects"
on public.projects
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

alter policy "users can read own profile"
on public.profiles
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.organization_members membership
    where membership.user_id = profiles.id
      and private.is_organization_member(membership.organization_id)
  )
);

alter policy "users can update own profile"
on public.profiles
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

alter policy "admins can read invitations"
on public.organization_invitations
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
  or email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
);

alter policy "admins can create invitations"
on public.organization_invitations
with check (
  invited_by = (select auth.uid())
  and role <> 'owner'::public.organization_role
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

alter policy "members can read licensing processes"
on public.licensing_processes
using (private.is_organization_member(organization_id));

alter policy "analysts can create licensing processes"
on public.licensing_processes
with check (
  created_by = (select auth.uid())
  and private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
);

alter policy "reviewers can update licensing processes"
on public.licensing_processes
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst', 'reviewer']::public.organization_role[]
  )
)
with check (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst', 'reviewer']::public.organization_role[]
  )
);

alter policy "admins can delete licensing processes"
on public.licensing_processes
using (
  private.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

alter policy "members can read audit logs"
on public.audit_logs
using (private.is_organization_member(organization_id));

create index licensing_processes_project_tenant_idx
  on public.licensing_processes(project_id, organization_id);
create index organization_invitations_invited_by_idx
  on public.organization_invitations(invited_by);
create index organization_invitations_accepted_by_idx
  on public.organization_invitations(accepted_by)
  where accepted_by is not null;

revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, public.organization_role[]) to authenticated;
grant execute on function private.is_organization_owner_user(uuid, uuid) to authenticated;
grant execute on function public.accept_organization_invitation(text) to authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

comment on schema private is
  'Internal authorization helpers. This schema must not be exposed through the Data API.';
