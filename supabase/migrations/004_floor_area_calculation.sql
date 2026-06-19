alter table public.veiculos drop column if exists volume_m3;
alter table public.veiculos drop column if exists altura_m;
alter table public.veiculos add column if not exists area_m2 numeric generated always as (comprimento_m * largura_m) stored;

alter table public.produtos drop column if exists volume_unitario_m3;
alter table public.produtos drop column if exists altura_cm;
alter table public.produtos add column if not exists area_unitaria_m2 numeric generated always as ((comprimento_cm / 100) * (largura_cm / 100)) stored;

alter table public.simulacoes drop column if exists volume_total_m3;
alter table public.simulacoes add column if not exists area_total_m2 numeric;

alter table public.simulacao_itens drop column if exists volume_total_m3;
alter table public.simulacao_itens add column if not exists area_total_m2 numeric;
