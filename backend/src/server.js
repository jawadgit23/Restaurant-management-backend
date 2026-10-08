const env = require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/database');

async function start() {
  await connectDB();
  console.log('MongoDB connected');
  const server = app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}/api  (${env.nodeEnv})`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
