import { supabase } from "../lib/supabase";
import type { Business } from "../types";

export type CreateBusinessData = {
  name: string;
  business_type: string;
  phone?: string;
  address?: string;
  primary_color?: string;
};

export async function getMyBusiness() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado");
  }

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Business | null;
}

export async function createBusiness(
  businessData: CreateBusinessData
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No hay un usuario autenticado");
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      name: businessData.name,
      business_type: businessData.business_type,
      phone: businessData.phone || null,
      address: businessData.address || null,
      primary_color: businessData.primary_color || "#19352d",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Business;
}