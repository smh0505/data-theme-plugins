# Data Theme Plugins

Monorepo of data-only theme plugins for [Concourse](https://github.com/smh0505/Concourse) - the
"data-only tier" from that project's plugin architecture (Milestone 8.5): a `ThemePlugin` made
entirely of `cssVariables`, no code, no build step on the app side. The manifest file itself
*is* the whole plugin.

## Structure

Each theme lives at `themes/<id>/manifest.json`:

```json
{
  "id": "sakura-theme",
  "name": "Sakura",
  "version": "1.0.0",
  "cssVariables": {
    "--color-base": "#fff5f7",
    "--color-accent": "#ff6f91"
  }
}
```

- `id` must match the folder name exactly, lowercase kebab-case.
- `cssVariables` keys should be a subset of the variables Concourse's default theme
  defines (`--color-base`, `--color-mantle`, `--color-crust`, `--color-text`, `--color-subtext`,
  `--color-surface0`, `--color-surface1`, `--color-accent`, `--color-accent-alt`,
  `--color-danger`, `--color-button-text`, `--color-on-accent`) - any variable you omit falls
  back to the app's own default.
- `version` is plain SemVer: patch for palette tweaks, minor for adding new `cssVariables`
  keys, major for removing/renaming keys a theme previously relied on. Full convention:
  `.claude/CLAUDE.md` (Plugin Versioning) in the main `concourse` repo.

## Adding a theme

1. `mkdir themes/<your-theme-id>` and add a `manifest.json` following the shape above.
2. `bun run validate` locally to check it.
3. Open a PR. Once merged to `main`, CI validates every theme and publishes/updates a GitHub
   Release per theme, tagged with the theme's `id`.

## Installing a published theme

In Concourse's Theme settings tab, paste the release asset URL:

```
https://github.com/<owner>/<repo>/releases/download/<theme-id>/manifest.json
```

The app downloads and caches it locally; re-running install after a theme update re-fetches the
same stable URL (the release tag is reused per theme id, not versioned per release).

## CI

`.github/workflows/release-themes.yml`:

- Validates every `themes/*/manifest.json` (`scripts/validate.mjs`) on every push touching
  `themes/**`.
- On push to `main`, publishes/updates one GitHub Release per theme with its `manifest.json`
  attached as a release asset.
