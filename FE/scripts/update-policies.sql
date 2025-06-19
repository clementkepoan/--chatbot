-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to insert menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to update menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow authenticated users to delete menu items" ON menu_items;

DROP POLICY IF EXISTS "Allow authenticated users to view restaurant details" ON restaurant_details;
DROP POLICY IF EXISTS "Allow authenticated users to insert restaurant details" ON restaurant_details;
DROP POLICY IF EXISTS "Allow authenticated users to update restaurant details" ON restaurant_details;
DROP POLICY IF EXISTS "Allow authenticated users to delete restaurant details" ON restaurant_details;

-- Create new policies that allow service role access
CREATE POLICY "Allow service role full access to menu items" ON menu_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to restaurant details" ON restaurant_details
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: Allow authenticated users to view data (for frontend)
CREATE POLICY "Allow authenticated users to view menu items" ON menu_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view restaurant details" ON restaurant_details
  FOR SELECT USING (auth.role() = 'authenticated');
