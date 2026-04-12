/**
 * Muat backend/.env sekali saja sebelum modul lain membaca process.env.
 * Menghindari dotenv.config() ganda (mis. di server.js + supabaseClient.js)
 * yang membuat log dotenv tampak "inject" dua kali — bukan karena variabel bertambah.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../../.env');

dotenv.config({ path: envPath });

for (const k of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  const v = process.env[k];
  if (typeof v === 'string') process.env[k] = v.replace(/^\uFEFF/, '').trim();
}
