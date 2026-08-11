import { supabase } from '../../lib/supabase';

export const saveSettings = async (settingsArray: { setting_key: string, setting_value: any }[], userId: string) => {
  const payload = settingsArray.map(s => ({
    ...s,
    updated_by: userId,
    updated_at: new Date().toISOString()
  }));

  const { data, error } = await supabase.from('system_settings')
    .upsert(payload, { onConflict: 'setting_key' })
    .select();
  if (error) throw new Error(error.message);
  return data;
};

export const loadSettings = async () => {
  const { data, error } = await supabase.from('system_settings').select('*');
  if (error) throw new Error(error.message);
  return data;
};
