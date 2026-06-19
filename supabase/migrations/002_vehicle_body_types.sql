alter table public.veiculos drop constraint if exists veiculos_tipo_check;

update public.veiculos set tipo = 'van_furgao' where tipo = 'van';
update public.veiculos set tipo = 'fiorino' where tipo = 'utilitario';

alter table public.veiculos
  add constraint veiculos_tipo_check
  check (tipo in ('fiorino', 'van_furgao', 'van_bau', 'truck', 'carreta', 'vanderleia'));
