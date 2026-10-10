// scripts/generate-index.mjs
import { readFileSync, writeFileSync } from 'fs';

// Manifest written by WebpackManifestPlugin during the webpack build
const manifest = JSON.parse(readFileSync('dist/static/manifest.json', 'utf8'));
const appJs = manifest['/app.js'];
const appCss = manifest['/app.css'];
const previewAppJs = manifest['/previewApp.js'];
const previewScriptsJs = manifest['/previewScripts.js'];

if (!appJs || !appCss) {
  console.error('Missing /app.js or /app.css in manifest.json:', manifest);
  process.exit(1);
}
if (!previewAppJs || !previewScriptsJs) {
  console.error('Missing preview bundles in manifest.json:', manifest);
  process.exit(1);
}

const env = process.env;

// ---- Main Editor Shell (mirrors server/views/index.ts renderIndex()) ----
const editorConfigScript = `
        if (!window.process) { window.process = {}; }
        if (!window.process.env) { window.process.env = {}; }
        window.process.env.API_URL = '${env.API_URL ?? ''}';
        window.process.env.API_TOKEN = ${env.API_TOKEN ? `'${env.API_TOKEN}'` : 'undefined'};
        window.process.env.NODE_ENV = 'production';
        window.process.env.CLIENT = true;
        window.process.env.LOGIN_ENABLED = ${env.LOGIN_ENABLED !== 'false'};
        window.process.env.EXAMPLES_ENABLED = ${env.EXAMPLES_ENABLED !== 'false'};
        window.process.env.EXAMPLES_ENDPOINT = ${env.EXAMPLES_ENDPOINT ? `'${env.EXAMPLES_ENDPOINT}'` : 'undefined'};
        window.process.env.UI_COLLECTIONS_ENABLED = ${env.UI_COLLECTIONS_ENABLED !== 'false'};
        window.process.env.UPLOAD_LIMIT = ${env.UPLOAD_LIMIT ?? 'undefined'};
        window.process.env.TRANSLATIONS_ENABLED = ${env.TRANSLATIONS_ENABLED === 'true'};
        window.process.env.PREVIEW_URL = '${env.PREVIEW_URL ?? ''}';
        window.process.env.GA_MEASUREMENT_ID = '${env.GA_MEASUREMENT_ID ?? ''}';
`;

const editorHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="keywords" content="p5.js, p5.js web editor, web editor, processing, code editor" />
    <meta name="description" content="A web editor for p5.js, a JavaScript library with the goal of making coding accessible to artists, designers, educators, and beginners." />
    <title>p5.js Web Editor</title>
    <link rel='stylesheet' href='${appCss}' />
    <link href='https://fonts.googleapis.com/css?family=Inconsolata:400,700' rel='stylesheet' type='text/css'>
    <link href='https://fonts.googleapis.com/css?family=Montserrat:400,700' rel='stylesheet' type='text/css'>
    <link rel='shortcut icon' href='/favicon.ico' type='image/x-icon' />
    <script>${editorConfigScript}</script>
  </head>
  <body>
    <div id="root" class="root-app">
    </div>
    <script src='${appJs}'></script>
  </body>
</html>
`;

writeFileSync('dist/static/index.html', editorHtml);
console.log('✓ Generated dist/static/index.html');
console.log('  App JS:', appJs);
console.log('  App CSS:', appCss);

// ---- Preview Shell (mirrors server/views/previewIndex.ts renderPreviewIndex()) ----
const previewConfigScript = `
      if (!window.process) { window.process = {}; }
      if (!window.process.env) { window.process.env = {}; }
      window.process.env.PREVIEW_SCRIPTS_URL = '${previewScriptsJs}';
      window.process.env.EDITOR_URL = '${env.EDITOR_URL ?? ''}';
`;

const previewHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>${previewConfigScript}</script>
  </head>
  <body>
    <div id="root" class="root-app">
    </div>
    <script src='${previewAppJs}'></script>
  </body>
</html>
`;

writeFileSync('dist/static/preview.html', previewHtml);
console.log('✓ Generated dist/static/preview.html');
console.log('  Preview JS:', previewAppJs);
console.log('  Preview Scripts:', previewScriptsJs);