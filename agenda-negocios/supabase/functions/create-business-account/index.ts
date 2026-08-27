import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Sesión requerida" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminUserId = Deno.env.get("ADMIN_USER_ID");
    if (!serviceRoleKey || !adminUserId)
      return json({ error: "La función no está configurada" }, 500);

    const sessionClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user: adminUser },
    } = await sessionClient.auth.getUser();
    if (!adminUser || adminUser.id !== adminUserId) {
      return json({ error: "No tienes permiso para crear negocios" }, 403);
    }

    const body = await request.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();
    const businessName = String(body.businessName ?? "").trim();
    const businessType = String(body.businessType ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();

    if (
      !email ||
      !password ||
      password.length < 8 ||
      !businessName ||
      !businessType
    ) {
      return json(
        {
          error:
            "Usuario, contraseña, nombre y tipo de negocio son obligatorios",
        },
        400,
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: createdAuth, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
    if (authError || !createdAuth.user)
      return json(
        { error: authError?.message ?? "No se pudo crear el usuario" },
        400,
      );

    const { data: business, error: businessError } = await admin
      .from("businesses")
      .insert({
        owner_id: createdAuth.user.id,
        name: businessName,
        business_type: businessType,
        phone: phone || null,
        address: address || null,
        primary_color: "#19352d",
      })
      .select()
      .single();
    if (businessError || !business) {
      await admin.auth.admin.deleteUser(createdAuth.user.id);
      return json(
        { error: businessError?.message ?? "No se pudo crear el negocio" },
        400,
      );
    }

    const { error: memberError } = await admin.from("business_members").insert({
      business_id: business.id,
      user_id: createdAuth.user.id,
      role: "owner",
    });
    if (memberError) {
      await admin.from("businesses").delete().eq("id", business.id);
      await admin.auth.admin.deleteUser(createdAuth.user.id);
      return json({ error: memberError.message }, 400);
    }

    return json({ user: { id: createdAuth.user.id, email }, business }, 201);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "No se pudo crear la cuenta",
      },
      500,
    );
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
