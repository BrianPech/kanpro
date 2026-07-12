-- Migration: Remove obsolete text-based salary columns from vacancies table
-- Created at: 2026-07-12T15:15:00-05:00

ALTER TABLE vacancies DROP COLUMN IF EXISTS salary;
ALTER TABLE vacancies DROP COLUMN IF EXISTS salary_range;
