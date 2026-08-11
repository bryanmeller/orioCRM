const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const sql = `
    CREATE SEQUENCE IF NOT EXISTS provider_code_seq START 100;

    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider_code INTEGER UNIQUE;

    DO $$
    DECLARE
        rec RECORD;
    BEGIN
        FOR rec IN SELECT id FROM public.profiles WHERE role = 'PROVIDER' AND provider_code IS NULL
        LOOP
            UPDATE public.profiles SET provider_code = nextval('provider_code_seq') WHERE id = rec.id;
        END LOOP;
    END $$;

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
  `;
  
  // Actually we need to execute this SQL, but supabase-js doesn't have a direct way to run raw SQL.
  // Wait, let's create a migration script to be saved and run via API or inform user to run it.
}
