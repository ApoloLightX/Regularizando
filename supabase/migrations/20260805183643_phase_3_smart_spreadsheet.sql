create type public.spreadsheet_import_status as enum (
  'recebendo',
  'aguardando_processamento',
  'processando',
  'aguardando_revisao',
  'concluida',
  'concluida_com_alertas',
  'falhou',
  'cancelada'
);

create type public.spreadsheet_candidate_kind as enum (
  'coordinate',
  'monitoring',
  'document_pending'
);

create type public.spreadsheet_review_status as enum (
  'proposta',
  'confirmada',
  'editada',
  'rejeitada'
);

create unique index licensing_processes_id_organization_unique
  on public.licensing_processes (id, organization_id);

create table public.spreadsheet_imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  licensing_process_id uuid not null,
  storage_path text not null unique,
  original_name text not null,
  declared_mime text not null,
  detected_mime text,
  size_bytes bigint not null,
  sha256 text,
  extractor_version text not null,
  status public.spreadsheet_import_status not null default 'recebendo',
  total_sheets integer not null default 0,
  processed_sheets integer not null default 0,
  failed_sheets integer not null default 0,
  alert_count integer not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  finalized_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spreadsheet_imports_id_organization_unique
    unique (id, organization_id),
  constraint spreadsheet_imports_process_tenant_fk
    foreign key (licensing_process_id, organization_id)
    references public.licensing_processes (id, organization_id)
    on delete cascade,
  constraint spreadsheet_imports_storage_path_length
    check (char_length(storage_path) between 1 and 1024),
  constraint spreadsheet_imports_original_name_length
    check (char_length(original_name) between 1 and 255),
  constraint spreadsheet_imports_declared_mime_allowed
    check (declared_mime in (
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )),
  constraint spreadsheet_imports_detected_mime_allowed
    check (detected_mime is null or detected_mime in (
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )),
  constraint spreadsheet_imports_size_limit
    check (size_bytes between 1 and 10485760),
  constraint spreadsheet_imports_sha256_format
    check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  constraint spreadsheet_imports_extractor_version_length
    check (char_length(extractor_version) between 1 and 80),
  constraint spreadsheet_imports_progress_bounds
    check (
      total_sheets between 0 and 20
      and processed_sheets between 0 and total_sheets
      and failed_sheets between 0 and total_sheets
      and processed_sheets + failed_sheets <= total_sheets
      and alert_count >= 0
    )
);

create table public.spreadsheet_sheets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_id uuid not null,
  sheet_index integer not null,
  name text not null,
  row_count integer not null default 0,
  column_count integer not null default 0,
  classifications jsonb not null default '[]'::jsonb,
  confidence numeric(5,4),
  signals jsonb not null default '[]'::jsonb,
  alerts jsonb not null default '[]'::jsonb,
  status text not null default 'pendente',
  error_code text,
  sanitized_error text,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spreadsheet_sheets_id_organization_unique
    unique (id, organization_id),
  constraint spreadsheet_sheets_id_tenant_import_unique
    unique (id, organization_id, import_id),
  constraint spreadsheet_sheets_import_tenant_fk
    foreign key (import_id, organization_id)
    references public.spreadsheet_imports (id, organization_id)
    on delete cascade,
  constraint spreadsheet_sheets_import_index_unique
    unique (import_id, sheet_index),
  constraint spreadsheet_sheets_index_limit
    check (sheet_index between 0 and 19),
  constraint spreadsheet_sheets_name_length
    check (char_length(name) between 1 and 200),
  constraint spreadsheet_sheets_dimensions_limit
    check (
      row_count between 0 and 50000
      and column_count between 0 and 16384
    ),
  constraint spreadsheet_sheets_classifications_shape
    check (
      jsonb_typeof(classifications) = 'array'
      and octet_length(classifications::text) <= 16000
    ),
  constraint spreadsheet_sheets_confidence_range
    check (confidence is null or confidence between 0 and 1),
  constraint spreadsheet_sheets_signals_limit
    check (
      jsonb_typeof(signals) = 'array'
      and octet_length(signals::text) <= 16000
    ),
  constraint spreadsheet_sheets_alerts_limit
    check (
      jsonb_typeof(alerts) = 'array'
      and octet_length(alerts::text) <= 16000
    ),
  constraint spreadsheet_sheets_status_allowed
    check (status in ('pendente', 'processando', 'concluida', 'falhou', 'cancelada')),
  constraint spreadsheet_sheets_error_code_length
    check (error_code is null or char_length(error_code) <= 80),
  constraint spreadsheet_sheets_sanitized_error_length
    check (sanitized_error is null or char_length(sanitized_error) <= 1000)
);

create table public.source_cells (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_id uuid not null,
  sheet_id uuid not null,
  row_number integer not null,
  column_number integer not null,
  address text not null,
  header_original text,
  raw_value jsonb not null,
  safe_text text not null,
  formula_text text,
  created_at timestamptz not null default now(),
  constraint source_cells_id_organization_unique
    unique (id, organization_id),
  constraint source_cells_id_tenant_import_unique
    unique (id, organization_id, import_id),
  constraint source_cells_import_tenant_fk
    foreign key (import_id, organization_id)
    references public.spreadsheet_imports (id, organization_id)
    on delete cascade,
  constraint source_cells_sheet_tenant_import_fk
    foreign key (sheet_id, organization_id, import_id)
    references public.spreadsheet_sheets (id, organization_id, import_id)
    on delete cascade,
  constraint source_cells_sheet_address_unique
    unique (sheet_id, address),
  constraint source_cells_position_positive
    check (row_number between 1 and 50000 and column_number between 1 and 16384),
  constraint source_cells_address_format
    check (address ~ '^[A-Z]+[1-9][0-9]*$' and char_length(address) <= 16),
  constraint source_cells_header_length
    check (header_original is null or char_length(header_original) <= 500),
  constraint source_cells_safe_text_length
    check (char_length(safe_text) <= 4000),
  constraint source_cells_formula_text_length
    check (formula_text is null or char_length(formula_text) <= 4000)
);

