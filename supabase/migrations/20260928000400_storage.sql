-- LeanBox · 004 · Storage bucket for meal photos
-- Public bucket: anyone can fetch images by URL. Only admins may write.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-images',
  'meal-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "meal-images: public read"
  on storage.objects for select
  using (bucket_id = 'meal-images');

create policy "meal-images: admin insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'meal-images' and public.is_admin());

create policy "meal-images: admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'meal-images' and public.is_admin())
  with check (bucket_id = 'meal-images' and public.is_admin());

create policy "meal-images: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'meal-images' and public.is_admin());
