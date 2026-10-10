// scripts/generate-index.mjs
import { readFileSync, writeFileSync } from 'fs';

// Manifest written by WebpackManifestPlugin during the webpack build
const manifest = JSON.parse(readFileSync('dist/static/manifest.json', 'utf8'));
const appJs = manifest['/app.js'];
const appCss = manifest['/app.css'];

if (!appJs || !appCss) {
  console.error('Missing /app.js or /app.css in manifest.json:', manifest);
  process.exit(1);
}

// Mirrors server/views/index.ts renderIndex() — same keys, same types.
// Booleans stay booleans; unset optionals become undefined, like the server did.
const env = process.env;
const configScript = `
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

const html = `<!DOCTYPE html>
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
    <script>${configScript}</script>
  </head>
  <body>
    <div id="root" class="root-app">
    </div>
    <script src='${appJs}'></script>
  </body>
</html>
`;

writeFileSync('dist/static/index.html', html);
console.log('✓ Generated dist/index.html');
console.log('  JS:', appJs);
console.log('  CSS:', appCss);