create table public.spreadsheet_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_id uuid not null,
  sheet_id uuid not null,
  kind public.spreadsheet_candidate_kind not null,
  review_status public.spreadsheet_review_status not null default 'proposta',
  confidence numeric(5,4) not null,
  proposed_payload jsonb not null,
  confirmed_payload jsonb,
  alerts jsonb not null default '[]'::jsonb,
  ambiguity_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default clock_timestamp(),
  constraint spreadsheet_candidates_id_organization_unique
    unique (id, organization_id),
  constraint spreadsheet_candidates_id_tenant_import_unique
    unique (id, organization_id, import_id),
  constraint spreadsheet_candidates_import_tenant_fk
    foreign key (import_id, organization_id)
    references public.spreadsheet_imports (id, organization_id)
    on delete cascade,
  constraint spreadsheet_candidates_sheet_tenant_import_fk
    foreign key (sheet_id, organization_id, import_id)
    references public.spreadsheet_sheets (id, organization_id, import_id)
    on delete cascade,
  constraint spreadsheet_candidates_confidence_range
    check (confidence between 0 and 1),
  constraint spreadsheet_candidates_proposal_shape
    check (
      jsonb_typeof(proposed_payload) = 'object'
      and octet_length(proposed_payload::text) <= 32000
    ),
  constraint spreadsheet_candidates_confirmed_shape
    check (
      confirmed_payload is null
      or (
        jsonb_typeof(confirmed_payload) = 'object'
        and octet_length(confirmed_payload::text) <= 32000
      )
    ),
  constraint spreadsheet_candidates_alerts_limit
    check (
      jsonb_typeof(alerts) = 'array'
      and octet_length(alerts::text) <= 16000
    ),
  constraint spreadsheet_candidates_ambiguity_length
    check (ambiguity_id is null or char_length(ambiguity_id) between 1 and 200)
);

create table public.coordinate_candidates (
  candidate_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  coordinate_system text,
  latitude_original text,
  longitude_original text,
  easting_original text,
  northing_original text,
  utm_zone smallint,
  hemisphere text,
  datum text,
  transformed_latitude numeric,
  transformed_longitude numeric,
  transformation_method text,
  constraint coordinate_candidates_candidate_tenant_fk
    foreign key (candidate_id, organization_id)
    references public.spreadsheet_candidates (id, organization_id)
    on delete cascade,
  constraint coordinate_candidates_system_length
    check (coordinate_system is null or char_length(coordinate_system) <= 80),
  constraint coordinate_candidates_original_value_length
    check (
      (latitude_original is null or char_length(latitude_original) <= 200)
      and (longitude_original is null or char_length(longitude_original) <= 200)
      and (easting_original is null or char_length(easting_original) <= 200)
      and (northing_original is null or char_length(northing_original) <= 200)
    ),
  constraint coordinate_candidates_utm_zone_range
    check (utm_zone is null or utm_zone between 1 and 60),
  constraint coordinate_candidates_hemisphere_allowed
    check (hemisphere is null or hemisphere in ('N', 'S')),
  constraint coordinate_candidates_metadata_length
    check (
      (datum is null or char_length(datum) <= 100)
      and (transformation_method is null or char_length(transformation_method) <= 500)
    )
);

create table public.monitoring_candidates (
  candidate_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parameter_original text,
  parameter_normalized text,
  value_original text,
  value_normalized numeric,
  unit_original text,
  unit_normalized text,
  measured_at timestamptz,
  sampling_point text,
  method text,
  laboratory text,
  ready_for_comparison boolean not null default false,
  not_ready_reason text,
  constraint monitoring_candidates_candidate_tenant_fk
    foreign key (candidate_id, organization_id)
    references public.spreadsheet_candidates (id, organization_id)
    on delete cascade,
  constraint monitoring_candidates_text_limits
    check (
      (parameter_original is null or char_length(parameter_original) <= 300)
      and (parameter_normalized is null or char_length(parameter_normalized) <= 160)
      and (value_original is null or char_length(value_original) <= 300)
      and (unit_original is null or char_length(unit_original) <= 100)
      and (unit_normalized is null or char_length(unit_normalized) <= 100)
      and (sampling_point is null or char_length(sampling_point) <= 300)
      and (method is null or char_length(method) <= 500)
      and (laboratory is null or char_length(laboratory) <= 300)
      and (not_ready_reason is null or char_length(not_ready_reason) <= 1000)
    )
);

create table public.document_pending_item_candidates (
  candidate_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_name text,
  required_as_stated boolean,
  original_status text,
  valid_until date,
  responsible text,
  proposed_description text,
  constraint document_pending_candidates_candidate_tenant_fk
    foreign key (candidate_id, organization_id)
    references public.spreadsheet_candidates (id, organization_id)
    on delete cascade,
  constraint document_pending_candidates_text_limits
    check (
      (document_name is null or char_length(document_name) <= 500)
      and (original_status is null or char_length(original_status) <= 300)
      and (responsible is null or char_length(responsible) <= 300)
      and (proposed_description is null or char_length(proposed_description) <= 2000)
    )
);

create table public.candidate_evidence (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_id uuid not null,
  candidate_id uuid not null,
  source_cell_id uuid not null,
  ordinal smallint not null default 0,
  created_at timestamptz not null default now(),
  primary key (candidate_id, source_cell_id),
  constraint candidate_evidence_candidate_tenant_import_fk
    foreign key (candidate_id, organization_id, import_id)
    references public.spreadsheet_candidates (id, organization_id, import_id)
    on delete cascade,
  constraint candidate_evidence_cell_tenant_import_fk
    foreign key (source_cell_id, organization_id, import_id)
    references public.source_cells (id, organization_id, import_id)
    on delete cascade,
  constraint candidate_evidence_ordinal_nonnegative
    check (ordinal between 0 and 100)
);

