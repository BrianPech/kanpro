# Kanpro — Agent Instructions

<!-- BEGIN:nextjs-agent-rules -->
**# This is NOT the Next.js you know**

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Architecture

Kanpro is a SaaS platform built with Next.js App Router, TypeScript, and Supabase.

Before implementing changes:
- Inspect the existing project architecture.
- Reuse established patterns and components.
- Follow the installed Next.js documentation.
- Preserve existing public interfaces and behavior.
- Avoid unnecessary dependencies and large refactors.

## Parallel Agent Development

Multiple coding agents may work on Kanpro simultaneously.

- Work only within the assigned Git branch and worktree.
- Respect module ownership boundaries.
- Never overwrite or revert another agent's changes.
- Avoid unrelated modifications.
- Do not merge into `main` without explicit approval.
- Request approval before changing shared interfaces, dependencies, configuration, or global components.

## Supabase and Security

- Respect existing database schemas and RLS policies.
- Never expose service-role credentials to the browser.
- Validate authorization on the server.
- Create new migrations instead of editing previously applied migrations.
- Do not execute destructive database operations.
- Do not apply migrations to shared or production databases without approval.

## Quality Requirements

- Use strict TypeScript practices.
- Handle errors and loading states.
- Follow existing UI conventions.
- Run relevant tests and static checks.
- Report changes, tests, limitations, and potential integration conflicts.

## Delivery

Before implementing a substantial feature, explain the proposed approach and affected files.

Never assume that a successful build guarantees functional correctness.