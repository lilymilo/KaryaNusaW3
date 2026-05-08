import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim() || undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

/**
 * Cache of per-token Supabase clients to avoid re-creating a client on every single request.
 * Uses a WeakRef-like Map with a max-size eviction policy to avoid memory leaks.
 */
const clientCache = new Map();
const CLIENT_CACHE_MAX = 50;

export const getAuthClient = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    // No token — return the default anon client
    return supabase;
  }

  // Return cached client if still valid for this token
  if (clientCache.has(token)) {
    return clientCache.get(token);
  }

  // Evict oldest entries if cache is full
  if (clientCache.size >= CLIENT_CACHE_MAX) {
    const firstKey = clientCache.keys().next().value;
    clientCache.delete(firstKey);
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  clientCache.set(token, client);
  return client;
};