import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();
const app = express();

// Proactive Debugging: Check for missing ENV variables
const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
if (missingEnvs.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

// Global Process Event Handlers for Debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/chat', chatRoutes);

// Health check with more info
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: 'supabase',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ error: 'Terjadi kesalahan internal pada server.' });
});

const PORT = process.env.PORT || 5001;

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` KaryaNusa Backend is RUNNING `);
    console.log(` URL: http://localhost:${PORT} `);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
    console.log(`========================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`ERROR: Port ${PORT} is already in use. Please close the other process or change the PORT in .env`);
      process.exit(1);
    } else {
      console.error('SERVER STARTUP ERROR:', err);
    }
  });
}

export default app;