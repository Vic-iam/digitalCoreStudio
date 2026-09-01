import { supabase } from "../lib/supabase";
import type { Professional } from "../types";

export type ProfessionalPosition =
  | "owner"
  | "manager"
  | "professional"
  | "assistant"
  | "receptionist";

function getProfessionalErrorMessage(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  if (!error) return "No se pudo guardar el profesional";

  if (error.code === "42P01" || message.includes("does not exist")) {
    return "La tabla de profesionales no existe en Supabase. Ejecutá la migración de profesionales.";
  }

  if (error.code === "42501" || message.includes("row level security")) {
    return "No tenés permisos para gestionar profesionales en este negocio.";
  }

  return error.message || "No se pudo guardar el profesional";
}

export async function getProfessionals(businessId: string) {
  const { data, error } = await supabase
    .from("professionals")
    .select("*")
    .eq("business_id", businessId)
    .order("name");

  if (error) {
    throw new Error(getProfessionalErrorMessage(error));
  }

  return (data ?? []) as Professional[];
}

export async function createProfessional(
  professional: Omit<Professional, "id" | "created_at">,
) {
  const { data, error } = await supabase
    .from("professionals")
    .insert(professional)
    .select()
    .single();

  if (error) {
    throw new Error(getProfessionalErrorMessage(error));
  }

  return data as Professional;
}

export async function updateProfessional(
  id: string,
  changes: Partial<Pick<Professional, "name" | "email" | "phone" | "position" | "active">>,
) {
  const { data, error } = await supabase
    .from("professionals")
    .update(changes)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(getProfessionalErrorMessage(error));
  }

  return data as Professional;
}

export async function deleteProfessional(id: string) {
  const { error } = await supabase.from("professionals").delete().eq("id", id);

  if (error) {
    throw new Error(getProfessionalErrorMessage(error));
  }
}
