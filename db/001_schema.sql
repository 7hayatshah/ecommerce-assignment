-- SPRINT 2 - THRIFT STORE CATALOG DATABASE
-- PostgreSQL / Supabase

-- 1. CATEGORIES


CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,

    parent_id BIGINT
        REFERENCES categories(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    name VARCHAR(100) NOT NULL,

    slug VARCHAR(120) NOT NULL UNIQUE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A category cannot be its own direct parent
    CONSTRAINT category_not_own_parent
        CHECK (parent_id IS NULL OR parent_id <> id)
);



-- 2. PRODUCTS


CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,

    category_id BIGINT NOT NULL
        REFERENCES categories(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    name VARCHAR(200) NOT NULL,

    slug VARCHAR(220) NOT NULL UNIQUE,

    brand VARCHAR(100),

    description TEXT,

    -- Dynamic Specifications (Section 5 Requirement)
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT product_status_check
        CHECK (status IN ('draft', 'published', 'deactivated'))
);


-- 3. VARIANTS


CREATE TABLE variants (
    id BIGSERIAL PRIMARY KEY,

    product_id BIGINT NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    size VARCHAR(50),

    condition VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT variant_condition_check
        CHECK (
            condition IS NULL
            OR condition IN (
                'Brand New',
                'As Good as New',
                'Slightly Used',
                'Used'
            )
        )
);



-- 4. SKUs


CREATE TABLE skus (
    id BIGSERIAL PRIMARY KEY,

    variant_id BIGINT NOT NULL
        REFERENCES variants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    sku_code VARCHAR(100) NOT NULL UNIQUE,

    price INTEGER NOT NULL,

    stock_quantity INTEGER NOT NULL DEFAULT 0,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sku_price_positive
        CHECK (price >= 0),

    CONSTRAINT sku_stock_non_negative
        CHECK (stock_quantity >= 0)
);



-- 5. ASSETS / PRODUCT IMAGES


CREATE TABLE assets (
    id BIGSERIAL PRIMARY KEY,

    product_id BIGINT
        REFERENCES products(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    variant_id BIGINT
        REFERENCES variants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    storage_key TEXT NOT NULL,

    url TEXT,

    role VARCHAR(30) NOT NULL DEFAULT 'detail',

    alt_text TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT asset_role_check
        CHECK (
            role IN (
                'hero',
                'detail',
                'swatch'
            )
        ),

    CONSTRAINT asset_has_owner
        CHECK (
            product_id IS NOT NULL
            OR variant_id IS NOT NULL
        )
);



-- 6. CART ITEMS
--    Adapted from Sprint 1


CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    sku_id BIGINT NOT NULL
        REFERENCES skus(id)
        ON DELETE RESTRICT,

    quantity INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cart_quantity_positive
        CHECK (quantity > 0)
);



-- 7. ORDERS
--    Adapted from Sprint 1


CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,

    total_amount INTEGER NOT NULL DEFAULT 0,

    order_status VARCHAR(30) NOT NULL DEFAULT 'pending',

    shipping_address TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT order_total_non_negative
        CHECK (total_amount >= 0),

    CONSTRAINT order_status_check
        CHECK (
            order_status IN (
                'pending',
                'paid',
                'processing',
                'shipped',
                'delivered',
                'cancelled'
            )
        )
);



-- 8. ORDER ITEMS


CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL
        REFERENCES orders(id)
        ON DELETE CASCADE,

    sku_id BIGINT NOT NULL
        REFERENCES skus(id)
        ON DELETE RESTRICT,

    quantity INTEGER NOT NULL,

    unit_price INTEGER NOT NULL,

    CONSTRAINT order_item_quantity_positive
        CHECK (quantity > 0),

    CONSTRAINT order_item_price_non_negative
        CHECK (unit_price >= 0)
);



-- INDEXES


CREATE INDEX idx_categories_parent_id
    ON categories(parent_id);

CREATE INDEX idx_products_category_status ON products(category_id, status);
CREATE INDEX idx_skus_active ON skus(active);

CREATE INDEX idx_products_category_id
    ON products(category_id);

CREATE INDEX idx_variants_product_id
    ON variants(product_id);

CREATE INDEX idx_skus_variant_id
    ON skus(variant_id);

CREATE INDEX idx_assets_product_id
    ON assets(product_id);

CREATE INDEX idx_assets_variant_id
    ON assets(variant_id);

CREATE INDEX idx_cart_items_user_id
    ON cart_items(user_id);

CREATE INDEX idx_order_items_order_id
    ON order_items(order_id);

CREATE INDEX idx_orders_user_id
    ON orders(user_id);
