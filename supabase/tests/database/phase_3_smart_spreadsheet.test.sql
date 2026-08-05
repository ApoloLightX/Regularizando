begin;

select plan(43);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11000000-0000-0000-0000-000000000001', 'sheet-owner@example.com', '{}'),
  ('11000000-0000-0000-0000-000000000002', 'sheet-analyst@example.com', '{}'),
  ('11000000-0000-0000-0000-000000000003', 'sheet-reviewer@example.com', '{}'),
  ('11000000-0000-0000-0000-000000000004', 'sheet-viewer@example.com', '{}'),
  ('11000000-0000-0000-0000-000000000005', 'sheet-outsider@example.com', '{}'),
  ('11000000-0000-0000-0000-000000000006', 'sheet-owner-two@example.com', '{}');

insert into public.organizations (id, name, slug, owner_id)
values
  (
    '21000000-0000-0000-0000-000000000001',
    'Planilhas tenant um',
    'planilhas-tenant-um',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '21000000-0000-0000-0000-000000000002',
    'Planilhas tenant dois',
    'planilhas-tenant-dois',
    '11000000-0000-0000-0000-000000000006'
  );

insert into public.organization_members (organization_id, user_id, role)
values
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000002',
    'analyst'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000003',
    'reviewer'
  ),
  (
    '21000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000004',
    'viewer'
  );

insert into public.projects (id, organization_id, name, created_by)
values
  (
    '31000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'Projeto planilhas um',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '31000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000002',
    'Projeto planilhas dois',
    '11000000-0000-0000-0000-000000000006'
  );

insert into public.licensing_processes (
  id,
  organization_id,
  project_id,
  name,
  state,
  created_by
)
values
  (
    '41000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    'Processo planilhas um',
    'SP',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '41000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000002',
    '31000000-0000-0000-0000-000000000002',
    'Processo planilhas dois',
    'MG',
    '11000000-0000-0000-0000-000000000006'
  );

select throws_ok(
  $$insert into public.spreadsheet_imports
      (organization_id, licensing_process_id, storage_path, original_name,
       declared_mime, size_bytes, extractor_version, created_by)
    values
      ('21000000-0000-0000-0000-000000000001',
       '41000000-0000-0000-0000-000000000002',
       'cross-tenant/file.xlsx', 'file.xlsx',
       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
       1024, 'spreadsheet-v1',
       '11000000-0000-0000-0000-000000000001')$$,
  '23503',
  null,
  'an import cannot reference a process from another tenant'
);

insert into public.spreadsheet_imports (
  id,
  organization_id,
  licensing_process_id,
  storage_path,
  original_name,
  declared_mime,
  size_bytes,
  extractor_version,
  created_by
)
values
  (
    '51000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001/41000000-0000-0000-0000-000000000001/51000000-0000-0000-0000-000000000001/data.xlsx',
    'data.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    1024,
    'spreadsheet-v1',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '51000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001/41000000-0000-0000-0000-000000000001/51000000-0000-0000-0000-000000000002/cancel.csv',
    'cancel.csv',
    'text/csv',
    128,
    'spreadsheet-v1',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    '51000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000002',
    '41000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000002/41000000-0000-0000-0000-000000000002/51000000-0000-0000-0000-000000000003/private.csv',
    'private.csv',
    'text/csv',
    128,
    'spreadsheet-v1',
    '11000000-0000-0000-0000-000000000006'
  ),
  (
    '51000000-0000-0000-0000-000000000004',
    '21000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001/41000000-0000-0000-0000-000000000001/51000000-0000-0000-0000-000000000004/duplicate.xlsx',
    'duplicate.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    1024,
    'spreadsheet-v1',
    '11000000-0000-0000-0000-000000000001'
  );

set local role authenticated;
set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000005';

