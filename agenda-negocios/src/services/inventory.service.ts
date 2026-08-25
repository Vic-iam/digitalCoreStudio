import { supabase } from "../lib/supabase";
import type { Product } from "../types";

export async function getProducts(businessId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function createProduct(product: Omit<Product, "id" | "created_at">) {
  const { data, error } = await supabase.from("products").insert(product).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProductStock(id: string, stock: number) {
  const { data, error } = await supabase.from("products").update({ stock }).eq("id", id).select().single();
  if (error) throw error;
  return data as Product;
}

export async function updateProductBySku(businessId: string, sku: string, product: Partial<Omit<Product, "id" | "business_id" | "created_at">>) {
  const { data, error } = await supabase.from("products").update(product).eq("business_id", businessId).eq("sku", sku).select().maybeSingle();
  if (error) throw error;
  return data as Product | null;
}