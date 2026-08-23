import { supabase } from "../lib/supabase";

export type NewUserData = {
  email: string;
  password: string;
  fullName: string;
};

export type NewBusinessAccountData = NewUserData & {
  businessName: string;
  businessType: string;
  phone?: string;
  address?: string;
};

export async function createBusinessAccount(account: NewBusinessAccountData) {
  const { data, error } = await supabase.functions.invoke("create-business-account", { body: account });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { user: { id: string; email: string }; business: { id: string; name: string } };
}

export async function createManagedUser(userData: NewUserData) {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: userData,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.user as { id: string; email: string };
}
