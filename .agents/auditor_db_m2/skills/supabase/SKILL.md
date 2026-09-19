---
name: supabase
description: "Use when doing ANY task involving Supabase. Triggers: Supabase products (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues); client libraries and SSR integrations (supabase-js, @supabase/ssr) in Next.js, React, SvelteKit, Astro, Remix; auth issues (login, logout, sessions, JWT, cookies, getSession, getUser, getClaims, RLS); Supabase CLI or MCP server; schema changes, migrations, declarative schemas, security audits, Postgres extensions (pg_graphql, pg_cron, pg_vector)."
metadata:
  author: supabase
  version: "0.1.2"
---

# Supabase Best Practices for Security & Migrations
- Auth & session security: Never use user_metadata claims in JWT-based authorization decisions.
- SECURITY DEFINER functions: Specify search_path = public, pg_temp; ensure explicit revocation of public EXECUTE when needed.
- Trigger functions: Validate data sources, handle nulls/untrusted inputs securely.
