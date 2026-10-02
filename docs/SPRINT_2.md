# Sprint 2 Report: Catalog Data Foundation

**Course:** E-Commerce  
**Department:** Computer Science  
**Institute:** Institute of Mathematics & Computer Science, University of Sindh, Jamshoro  

---

## 1. Sprint Goal and Scope Boundary

### Sprint Goal
Given a product catalog administrator, the system must persist categories, products, variants, and SKUs without losing identity, relationship, price, or inventory meaning.

### In Scope
* Normalized category tree management with stable identifiers, slugs, and parent-child relationships.
* Product creation and editing, supporting `draft`, `published`, and `deactivated` status lifecycle and JSONB dynamic specifications.
* Multi-variant thrift inventory support with unique SKU codes, minor-unit price representation, stock tracking, and availability controls.
* Authenticated admin REST endpoints for categories, products, variants, and SKUs utilizing JWT authorization checks and bypassing RLS via server-side `service_role` credentials.
* Database constraints (`CHECK`, `FOREIGN KEY`, `UNIQUE`), migration scripts (`001_schema.sql`), reproducible seed data (`002_seed.sql`), and automated integration testing.

### Out of Scope
* Front-end drag-and-drop image uploader pipeline (URL strings stored in `assets` table).
* Public catalog search, storefront filtering, shopper cart checkout workflows, payment gateway integration, and shipping integrations (deferred to Sprint 3).

---

## 2. Reuse and Changes from Sprint 1

Sprint 2 builds directly on top of our Sprint 1 architecture:
* **Reused Entities:** Retained the Sprint 1 user and cart foundation (`cart_items`, `orders`, and added `order_items`) referencing `auth.users(id)` to enforce foreign key integrity against future shopper operations.
* **Database & Cloud Stack:** PostgreSQL / Supabase hosted instance managed via online SQL migrations, with Node.js/Express backend execution inside GitHub Codespaces.
* **Schema Evolution:** Normalized flat product concepts into structured `products`, `variants`, and `skus` tables to support multi-variant thrift inventory items.

---

## 3. Updated ERD and Data Dictionary

### Mermaid ER Diagram

```mermaid
erDiagram
    CATEGORIES ||--o{ CATEGORIES : "parent_of"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    PRODUCTS ||--o{ VARIANTS : "has"
    PRODUCTS ||--o{ ASSETS : "displays"
    VARIANTS ||--o{ SKUS : "materializes"
    VARIANTS ||--o{ ASSETS : "displays"
    SKUS ||--o{ CART_ITEMS : "selected_as"
    SKUS ||--o{ ORDER_ITEMS : "sold_as"
    ORDERS ||--o{ ORDER_ITEMS : "contains"

    CATEGORIES {
        bigint id PK
        bigint parent_id FK
        string name
        string slug UK
        boolean active
        timestamptz created_at
    }

    PRODUCTS {
        bigint id PK
        bigint category_id FK
        string name
        string slug UK
        string brand
        text description
        jsonb specifications
        string status
        timestamptz created_at
    }

    VARIANTS {
        bigint id PK
        bigint product_id FK
        string size
        string condition
        timestamptz created_at
    }

    SKUS {
        bigint id PK
        bigint variant_id FK
        string sku_code UK
        integer price
        integer stock_quantity
        boolean active
        timestamptz created_at
    }

    ASSETS {
        bigint id PK
        bigint product_id FK
        bigint variant_id FK
        string storage_key
        string url
        string role
        text alt_text
        integer sort_order
    }

    CART_ITEMS {
        bigint id PK
        uuid user_id FK
        bigint sku_id FK
        integer quantity
    }

    ORDERS {
        bigint id PK
        uuid user_id FK
        integer total_amount
        string order_status
    }

    ORDER_ITEMS {
        bigint id PK
        bigint order_id FK
        bigint sku_id FK
        integer unit_price
        integer quantity
    }