create table public.spreadsheet_extraction_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_id uuid not null,
  sheet_id uuid,
  extractor_version text not null,
  attempt integer not null default 1,
  status text not null,
  ambiguity_id text,
  reservation_id text,
  ai_model text,
  ai_schema_version text,
  correlation_id text,
  ai_latency_ms integer,
  ai_usage jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  sanitized_error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint spreadsheet_extraction_runs_import_tenant_fk
    foreign key (import_id, organization_id)
    references public.spreadsheet_imports (id, organization_id)
    on delete cascade,
  constraint spreadsheet_extraction_runs_sheet_tenant_import_fk
    foreign key (sheet_id, organization_id, import_id)
    references public.spreadsheet_sheets (id, organization_id, import_id)
    on delete cascade,
  constraint spreadsheet_extraction_runs_attempt_positive
    check (attempt = 1),
  constraint spreadsheet_extraction_runs_status_allowed
    check (status in ('reserved', 'processando', 'concluida', 'falhou')),
  constraint spreadsheet_extraction_runs_ambiguity_pair
    check (
      (ambiguity_id is null and reservation_id is null)
      or (ambiguity_id is not null and reservation_id is not null and status = 'reserved')
    ),
  constraint spreadsheet_extraction_runs_text_limits
    check (
      char_length(extractor_version) between 1 and 80
      and (ambiguity_id is null or char_length(ambiguity_id) between 1 and 200)
      and (reservation_id is null or char_length(reservation_id) between 1 and 200)
      and (ai_model is null or char_length(ai_model) <= 200)
      and (ai_schema_version is null or char_length(ai_schema_version) <= 100)
      and (correlation_id is null or char_length(correlation_id) <= 200)
      and (sanitized_error is null or char_length(sanitized_error) <= 1000)
    ),
  constraint spreadsheet_extraction_runs_ai_latency_nonnegative
    check (ai_latency_ms is null or ai_latency_ms >= 0),
  constraint spreadsheet_extraction_runs_ai_usage_limit
    check (jsonb_typeof(ai_usage) = 'object' and octet_length(ai_usage::text) <= 4000),
  constraint spreadsheet_extraction_runs_metrics_limit
    check (jsonb_typeof(metrics) = 'object' and octet_length(metrics::text) <= 8000)
);

create table public.spreadsheet_review_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_id uuid not null,
  candidate_id uuid not null,
  actor_id uuid not null references auth.users(id) on delete restrict,
  from_status public.spreadsheet_review_status not null,
  to_status public.spreadsheet_review_status not null,
  before_payload jsonb not null,
  after_payload jsonb,
  justification text,
  created_at timestamptz not null default now(),
  constraint spreadsheet_review_events_import_tenant_fk
    foreign key (import_id, organization_id)
    references public.spreadsheet_imports (id, organization_id)
    on delete cascade,
  constraint spreadsheet_review_events_candidate_tenant_import_fk
    foreign key (candidate_id, organization_id, import_id)
    references public.spreadsheet_candidates (id, organization_id, import_id)
    on delete cascade,
  constraint spreadsheet_review_events_before_payload_limit
    check (jsonb_typeof(before_payload) = 'object' and octet_length(before_payload::text) <= 32000),
  constraint spreadsheet_review_events_after_payload_limit
    check (
      after_payload is null
      or (jsonb_typeof(after_payload) = 'object' and octet_length(after_payload::text) <= 32000)
    ),
  constraint spreadsheet_review_events_justification_length
    check (justification is null or char_length(justification) <= 1000),
  constraint spreadsheet_review_events_transition
    check (from_status = 'proposta' and to_status in ('confirmada', 'editada', 'rejeitada'))
);

create unique index spreadsheet_imports_idempotency_unique
  on public.spreadsheet_imports (
    organization_id, licensing_process_id, sha256, extractor_version
  )
  where sha256 is not null and status <> 'cancelada';

create index spreadsheet_imports_organization_id_idx
  on public.spreadsheet_imports (organization_id);
create index spreadsheet_imports_process_tenant_idx
  on public.spreadsheet_imports (licensing_process_id, organization_id);
create index spreadsheet_imports_created_by_idx
  on public.spreadsheet_imports (created_by);
create index spreadsheet_imports_status_idx
  on public.spreadsheet_imports (status);
create index spreadsheet_sheets_organization_id_idx
  on public.spreadsheet_sheets (organization_id);
create index spreadsheet_sheets_import_status_index_idx
  on public.spreadsheet_sheets (import_id, status, sheet_index);
create index source_cells_organization_id_idx
  on public.source_cells (organization_id);
create index source_cells_import_id_idx
  on public.source_cells (import_id);
create index source_cells_sheet_id_idx
  on public.source_cells (sheet_id);
create index spreadsheet_candidates_organization_id_idx
  on public.spreadsheet_candidates (organization_id);
create index spreadsheet_candidates_import_status_idx
  on public.spreadsheet_candidates (import_id, review_status);
create index spreadsheet_candidates_sheet_id_idx
  on public.spreadsheet_candidates (sheet_id);
create index spreadsheet_candidates_kind_idx
  on public.spreadsheet_candidates (kind);
create index coordinate_candidates_organization_id_idx
  on public.coordinate_candidates (organization_id);
create index monitoring_candidates_organization_id_idx
  on public.monitoring_candidates (organization_id);
create index document_pending_candidates_organization_id_idx
  on public.document_pending_item_candidates (organization_id);
create index candidate_evidence_organization_id_idx
  on public.candidate_evidence (organization_id);
create index candidate_evidence_import_id_idx
  on public.candidate_evidence (import_id);
create index candidate_evidence_source_cell_id_idx
  on public.candidate_evidence (source_cell_id);
create index spreadsheet_extraction_runs_organization_id_idx
  on public.spreadsheet_extraction_runs (organization_id);
create index spreadsheet_extraction_runs_import_id_idx
  on public.spreadsheet_extraction_runs (import_id);
create index spreadsheet_extraction_runs_sheet_id_idx
  on public.spreadsheet_extraction_runs (sheet_id)
  where sheet_id is not null;
create unique index spreadsheet_extraction_runs_sheet_attempt_unique
  on public.spreadsheet_extraction_runs (sheet_id, attempt)
  where ambiguity_id is null;
create unique index spreadsheet_extraction_runs_ambiguity_unique
  on public.spreadsheet_extraction_runs (import_id, ambiguity_id)
  where ambiguity_id is not null;
create index spreadsheet_extraction_runs_ambiguity_id_idx
  on public.spreadsheet_extraction_runs (ambiguity_id)
  where ambiguity_id is not null;
