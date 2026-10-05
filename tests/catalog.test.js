import request from 'supertest';
import { jest } from '@jest/globals';

// Mock authorization token for admin testing
const MOCK_ADMIN_TOKEN = 'mock-valid-admin-jwt-token';
const AUTH_HEADER = `Bearer ${MOCK_ADMIN_TOKEN}`;

// Mock Supabase client to isolate route testing without altering live database records
jest.unstable_mockModule('../src/config/supabase.js', () => {
  return {
    supabaseAdmin: {
      auth: {
        getUser: jest.fn(async (token) => {
          if (token === 'mock-valid-admin-jwt-token') {
            return { data: { user: { id: 'admin-user-uuid', role: 'authenticated' } }, error: null };
          }
          return { data: { user: null }, error: new Error('Invalid token') };
        }),
      },
      from: jest.fn((table) => {
        // Table specific mock responses
        if (table === 'categories') {
          return {
            insert: jest.fn().mockImplementation((payload) => ({
              select: () => ({
                single: async () => {
                  if (payload[0].slug === 'existing-category-slug') {
                    return { data: null, error: { code: '23505', message: 'Duplicate key error' } };
                  }
                  return { data: { id: 10, ...payload[0] }, error: null };
                },
              }),
            })),
            select: jest.fn().mockReturnValue({
              order: async () => ({
                data: [
                  { id: 1, parent_id: null, name: 'Outerwear', slug: 'outerwear', active: true },
                  { id: 2, parent_id: 1, name: 'Jackets', slug: 'jackets', active: true },
                ],
                error: null,
              }),
            }),
          };
        }

        if (table === 'products') {
          return {
            insert: jest.fn().mockImplementation((payload) => ({
              select: () => ({
                single: async () => {
                  if (payload[0].slug === 'duplicate-slug') {
                    return { data: null, error: { code: '23505', message: 'Duplicate slug constraint violation' } };
                  }
                  return { data: { id: 100, ...payload[0], created_at: new Date().toISOString() }, error: null };
                },
              }),
            })),
            update: jest.fn().mockImplementation((updates) => ({
              eq: (field, val) => ({
                select: () => ({
                  single: async () => {
                    if (val === '999') return { data: null, error: null };
                    return { data: { id: parseInt(val), name: 'Updated Name', ...updates }, error: null };
                  },
                }),
              }),
            })),
            select: jest.fn().mockImplementation(() => ({
              range: () => ({
                order: async () => ({
                  data: [
                    { id: 1, name: 'Varsity Jacket', slug: 'varsity-jacket', status: 'published' },
                  ],
                  error: null,
                  count: 1,
                }),
              }),
            })),
          };
        }

        if (table === 'variants') {
          return {
            insert: jest.fn().mockImplementation((payload) => ({
              select: () => ({
                single: async () => ({
                  data: { id: 50, ...payload[0] },
                  error: null,
                }),
              }),
            })),
          };
        }

        if (table === 'skus') {
          return {
            insert: jest.fn().mockImplementation((payload) => ({
              select: () => ({
                single: async () => {
                  if (payload[0].sku_code === 'DUPLICATE-SKU') {
                    return { data: null, error: { code: '23505', message: 'Duplicate SKU code' } };
                  }
                  return { data: { id: 200, ...payload[0] }, error: null };
                },
              }),
            })),
            update: jest.fn().mockImplementation((updates) => ({
              eq: (field, val) => ({
                select: () => ({
                  single: async () => {
                    if (val === '999') return { data: null, error: null };
                    return { data: { id: parseInt(val), ...updates }, error: null };
                  },
                }),
              }),
            })),
          };
        }

        return {};
      }),
    },
  };
});

const { default: app } = await import('../src/app.js');

describe('Sprint 2 Admin Catalog API Test Suite', () => {
  
  // 1. Authorization Guard
  describe('Authentication & Authorization Guards', () => {
    it('should reject requests without authorization header with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/admin/categories');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid bearer tokens with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // 2. Category Endpoints
  describe('Category Management (/api/v1/admin/categories)', () => {
    it('POST /categories should create a new category', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'Footwear', slug: 'footwear' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Footwear');
    });

    it('GET /categories should return category tree hierarchy', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('Authorization', AUTH_HEADER);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].children).toBeDefined();
    });
  });

  // 3. Product Endpoints
  describe('Product Management (/api/v1/admin/products)', () => {
    it('POST /products should create a draft or published product', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', AUTH_HEADER)
        .send({
          category_id: 1,
          name: 'Varsity Suede Jacket',
          slug: 'varsity-suede-jacket',
          brand: 'Outfitters',
          status: 'published',
          specifications: { material: 'Faux Suede', fit: 'Regular' },
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('varsity-suede-jacket');
    });

    it('POST /products should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', AUTH_HEADER)
        .send({ name: 'Incomplete Product' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /products should reject duplicate product slugs', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products')
        .set('Authorization', AUTH_HEADER)
        .send({
          category_id: 1,
          name: 'Duplicate Item',
          slug: 'duplicate-slug',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /products/:id should update product status', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/products/1')
        .set('Authorization', AUTH_HEADER)
        .send({ status: 'deactivated' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('deactivated');
    });

    it('GET /products should return paginated catalog list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/products?page=1&limit=10')
        .set('Authorization', AUTH_HEADER);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta).toBeDefined();
    });
  });

  // 4. SKU & Variant Endpoints
  describe('SKU & Inventory Management (/api/v1/admin/skus)', () => {
    it('POST /products/:id/skus should create variant and SKU', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', AUTH_HEADER)
        .send({
          size: 'L',
          condition: 'Brand New',
          sku_code: 'OUTFITTERS-SUEDE-LRG',
          price: 8990,
          stock_quantity: 15,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku.sku_code).toBe('OUTFITTERS-SUEDE-LRG');
    });

    it('POST /products/:id/skus should reject negative price or stock values', async () => {
      const res = await request(app)
        .post('/api/v1/admin/products/1/skus')
        .set('Authorization', AUTH_HEADER)
        .send({
          size: 'M',
          sku_code: 'BAD-SKU',
          price: -500,
          stock_quantity: -10,
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /skus/:id should update stock quantity and price', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/skus/1')
        .set('Authorization', AUTH_HEADER)
        .send({ price: 9500, stock_quantity: 20 });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(9500);
    });
  });
});