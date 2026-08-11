import { supabase } from '../../lib/supabase';

export const executeCreditTransaction = async (
  fromId: string | null,
  toId: string | null,
  amount: number,
  type: string,
  description: string,
  licenseId?: string
) => {
  const { data, error } = await supabase.rpc('execute_credit_transaction', {
    p_from_id: fromId,
    p_to_id: toId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_license_id: licenseId || null
  });
  
  if (error) throw new Error(error.message);
  return data;
};