create unique index spreadsheet_extraction_runs_reservation_unique
  on public.spreadsheet_extraction_runs (reservation_id)
  where reservation_id is not null;
create index spreadsheet_review_events_organization_id_idx
  on public.spreadsheet_review_events (organization_id);
create index spreadsheet_review_events_import_id_idx
  on public.spreadsheet_review_events (import_id);
create index spreadsheet_review_events_candidate_created_idx
  on public.spreadsheet_review_events (candidate_id, created_at);
create index spreadsheet_review_events_actor_id_idx
  on public.spreadsheet_review_events (actor_id);

create trigger spreadsheet_imports_set_updated_at
before update on public.spreadsheet_imports
for each row execute function public.set_updated_at();

create trigger spreadsheet_sheets_set_updated_at
before update on public.spreadsheet_sheets
for each row execute function public.set_updated_at();

create or replace function public.finalize_spreadsheet_import(
  p_import_id uuid,
  p_sha256 text,
  p_detected_mime text,
  p_sheets jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.spreadsheet_imports%rowtype;
  existing_id uuid;
  sheet_meta jsonb;
  sheet_ordinal bigint;
  target_sheet_index integer;
  target_sheet_name text;
  target_row_count integer;
  target_column_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into target
  from public.spreadsheet_imports
  where id = p_import_id
  for update;

  if target.id is null then
    raise exception 'Spreadsheet import not found.' using errcode = 'P0002';
  end if;

  if not private.has_organization_role(
    target.organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  ) then
    raise exception 'Insufficient role.' using errcode = '42501';
  end if;

  if target.status <> 'recebendo' then
    if target.sha256 = p_sha256 and target.detected_mime = p_detected_mime then
      return target.id;
    end if;
    raise exception 'Import is not receiving.' using errcode = '55000';
  end if;

  if p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid SHA-256.' using errcode = '22023';
  end if;

  if p_detected_mime not in (
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) then
    raise exception 'Unsupported detected MIME.' using errcode = '22023';
  end if;

  if p_detected_mime <> target.declared_mime then
    raise exception 'Detected MIME does not match declaration.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_sheets) <> 'array'
    or jsonb_array_length(p_sheets) < 1
    or jsonb_array_length(p_sheets) > 20
  then
    raise exception 'Invalid sheet metadata.' using errcode = '22023';
  end if;

  select candidate.id into existing_id
  from public.spreadsheet_imports candidate
  where candidate.organization_id = target.organization_id
    and candidate.licensing_process_id = target.licensing_process_id
    and candidate.sha256 = p_sha256
    and candidate.extractor_version = target.extractor_version
    and candidate.status <> 'cancelada'
    and candidate.id <> target.id
  order by candidate.created_at, candidate.id
  limit 1;

  if existing_id is not null then
    return existing_id;
  end if;

  begin
    update public.spreadsheet_imports
    set sha256 = p_sha256,
        detected_mime = p_detected_mime,
        total_sheets = jsonb_array_length(p_sheets),
        status = 'aguardando_processamento',
        finalized_at = now()
    where id = target.id;
  exception when unique_violation then
    select candidate.id into existing_id
    from public.spreadsheet_imports candidate
    where candidate.organization_id = target.organization_id
      and candidate.licensing_process_id = target.licensing_process_id
      and candidate.sha256 = p_sha256
      and candidate.extractor_version = target.extractor_version
      and candidate.status <> 'cancelada'
      and candidate.id <> target.id
    order by candidate.created_at, candidate.id
    limit 1;
    if existing_id is null then
      raise;
    end if;
    return existing_id;
  end;

  for sheet_meta, sheet_ordinal in
    select item.value, item.ordinality
    from jsonb_array_elements(p_sheets) with ordinality as item(value, ordinality)
  loop
    if jsonb_typeof(sheet_meta) <> 'object' then
      raise exception 'Invalid sheet metadata.' using errcode = '22023';
    end if;

    target_sheet_index := coalesce((sheet_meta ->> 'index')::integer, sheet_ordinal::integer - 1);
    target_sheet_name := nullif(btrim(sheet_meta ->> 'name'), '');
    target_row_count := coalesce((sheet_meta ->> 'rowCount')::integer, 0);
    target_column_count := coalesce((sheet_meta ->> 'columnCount')::integer, 0);

    if target_sheet_name is null
      or char_length(target_sheet_name) > 200
      or target_sheet_index < 0
      or target_sheet_index > 19
      or target_row_count < 0
      or target_row_count > 50000
      or target_column_count < 0
      or target_column_count > 16384
    then
      raise exception 'Invalid sheet metadata.' using errcode = '22023';
    end if;

    insert into public.spreadsheet_sheets (
      organization_id,
      import_id,
      sheet_index,
      name,
      row_count,
      column_count
    ) values (
      target.organization_id,
      target.id,
      target_sheet_index,
      target_sheet_name,
      target_row_count,
      target_column_count
    );
  end loop;

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    target.organization_id,
    (select auth.uid()),
    'finalize',
    'spreadsheet_imports',
    target.id::text,
    jsonb_build_object(
      'source', 'finalize_spreadsheet_import',
      'sheet_count', jsonb_array_length(p_sheets),
      'extractor_version', target.extractor_version
    )
  );

  return target.id;
end;
$$;

create or replace function public.claim_next_spreadsheet_sheet(p_import_id uuid)
returns public.spreadsheet_sheets
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.spreadsheet_imports%rowtype;
  claimed public.spreadsheet_sheets%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into target
  from public.spreadsheet_imports
  where id = p_import_id
  for update;

  if target.id is null then
    raise exception 'Spreadsheet import not found.' using errcode = 'P0002';
  end if;

  if not private.has_organization_role(
    target.organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  ) then
    raise exception 'Insufficient role.' using errcode = '42501';
  end if;

  if target.status not in ('aguardando_processamento', 'processando') then
    return null;
  end if;

  select * into claimed
  from public.spreadsheet_sheets sheet
  where sheet.import_id = target.id
    and sheet.organization_id = target.organization_id
    and sheet.status = 'pendente'
  order by sheet.sheet_index
  limit 1
  for update skip locked;

  if claimed.id is null then
    return null;
  end if;

  update public.spreadsheet_sheets
  set status = 'processando', claimed_at = now()
  where id = claimed.id
  returning * into claimed;

  update public.spreadsheet_imports
  set status = 'processando'
  where id = target.id;

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    target.organization_id,
    (select auth.uid()),
    'claim',
    'spreadsheet_sheets',
    claimed.id::text,
    jsonb_build_object('source', 'claim_next_spreadsheet_sheet')
  );

  return claimed;
