import { supabase } from "../lib/supabase";

export async function getServices(businessId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

export async function createService(service: {
  business_id: string;
  name: string;
  duration_minutes: number;
  price: number;
}) {
  const { data, error } = await supabase
    .from("services")
    .insert(service)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}