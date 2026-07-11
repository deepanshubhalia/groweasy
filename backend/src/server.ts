import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import importRouter from './routes/import.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend requests
app.use(cors({
  origin: '*', // Open in dev, can restrict later
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liveness probe/health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Import endpoints
app.use('/api', importRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'An unexpected server error occurred.' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 GrowEasy Backend running on http://localhost:${PORT}`);
});