end;
$$;

create or replace function public.persist_spreadsheet_sheet_extraction(
  p_import_id uuid,
  p_sheet_index integer,
  p_extraction jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.spreadsheet_imports%rowtype;
  target_sheet public.spreadsheet_sheets%rowtype;
  cell_item jsonb;
  candidate_item jsonb;
  evidence_item jsonb;
  reservation_item jsonb;
  candidate_id_value uuid;
  source_cell_id_value uuid;
  evidence_address text;
  proposal jsonb;
  details jsonb;
  candidate_kind public.spreadsheet_candidate_kind;
  candidate_confidence numeric;
  evidence_ordinal integer;
  extraction_attempt integer;
  pending_count integer;
  failed_count integer;
  completed_count integer;
  candidate_count integer;
  total_alerts integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into target
  from public.spreadsheet_imports
  where id = p_import_id
  for update;

  if target.id is null then
    raise exception 'Spreadsheet import not found.' using errcode = 'P0002';
  end if;

  if not private.has_organization_role(
    target.organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  ) then
    raise exception 'Insufficient role.' using errcode = '42501';
  end if;

  if jsonb_typeof(p_extraction) <> 'object' then
    raise exception 'Invalid extraction payload.' using errcode = '22023';
  end if;

  if p_extraction ->> 'extractorVersion' is distinct from target.extractor_version then
    raise exception 'Extractor version mismatch.' using errcode = '22023';
  end if;

  select * into target_sheet
  from public.spreadsheet_sheets sheet
  where sheet.import_id = target.id
    and sheet.organization_id = target.organization_id
    and sheet.sheet_index = p_sheet_index
  for update;

  if target_sheet.id is null then
    raise exception 'Spreadsheet sheet not found.' using errcode = 'P0002';
  end if;

  if target_sheet.status <> 'processando' then
    raise exception 'Sheet is not claimed.' using errcode = '55000';
  end if;

  extraction_attempt := coalesce((p_extraction ->> 'attempt')::integer, 1);
  if extraction_attempt <> 1 then
    raise exception 'Invalid extraction attempt.' using errcode = '22023';
  end if;

  if coalesce(p_extraction ->> 'status', 'completed') = 'failed' then
    update public.spreadsheet_sheets
    set status = 'falhou',
        error_code = nullif(btrim(p_extraction ->> 'errorCode'), ''),
        sanitized_error = nullif(btrim(p_extraction ->> 'sanitizedError'), ''),
        alerts = coalesce(p_extraction -> 'alerts', '[]'::jsonb),
        completed_at = now()
    where id = target_sheet.id;

    insert into public.spreadsheet_extraction_runs (
      organization_id, import_id, sheet_id, extractor_version, attempt,
      status, metrics, sanitized_error, completed_at
    ) values (
      target.organization_id, target.id, target_sheet.id, target.extractor_version,
      extraction_attempt, 'falhou', coalesce(p_extraction -> 'metrics', '{}'::jsonb),
      nullif(btrim(p_extraction ->> 'sanitizedError'), ''), now()
    );
  else
    if coalesce(jsonb_typeof(p_extraction -> 'cells'), 'null') <> 'array'
      or coalesce(jsonb_typeof(p_extraction -> 'candidates'), 'null') <> 'array'
      or coalesce(jsonb_typeof(p_extraction -> 'signals'), 'array') <> 'array'
      or coalesce(jsonb_typeof(p_extraction -> 'alerts'), 'array') <> 'array'
      or coalesce(jsonb_typeof(p_extraction -> 'classifications'), 'array') <> 'array'
    then
      raise exception 'Invalid extraction payload.' using errcode = '22023';
    end if;

    for cell_item in
      select value from jsonb_array_elements(p_extraction -> 'cells')
    loop
      if jsonb_typeof(cell_item) <> 'object'
        or cell_item ->> 'address' is null
        or (cell_item ->> 'address') !~ '^[A-Z]+[1-9][0-9]*$'
        or coalesce((cell_item ->> 'row')::integer, 0) < 1
        or coalesce((cell_item ->> 'column')::integer, 0) < 1
        or (cell_item ? 'sourceFileId' and (cell_item ->> 'sourceFileId')::uuid <> target.id)
        or (cell_item ? 'sourceSha256' and cell_item ->> 'sourceSha256' <> target.sha256)
      then
        raise exception 'Invalid source cell.' using errcode = '22023';
      end if;

      insert into public.source_cells (
        organization_id,
        import_id,
        sheet_id,
        row_number,
        column_number,
        address,
        header_original,
        raw_value,
        safe_text,
        formula_text
      ) values (
        target.organization_id,
        target.id,
        target_sheet.id,
        (cell_item ->> 'row')::integer,
        (cell_item ->> 'column')::integer,
        cell_item ->> 'address',
        cell_item ->> 'headerOriginal',
        coalesce(cell_item -> 'rawValue', 'null'::jsonb),
        coalesce(cell_item ->> 'safeText', ''),
        cell_item ->> 'formulaText'
      );
    end loop;

    if p_extraction ? 'ambiguityReservations' then
      if jsonb_typeof(p_extraction -> 'ambiguityReservations') <> 'array' then
        raise exception 'Invalid ambiguity reservations.' using errcode = '22023';
      end if;

      for reservation_item in
        select value from jsonb_array_elements(p_extraction -> 'ambiguityReservations')
      loop
        if jsonb_typeof(reservation_item) <> 'object'
          or nullif(btrim(reservation_item ->> 'ambiguityId'), '') is null
          or nullif(btrim(reservation_item ->> 'reservationId'), '') is null
          or coalesce((reservation_item ->> 'number')::integer, 0) <> 1
          or reservation_item ->> 'state' <> 'reserved'
        then
          raise exception 'Invalid ambiguity reservation.' using errcode = '22023';
        end if;

        insert into public.spreadsheet_extraction_runs (
          organization_id,
          import_id,
          sheet_id,
          extractor_version,
          attempt,
          status,
          ambiguity_id,
          reservation_id,
          ai_model,
          ai_schema_version,
          correlation_id,
          ai_latency_ms,
          ai_usage
        ) values (
          target.organization_id,
          target.id,
          target_sheet.id,
          target.extractor_version,
          1,
          'reserved',
          reservation_item ->> 'ambiguityId',
          reservation_item ->> 'reservationId',
          reservation_item ->> 'model',
          reservation_item ->> 'schemaVersion',
          reservation_item ->> 'correlationId',
          (reservation_item ->> 'latencyMs')::integer,
          coalesce(reservation_item -> 'usage', '{}'::jsonb)
        );
      end loop;
    end if;

    for candidate_item in
      select value from jsonb_array_elements(p_extraction -> 'candidates')
    loop
      if jsonb_typeof(candidate_item) <> 'object'
        or candidate_item ->> 'kind' not in ('coordinate', 'monitoring', 'document_pending')
        or coalesce(candidate_item ->> 'reviewStatus', 'proposta') <> 'proposta'
        or jsonb_typeof(candidate_item -> 'proposal') <> 'object'
        or jsonb_typeof(coalesce(candidate_item -> 'alerts', '[]'::jsonb)) <> 'array'
        or jsonb_typeof(candidate_item -> 'evidence') <> 'array'
        or jsonb_array_length(candidate_item -> 'evidence') < 1
      then
        raise exception 'Invalid candidate.' using errcode = '22023';
      end if;

      candidate_confidence := (candidate_item ->> 'confidence')::numeric;
      if candidate_confidence < 0 or candidate_confidence > 1 then
        raise exception 'Invalid candidate confidence.' using errcode = '22023';
      end if;

      candidate_id_value := coalesce(
        (candidate_item ->> 'id')::uuid,
        gen_random_uuid()
      );
      candidate_kind := (candidate_item ->> 'kind')::public.spreadsheet_candidate_kind;
      proposal := candidate_item -> 'proposal';
      details := coalesce(candidate_item -> 'details', proposal);

      insert into public.spreadsheet_candidates (
        id,
        organization_id,
        import_id,
        sheet_id,
        kind,
        confidence,
        proposed_payload,
        alerts,
        ambiguity_id
      ) values (
        candidate_id_value,
        target.organization_id,
        target.id,
        target_sheet.id,
        candidate_kind,
        candidate_confidence,
        proposal,
        coalesce(candidate_item -> 'alerts', '[]'::jsonb),
        nullif(btrim(candidate_item ->> 'ambiguityId'), '')
      );

      if candidate_kind = 'coordinate' then
        insert into public.coordinate_candidates (
          candidate_id,
          organization_id,
          coordinate_system,
          latitude_original,
          longitude_original,
          easting_original,
          northing_original,
          utm_zone,
          hemisphere,
          datum,
          transformed_latitude,
          transformed_longitude,
          transformation_method
        ) values (
          candidate_id_value,
          target.organization_id,
          coalesce(details ->> 'coordinateSystem', details ->> 'crs'),
          coalesce(details ->> 'latitudeOriginal', details ->> 'latitude'),
          coalesce(details ->> 'longitudeOriginal', details ->> 'longitude'),
          details ->> 'eastingOriginal',
          details ->> 'northingOriginal',
          (details ->> 'utmZone')::smallint,
          details ->> 'hemisphere',
          details ->> 'datum',
          (details ->> 'transformedLatitude')::numeric,
          (details ->> 'transformedLongitude')::numeric,
          details ->> 'transformationMethod'
        );
      elsif candidate_kind = 'monitoring' then
        insert into public.monitoring_candidates (
          candidate_id,
          organization_id,
          parameter_original,
          parameter_normalized,
          value_original,
          value_normalized,
          unit_original,
          unit_normalized,
          measured_at,
          sampling_point,
          method,
          laboratory,
          ready_for_comparison,
          not_ready_reason
        ) values (
          candidate_id_value,
          target.organization_id,
          details ->> 'parameterOriginal',
          details ->> 'parameterNormalized',
          details ->> 'valueOriginal',
          (details ->> 'valueNormalized')::numeric,
          details ->> 'unitOriginal',
          details ->> 'unitNormalized',
          (details ->> 'measuredAt')::timestamptz,
          details ->> 'samplingPoint',
          details ->> 'method',
          details ->> 'laboratory',
          coalesce((details ->> 'readyForComparison')::boolean, false),
          details ->> 'notReadyReason'
        );
      else
        insert into public.document_pending_item_candidates (
          candidate_id,
          organization_id,
          document_name,
          required_as_stated,
          original_status,
          valid_until,
          responsible,
          proposed_description
        ) values (
          candidate_id_value,
          target.organization_id,
          details ->> 'documentName',
          (details ->> 'requiredAsStated')::boolean,
          details ->> 'originalStatus',
          (details ->> 'validUntil')::date,
          details ->> 'responsible',
          details ->> 'proposedDescription'
        );
      end if;

      evidence_ordinal := 0;
      for evidence_item in
        select value from jsonb_array_elements(candidate_item -> 'evidence')
      loop
        evidence_address := case
          when jsonb_typeof(evidence_item) = 'string'
            then evidence_item #>> '{}'
          when jsonb_typeof(evidence_item) = 'object'
            then evidence_item ->> 'address'
          else null
        end;

        select cell.id into source_cell_id_value
        from public.source_cells cell
        where cell.sheet_id = target_sheet.id
          and cell.organization_id = target.organization_id
          and cell.import_id = target.id
          and cell.address = evidence_address;

        if source_cell_id_value is null then
          raise exception 'Candidate evidence cell not found.' using errcode = '22023';
        end if;

        insert into public.candidate_evidence (
          organization_id,
          import_id,
          candidate_id,
          source_cell_id,
          ordinal
        ) values (
          target.organization_id,
          target.id,
          candidate_id_value,
          source_cell_id_value,
          evidence_ordinal
        );
        evidence_ordinal := evidence_ordinal + 1;
      end loop;
    end loop;

    update public.spreadsheet_sheets
    set classifications = coalesce(p_extraction -> 'classifications', '[]'::jsonb),
        confidence = (
          select max((classification ->> 'confidence')::numeric)
          from jsonb_array_elements(
            coalesce(p_extraction -> 'classifications', '[]'::jsonb)
          ) as classification
        ),
        signals = coalesce(p_extraction -> 'signals', '[]'::jsonb),
        alerts = coalesce(p_extraction -> 'alerts', '[]'::jsonb),
        status = 'concluida',
        completed_at = now()
    where id = target_sheet.id;

    insert into public.spreadsheet_extraction_runs (
      organization_id,
      import_id,
      sheet_id,
      extractor_version,
      attempt,
      status,
      metrics,
      completed_at
    ) values (
      target.organization_id,
      target.id,
      target_sheet.id,
      target.extractor_version,
      extraction_attempt,
      'concluida',
      coalesce(p_extraction -> 'metrics', '{}'::jsonb),
      now()
    );
  end if;

  select
    count(*) filter (where status in ('pendente', 'processando')),
    count(*) filter (where status = 'falhou'),
    count(*) filter (where status = 'concluida'),
    coalesce(sum(jsonb_array_length(alerts)), 0)
  into pending_count, failed_count, completed_count, total_alerts
  from public.spreadsheet_sheets
  where import_id = target.id
    and organization_id = target.organization_id;

  select count(*) into candidate_count
  from public.spreadsheet_candidates
  where import_id = target.id
    and organization_id = target.organization_id;

  update public.spreadsheet_imports
  set processed_sheets = completed_count,
      failed_sheets = failed_count,
      alert_count = total_alerts,
      status = case
        when pending_count > 0 then 'processando'::public.spreadsheet_import_status
        when candidate_count > 0 then 'aguardando_revisao'::public.spreadsheet_import_status
        when completed_count = 0 and failed_count > 0 then 'falhou'::public.spreadsheet_import_status
        when total_alerts > 0 or failed_count > 0 then 'concluida_com_alertas'::public.spreadsheet_import_status
        else 'concluida'::public.spreadsheet_import_status
      end
  where id = target.id;

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    target.organization_id,
    (select auth.uid()),
    'persist_extraction',
    'spreadsheet_sheets',
    target_sheet.id::text,
    jsonb_build_object(
      'source', 'persist_spreadsheet_sheet_extraction',
      'sheet_index', p_sheet_index,
      'extractor_version', target.extractor_version,
      'result', coalesce(p_extraction ->> 'status', 'completed')
    )
  );

  return target_sheet.id;