select is(
  (select count(*) from public.spreadsheet_imports),
  0::bigint,
  'an outsider cannot read another tenant imports'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000004';

select is(
  (select count(*) from public.spreadsheet_imports),
  3::bigint,
  'a tenant viewer can read imports from their organization'
);

reset role;

select is(
  (
    select count(*)
    from pg_class
    where oid = any(array[
      'public.spreadsheet_imports'::regclass,
      'public.spreadsheet_sheets'::regclass,
      'public.source_cells'::regclass,
      'public.spreadsheet_candidates'::regclass,
      'public.coordinate_candidates'::regclass,
      'public.monitoring_candidates'::regclass,
      'public.document_pending_item_candidates'::regclass,
      'public.candidate_evidence'::regclass,
      'public.spreadsheet_extraction_runs'::regclass,
      'public.spreadsheet_review_events'::regclass
    ]) and relrowsecurity
  ),
  10::bigint,
  'every new public table has RLS enabled'
);

select ok(
  (select bool_and(has_table_privilege('authenticated', table_name, 'select'))
   from unnest(array[
     'public.spreadsheet_imports',
     'public.spreadsheet_sheets',
     'public.source_cells',
     'public.spreadsheet_candidates',
     'public.coordinate_candidates',
     'public.monitoring_candidates',
     'public.document_pending_item_candidates',
     'public.candidate_evidence',
     'public.spreadsheet_extraction_runs',
     'public.spreadsheet_review_events'
   ]) as tables(table_name)),
  'authenticated receives explicit SELECT on queryable tables'
);

select ok(
  (select bool_and(not has_table_privilege('authenticated', table_name, 'insert'))
   from unnest(array[
     'public.spreadsheet_imports', 'public.spreadsheet_sheets',
     'public.source_cells', 'public.spreadsheet_candidates',
     'public.coordinate_candidates', 'public.monitoring_candidates',
     'public.document_pending_item_candidates', 'public.candidate_evidence',
     'public.spreadsheet_extraction_runs', 'public.spreadsheet_review_events'
   ]) as tables(table_name)),
  'authenticated has no direct INSERT on spreadsheet tables'
);

select ok(
  (select bool_and(not has_table_privilege('authenticated', table_name, 'update'))
   from unnest(array[
     'public.spreadsheet_imports', 'public.spreadsheet_sheets',
     'public.source_cells', 'public.spreadsheet_candidates',
     'public.coordinate_candidates', 'public.monitoring_candidates',
     'public.document_pending_item_candidates', 'public.candidate_evidence',
     'public.spreadsheet_extraction_runs', 'public.spreadsheet_review_events'
   ]) as tables(table_name)),
  'authenticated has no direct UPDATE on spreadsheet tables'
);

select ok(
  (select bool_and(not has_table_privilege('authenticated', table_name, 'delete'))
   from unnest(array[
     'public.spreadsheet_imports', 'public.spreadsheet_sheets',
     'public.source_cells', 'public.spreadsheet_candidates',
     'public.coordinate_candidates', 'public.monitoring_candidates',
     'public.document_pending_item_candidates', 'public.candidate_evidence',
     'public.spreadsheet_extraction_runs', 'public.spreadsheet_review_events'
   ]) as tables(table_name)),
  'authenticated has no direct DELETE on spreadsheet tables'
);

select ok(
  not has_table_privilege('authenticated', 'public.spreadsheet_candidates', 'update'),
  'candidates cannot be updated directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.spreadsheet_review_events', 'insert'),
  'review events cannot be inserted directly'
);

select ok(
  not has_table_privilege('anon', 'public.spreadsheet_imports', 'select'),
  'anon has no spreadsheet table privileges'
);

select ok(
  (select bool_and(has_function_privilege('authenticated', signature, 'execute'))
   from unnest(array[
     'public.finalize_spreadsheet_import(uuid,text,text,jsonb)',
     'public.claim_next_spreadsheet_sheet(uuid)',
     'public.persist_spreadsheet_sheet_extraction(uuid,integer,jsonb)',
     'public.review_spreadsheet_candidate(uuid,text,jsonb,text,timestamp with time zone)',
     'public.cancel_spreadsheet_import(uuid)'
   ]) as functions(signature)),
  'authenticated can execute only the exact spreadsheet RPC signatures'
);

select ok(
  (select bool_and(not has_function_privilege('anon', signature, 'execute'))
   from unnest(array[
     'public.finalize_spreadsheet_import(uuid,text,text,jsonb)',
     'public.claim_next_spreadsheet_sheet(uuid)',
     'public.persist_spreadsheet_sheet_extraction(uuid,integer,jsonb)',
     'public.review_spreadsheet_candidate(uuid,text,jsonb,text,timestamp with time zone)',
     'public.cancel_spreadsheet_import(uuid)'
   ]) as functions(signature)),
  'anon cannot execute spreadsheet RPCs'
);

set local role authenticated;
set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000003';

