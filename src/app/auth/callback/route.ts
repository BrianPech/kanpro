import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const searchRole = requestUrl.searchParams.get("role");
  const redirectToParam =
    requestUrl.searchParams.get("redirectTo") ||
    requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // 1. Check if user profile has a role in profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      let role = profile?.role;

      // 2. If user profile does NOT have a role in profiles, set role from searchParams (defaulting to 'candidate')
      if (!role) {
        const assignedRole =
          searchRole === "admin" ||
          searchRole === "company" ||
          searchRole === "candidate"
            ? searchRole
            : "candidate";

        const { error: upsertErr } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email || "",
            full_name:
              (data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                "") as string,
            avatar_url:
              data.user.user_metadata?.avatar_url ||
              data.user.user_metadata?.picture ||
              null,
            whatsapp_number:
              (data.user.user_metadata?.whatsapp_number || "") as string,
            role: assignedRole,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

        if (upsertErr) {
          console.error("Error updating profile role:", upsertErr);
        }

        await supabase.auth.updateUser({
          data: { role: assignedRole },
        });

        role = assignedRole;
      }

      const targetRole =
        role === "admin" || role === "company" || role === "candidate"
          ? role
          : "candidate";

      // 3. If redirectTo is present and valid, redirect directly to redirectTo
      if (redirectToParam) {
        const isValidRelative =
          redirectToParam.startsWith("/") && !redirectToParam.startsWith("//");
        if (isValidRelative) {
          return NextResponse.redirect(
            new URL(redirectToParam, requestUrl.origin)
          );
        }

        try {
          const parsed = new URL(redirectToParam);
          if (parsed.origin === requestUrl.origin) {
            return NextResponse.redirect(parsed);
          }
        } catch {
          // Invalid URL, continue to default role dashboard redirect
        }
      }

      return NextResponse.redirect(
        new URL(`/dashboard/${targetRole}`, requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=auth-callback-failed", requestUrl.origin)
  );
}
