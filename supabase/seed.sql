-- Idempotent demo Staff Members (ADR 0012). Password meets Auth's 6-character minimum.
-- Run after migrate. Turn Auth confirmations OFF in the Supabase project.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  staff record;
  auth_user_id uuid;
  encrypted text;
begin
  for staff in
    select *
    from (
      values
        (
          '11111111-1111-1111-1111-111111111111'::uuid,
          'admin@sadicon.local',
          'Amina Solis',
          'admin'
        ),
        (
          '22222222-2222-2222-2222-222222222222'::uuid,
          'planner@sadicon.local',
          'Priya Tan',
          'planner'
        )
    ) as t(id, email, full_name, staff_role)
  loop
    encrypted := extensions.crypt('demo123', extensions.gen_salt('bf'));
    select id into auth_user_id from auth.users where email = staff.email;

    if auth_user_id is null then
      auth_user_id := staff.id;
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      )
      values (
        '00000000-0000-0000-0000-000000000000',
        auth_user_id,
        'authenticated',
        'authenticated',
        staff.email,
        encrypted,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', staff.full_name),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );
    end if;

    if not exists (
      select 1 from auth.identities
      where auth.identities.user_id = auth_user_id and provider = 'email'
    ) then
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      )
      values (
        gen_random_uuid(),
        auth_user_id,
        jsonb_build_object('sub', auth_user_id::text, 'email', staff.email, 'email_verified', true),
        'email',
        auth_user_id::text,
        now(),
        now(),
        now()
      );
    end if;

    insert into public.profiles (id, email, full_name, role)
    values (auth_user_id, staff.email, staff.full_name, staff.staff_role)
    on conflict (id) do update
      set email = excluded.email,
          full_name = excluded.full_name,
          role = excluded.role,
          is_active = true;
  end loop;
end
$$;

-- Sample Project (synthetic). Hosted DBs can also run this file on its own.
\ir seed_clearwater.sql