select throws_ok(
  $$select public.finalize_spreadsheet_import(
      '51000000-0000-0000-0000-000000000001', repeat('a', 64),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '[{"index":0,"name":"Pontos","rowCount":2,"columnCount":2}]'::jsonb
    )$$,
  '42501',
  'Insufficient role.',
  'a reviewer cannot finalize an import'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000001';

select is(
  public.finalize_spreadsheet_import(
    '51000000-0000-0000-0000-000000000001',
    repeat('a', 64),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '[{"index":0,"name":"Pontos","rowCount":2,"columnCount":2}]'::jsonb
  ),
  '51000000-0000-0000-0000-000000000001'::uuid,
  'an owner finalizes the receiving import atomically'
);

select is(
  (select status::text from public.spreadsheet_imports
   where id = '51000000-0000-0000-0000-000000000001'),
  'aguardando_processamento',
  'finalization moves the import to processing queue'
);

select is(
  (select count(*) from public.spreadsheet_sheets
   where import_id = '51000000-0000-0000-0000-000000000001'),
  1::bigint,
  'finalization creates sheet metadata in the same transaction'
);

select is(
  public.finalize_spreadsheet_import(
    '51000000-0000-0000-0000-000000000004',
    repeat('a', 64),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '[{"index":0,"name":"Nao deve persistir","rowCount":1,"columnCount":1}]'::jsonb
  ),
  '51000000-0000-0000-0000-000000000001'::uuid,
  'idempotent finalization returns the existing import'
);

select is(
  (select count(*) from public.spreadsheet_sheets
   where import_id = '51000000-0000-0000-0000-000000000004'),
  0::bigint,
  'idempotent finalization does not change duplicate results'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000003';

select throws_ok(
  $$select public.claim_next_spreadsheet_sheet(
      '51000000-0000-0000-0000-000000000001'
    )$$,
  '42501',
  'Insufficient role.',
  'a reviewer cannot claim a sheet'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000001';

select is(
  (public.claim_next_spreadsheet_sheet(
    '51000000-0000-0000-0000-000000000001'
  )).sheet_index,
  0,
  'claim returns exactly the next sheet'
);

select is(
  (select status from public.spreadsheet_sheets
   where import_id = '51000000-0000-0000-0000-000000000001'
     and sheet_index = 0),
  'processando',
  'claim marks the selected sheet as processing'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000003';

select throws_ok(
  $$select public.persist_spreadsheet_sheet_extraction(
      '51000000-0000-0000-0000-000000000001', 0,
      '{"extractorVersion":"spreadsheet-v1","cells":[],"candidates":[]}'::jsonb
    )$$,
  '42501',
  'Insufficient role.',
  'a reviewer cannot persist a claimed sheet'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000001';

select throws_ok(
  $$select public.persist_spreadsheet_sheet_extraction(
      '51000000-0000-0000-0000-000000000001', 0,
      '{"extractorVersion":"wrong-version","cells":[],"candidates":[]}'::jsonb
    )$$,
  '22023',
  'Extractor version mismatch.',
  'persist rejects an extraction from another version'
);

select is(
  (select count(*) from public.source_cells
   where import_id = '51000000-0000-0000-0000-000000000001'),
  0::bigint,
  'an invalid extraction rolls back every cell from that sheet'
);

select lives_ok(
  $$select public.persist_spreadsheet_sheet_extraction(
      '51000000-0000-0000-0000-000000000001', 0,
      '{
        "extractorVersion":"spreadsheet-v1",
        "classifications":[{"kind":"coordenadas","confidence":0.96}],
        "signals":["latitude_header","longitude_header"],
        "alerts":[],
        "cells":[
          {"address":"A2","row":2,"column":1,"headerOriginal":"Latitude","rawValue":-23.5,"safeText":"-23.5","formulaText":null,"sourceFileId":"51000000-0000-0000-0000-000000000001","sourceSha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
          {"address":"B2","row":2,"column":2,"headerOriginal":"Longitude","rawValue":-46.6,"safeText":"-46.6","formulaText":null,"sourceFileId":"51000000-0000-0000-0000-000000000001","sourceSha256":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
        ],
        "candidates":[{
          "id":"61000000-0000-0000-0000-000000000001",
          "kind":"coordinate",
          "reviewStatus":"proposta",
          "confidence":0.96,
          "proposal":{"coordinateSystem":"wgs84","latitude":-23.5,"longitude":-46.6},
          "alerts":[],
          "evidence":["A2","B2"]
        }],
        "ambiguityReservations":[{
          "ambiguityId":"ambiguity-sheet-0-table-0",
          "reservationId":"reservation-sheet-0-table-0",
          "number":1,
          "state":"reserved"
        }]
      }'::jsonb
    )$$,
  'a valid extraction persists one claimed sheet atomically'
);

select is(
  (select count(*) from public.source_cells
   where import_id = '51000000-0000-0000-0000-000000000001'),
  2::bigint,
  'only evidence cells are persisted'
);

select is(
  (select count(*) from public.spreadsheet_candidates
   where import_id = '51000000-0000-0000-0000-000000000001'),
  1::bigint,
  'the extraction persists proposed candidates'
);

select is(
  (select count(*) from public.candidate_evidence
   where import_id = '51000000-0000-0000-0000-000000000001'),
  2::bigint,
  'candidate evidence links only persisted source cells'
);

select is(
  (select count(*) from public.spreadsheet_extraction_runs
   where import_id = '51000000-0000-0000-0000-000000000001'
     and ambiguity_id = 'ambiguity-sheet-0-table-0'),
  1::bigint,
  'the only AI reservation is durably bound to its ambiguity'
);

reset role;

select throws_ok(
  $$insert into public.spreadsheet_extraction_runs (
      organization_id, import_id, sheet_id, extractor_version, attempt,
      status, ambiguity_id, reservation_id
    )
    select organization_id, import_id, id, 'spreadsheet-v1', 1,
      'reserved', 'ambiguity-sheet-0-table-0', 'another-reservation'
    from public.spreadsheet_sheets
    where import_id = '51000000-0000-0000-0000-000000000001'
      and sheet_index = 0$$,
  '23505',
  null,
  'an ambiguity cannot reserve a second AI attempt'
);

set local role authenticated;
set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000003';

select lives_ok(
  $$select public.review_spreadsheet_candidate(
      '61000000-0000-0000-0000-000000000001',
      'confirmada',
      '{"coordinateSystem":"wgs84","latitude":-23.5,"longitude":-46.6}'::jsonb,
      'Coordenada conferida',
      (select updated_at from public.spreadsheet_candidates
       where id = '61000000-0000-0000-0000-000000000001')
    )$$,
  'a reviewer can review a candidate'
);

select is(
  (select count(*) from public.spreadsheet_review_events
   where candidate_id = '61000000-0000-0000-0000-000000000001'),
  1::bigint,
  'review inserts one append-only event'
);

select is(
  (select status::text from public.spreadsheet_imports
   where id = '51000000-0000-0000-0000-000000000001'),
  'concluida',
  'review derives the terminal import state'
);

select throws_ok(
  $$select public.review_spreadsheet_candidate(
      '61000000-0000-0000-0000-000000000001', 'rejeitada', null, null,
      '2000-01-01 00:00:00+00'::timestamptz
    )$$,
  '40001',
  'Candidate changed.',
  'stale review updates fail optimistically'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000004';

select throws_ok(
  $$select public.review_spreadsheet_candidate(
      '61000000-0000-0000-0000-000000000001', 'rejeitada', null, null,
      (select updated_at from public.spreadsheet_candidates
       where id = '61000000-0000-0000-0000-000000000001')
    )$$,
  '42501',
  'Insufficient role.',
  'a viewer cannot review candidates'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000003';

select throws_ok(
  $$select public.cancel_spreadsheet_import(
      '51000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  'Insufficient role.',
  'a reviewer cannot cancel an import'
);

set local request.jwt.claim.sub = '11000000-0000-0000-0000-000000000002';

select ok(
  public.cancel_spreadsheet_import(
    '51000000-0000-0000-0000-000000000002'
  ),
  'an analyst can cancel a non-terminal import'
);

select is(
  (select count(*) from public.spreadsheet_imports
   where id = '51000000-0000-0000-0000-000000000002'
     and status = 'cancelada'),
  1::bigint,
  'cancellation preserves the import history'
);

reset role;

select is(
  (select public from storage.buckets where id = 'spreadsheet-imports'),
  false,
  'the spreadsheet bucket is private'
);

select is(
  (select count(*) from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname = 'spreadsheet imports can be uploaded by contributors'
     and cmd = 'INSERT'),
  1::bigint,
  'storage has an immutable upload policy bound to receiving imports'
);

select is(
  (select count(*) from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname = 'spreadsheet imports can be read by members'
     and cmd = 'SELECT'),
  1::bigint,
  'storage read policy is bound to import membership'
);

select is(
  (select count(*) from pg_policies
   where schemaname = 'storage' and tablename = 'objects'
     and policyname like 'spreadsheet imports%'
     and cmd = 'UPDATE'),
  0::bigint,
  'storage objects have no UPDATE policy and remain immutable'
);

select * from finish();
rollback;
