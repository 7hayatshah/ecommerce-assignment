-- SPRINT 2 - THRIFT STORE CATALOG SEED DATA
-- PostgreSQL / Supabase
-- Based on Outfitters Products


-- Clear existing data (in reverse order of foreign keys)
TRUNCATE TABLE order_items, orders, cart_items, assets, skus, variants, products, categories RESTART IDENTITY CASCADE;


-- 1. CATEGORIES (2 Hierarchy Levels)
-- Level 1: Root Categories | Level 2: Subcategories


-- Level 1 Root Categories
INSERT INTO categories (id, parent_id, name, slug, active) VALUES
(1, NULL, 'Outerwear', 'outerwear', TRUE),
(2, NULL, 'Tops', 'tops', TRUE);

-- Level 2 Subcategories
INSERT INTO categories (id, parent_id, name, slug, active) VALUES
(3, 1, 'Jackets & Coats', 'jackets-coats', TRUE),
(4, 2, 'T-Shirts', 't-shirts', TRUE);



-- 2. PRODUCTS (3 Outfitters Products)
-- Statuses: published, draft


INSERT INTO products (id, category_id, name, slug, brand, description, specifications, status) VALUES
-- Product 1: Varsity Suede Jacket F0067 (Published, Multiple Variants)
(1, 3, 'Varsity Suede Jacket', 'varsity-suede-jacket', 'Outfitters', 
 'Add a playful pop of style to your wardrobe with our Varsity Suede Jacket. With a snap button closure, contrast color sleeves, and tipping details on the band, sleeves, and hem, this jacket is the perfect mix of fun and function. (Cool look, easy closure, unique details!)', 
 '{"material": "Faux Suede", "fit": "Regular Fit", "closure": "Snap Button"}'::jsonb, 
 'published'),

-- Product 2:
(2, 4, 'Embroidered Polo Shirt', 'embroidered-polo-shirt', 'Outfitters', 
 'This embroidered polo shirt features polo collar and two-button placket. Short sleeves feature minimal front embroidery for understated style.', 
 '{"material": "100% Cotton", "fit": "Regular Fit"}'::jsonb, 
 'published'),

-- Product 3:
(3, 4, 'Graphic T-Shirt', 'graphic-t-shirt', 'Outfitters', 
 'This classic graphic t-shirt features a bold slogan print on the front, crafted with a comfortable crew neck and short sleeves.', 
 '{"material": "100% Cotton", "fit": "Regular Fit"}'::jsonb, 
 'draft');



-- 3. VARIANTS
-- Represents sizes and condition


INSERT INTO variants (id, product_id, size, condition) VALUES

-- Product 1:
(1, 1, 'Medium', 'Brand New'),
(2, 1, 'Large', 'Brand New'),

-- Product 2:
(3, 2, 'Large', 'Slightly Used'),

-- Product 3: Graphic T-Shirt F1297 (Single Variant)
(4, 3, 'Small', 'Brand New');



-- 4. SKUs (4 Active SKUs + 1 Unavailable Combination)


INSERT INTO skus (id, variant_id, sku_code, price, stock_quantity, active) VALUES
-- SKU 1: Varsity Suede Jacket - Medium (Active, In Stock) - Ref Variant 43832045994175
(1, 1, 'OUTFITTERS-F0067-MED', 8990, 3, TRUE),

-- SKU 2: Varsity Suede Jacket - Large (Active, In Stock)
(2, 2, 'OUTFITTERS-F0067-LRG', 8990, 2, TRUE),

-- SKU 3: Graphic T-Shirt F1375 - Large (Active, In Stock) - Ref Variant 45527484956863
(3, 3, 'OUTFITTERS-F1375-LRG', 2490, 5, TRUE),

-- SKU 4: Graphic T-Shirt F1297 - Small (Active, Draft Item)
(4, 4, 'OUTFITTERS-F1297-SML', 2290, 1, TRUE),

-- SKU 5: Varsity Suede Jacket - Medium (Intentionally Unavailable Combination)
(5, 1, 'OUTFITTERS-F0067-MED-OUTOFSTOCK', 8990, 0, FALSE);



-- 5. ASSETS (Product Image Links)


INSERT INTO assets (product_id, variant_id, storage_key, url, role, alt_text, sort_order) VALUES
(1, 1, 'outfitters/f0067_varsity.jpg', 'https://outfitters.com.pk/cdn/shop/files/F0067-501-1.jpg', 'hero', 'Varsity Suede Jacket Front View', 1),
(2, 3, 'outfitters/f1375_tee.jpg', 'https://outfitters.com.pk/cdn/shop/files/F1375-506-1.jpg', 'hero', 'Graphic T-Shirt F1375 Front View', 1),
(3, 4, 'outfitters/f1297_tee.jpg', 'https://outfitters.com.pk/cdn/shop/files/F1297-506-1.jpg', 'hero', 'Graphic T-Shirt F1297 Front View', 1);



-- RESET SEQUENCES


SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE(MAX(id), 1)) FROM categories;
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(MAX(id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('variants', 'id'), COALESCE(MAX(id), 1)) FROM variants;
SELECT setval(pg_get_serial_sequence('skus', 'id'), COALESCE(MAX(id), 1)) FROM skus;
SELECT setval(pg_get_serial_sequence('assets', 'id'), COALESCE(MAX(id), 1)) FROM assets;
