// scripts/generate-index.mjs
import { writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const staticDir = 'dist/static';

// Scan flat directory (not js/css subfolders)
const jsFiles = readdirSync(staticDir).filter(f => f.endsWith('.js'));
const cssFiles = readdirSync(staticDir).filter(f => f.endsWith('.css'));

const appJs = jsFiles.find(f => f.startsWith('app.') && !f.includes('preview'));
const appCss = cssFiles.find(f => f.startsWith('app.'));
const previewJs = jsFiles.find(f => f.startsWith('previewApp.'));

if (!appJs || !appCss) {
  console.error('Missing app entry files. Found:', { appJs, appCss, previewJs });
  console.error('Files in dist/static:');
  console.log(jsFiles);
  console.log(cssFiles);
  process.exit(1);
}

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>p5.js Web Editor</title>
  <link rel="stylesheet" href="/static/${appCss}">
  <link rel="icon" href="/favicon.ico">
</head>
<body>
  <div id="react-root"></div>
  <script src="/static/${appJs}"></script>
  ${previewJs ? `<script src="/static/${previewJs}"></script>` : ''}
</body>
</html>`;

writeFileSync('dist/index.html', indexHtml);
console.log('✓ Generated dist/index.html');
console.log('  JS:', appJs);
console.log('  CSS:', appCss);
if (previewJs) console.log('  Preview JS:', previewJs);
