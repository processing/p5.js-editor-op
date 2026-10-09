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

// in generate-index.mjs — replaces the hardcoded config object
const config = { ...process.env };  // whole env, passthrough
delete config.NODE_ENV_IS_DEFAULT;   // nothing sensitive here if .env only holds public client config

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