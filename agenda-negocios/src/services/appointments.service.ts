import { supabase } from "../lib/supabase";
import type { Appointment } from "../types";

export async function getAppointments(businessId: string, from: string, to: string) {
	const { data, error } = await supabase
		.from("appointments")
		.select("*, client:clients(name, phone), service:services(name, duration_minutes, price)")
		.eq("business_id", businessId)
		.gte("starts_at", from)
		.lt("starts_at", to)
		.order("starts_at");

	if (error) throw error;
	return (data ?? []) as Appointment[];
}

export async function updateAppointmentStatus(id: string, status: Appointment["status"]) {
	const { data, error } = await supabase
		.from("appointments")
		.update({ status })
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as Appointment;
}
