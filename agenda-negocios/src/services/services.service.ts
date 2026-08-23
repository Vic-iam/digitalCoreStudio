import { supabase } from "../lib/supabase";
import type { Service } from "../types";

export async function getServices(businessId: string) {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) as Service[];
}

export async function createService(service: {
  business_id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  active?: boolean;
}) {
  const { data, error } = await supabase
    .from("services")
    .insert({ ...service, active: service.active ?? true })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Service;
}