-- ==============================================
-- ADMIN RLS POLICIES
-- Allows users with role='admin' in profiles to read/write all data
-- ==============================================

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES: admin can read and update all profiles
CREATE POLICY "admin_read_profiles" ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_profiles" ON profiles FOR UPDATE USING (public.is_admin());

-- DOGS: admin can read and update all dogs
CREATE POLICY "admin_read_dogs" ON dogs FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_dogs" ON dogs FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_insert_dogs" ON dogs FOR INSERT WITH CHECK (public.is_admin());

-- KENNELS: admin can read all kennels
CREATE POLICY "admin_read_kennels" ON kennels FOR SELECT USING (public.is_admin());

-- LITTERS: admin can read all litters
CREATE POLICY "admin_read_litters" ON litters FOR SELECT USING (public.is_admin());

-- BREEDS: admin full access
CREATE POLICY "admin_read_breeds" ON breeds FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_breeds" ON breeds FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_breeds" ON breeds FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_breeds" ON breeds FOR DELETE USING (public.is_admin());

-- COLORS: admin full access
CREATE POLICY "admin_read_colors" ON colors FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_colors" ON colors FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_colors" ON colors FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_colors" ON colors FOR DELETE USING (public.is_admin());

-- DEALS: admin can read all deals
CREATE POLICY "admin_read_deals" ON deals FOR SELECT USING (public.is_admin());

-- CONTACTS: admin can read all contacts
CREATE POLICY "admin_read_contacts" ON contacts FOR SELECT USING (public.is_admin());

-- GENES_TRANSACTIONS: admin can read all + insert (for manual adjustments)
CREATE POLICY "admin_read_genes_tx" ON genes_transactions FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_genes_tx" ON genes_transactions FOR INSERT WITH CHECK (public.is_admin());

-- VET_REMINDER_TEMPLATES: admin can CRUD all (including system templates)
CREATE POLICY "admin_read_vet_templates" ON vet_reminder_templates FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_vet_templates" ON vet_reminder_templates FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_vet_templates" ON vet_reminder_templates FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_delete_vet_templates" ON vet_reminder_templates FOR DELETE USING (public.is_admin());

-- VET_REMINDERS: admin can read all
CREATE POLICY "admin_read_vet_reminders" ON vet_reminders FOR SELECT USING (public.is_admin());

-- DOG_PHOTOS: admin can read all
CREATE POLICY "admin_read_dog_photos" ON dog_photos FOR SELECT USING (public.is_admin());

-- EVENTS: admin can read all
CREATE POLICY "admin_read_events" ON events FOR SELECT USING (public.is_admin());

-- NOTIFICATIONS: admin can read and insert all
CREATE POLICY "admin_read_notifications" ON notifications FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_insert_notifications" ON notifications FOR INSERT WITH CHECK (public.is_admin());

-- FAVORITES: admin can read all
CREATE POLICY "admin_read_favorites" ON favorites FOR SELECT USING (public.is_admin());

-- FORM_SUBMISSIONS: admin can read all
CREATE POLICY "admin_read_form_submissions" ON form_submissions FOR SELECT USING (public.is_admin());

-- KENNEL_FORMS: admin can read all
CREATE POLICY "admin_read_kennel_forms" ON kennel_forms FOR SELECT USING (public.is_admin());

-- VET_RECORDS: admin can read all
CREATE POLICY "admin_read_vet_records" ON vet_records FOR SELECT USING (public.is_admin());

-- AWARDS: admin can read all
CREATE POLICY "admin_read_awards" ON awards FOR SELECT USING (public.is_admin());

SELECT 'Admin RLS policies created';
