// cPanel Passenger loads startup files with require() (CommonJS).
// This loader bootstraps our ES module server (package.json type: module).
import('./server.js').catch((err) => {
  console.error('Failed to start server.js:', err);
  process.exit(1);
});
