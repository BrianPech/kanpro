# Supabase Security & RLS Best Practices
Source: /Users/brianpech/Developer/Commercial/kanpro/.agents/skills/supabase/SKILL.md
Core methodology: Never rely on user_metadata; use TO authenticated + USING/WITH CHECK for RLS; protect SECURITY DEFINER search_path and grant permissions; implement Fail-Closed auth.
