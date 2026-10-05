export function validateProductPayload(req, res, next) {
  const { category_id, name, slug, status } = req.body;

  if (!category_id || !name || !slug) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: category_id, name, and slug are required fields.',
    });
  }

  if (status && !['draft', 'published', 'deactivated'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Status must be draft, published, or deactivated.',
    });
  }

  next();
}

export function validateSkuPayload(req, res, next) {
  const { sku_code, price, stock_quantity, size } = req.body;

  if (!sku_code || price === undefined || stock_quantity === undefined || !size) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: sku_code, price, stock_quantity, and size are required.',
    });
  }

  if (price < 0 || stock_quantity < 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Price and stock_quantity cannot be negative.',
    });
  }

  next();
}