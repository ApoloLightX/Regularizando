create type public.licensing_process_status as enum (
  'draft',
  'collecting_documents',
  'in_review',
  'ready',
  'archived'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name varchar(160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.organization_role not null default 'viewer',
  token_hash bytea not null unique,
  status text not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete restrict,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint organization_invitations_email_normalized
    check (email = lower(trim(email))),
  constraint organization_invitations_role
    check (role <> 'owner'::public.organization_role),
  constraint organization_invitations_status
    check (status in ('pending', 'accepted', 'revoked', 'expired'))
);

alter table public.projects
  add constraint projects_id_organization_unique unique (id, organization_id);

create table public.licensing_processes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null,
  name varchar(200) not null,
  agency varchar(160),
  municipality varchar(160),
  state char(2),
  activity varchar(200),
  status public.licensing_process_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint licensing_processes_state_format
    check (state is null or state ~ '^[A-Z]{2}$'),
  constraint licensing_processes_project_tenant_fk
    foreign key (project_id, organization_id)
    references public.projects (id, organization_id)
    on delete cascade
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_full_name_idx on public.profiles(full_name);
create index organization_invitations_organization_id_idx
  on public.organization_invitations(organization_id);
create index organization_invitations_email_idx
  on public.organization_invitations(email);
create unique index organization_invitations_one_pending_idx
  on public.organization_invitations(organization_id, email)
  where status = 'pending';
create index licensing_processes_organization_id_idx
  on public.licensing_processes(organization_id);
create index licensing_processes_project_id_idx
  on public.licensing_processes(project_id);
create index licensing_processes_status_idx
  on public.licensing_processes(status);
create index audit_logs_organization_created_at_idx
  on public.audit_logs(organization_id, created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs(actor_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger licensing_processes_set_updated_at
before update on public.licensing_processes
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name)
select id, nullif(trim(raw_user_meta_data ->> 'full_name'), '')
from auth.users
on conflict (id) do nothing;

alter table public.organization_members
  add constraint organization_members_user_profile_fk
  foreign key (user_id) references public.profiles(id) on delete cascade;

create or replace function public.accept_organization_invitation(invitation_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.organization_invitations%rowtype;
  current_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select lower(email) into current_email
  from auth.users
  where id = auth.uid();

  select * into invitation
  from public.organization_invitations
  where token_hash = extensions.digest(invitation_token, 'sha256')
    and status = 'pending'
  for update;

  if invitation.id is null then
    raise exception 'Invitation not found.';
  end if;

  if invitation.expires_at <= now() then
    update public.organization_invitations
    set status = 'expired'
    where id = invitation.id;
    return null;
  end if;

  if current_email is distinct from invitation.email then
    raise exception 'Invitation belongs to another email address.';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (invitation.organization_id, auth.uid(), invitation.role)
  on conflict (organization_id, user_id) do nothing;

  update public.organization_invitations
  set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
  where id = invitation.id;

  return invitation.organization_id;
end;
$$;

create or replace function public.protect_membership_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id
  then
    raise exception 'Membership identity cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger organization_members_keep_identity
before update on public.organization_members
for each row execute function public.protect_membership_identity();

create or replace function public.protect_domain_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.created_by is distinct from old.created_by
  then
    raise exception 'Tenant and creator cannot be changed.';
  end if;
  return new;
end;
$$;

create trigger projects_keep_domain_ownership
before update on public.projects
for each row execute function public.protect_domain_ownership();

create trigger licensing_processes_keep_domain_ownership
before update on public.licensing_processes
for each row execute function public.protect_domain_ownership();

create or replace function public.enforce_organization_owner_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'owner'::public.organization_role
    and not public.is_organization_owner_user(new.organization_id, new.user_id)
  then
    raise exception 'Only the organization owner can hold the owner role.';
  end if;

  if public.is_organization_owner_user(new.organization_id, new.user_id)
    and new.role <> 'owner'::public.organization_role
  then
    raise exception 'The organization owner must keep the owner role.';
  end if;

  return new;
end;
$$;

create trigger organization_members_enforce_owner_role
before insert or update on public.organization_members
for each row execute function public.enforce_organization_owner_role();

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  tenant_id uuid;
  record_id text;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  tenant_id := nullif(row_data ->> 'organization_id', '')::uuid;
  record_id := coalesce(row_data ->> 'id', row_data ->> 'user_id');

  if tg_table_name = 'organizations' and tg_op <> 'DELETE' then
    tenant_id := (row_data ->> 'id')::uuid;
  elsif tg_table_name = 'organizations' then
    tenant_id := null;
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    tenant_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    record_id,
    jsonb_build_object('source', 'database_trigger')
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger organizations_audit
after insert or update or delete on public.organizations
for each row execute function public.write_audit_log();
create trigger organization_members_audit
after insert or update or delete on public.organization_members
for each row execute function public.write_audit_log();
create trigger organization_invitations_audit
after insert or update or delete on public.organization_invitations
for each row execute function public.write_audit_log();
create trigger projects_audit
after insert or update or delete on public.projects
for each row execute function public.write_audit_log();
create trigger licensing_processes_audit
after insert or update or delete on public.licensing_processes
for each row execute function public.write_audit_log();

revoke all on function public.accept_organization_invitation(text) from public;
revoke all on function public.enforce_organization_owner_role() from public;
revoke all on function public.protect_membership_identity() from public;
revoke all on function public.protect_domain_ownership() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.write_audit_log() from public;
grant execute on function public.accept_organization_invitation(text) to authenticated;

alter table public.profiles enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.licensing_processes enable row level security;
alter table public.audit_logs enable row level security;

create policy "users can read own profile"
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.organization_members membership
    where membership.user_id = profiles.id
      and public.is_organization_member(membership.organization_id)
  )
);

create policy "users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "admins can read invitations"
on public.organization_invitations for select to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
  or email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "admins can create invitations"
on public.organization_invitations for insert to authenticated
with check (
  invited_by = auth.uid()
  and role <> 'owner'::public.organization_role
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy "members can create projects" on public.projects;
drop policy "members can update projects" on public.projects;
drop policy "creators and admins can delete projects" on public.projects;
drop policy "admins can add memberships" on public.organization_members;
drop policy "admins can update memberships" on public.organization_members;

create policy "admins can add memberships"
on public.organization_members for insert to authenticated
with check (
  role <> 'owner'::public.organization_role
  and not public.is_organization_owner_user(organization_id, user_id)
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "admins can update memberships"
on public.organization_members for update to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  role <> 'owner'::public.organization_role
  and not public.is_organization_owner_user(organization_id, user_id)
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "contributors can create projects"
on public.projects for insert to authenticated
with check (
  created_by = auth.uid()
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
);

create policy "contributors can update projects"
on public.projects for update to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
);

create policy "admins can delete projects"
on public.projects for delete to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "members can read licensing processes"
on public.licensing_processes for select to authenticated
using (public.is_organization_member(organization_id));

create policy "analysts can create licensing processes"
on public.licensing_processes for insert to authenticated
with check (
  created_by = auth.uid()
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  )
);

create policy "reviewers can update licensing processes"
on public.licensing_processes for update to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst', 'reviewer']::public.organization_role[]
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin', 'analyst', 'reviewer']::public.organization_role[]
  )
);

create policy "admins can delete licensing processes"
on public.licensing_processes for delete to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "members can read audit logs"
on public.audit_logs for select to authenticated
using (public.is_organization_member(organization_id));

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert on public.organization_invitations to authenticated;
grant select, insert, update, delete on public.licensing_processes to authenticated;
grant select on public.audit_logs to authenticated;

comment on table public.profiles is 'Minimal user profile linked to Supabase Auth.';
comment on table public.organization_invitations is 'Hashed, expiring organization invitations.';
comment on table public.licensing_processes is 'Licensing workflows scoped to projects and tenants.';
comment on table public.audit_logs is 'Append-only database audit trail visible through RLS.';
