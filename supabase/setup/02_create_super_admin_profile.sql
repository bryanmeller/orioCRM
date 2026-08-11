-- 0. Garantir que as colunas existam (caso a tabela já existisse antes do script 1)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portal_access BOOLEAN NOT NULL DEFAULT false;

-- 1. Inserir usuário no Supabase Auth (se não existir)
DO $$ 
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_target_email TEXT := 'admin@streamflixtv.local';
    v_target_password TEXT := 'Admin@123456';
    v_encrypted_pw TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_target_email) THEN
        v_encrypted_pw := crypt(v_target_password, gen_salt('bf'));
        
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
            recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
        ) VALUES (
            v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', v_target_email, v_encrypted_pw, now(), 
            NULL, NULL, '{"provider":"email","providers":["email"]}', '{"full_name":"Super Administrador","username":"superadmin"}', 
            now(), now(), '', '', '', ''
        );
        
        INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_user_id::text, v_user_id, format('{"sub":"%s","email":"%s"}', v_user_id::text, v_target_email)::jsonb, 'email', NULL, now(), now()
        );
    END IF;
END $$;

-- 2. Criar ou atualizar o Profile do Super Admin
DO $$ 
DECLARE
    v_user_id UUID;
    v_target_email TEXT := 'admin@streamflixtv.local';
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
    
    INSERT INTO public.profiles (
        id, full_name, email, username, role, parent_id, business_mode, status, portal_access
    ) VALUES (
        v_user_id, 'Super Administrador', v_target_email, 'superadmin', 'SUPER_ADMIN'::profile_role_enum, NULL, 'SYSTEM'::business_mode_enum, 'ACTIVE'::profile_status_enum, true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        business_mode = EXCLUDED.business_mode,
        portal_access = EXCLUDED.portal_access;
END $$;
