import { supabase } from "../lib/supabase";
import type { CashRegisterEntry, PaymentMethod } from "../types";

export async function getCashRegisterEntries(businessId: string, date: string) {
  const { data, error } = await supabase
    .from("cash_register_entries")
    .select("*")
    .eq("business_id", businessId)
    .eq("entry_date", date)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CashRegisterEntry[];
}

export async function createCashRegisterEntry(input: {
  businessId: string;
  date: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  clientName?: string | null;
  clientEmail?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await supabase
    .from("cash_register_entries")
    .insert({
      business_id: input.businessId,
      entry_date: input.date,
      description: input.description,
      amount: input.amount,
      payment_method: input.paymentMethod,
      client_name: input.clientName ?? null,
      client_email: input.clientEmail ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CashRegisterEntry;
}

export async function deleteCashRegisterEntry(id: string) {
  const { error } = await supabase
    .from("cash_register_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getCashRegisterEntriesBetween(
  businessId: string,
  from: string,
  to: string,
) {
  const { data, error } = await supabase
    .from("cash_register_entries")
    .select("*")
    .eq("business_id", businessId)
    .gte("entry_date", from)
    .lte("entry_date", to)
    .order("entry_date")
    .order("created_at");

  if (error) throw error;
  return (data ?? []) as CashRegisterEntry[];
}