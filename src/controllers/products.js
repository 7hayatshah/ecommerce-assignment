import { supabaseAdmin } from '../config/supabase.js';

// 3. POST /api/v1/admin/products
export async function createProduct(req, res) {
  const { category_id, name, slug, brand, description, specifications, status } = req.body;

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([{
      category_id,
      name,
      slug,
      brand: brand || 'Generic',
      description,
      specifications: specifications || {},
      status: status || 'draft',
    }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Product slug already exists.' });
    }
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data });
}

// 4. PATCH /api/v1/admin/products/:id
export async function updateProduct(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (updates.status && !['draft', 'published', 'deactivated'].includes(updates.status)) {
    return res.status(400).json({ success: false, error: 'Invalid product status value.' });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ success: false, error: 'Product not found.' });
  }

  return res.status(200).json({ success: true, data });
}

// 5. GET /api/v1/admin/products
export async function listProducts(req, res) {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('products')
    .select('*, categories(name, slug)', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(200).json({
    success: true,
    data,
    meta: { page, limit, total: count },
  });
}