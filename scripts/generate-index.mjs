// scripts/generate-index.mjs
import { writeFileSync, readdirSync } from 'fs';

const staticDir = 'dist/static';

const jsFiles = readdirSync(staticDir).filter(f => f.endsWith('.js'));
const cssFiles = readdirSync(staticDir).filter(f => f.endsWith('.css'));

const appJs = jsFiles.find(f => f.startsWith('app.') && !f.includes('preview'));
const appCss = cssFiles.find(f => f.startsWith('app.'));

if (!appJs || !appCss) {
  console.error('Missing app entry files. Found:', { appJs, appCss });
  console.error('Files in dist/static:');
  console.log(jsFiles);
  console.log(cssFiles);
  process.exit(1);
}

// Runtime config injected into the page
const config = {
  NODE_ENV: process.env.NODE_ENV ?? 'production',
  API_URL: process.env.API_URL ?? '',           // '' = same origin
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID ?? '',
  UPLOAD_LIMIT: process.env.UPLOAD_LIMIT ?? 250000,
  LOGIN_ENABLED: process.env.LOGIN_ENABLED ?? false,
  UI_COLLECTIONS_ENABLED: process.env.UI_COLLECTIONS_ENABLED ?? false,
  EXAMPLES_ENABLED: process.env.EXAMPLES_ENABLED ?? false,
};

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>p5.js Web Editor</title>
  <link rel="stylesheet" href="/static/${appCss}">
  <link rel="icon" href="/favicon.ico">
  <script>window.process = { env: ${JSON.stringify(config)} };</script>
</head>
<body>
  <div id="react-root"></div>
  <script src="/static/${appJs}"></script>
</body>
</html>`;

writeFileSync('dist/index.html', indexHtml);
console.log('✓ Generated dist/index.html');
console.log('  JS:', appJs);
console.log('  CSS:', appCss);