-- ==============================================================================
-- MIGRATION 00003: SEEDS AND STORAGE
-- Version: 1.0.0
-- Platform: StreamFlix TV SaaS Multi-Tenant
-- ==============================================================================

-- 1. SEED DEFAULT PERMISSIONS
INSERT INTO public.permissions (role, resource, can_read, can_write, can_delete) VALUES
('SUPER_ADMIN', 'ALL', TRUE, TRUE, TRUE),
('PROVEDOR', 'RESELLERS', TRUE, TRUE, TRUE),
('PROVEDOR', 'USERS', TRUE, TRUE, TRUE),
('PROVEDOR', 'LICENSES', TRUE, TRUE, TRUE),
('REVENDA', 'SUBRESELLERS', TRUE, TRUE, TRUE),
('REVENDA', 'USERS', TRUE, TRUE, TRUE),
('REVENDA', 'LICENSES', TRUE, TRUE, TRUE),
('SUBREVENDA', 'USERS', TRUE, TRUE, TRUE),
('SUBREVENDA', 'LICENSES', TRUE, TRUE, TRUE)
ON CONFLICT (role, resource) DO NOTHING;

-- 2. SEED DEFAULT PROVIDER PLANS
INSERT INTO public.provider_plans (name, credits_amount, price_brl, is_active) VALUES
('Starter', 100, 200.00, TRUE),
('Professional', 500, 800.00, TRUE),
('Enterprise', 1000, 1500.00, TRUE)
ON CONFLICT DO NOTHING;

-- 3. SEED PLATFORM SETTINGS
INSERT INTO public.platform_settings (key, value, description) VALUES
('app_version', '{"version": "1.0.0", "build": 1}', 'Versão atual do aplicativo'),
('maintenance_mode', '{"enabled": false}', 'Modo de manutenção da API')
ON CONFLICT (key) DO NOTHING;

-- 4. CREATE STORAGE BUCKETS (Need to insert directly to storage.buckets)
INSERT INTO storage.buckets (id, name, public) VALUES 
('logos', 'logos', TRUE),
('avatars', 'avatars', TRUE),
('uploads', 'uploads', FALSE),
('backups', 'backups', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 5. STORAGE POLICIES
-- Logos (Public read, authenticated write)
CREATE POLICY "Public Access for Logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Auth Insert for Logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- Avatars (Public read, authenticated write)
CREATE POLICY "Public Access for Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth Insert for Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Uploads (Authenticated only)
CREATE POLICY "Auth Access for Uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Auth Insert for Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
