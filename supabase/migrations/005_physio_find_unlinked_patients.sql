-- Allow physios to find patients not yet linked to any physio
create policy "Physios can find unlinked patients"
  on users for select using (
    role = 'patient' and physio_id is null
  );
