alter table public.produtos
  add column if not exists altura_cm numeric check (altura_cm > 0);
