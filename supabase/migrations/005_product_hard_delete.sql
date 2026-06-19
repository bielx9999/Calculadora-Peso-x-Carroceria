alter table public.simulacao_itens
  drop constraint if exists simulacao_itens_produto_id_fkey;

alter table public.simulacao_itens
  add constraint simulacao_itens_produto_id_fkey
  foreign key (produto_id) references public.produtos(id) on delete set null;
