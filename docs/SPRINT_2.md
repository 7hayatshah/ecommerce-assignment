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
* **Reused Entities:** Retained the Sprint 1 user and cart foundation (`cart_items`, `orders`, and `order_items`) referencing `auth.users(id)` to enforce foreign key integrity against future shopper operations.
* **Database & Cloud Stack:** PostgreSQL / Supabase hosted instance managed via online SQL migrations, with Node.js/Express backend execution.
* **Schema Evolution:** Normalized flat product concepts into structured `products`, `variants`, and `skus` tables to support multi-variant thrift inventory items.

---

## 3. ERD and Data Model

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

## 4. Administrative REST API Endpoints

All admin endpoints require `Authorization: Bearer <JWT_TOKEN>` header verification.

| Method | Endpoint | Description | Payload Validation / Rules |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/categories` | Create top-level or child category | Requires `name`, `slug` (unique). |
| `GET` | `/api/v1/admin/categories` | Fetch category hierarchy tree | Returns nested parent-child categories. |
| `POST` | `/api/v1/admin/products` | Create catalog product item | Requires `category_id`, `name`, `slug` (unique). Status restricted to `draft`, `published`, `deactivated`. |
| `PATCH`| `/api/v1/admin/products/:id` | Update product fields/status | Validates status enum values. |
| `GET` | `/api/v1/admin/products` | List all catalog products | Supports pagination parameters (`page`, `limit`). |
| `POST` | `/api/v1/admin/products/:id/skus` | Create product variant and SKU | Requires `size`, `sku_code`, `price` (>= 0), `stock_quantity` (>= 0). |
| `PATCH`| `/api/v1/admin/skus/:id` | Update inventory stock and price | Rejects negative price or stock values. |

## 5. Security & Environment Configuration

* **Bypassing RLS:** Administrative actions perform database writes using the `@supabase/supabase-js` client initialized with `SUPABASE_SERVICE_ROLE_KEY`.
* **Secrets Management:** Credentials are maintained locally in `.env` and loaded at runtime via `--env-file=.env`. `.env` is explicitly ignored by version control via `.gitignore`.
* **Safe Repository Template:** `.env.example` is committed to version control to inform evaluators of required environment variables without exposing sensitive secret keys.

## 6. Seed Data Summary

Seed data (`db/002_seed.sql`) populates realistic test catalog entities modeled after actual thrift catalog inventory (such as Outfitters apparels):
* **Categories:** Root categories (`Men`, `Women`, `Outerwear`) with nested children (`Jackets`, `Sweatshirts`).
* **Products:** Products populated with status flags (`published`) and dynamic JSONB attributes (`material`, `fit`, `care_instructions`).
* **Variants & SKUs:** Product sizes (`S`, `M`, `L`) and conditions (`Brand New`, `Thrifted - Excellent`) paired with unique SKU codes and stock counts in minor units (e.g., PKR integer values).

## 7. Test Strategy, Command, and Automated Execution Results

Automated integration tests were executed using **Jest** and **Supertest** to test authentication guards, payload validation middleware, unique constraint handling, and administrative REST route logic.

### Test Command
```bash
npm test

Execution Output
PS D:\Programing\JavaScript\Ecommerce backend> npm test

> ecommerce-backend@1.0.0 test
> cross-env NODE_ENV=test node --env-file=.env --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --detectOpenHandles

(node:860) ExperimentalWarning: VM Modules is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
 PASS  tests/catalog.test.js
  Sprint 2 Admin Catalog API Test Suite
    Authentication & Authorization Guards
      √ should reject requests without authorization header with 401 Unauthorized (140 ms)
      √ should reject invalid bearer tokens with 401 Unauthorized (23 ms)
    Category Management (/api/v1/admin/categories)
      √ POST /categories should create a new category (417 ms)
      √ GET /categories should return category tree hierarchy (19 ms)
    Product Management (/api/v1/admin/products)
      √ POST /products should create a draft or published product (24 ms)
      √ POST /products should validate required fields (20 ms)
      √ POST /products should reject duplicate product slugs (27 ms)
      √ PATCH /products/:id should update product status (19 ms)
      √ GET /products should return paginated catalog list (22 ms)
    SKU & Inventory Management (/api/v1/admin/skus)
      √ POST /products/:id/skus should create variant and SKU (25 ms)
      √ POST /products/:id/skus should reject negative price or stock values (36 ms)
      √ PATCH /skus/:id should update stock quantity and price (16 ms)

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        2.235 s
Ran all test suites.
