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
  "version": "1.0.1",
  "kind": "theme",
  "cssVariables": {
    "--color-base": "#fff5f7",
    "--color-accent": "#ff6f91"
  }
}
```

- `id` must match the folder name exactly, lowercase kebab-case.
- `kind` must be the literal string `"theme"` - shared with source plugin manifests'
  `{id, name, version, kind, entry}` shape, so Concourse's universal "Add Plugin" UI can tell
  a pasted URL's plugin kind apart from a single field instead of guessing from the presence
  of `cssVariables`. (Themes have no `entry` - `cssVariables` is the whole plugin, there's no
  code to load.)
- `cssVariables` keys should be a subset of the variables Concourse's default theme
  defines (`--color-base`, `--color-mantle`, `--color-crust`, `--color-text`, `--color-subtext`,
  `--color-surface0`, `--color-surface1`, `--color-accent`, `--color-accent-alt`,
  `--color-danger`, `--color-button-text`, `--color-on-accent`) - any variable you omit falls
  back to the app's own default.
- `version` is plain SemVer: patch for palette tweaks, minor for adding new `cssVariables`
  keys, major for removing/renaming keys a theme previously relied on. Full convention:
  [`.claude/CLAUDE.md`](https://github.com/smh0505/Concourse/blob/main/.claude/CLAUDE.md) (Plugin Versioning) in the main [Concourse](https://github.com/smh0505/Concourse) repo.
- `cardVisual` (optional, Milestone 17) - a closed-vocabulary JSON AST overriding GameCard's
  cover-visual region (image-or-placeholder). Still just data, no code - validated by
  Concourse's `validateCardVisualAst` before ever being trusted. See `brick-block-data-theme`
  for a real example.
- `fontFaces` (optional) - real fonts to load via `@font-face`, since `cssVariables` can only
  ever *select* a font by name, never load one. Each entry is `{family, url, weight?, style?}`;
  `url` must be a same-repo, commit-pinned `raw.githubusercontent.com` link (never a third-party
  CDN - unpinnable, unreviewed) and gets strictly validated by Concourse before any CSS text is
  built from it.
- `fonts` (optional) - pure attribution metadata, not consumed by Concourse at all, distinct
  from the functional `fontFaces` above. `{name, author, url, license}` per font actually used,
  crediting the original creator. See `FONTS.md` for the full credits list.

Themes published before `kind` existed still install fine - Concourse's installer defaults a
missing `kind` to `"theme"` when it's absent and `cssVariables` is present, for backward
compatibility with already-published releases.

## Adding a theme

1. `mkdir themes/<your-theme-id>` and add a `manifest.json` following the shape above.
2. `bun run validate` locally to check it.
3. Open a PR. Once merged to `main`, CI validates every theme and publishes/updates the single
   shared `themes` release with all manifests attached.

## Installing a published theme

In Concourse's Theme settings tab (or the universal Add Plugin button), paste the release
asset URL:

```
https://github.com/smh0505/data-theme-plugins/releases/download/themes/<theme-id>.json
```

Currently published themes:

- Midnight Neon: `https://github.com/smh0505/data-theme-plugins/releases/download/themes/midnight-neon-theme.json`
- Sakura: `https://github.com/smh0505/data-theme-plugins/releases/download/themes/sakura-theme.json`
- Brick Block (Data): `https://github.com/smh0505/data-theme-plugins/releases/download/themes/brick-block-data-theme.json`
  - A data-only reduction of Concourse's built-in, `slots`-based Brick Block theme (see that
    project's Milestone 17) - see its own devlog for exactly what's preserved vs. lost in the
    conversion.

The app downloads and caches it locally; re-running install after a theme update re-fetches the
same stable URL (the `themes` release tag is reused across pushes, not versioned per release).

## CI

`.github/workflows/release-themes.yml`:

- Validates every `themes/*/manifest.json` (`scripts/validate.mjs`) on every push touching
  `themes/**`.
- On push to `main`, publishes/updates a single GitHub Release (tag `themes`) with every
  theme's manifest attached as `<theme-id>.json` (renamed from `manifest.json`, since release
  assets need unique filenames within a release).
