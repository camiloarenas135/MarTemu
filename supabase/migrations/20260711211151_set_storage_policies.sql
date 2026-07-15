-- ========================================================
-- Row Level Security (RLS) Policies for database tables
-- ========================================================

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_members ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'products' table
DROP POLICY IF EXISTS "Allow public read access" ON products;
CREATE POLICY "Allow public read access" ON products
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow admin write access" ON products;
CREATE POLICY "Allow admin write access" ON products
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('camiloarenas135@gmail.com', 'martemushop@gmail.com'));

-- 2. Policies for 'orders' table
DROP POLICY IF EXISTS "Allow public insert" ON orders;
CREATE POLICY "Allow public insert" ON orders
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin read/write" ON orders;
CREATE POLICY "Allow admin read/write" ON orders
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('camiloarenas135@gmail.com', 'martemushop@gmail.com'));

-- 3. Policies for 'vip_members' table
DROP POLICY IF EXISTS "Allow public insert" ON vip_members;
CREATE POLICY "Allow public insert" ON vip_members
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin read/write" ON vip_members;
CREATE POLICY "Allow admin read/write" ON vip_members
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('camiloarenas135@gmail.com', 'martemushop@gmail.com'));


-- ========================================================
-- Storage Policies for 'product-images' bucket
-- ========================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Allow public read access to product images
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'product-images');

-- 2. Allow upload/modify/delete of product images to authenticated admins only
DROP POLICY IF EXISTS "Admin Write Access" ON storage.objects;
CREATE POLICY "Admin Write Access" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'product-images' 
        AND auth.jwt() ->> 'email' IN ('camiloarenas135@gmail.com', 'martemushop@gmail.com')
    );
