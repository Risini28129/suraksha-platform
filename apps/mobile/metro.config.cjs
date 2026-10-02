const { getDefaultConfig } = require('expo/metro-config');
const http = require('node:http');
const config = getDefaultConfig(__dirname);
// Same-origin API access for the local browser preview only.
if (process.env.SURAKSHA_WEB_PREVIEW === '1') {
  const enhance = config.server.enhanceMiddleware;
  config.server.enhanceMiddleware = (middleware, server) => {
    const next = enhance ? enhance(middleware, server) : middleware;
    return (req, res, nextHandler) => {
      if (!req.url.startsWith('/v1/')) return next(req, res, nextHandler);
      const proxy = http.request({
        hostname: '127.0.0.1', port: 4001, path: req.url, method: req.method,
        headers: { ...req.headers, host: 'localhost:4001' },
      }, (upstream) => {
        res.writeHead(upstream.statusCode || 502, upstream.headers);
        upstream.pipe(res);
      });
      proxy.on('error', () => {
        if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'Local API is unavailable. Start the API on port 4001.' } }));
      });
      req.pipe(proxy);
    };
  };
}
module.exports = config;
