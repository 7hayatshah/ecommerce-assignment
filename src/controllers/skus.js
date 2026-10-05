import { supabaseAdmin } from '../config/supabase.js';

// 6. POST /api/v1/admin/products/:id/skus
export async function createVariantAndSku(req, res) {
  const { id: product_id } = req.params;
  const { size, condition, sku_code, price, stock_quantity, active } = req.body;

  // Step A: Insert Variant
  const { data: variant, error: variantErr } = await supabaseAdmin
    .from('variants')
    .insert([{
      product_id,
      size,
      condition: condition || 'Brand New',
    }])
    .select()
    .single();

  if (variantErr) {
    return res.status(500).json({ success: false, error: variantErr.message });
  }

  // Step B: Insert SKU referencing newly created variant
  const { data: sku, error: skuErr } = await supabaseAdmin
    .from('skus')
    .insert([{
      variant_id: variant.id,
      sku_code,
      price,
      stock_quantity,
      active: active ?? true,
    }])
    .select()
    .single();

  if (skuErr) {
    if (skuErr.code === '23505') {
      return res.status(409).json({ success: false, error: 'SKU code already exists.' });
    }
    return res.status(500).json({ success: false, error: skuErr.message });
  }

  return res.status(201).json({
    success: true,
    data: { variant, sku },
  });
}

// 7. PATCH /api/v1/admin/skus/:id
export async function updateSku(req, res) {
  const { id } = req.params;
  const { price, stock_quantity, active } = req.body;

  if (price !== undefined && price < 0) {
    return res.status(400).json({ success: false, error: 'Price cannot be negative.' });
  }

  if (stock_quantity !== undefined && stock_quantity < 0) {
    return res.status(400).json({ success: false, error: 'Stock quantity cannot be negative.' });
  }

  const { data, error } = await supabaseAdmin
    .from('skus')
    .update({ price, stock_quantity, active })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  if (!data) {
    return res.status(404).json({ success: false, error: 'SKU record not found.' });
  }

  return res.status(200).json({ success: true, data });
}