end;
$$;

create or replace function public.review_spreadsheet_candidate(
  p_candidate_id uuid,
  p_decision text,
  p_confirmed_payload jsonb,
  p_justification text,
  p_expected_updated_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.spreadsheet_candidates%rowtype;
  target_import public.spreadsheet_imports%rowtype;
  next_status public.spreadsheet_review_status;
  next_payload jsonb;
  has_proposals boolean;
  has_alerts boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into target
  from public.spreadsheet_candidates
  where id = p_candidate_id
  for update;

  if target.id is null then
    raise exception 'Spreadsheet candidate not found.' using errcode = 'P0002';
  end if;

  if not private.has_organization_role(
    target.organization_id,
    array['owner', 'admin', 'analyst', 'reviewer']::public.organization_role[]
  ) then
    raise exception 'Insufficient role.' using errcode = '42501';
  end if;

  if p_expected_updated_at is distinct from target.updated_at then
    raise exception 'Candidate changed.' using errcode = '40001';
  end if;

  if target.review_status <> 'proposta' then
    raise exception 'Candidate is already reviewed.' using errcode = '55000';
  end if;

  if p_decision not in ('confirmada', 'editada', 'rejeitada') then
    raise exception 'Invalid review decision.' using errcode = '22023';
  end if;

  if p_justification is not null and char_length(p_justification) > 1000 then
    raise exception 'Review justification is too long.' using errcode = '22023';
  end if;

  next_status := p_decision::public.spreadsheet_review_status;
  if next_status = 'editada' then
    if jsonb_typeof(p_confirmed_payload) <> 'object' then
      raise exception 'Edited review requires a payload.' using errcode = '22023';
    end if;
    next_payload := p_confirmed_payload;
  elsif next_status = 'confirmada' then
    next_payload := coalesce(p_confirmed_payload, target.proposed_payload);
    if jsonb_typeof(next_payload) <> 'object' then
      raise exception 'Confirmed review requires a payload.' using errcode = '22023';
    end if;
  else
    next_payload := null;
  end if;

  update public.spreadsheet_candidates
  set review_status = next_status,
      confirmed_payload = next_payload,
      updated_at = clock_timestamp()
  where id = target.id;

  insert into public.spreadsheet_review_events (
    organization_id,
    import_id,
    candidate_id,
    actor_id,
    from_status,
    to_status,
    before_payload,
    after_payload,
    justification
  ) values (
    target.organization_id,
    target.import_id,
    target.id,
    (select auth.uid()),
    target.review_status,
    next_status,
    target.proposed_payload,
    next_payload,
    nullif(btrim(p_justification), '')
  );

  select * into target_import
  from public.spreadsheet_imports
  where id = target.import_id
    and organization_id = target.organization_id
  for update;

  select exists (
    select 1
    from public.spreadsheet_candidates candidate
    where candidate.import_id = target.import_id
      and candidate.organization_id = target.organization_id
      and candidate.review_status = 'proposta'
  ) into has_proposals;

  select
    target_import.alert_count > 0
    or exists (
      select 1
      from public.spreadsheet_candidates candidate
      where candidate.import_id = target.import_id
        and candidate.organization_id = target.organization_id
        and jsonb_array_length(candidate.alerts) > 0
    )
  into has_alerts;

  update public.spreadsheet_imports
  set status = case
    when has_proposals then 'aguardando_revisao'::public.spreadsheet_import_status
    when has_alerts then 'concluida_com_alertas'::public.spreadsheet_import_status
    else 'concluida'::public.spreadsheet_import_status
  end
  where id = target.import_id;

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    target.organization_id,
    (select auth.uid()),
    'review',
    'spreadsheet_candidates',
    target.id::text,
    jsonb_build_object(
      'source', 'review_spreadsheet_candidate',
      'decision', next_status,
      'kind', target.kind
    )
  );

  return target.id;
