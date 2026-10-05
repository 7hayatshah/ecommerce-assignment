import express from 'express';
import adminRouter from './routes/admin.js';

const app = express();

app.use(express.json());

// Register API Route Namespace
app.use('/api/v1/admin', adminRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error occurred.' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;