-- 07_add_provider_code.sql

-- 1. Create a sequence for provider codes starting at 100
CREATE SEQUENCE IF NOT EXISTS provider_code_seq START 100;

-- 2. Add provider_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_code INTEGER UNIQUE;

-- 3. Populate existing providers
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id FROM public.profiles WHERE role = 'PROVIDER' AND provider_code IS NULL
    LOOP
        UPDATE public.profiles SET provider_code = nextval('provider_code_seq') WHERE id = rec.id;
    END LOOP;
END $$;

-- 4. Create trigger to auto-generate code for new providers
CREATE OR REPLACE FUNCTION public.set_provider_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'PROVIDER' AND NEW.provider_code IS NULL THEN
        NEW.provider_code := nextval('provider_code_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_provider_code ON public.profiles;
CREATE TRIGGER trg_set_provider_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_provider_code();

-- 5. Add sort_order to iptv_servers
ALTER TABLE public.iptv_servers ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;