end;
$$;

create or replace function public.cancel_spreadsheet_import(p_import_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.spreadsheet_imports%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  select * into target
  from public.spreadsheet_imports
  where id = p_import_id
  for update;

  if target.id is null then
    raise exception 'Spreadsheet import not found.' using errcode = 'P0002';
  end if;

  if not private.has_organization_role(
    target.organization_id,
    array['owner', 'admin', 'analyst']::public.organization_role[]
  ) then
    raise exception 'Insufficient role.' using errcode = '42501';
  end if;

  if target.status in ('concluida', 'concluida_com_alertas', 'falhou', 'cancelada') then
    return false;
  end if;

  update public.spreadsheet_imports
  set status = 'cancelada', cancelled_at = now()
  where id = target.id;

  update public.spreadsheet_sheets
  set status = 'cancelada', completed_at = now()
  where import_id = target.id
    and organization_id = target.organization_id
    and status in ('pendente', 'processando');

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    target.organization_id,
    (select auth.uid()),
    'cancel',
    'spreadsheet_imports',
    target.id::text,
    jsonb_build_object('source', 'cancel_spreadsheet_import')
  );

  return true;
end;
$$;

alter table public.spreadsheet_imports enable row level security;
alter table public.spreadsheet_sheets enable row level security;
alter table public.source_cells enable row level security;
alter table public.spreadsheet_candidates enable row level security;
alter table public.coordinate_candidates enable row level security;
alter table public.monitoring_candidates enable row level security;
alter table public.document_pending_item_candidates enable row level security;
alter table public.candidate_evidence enable row level security;
alter table public.spreadsheet_extraction_runs enable row level security;
alter table public.spreadsheet_review_events enable row level security;

