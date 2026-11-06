import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export type BrandProfile = {
  id: string;
  name: string;
  productDetails: string;
  audience: string;
  voice: string;
  isDefault: boolean;
};

const SELECTED_PROFILE_KEY = '@contentforge/selected-brand-profile';

function fromRow(row: { id: string; name: string; product_details: string; audience: string; voice: string; is_default: boolean }): BrandProfile {
  return { id: row.id, name: row.name, productDetails: row.product_details, audience: row.audience, voice: row.voice, isDefault: row.is_default };
}

export async function listBrandProfiles() {
  const { data, error } = await supabase.from('brand_profiles').select('id,name,product_details,audience,voice,is_default').order('is_default', { ascending: false }).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createBrandProfile(input: Omit<BrandProfile, 'id' | 'isDefault'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to create a brand profile.');
  const { data, error } = await supabase.from('brand_profiles').insert({
    user_id: user.id,
    name: input.name.trim(),
    product_details: input.productDetails.trim(),
    audience: input.audience.trim(),
    voice: input.voice.trim(),
    is_default: false,
  }).select('id,name,product_details,audience,voice,is_default').single();
  if (error) throw error;
  return fromRow(data);
}

export async function getSelectedBrandProfileId() {
  return AsyncStorage.getItem(SELECTED_PROFILE_KEY);
}

export async function setSelectedBrandProfileId(id: string) {
  await AsyncStorage.setItem(SELECTED_PROFILE_KEY, id);
}
