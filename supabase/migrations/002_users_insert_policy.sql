-- Allow newly signed-up users to insert their own profile row
create policy "Users can insert own profile"
  on users for insert with check (auth.uid() = id);