create policy "members can read spreadsheet imports"
on public.spreadsheet_imports for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read spreadsheet sheets"
on public.spreadsheet_sheets for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read source cells"
on public.source_cells for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read spreadsheet candidates"
on public.spreadsheet_candidates for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read coordinate candidates"
on public.coordinate_candidates for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read monitoring candidates"
on public.monitoring_candidates for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read document pending candidates"
on public.document_pending_item_candidates for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read candidate evidence"
on public.candidate_evidence for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read spreadsheet extraction runs"
on public.spreadsheet_extraction_runs for select
to authenticated
using (private.is_organization_member(organization_id));

create policy "members can read spreadsheet review events"
on public.spreadsheet_review_events for select
to authenticated
using (private.is_organization_member(organization_id));

revoke all on table
  public.spreadsheet_imports,
  public.spreadsheet_sheets,
  public.source_cells,
  public.spreadsheet_candidates,
  public.coordinate_candidates,
  public.monitoring_candidates,
  public.document_pending_item_candidates,
  public.candidate_evidence,
  public.spreadsheet_extraction_runs,
  public.spreadsheet_review_events
from public, anon, authenticated;

grant select on table
  public.spreadsheet_imports,
  public.spreadsheet_sheets,
  public.source_cells,
  public.spreadsheet_candidates,
  public.coordinate_candidates,
  public.monitoring_candidates,
  public.document_pending_item_candidates,
  public.candidate_evidence,
  public.spreadsheet_extraction_runs,
  public.spreadsheet_review_events
to authenticated;

revoke execute on function public.finalize_spreadsheet_import(uuid, text, text, jsonb)
  from public, anon, authenticated;
revoke execute on function public.claim_next_spreadsheet_sheet(uuid)
  from public, anon, authenticated;
revoke execute on function public.persist_spreadsheet_sheet_extraction(uuid, integer, jsonb)
  from public, anon, authenticated;
revoke execute on function public.review_spreadsheet_candidate(uuid, text, jsonb, text, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.cancel_spreadsheet_import(uuid)
  from public, anon, authenticated;

grant execute on function public.finalize_spreadsheet_import(uuid, text, text, jsonb)
  to authenticated;
grant execute on function public.claim_next_spreadsheet_sheet(uuid)
  to authenticated;
grant execute on function public.persist_spreadsheet_sheet_extraction(uuid, integer, jsonb)
  to authenticated;
grant execute on function public.review_spreadsheet_candidate(uuid, text, jsonb, text, timestamptz)
  to authenticated;
grant execute on function public.cancel_spreadsheet_import(uuid)
  to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spreadsheet-imports',
  'spreadsheet-imports',
  false,
  10485760,
  array[
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "spreadsheet imports can be uploaded by contributors"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'spreadsheet-imports'
  and exists (
    select 1
    from public.spreadsheet_imports spreadsheet_import
    where spreadsheet_import.storage_path = storage.objects.name
      and spreadsheet_import.status = 'recebendo'
      and spreadsheet_import.created_by = (select auth.uid())
      and private.has_organization_role(
        spreadsheet_import.organization_id,
        array['owner', 'admin', 'analyst']::public.organization_role[]
      )
  )
);

create policy "spreadsheet imports can be read by members"
on storage.objects for select
to authenticated
using (
  bucket_id = 'spreadsheet-imports'
  and exists (
    select 1
    from public.spreadsheet_imports spreadsheet_import
    where spreadsheet_import.storage_path = storage.objects.name
      and private.is_organization_member(spreadsheet_import.organization_id)
  )
);

comment on table public.spreadsheet_imports is
  'Private spreadsheet files linked to a licensing process and tenant.';
comment on table public.source_cells is
  'Only source cells needed by candidates or alerts; never a full spreadsheet copy.';
comment on table public.spreadsheet_candidates is
  'Immutable extraction proposals with separate confirmed review payloads.';
comment on table public.spreadsheet_extraction_runs is
  'Per-sheet runs and the single durable AI reservation allowed per ambiguity.';
comment on table public.spreadsheet_review_events is
  'Append-only human review decisions for spreadsheet candidates.';
