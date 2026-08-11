const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const catchAllAPI = `
  // Catch-all for API to prevent HTML responses
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint da API não encontrado (404)' });
  });
`;

content = content.replace(
  '    app.use(vite.middlewares);',
  catchAllAPI + '\n    app.use(vite.middlewares);'
);

content = content.replace(
  '    const distPath = path.join(process.cwd(), \'dist\');',
  catchAllAPI + '\n    const distPath = path.join(process.cwd(), \'dist\');'
);

const globalErrorHandler = `
  // Global error handler to ensure JSON responses for /api
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
    } else {
      next(err);
    }
  });
`;

content = content.replace(
  '  app.listen(PORT, \'0.0.0.0\', () => {',
  globalErrorHandler + '\n  app.listen(PORT, \'0.0.0.0\', () => {'
);

fs.writeFileSync('server.ts', content);
