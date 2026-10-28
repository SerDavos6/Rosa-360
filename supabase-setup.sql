-- Da eseguire UNA volta in Supabase: SQL Editor -> New query -> incolla tutto -> Run.

-- 1) Spazio per le immagini (pubblico in lettura, solo gli utenti registrati possono caricare)
insert into storage.buckets (id, name, public)
values ('immagini', 'immagini', true)
on conflict (id) do nothing;

drop policy if exists "immagini upload" on storage.objects;
create policy "immagini upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'immagini');

-- 2) Salvataggio dei gol in una sola chiamata (unisce i nuovi dati a quelli esistenti)
create or replace function public.merge_doc(c text, i text, p jsonb)
returns void
language sql
security invoker
as $$
  insert into public.docs (collection, id, data)
  values (c, i, p)
  on conflict (collection, id)
  do update set data = coalesce(public.docs.data, '{}'::jsonb) || excluded.data;
$$;
