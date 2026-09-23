-- Idempotent sample Project: Clearwater Medical Center (synthetic demo).
-- One statement so `supabase db query --file` can run it on the hosted DB.

do $$
declare
  v_project uuid := 'c1ea7a7e-2024-0008-a000-000000000001';
  v_admin uuid := '11111111-1111-1111-1111-111111111111';
  v_planner uuid := '22222222-2222-2222-2222-222222222222';
  v_boq uuid;
  v_phase_a uuid;
  v_phase_b uuid;
  v_phase_c uuid;
  n_a uuid;
  n_a1 uuid;
  n_a2 uuid;
  n_a3 uuid;
  n_a4 uuid;
  n_b uuid;
  n_b0 uuid;
  n_b1 uuid;
  n_b2 uuid;
  n_b3 uuid;
  n_b4 uuid;
  n_b5 uuid;
  n_c uuid;
  n_cpkg uuid;
begin
  delete from public.projects
  where id = v_project or code = 'PRJ-2024-008';

  insert into public.projects (
    id, code, name, client, site, stage, priority, progress_pct, expenditure, budget,
    currency, start_date, target_end_date, created_by
  ) values (
    v_project,
    'PRJ-2024-008',
    'Clearwater Medical Center',
    'HealthFirst Systems – Plano, TX',
    'Plano, TX / PH delivery team',
    'active',
    1,
    34,
    null,
    395105259,
    'PHP',
    '2026-01-05',
    '2026-12-18',
    case when exists (select 1 from public.profiles where id = v_admin) then v_admin else null end
  );

  insert into public.boqs (project_id, status, title, approved_at, approved_by)
  values (
    v_project,
    'approved',
    'Approved BOQ — Clearwater Medical Center',
    '2026-08-28T00:00:00Z',
    case when exists (select 1 from public.profiles where id = v_admin) then v_admin else null end
  )
  returning id into v_boq;

  insert into public.boq_phases (boq_id, code, name, color_token, sort_order)
  values (v_boq, 'A', 'General Requirements & Preliminaries', 'a', 1)
  returning id into v_phase_a;

  insert into public.boq_phases (boq_id, code, name, color_token, sort_order)
  values (v_boq, 'B', 'Site Works & Earthworks', 'b', 2)
  returning id into v_phase_b;

  insert into public.boq_phases (boq_id, code, name, color_token, sort_order)
  values (v_boq, 'C', 'Concrete Works', 'c', 3)
  returning id into v_phase_c;

  insert into public.boq_lines (phase_id, item_code, description, unit, quantity, rate, amount, sort_order)
  values
    (v_phase_a, 'A.1', 'Mobilization & Demobilization', 'lot', 1, 1835414, 1835414, 1),
    (v_phase_a, 'A.2', 'Temporary Facilities & Site Office', 'lot', 1, 834391, 834391, 2),
    (v_phase_a, 'A.3', 'Project Signage & Safety Barricades', 'lot', 1, 345159, 345159, 3),
    (v_phase_a, 'A.4', 'Project Management & Supervision', 'mo', 18, 601581, 10828458, 4),
    (v_phase_b, 'B.1', 'Site Clearing & Grubbing', 'm²', 9027, 85, 767295, 1),
    (v_phase_b, 'B.2', 'Excavation Works (Bulk)', 'm³', 15176, 320, 4856320, 2),
    (v_phase_b, 'B.3', 'Backfilling & Compaction', 'm³', 4298, 298.61, 1283440, 3),
    (v_phase_b, 'B.4', 'Gravel Fill Bedding (100mm)', 'm³', 1689, 1450, 2449050, 4),
    (v_phase_b, 'B.5', 'Dewatering Works', 'lot', 1, 262930, 262930, 5),
    (v_phase_c, 'C', 'Concrete Works (package aggregate)', 'lot', 1, 135527300, 135527300, 1);

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values (
    v_project, null, v_phase_a, 'phase_root', 'A', 'A – General Requirements & Preliminaries', 0, false, 1
  ) returning id into n_a;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_a, null, 'leaf', 'A.1', 'A.1 Mobilization & Demobilization', 10, false, 1)
  returning id into n_a1;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_a, null, 'leaf', 'A.2', 'A.2 Temporary Facilities', 15, false, 2)
  returning id into n_a2;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_a, null, 'leaf', 'A.3', 'A.3 Signage & Barricades', 5, false, 3)
  returning id into n_a3;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_a, null, 'leaf', 'A.4', 'A.4 Supervision (LOE)', 0, true, 4)
  returning id into n_a4;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values (
    v_project, null, v_phase_b, 'phase_root', 'B', 'B – Site Works & Earthworks', 0, false, 2
  ) returning id into n_b;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_b, null, 'summary', 'B.0', 'B.0 Earthworks package', 0, false, 1)
  returning id into n_b0;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_b0, null, 'leaf', 'B.1', 'B.1 Site Clearing & Grubbing', 12, false, 1)
  returning id into n_b1;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_b0, null, 'leaf', 'B.2', 'B.2 Excavation Works (Bulk)', 45, false, 2)
  returning id into n_b2;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_b0, null, 'leaf', 'B.3', 'B.3 Backfilling & Compaction', 20, false, 3)
  returning id into n_b3;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_b0, null, 'leaf', 'B.4', 'B.4 Gravel Fill Bedding', 10, false, 4)
  returning id into n_b4;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_b0, null, 'leaf', 'B.5', 'B.5 Dewatering Works', 20, false, 5)
  returning id into n_b5;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values (
    v_project, null, v_phase_c, 'phase_root', 'C', 'C – Concrete Works', 0, false, 3
  ) returning id into n_c;

  insert into public.schedule_nodes (
    project_id, parent_id, boq_phase_id, node_kind, wbs_code, name, duration_days, is_loe, sort_order
  ) values
    (v_project, n_c, null, 'leaf', 'C.pkg', 'C Concrete package (aggregate)', 120, false, 1)
  returning id into n_cpkg;

  insert into public.dependencies (project_id, predecessor_id, successor_id, dep_type, lag_days)
  values
    (v_project, n_a1, n_a2, 'FS', 0),
    (v_project, n_a1, n_a3, 'FS', 0),
    (v_project, n_a2, n_b1, 'FS', 0),
    (v_project, n_a3, n_b1, 'FS', 0),
    (v_project, n_b1, n_b2, 'FS', 0),
    (v_project, n_b2, n_b3, 'FS', 0),
    (v_project, n_b3, n_b4, 'FS', 0),
    (v_project, n_b1, n_b5, 'FS', 0),
    (v_project, n_b4, n_cpkg, 'FS', 0),
    (v_project, n_b5, n_cpkg, 'FS', 0);

  insert into public.project_personnel (project_id, staff_id, name, title, start_date)
  values
    (v_project, null, 'Emhil Joseph', 'Project Manager', '2025-11-01'),
    (v_project, null, 'Lara Cruz', 'Site Engineer', '2026-01-15'),
    (v_project, null, 'Marco Dela Peña', 'Safety Officer', '2026-01-15'),
    (v_project, null, 'Nina Santos', 'Quantity Surveyor', '2025-12-01'),
    (v_project, null, 'Owen Reyes', 'Document Controller', '2026-02-01'),
    (
      v_project,
      case when exists (select 1 from public.profiles where id = v_planner) then v_planner else null end,
      'Priya Tan',
      'Scheduler',
      '2026-03-01'
    ),
    (v_project, null, 'Quinn Lim', 'QA/QC', '2026-04-01');

  insert into public.documents (
    project_id, title, storage_path, content_type, byte_size, uploaded_by, created_at
  )
  values
    (
      v_project, 'Structural plans – Rev C', v_project::text || '/structural-plans-rev-c',
      'Engineering', 4200000,
      case when exists (select 1 from public.profiles where id = v_admin) then v_admin else null end,
      '2026-08-12'
    ),
    (
      v_project, 'Building permit BP-8821', v_project::text || '/building-permit-bp-8821',
      'Permit', 890000,
      case when exists (select 1 from public.profiles where id = v_admin) then v_admin else null end,
      '2026-07-02'
    ),
    (
      v_project, 'Safety plan SP-04', v_project::text || '/safety-plan-sp-04',
      'HSE', 1100000,
      case when exists (select 1 from public.profiles where id = v_admin) then v_admin else null end,
      '2026-08-20'
    ),
    (
      v_project, 'Approved BOQ PDF', v_project::text || '/approved-boq-pdf',
      'Commercial', 2400000,
      case when exists (select 1 from public.profiles where id = v_admin) then v_admin else null end,
      '2026-08-28'
    );
end
$$;
