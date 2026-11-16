# Linger landing page

A responsive, English-language landing page for Linger, with a black and amber design, animated typography, pointer lighting, interactive diagrams, and product videos.

This is a standalone static website built with readable HTML, CSS, and vanilla JavaScript. It has no build step, package dependencies, backend, API keys, or required hosting account. Fonts and media are included locally.

## Run locally

From this folder, start any static HTTP server. For example, with Python 3:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080` in a browser. Use an HTTP server rather than opening the HTML as a local file.

## Deploy your own copy

Upload the contents of this repository to any static web host, preserving the folder structure. The entry point is `index.html`.

- Build command: none.
- Publish directory: the repository root (`.`).
- Runtime environment variables: none.
- Custom domain: configure your own domain in your hosting provider.

Local asset paths are relative, so the page also works when served from a subdirectory. No domain binding, server address, hosting credentials, or deployment automation is included.

## Edit the site

| Files | Purpose |
| --- | --- |
| `index.html` | Page copy, sections, navigation, and inline illustrations |
| `base.css` | Colors, typography, and shared styles |
| Other `*.css` files | Section layouts, responsive rules, and animation styles |
| `main.js`, `product.js` | Navigation, tabs, dialogs, and product interactions |
| `cursor.js` | Desktop pointer trail and local lighting effects |
| `tech-context.js`, `tech-engine.js` | Interactive technical diagrams |
| `media/` | Brand artwork, avatars, posters, and videos |
| `fonts/` | Locally hosted fonts and their licenses |

The accent color is `#FDA947`. Touch devices use their own interaction styles, and animation respects the reduced-motion preference.

CSS and JavaScript references in `index.html` include cache-version query strings. After editing a file, update its `?v=` value or remove the query string while developing.

Product, documentation, and download links lead to Linger's public resources. This repository contains the presentation website, not the Linger agent application. See the [Linger project](https://github.com/simplexai-labs/linger) for the product itself.

## Asset credits

See [NOTICE.md](NOTICE.md) for the bundled product assets and font terms. Keep those notices with redistributed copies.
