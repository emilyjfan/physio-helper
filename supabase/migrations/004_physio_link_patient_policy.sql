-- Allow physios to link unlinked patients to themselves
create policy "Physios can link patients to themselves"
  on users for update using (
    role = 'patient' and physio_id is null
  ) with check (
    physio_id = auth.uid()
  );
