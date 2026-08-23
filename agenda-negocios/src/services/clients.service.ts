import { supabase } from "../lib/supabase";
import type { Client } from "../types";

export async function getClients(businessId: string) {
	const { data, error } = await supabase
		.from("clients")
		.select("*")
		.eq("business_id", businessId)
		.order("name");

	if (error) throw error;
	return (data ?? []) as Client[];
}

export async function createClient(client: Omit<Client, "id" | "created_at">) {
	const { data, error } = await supabase
		.from("clients")
		.insert(client)
		.select()
		.single();

	if (error) throw error;
	return data as Client;
}
