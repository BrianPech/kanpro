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

      // 2. If user profile does NOT have a role in profiles, resolve role from searchParams or user metadata (defaulting to 'candidate')
      // Security Invariant: Only 'candidate' or 'company' can be assigned via public callback. 'admin' is strictly prohibited.
      if (!role) {
        const metaRole = data.user.user_metadata?.role;
        const assignedRole: "candidate" | "company" =
          searchRole === "company" || searchRole === "candidate"
            ? searchRole
            : metaRole === "company" || metaRole === "candidate"
            ? metaRole
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

        if (assignedRole === "candidate") {
          await supabase.from("candidate_profiles").upsert(
            { id: data.user.id },
            { onConflict: "id" }
          );
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

      if (targetRole === "company") {
        const { count } = await supabase
          .from("company_members")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id);

        if (!count || count === 0) {
          return NextResponse.redirect(
            new URL("/onboarding", requestUrl.origin)
          );
        }
      }

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
