import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './server/auth.ts';
import { apiRouter } from './server/api.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Middlewares
  app.use(express.json());
  app.use(authMiddleware as any);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', store: 'GAME ROOM SETIF', timestamp: new Date().toISOString() });
  });

  // Mount API Router
  app.use('/api', apiRouter);

  if (!isProd) {
    // Development mode with Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GAME ROOM SETIF] Serveur démarré sur http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[GAME ROOM SETIF] Erreur fatale au démarrage du serveur:', err);
  process.exit(1);
});
