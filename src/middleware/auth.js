import { supabaseAdmin } from '../config/supabase.js';

export async function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token bearer.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token session.' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal authentication error.' });
  }
}