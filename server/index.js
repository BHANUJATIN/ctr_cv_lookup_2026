import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cvRoutes from './routes/cvRoutes.js';
import { getQueueStats } from './middleware/requestQueue.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Queue stats endpoint
app.get('/api/queue/stats', (req, res) => {
  const stats = getQueueStats();
  res.json({
    success: true,
    queue: stats,
  });
});

// API Routes
app.use('/api/cv', cvRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Queue stats: http://localhost:${PORT}/api/queue/stats`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST http://localhost:${PORT}/api/cv/check - Check CV eligibility`);
  console.log(`  POST http://localhost:${PORT}/api/cv/submit - Submit CV record`);
  console.log(`  GET  http://localhost:${PORT}/api/cv/companies - Get all companies\n`);
});
