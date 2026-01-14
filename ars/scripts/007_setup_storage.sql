-- Create storage bucket for sample packs
insert into storage.buckets (id, name, public)
values ('samplepacks', 'samplepacks', true)
on conflict (id) do nothing;

-- Storage policies for samplepacks bucket
create policy "Anyone can view pack files"
on storage.objects for select
using (bucket_id = 'samplepacks');

create policy "Authenticated users can upload pack files"
on storage.objects for insert
with check (
  bucket_id = 'samplepacks' 
  and auth.role() = 'authenticated'
);

create policy "Users can update their own pack files"
on storage.objects for update
using (
  bucket_id = 'samplepacks' 
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own pack files"
on storage.objects for delete
using (
  bucket_id = 'samplepacks' 
  and auth.uid()::text = (storage.foldername(name))[1]
);
