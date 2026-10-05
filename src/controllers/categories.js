import { supabaseAdmin } from '../config/supabase.js';

// 1. POST /api/v1/admin/categories
export async function createCategory(req, res) {
  const { parent_id, name, slug, active } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ success: false, error: 'Category name and slug are required.' });
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert([{ parent_id: parent_id || null, name, slug, active: active ?? true }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Category slug already exists.' });
    }
    return res.status(500).json({ success: false, error: error.message });
  }

  return res.status(201).json({ success: true, data });
}

// 2. GET /api/v1/admin/categories
export async function getCategoryTree(req, res) {
  const { data: categories, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    return res.status(500).json({ success: false, error: error.message });
  }

  // Construct hierarchical tree from flat records
  const rootCategories = categories.filter((c) => c.parent_id === null);
  const tree = rootCategories.map((root) => ({
    ...root,
    children: categories.filter((child) => child.parent_id === root.id),
  }));

  return res.status(200).json({ success: true, data: tree });
}