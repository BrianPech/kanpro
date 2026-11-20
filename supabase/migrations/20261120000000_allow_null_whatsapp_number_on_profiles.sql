-- Allow nullable whatsapp_number on public.profiles so ARCO account anonymization never violates NOT NULL
ALTER TABLE public.profiles
  ALTER COLUMN whatsapp_number DROP NOT NULL;
