# Deploying to Railway

This fork's editor is a **stateless** host for the React SPA — all user, sketch,
and collection data comes from the OpenProcessing API, and authentication
happens in the browser via the OAuth popup flow. There is no database, no
session store, and no object storage to provision. A Railway deployment is
therefore just the Node app itself.

## Architecture

`index.js` starts **two Express servers in one process**:

| Server | Default port | Serves |
| ------ | ------------ | ------ |
| Editor (`server/server.js`) | `8000` | The SPA shell, OAuth callback, redirects |
| Preview (`server/previewServer.js`) | `8002` | Sketch iframes and their assets |

They are deliberately on **separate origins**. That boundary is what sandboxes
running sketches away from the editor's origin — do not collapse them onto one
domain.

## One-time setup

### 1. Create the service

New Project → Deploy from GitHub repo → `msawired/OP-P5`.

### 2. Set the deploy branch

Settings → Source → Branch → **`OP-backend-refactor`**.

> Note: the local branch is named `OP-backend/main`, but it pushes to
> `OP-backend-refactor` on GitHub. Railway lists remote branch names, so
> `OP-backend/main` will not appear in the dropdown. Pick `OP-backend-refactor`.

### 3. Build configuration

Set these by hand in the dashboard. Railway's Config-as-code (`railway.json`)
is deprecated and, as of 2026-08-28, services that have never used it can no
longer opt in — so a committed config file is silently ignored.

| Setting | Value |
| ------- | ----- |
| Build → Builder | `Dockerfile` |
| Build → Dockerfile Path | leave blank (defaults to `./Dockerfile`) |
| Deploy → Healthcheck Path | `/health` |

Railway builds the final stage of the Dockerfile, which is `production`. If the
Builder is left on Railpack, Railway ignores the Dockerfile and auto-detects
instead — which resolves to `npm start`, the **development** command. It runs
nodemon and webpack-dev-middleware, and is not what you want in production.

The `production` stage sets `NODE_ENV=production` itself, and its `CMD` runs
`npm run start:prod`, so no custom start command is needed.

### Serverless

Deploy → Serverless scales the container to zero when idle and queues requests
until it wakes. That trades a cold start on the first request for lower cost.
For a user-facing editor the stall is noticeable; turn it off if the deployment
needs to feel instant, and leave it on to conserve free-plan usage.

### 4. Variables

Settings → Variables. Paste as raw editor content:

```
PORT=8000
PREVIEW_PORT=8002
EDITOR_URL=https://editor.example.org
PREVIEW_URL=https://preview.example.org
CORS_ALLOW_LOCALHOST=false
TRANSLATIONS_ENABLED=true
UPLOAD_LIMIT=250000000
API_URL=https://openprocessing.org/api
OP_404_SKETCH_ID=
EXAMPLES_ENDPOINT=/SableRaph/collections/ZJhMaeLbp96wBz
```

Substitute your real domains for `EDITOR_URL` and `PREVIEW_URL` once step 5
assigns them. `CORS_ALLOW_LOCALHOST` must be `false` in production — leaving it
`true` adds a `/localhost/` regex to the allowed CORS origins.

`API_URL` must be publicly reachable. A local value such as
`https://local.openprocessing.org/api` resolves on your machine but not from
Railway's network, and every API call will fail.

**Do not set `API_TOKEN` on a shared deployment.** When present it overrides the
per-user OAuth flow entirely, and `server/views/index.ts` writes it into the
page as `window.process.env.API_TOKEN`. Anyone who loads the editor can read it.
It exists for self-hosted, single-user, embedded, and CI setups only.

Optional extras this branch supports:

| Variable | Effect |
| -------- | ------ |
| `STATIC_MAX_AGE` | Overrides the `1d` production cache lifetime on static assets |
| `BASIC_USERNAME` / `BASIC_PASSWORD` | HTTP basic-auth gate over the whole editor. Useful for locking down a staging deployment; unrelated to user auth |

### 5. Domains

Both servers run in one container, so this is **one service with two domains**,
each pointed at a different container port.

Settings → Networking → Custom Domain, twice:

| Domain | Target port |
| ------ | ----------- |
| `editor.example.org` | `8000` |
| `preview.example.org` | `8002` |

Then go back and set `EDITOR_URL` and `PREVIEW_URL` to these two URLs. They feed
the CORS allowlist in both servers — if they are wrong or unset, the preview
iframe is blocked and sketches will not run.

## Why `PORT` is set explicitly

Railway injects its own `PORT` when a service does not define one. This app
needs `8000` specifically, because `PREVIEW_PORT` and the two domain port
mappings are pinned around it. Defining `PORT=8000` in the variables takes
precedence over the injected value. Do not remove it.

## Putting Cloudflare in front

Railway and Cloudflare are not either/or. To get Cloudflare's CDN, caching, and
DDoS protection without moving the compute:

1. Add both domains to Cloudflare as a zone.
2. Create `CNAME` records pointing at the Railway-provided targets.
3. Set them to **Proxied** (orange cloud).

Static assets are served with a `1d` cache lifetime, so Cloudflare's edge
absorbs most of the bandwidth. `/locales` is deliberately sent as `no-cache` so
translation updates propagate — leave that alone.

Note that `server/server.js` sets `trust proxy`, so client IPs survive the extra
hop correctly.

## Deploying

Push to `OP-backend-refactor` and Railway rebuilds automatically.

The Docker build runs `npm run build` (webpack client + server bundles) inside
the image, so the first deploy takes several minutes. Watch build logs for
`p5.js Web Editor is running on port: 8000!` and
`p5.js Preview Server is running on port: 8002` — both must appear. Only one
means the process started but half the app is down.

## Trimming the image

`npm run build` emits source maps, which are roughly 64 MB of the ~91 MB
`dist/static` directory. They ship in the production image and are served
publicly. To drop them, set `devtool: false` in `webpack/config.prod.js`, or
delete `dist/static/*.map` in the Dockerfile's `build` stage.
