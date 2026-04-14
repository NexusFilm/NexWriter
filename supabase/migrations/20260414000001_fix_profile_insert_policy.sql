-- Allow users to insert their own profile (needed for OAuth users where the trigger may not fire)
CREATE POLICY "Users can insert own profile"
  ON sw_user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
