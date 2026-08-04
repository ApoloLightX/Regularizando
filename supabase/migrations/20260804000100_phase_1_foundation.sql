create extension if not exists pgcrypto with schema extensions;

create type public.organization_role as enum (
  'owner',
  'admin',
  'analyst',
  'viewer'
);

create type public.project_status as enum (
  'draft',
  'in_review',
  'ready',
  'archived'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name varchar(160) not null,
  slug varchar(80) not null unique,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name varchar(200) not null,
  description text,
  status public.project_status not null default 'draft',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_owner_id_idx on public.organizations(owner_id);
create index organization_members_user_id_idx on public.organization_members(user_id);
create index projects_organization_id_idx on public.projects(organization_id);
create index projects_created_by_idx on public.projects(created_by);
create index projects_status_idx on public.projects(status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create or replace function public.prevent_organization_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'Organization ownership changes require a dedicated transfer flow.';
  end if;
  return new;
end;
$$;

create trigger organizations_keep_owner
before update of owner_id on public.organizations
for each row execute function public.prevent_organization_owner_change();

create or replace function public.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger organizations_add_owner
after insert on public.organizations
for each row execute function public.add_organization_owner();

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
  );
$$;

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.is_organization_owner_user(
  target_organization_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organizations organization
    where organization.id = target_organization_id
      and organization.owner_id = target_user_id
  );
$$;

create or replace function public.protect_organization_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_organization_owner_user(old.organization_id, old.user_id)
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

create trigger organization_members_keep_owner
before update on public.organization_members
for each row execute function public.protect_organization_owner_membership();

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_organization_role(uuid, public.organization_role[]) from public;
revoke all on function public.is_organization_owner_user(uuid, uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.organization_role[]) to authenticated;
grant execute on function public.is_organization_owner_user(uuid, uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;

create policy "members can read organizations"
on public.organizations for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_organization_member(id)
);

create policy "users can create owned organizations"
on public.organizations for insert
to authenticated
with check (owner_id = auth.uid());

create policy "admins can update organizations"
on public.organizations for update
to authenticated
using (
  owner_id = auth.uid()
  or public.has_organization_role(id, array['owner', 'admin']::public.organization_role[])
)
with check (
  owner_id = auth.uid()
  or public.has_organization_role(id, array['owner', 'admin']::public.organization_role[])
);

create policy "owners can delete organizations"
on public.organizations for delete
to authenticated
using (owner_id = auth.uid());

create policy "members can read memberships"
on public.organization_members for select
to authenticated
using (public.is_organization_member(organization_id));

create policy "admins can add memberships"
on public.organization_members for insert
to authenticated
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
  and (
    not public.is_organization_owner_user(organization_id, user_id)
    or role = 'owner'::public.organization_role
  )
);

create policy "admins can update memberships"
on public.organization_members for update
to authenticated
using (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "admins can remove memberships"
on public.organization_members for delete
to authenticated
using (
  user_id <> auth.uid()
  and not public.is_organization_owner_user(organization_id, user_id)
  and public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

create policy "members can read projects"
on public.projects for select
to authenticated
using (public.is_organization_member(organization_id));

create policy "members can create projects"
on public.projects for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_organization_member(organization_id)
);

create policy "members can update projects"
on public.projects for update
to authenticated
using (public.is_organization_member(organization_id))
with check (public.is_organization_member(organization_id));

create policy "creators and admins can delete projects"
on public.projects for delete
to authenticated
using (
  created_by = auth.uid()
  or public.has_organization_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.projects to authenticated;

comment on table public.organizations is 'Tenants of the Regularizando SaaS.';
comment on table public.organization_members is 'Users and roles scoped to an organization.';
comment on table public.projects is 'Environmental regularization projects owned by a tenant.';
