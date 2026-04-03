-- Fix: the original policy caused infinite recursion by subquerying the users table
drop policy "Physios can read their patients" on users;

create policy "Physios can read their patients"
  on users for select using (
    physio_id = auth.uid()
  );
