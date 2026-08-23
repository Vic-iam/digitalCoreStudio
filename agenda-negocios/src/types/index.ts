export type Business = {
	id: string;
	owner_id: string;
	name: string;
	business_type: string;
	phone: string | null;
	address: string | null;
	logo_url: string | null;
	primary_color: string;
	created_at: string;
};

export type Client = {
	id: string;
	business_id: string;
	name: string;
	phone: string | null;
	email: string | null;
	notes: string | null;
	created_at: string;
};

export type Service = {
	id: string;
	business_id: string;
	name: string;
	description: string | null;
	duration_minutes: number;
	price: number;
	active: boolean;
};

export type Appointment = {
	id: string;
	business_id: string;
	client_id: string;
	service_id: string;
	employee_id: string | null;
	starts_at: string;
	ends_at: string;
	status: "pending" | "confirmed" | "completed" | "cancelled";
	price: number;
	notes: string | null;
	created_at: string;
	client?: Pick<Client, "name" | "phone">;
	service?: Pick<Service, "name" | "duration_minutes" | "price">;
};
