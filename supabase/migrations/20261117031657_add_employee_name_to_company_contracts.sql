-- Add nullable employee_name column to store collaborator display name
-- on manual or unlinked contracts in public.company_contracts.
ALTER TABLE public.company_contracts
  ADD COLUMN IF NOT EXISTS employee_name text;

-- Backfill existing contracts linked to an active/terminated employee record.
UPDATE public.company_contracts AS c
SET employee_name = e.full_name
FROM public.company_employees AS e
WHERE c.employee_id = e.id
  AND c.employee_name IS NULL
  AND e.full_name IS NOT NULL;
