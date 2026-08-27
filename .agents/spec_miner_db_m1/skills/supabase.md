---
name: supabase
description: "Use when doing ANY task involving Supabase."
---
# Supabase Skill (Local Workspace Copy)
Key Principles:
- Verify against changelog and current docs.
- RLS enabled on all exposed schemas (public).
- Never use user_metadata claims for authorization.
- SECURITY DEFINER functions in public are callable by all roles; use explicit search_path and grant permissions carefully.
- Security Invoker vs Security Definer awareness.
