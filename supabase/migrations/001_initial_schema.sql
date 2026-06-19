create extension if not exists "pgcrypto";

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('fiorino', 'van_furgao', 'van_bau', 'truck', 'carreta', 'vanderleia')),
  capacidade_kg numeric not null check (capacidade_kg > 0),
  comprimento_m numeric not null check (comprimento_m > 0),
  largura_m numeric not null check (largura_m > 0),
  area_m2 numeric generated always as (comprimento_m * largura_m) stored,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('peca', 'palete', 'caixa', 'tambor', 'outro')),
  sku text unique,
  comprimento_cm numeric not null check (comprimento_cm > 0),
  largura_cm numeric not null check (largura_cm > 0),
  area_unitaria_m2 numeric generated always as ((comprimento_cm / 100) * (largura_cm / 100)) stored,
  empilhavel boolean default false,
  limite_empilhamento integer default 1 check (limite_empilhamento >= 1),
  fragil boolean default false,
  obs text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

create table if not exists public.simulacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  status text default 'rascunho' check (status in ('rascunho', 'calculada', 'aprovada')),
  peso_total_kg numeric,
  area_total_m2 numeric,
  resultado_json jsonb,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create table if not exists public.simulacao_itens (
  id uuid primary key default gen_random_uuid(),
  simulacao_id uuid not null references public.simulacoes(id) on delete cascade,
  produto_id uuid references public.produtos(id) on delete set null,
  quantidade integer not null check (quantidade > 0),
  peso_total_kg numeric,
  area_total_m2 numeric
);

alter table public.veiculos enable row level security;
alter table public.produtos enable row level security;
alter table public.simulacoes enable row level security;
alter table public.simulacao_itens enable row level security;

create policy "usuarios autenticados gerenciam veiculos" on public.veiculos for all to authenticated using (true) with check (true);
create policy "usuarios autenticados gerenciam produtos" on public.produtos for all to authenticated using (true) with check (true);
create policy "usuarios autenticados gerenciam simulacoes" on public.simulacoes for all to authenticated using (true) with check (true);
create policy "usuarios autenticados gerenciam itens" on public.simulacao_itens for all to authenticated using (true) with check (true);

create or replace function public.set_atualizado_em() returns trigger language plpgsql as $$
begin new.atualizado_em = now(); return new; end;
$$;

drop trigger if exists simulacoes_set_atualizado_em on public.simulacoes;
create trigger simulacoes_set_atualizado_em before update on public.simulacoes for each row execute function public.set_atualizado_em();
