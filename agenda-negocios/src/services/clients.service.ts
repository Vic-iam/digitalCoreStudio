import { supabase } from "../lib/supabase";
import type { Client } from "../types";

function getClientErrorMessage(error: { code?: string; message?: string } | null) {
	const message = error?.message?.toLowerCase() ?? "";

	if (!error) return "No se pudo guardar el cliente";

	if (error.code === "42P01" || message.includes("does not exist")) {
		return "La tabla de clientes no existe en Supabase. Ejecutá la migración de clientes.";
	}

	if (error.code === "42501" || message.includes("row level security")) {
		return "No tenés permisos para guardar clientes en este negocio.";
	}

	return error.message || "No se pudo guardar el cliente";
}

export async function getClients(businessId: string) {
	const { data, error } = await supabase
		.from("clients")
		.select("*")
		.eq("business_id", businessId)
		.order("name");

	if (error) {
		throw new Error(getClientErrorMessage(error));
	}
	return (data ?? []) as Client[];
}

export async function createClient(client: Omit<Client, "id" | "created_at">) {
	const { data, error } = await supabase
		.from("clients")
		.insert(client)
		.select()
		.single();

	if (error) {
		throw new Error(getClientErrorMessage(error));
	}
	return data as Client;
}
