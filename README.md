# Linger landing page

A standalone, responsive presentation site for Linger. Light surfaces, vinyl and dot-matrix graphics, and an interactive workspace demonstrate the product with fixed local data. No AI backend, microphone access, account connections, or API keys are required.

## Run locally

With Node.js 20 or later, obtain the unmodified Switzer webfont directly from Fontshare:

```sh
node prepare-fonts.mjs
python3 -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080`. The webfont is excluded from the source repository; its license is in `fonts/Switzer-FFL.txt`.

## Deploy your own copy

```sh
node prepare-fonts.mjs
node build-site.mjs
```

Upload the contents of `_site/` to any static host. Paths are relative, so subdirectory hosting also works. No environment variables or private deployment settings are needed.

For GitHub Pages, select **GitHub Actions** in the repository's Pages settings, then run **Publish Linger** or push to `main`. The included workflow downloads the official webfont, packages only the website assets listed in `site-files.json`, and publishes them.

## Edit

- `index.html`: page structure and copy.
- `review-theme.css` and `typography.css`: shared color and typography system.
- `review-demo.css`, `workspace-*.js`: local workspace demo.
- `product-*.css` / `product-*.js`: context, routines, and voice scenes.
- `dot-system.css` and `review-content.css`: waveform accents and the vinyl video selector.
- `media/`: product videos, artwork and textures.
- `waitlist.html` and `waitlist-config.js`: tester applications and launch settings.

CSS and JavaScript references include cache-version query strings; update them when changing assets. Voice scenes loop within the selected tab, and demo replies are presets. Customer stories and avatars are labeled fictional. The waitlist page opens from the homepage. Applications open when the launch post and collection endpoint are configured.

This repository is the presentation website. For the agent application, see [simplexai-labs/linger](https://github.com/simplexai-labs/linger).

See [NOTICE.md](NOTICE.md) for asset notices.
