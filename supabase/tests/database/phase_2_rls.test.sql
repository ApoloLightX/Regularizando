begin;

select plan(7);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'owner@example.com', '{"full_name":"Owner"}'),
  ('10000000-0000-0000-0000-000000000002', 'viewer@example.com', '{"full_name":"Viewer"}'),
  ('10000000-0000-0000-0000-000000000003', 'outsider@example.com', '{"full_name":"Outsider"}');

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

select lives_ok(
  $$insert into public.organizations (id, name, slug, owner_id)
    values (
      '20000000-0000-0000-0000-000000000001',
      'Organização teste',
      'organizacao-teste',
      '10000000-0000-0000-0000-000000000001'
    )$$,
  'an authenticated user creates an owned organization'
);

select is(
  (select count(*) from public.organization_members
   where organization_id = '20000000-0000-0000-0000-000000000001'
     and role = 'owner'),
  1::bigint,
  'the organization owner membership is created automatically'
);

insert into public.organization_members (organization_id, user_id, role)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'viewer'
);

select throws_ok(
  $$update public.organization_members
    set role = 'owner'
    where organization_id = '20000000-0000-0000-0000-000000000001'
      and user_id = '10000000-0000-0000-0000-000000000002'$$,
  'P0001',
  'Only the organization owner can hold the owner role.',
  'an administrator cannot create a second owner role'
);

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';

select throws_ok(
  $$insert into public.projects (organization_id, name, created_by)
    values (
      '20000000-0000-0000-0000-000000000001',
      'Projeto bloqueado',
      '10000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'a viewer cannot create projects'
);

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';

select lives_ok(
  $$insert into public.projects (id, organization_id, name, created_by)
    values (
      '30000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      'Projeto permitido',
      '10000000-0000-0000-0000-000000000001'
    )$$,
  'an owner creates a project'
);

select lives_ok(
  $$insert into public.licensing_processes (
      organization_id, project_id, name, state, created_by
    ) values (
      '20000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000001',
      'Licença Prévia',
      'SP',
      '10000000-0000-0000-0000-000000000001'
    )$$,
  'an owner creates a licensing process inside the same tenant'
);

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';

select is(
  (select count(*) from public.licensing_processes),
  0::bigint,
  'an outsider cannot read another tenant processes'
);

select * from finish();
rollback;
