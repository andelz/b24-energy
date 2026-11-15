# B24 Energy

Desktop app for tracking solar (PV) generation and electricity-meter readings,
computing the grid/PV split between two flats sharing a heat pump, and exporting
the result as a PDF report. All data lives in one encrypted vault file
(default `b24-energy.vault`) that you pick with a native dialog; nothing is uploaded.

An Angular app in a [tinyjs](https://tinyjs.app) shell: the system webview
(WebView2 on Windows, WebKit on macOS and Linux) plus a small JavaScript backend
on txiki.js. A Windows build is about 7.6 MB. Moved here from the `dox` monorepo,
where it ran on Electron.

## Layout

```
src/                 Angular app (the page)
  app/services/vault-io.adapter.ts   VaultIO → tiny.api calls
  tiny.d.ts          types for the injected `tiny` global
backend/main.ts      tinyjs backend: vault file dialogs, read/write, last path
tinyjs.json          app id, window, and how to build/serve the page
assets/icon.png      app icon (1024×1024; still the tinyjs placeholder)
www/                 Angular build output (gitignored), shipped by tinyjs
dist/                tinyjs build output (gitignored, emptied on every build)
```

## Prerequisites

- Node.js 20+ and npm
- tinyjs CLI: `irm https://tinyjs.app/install.ps1 | iex` (Windows) or
  `curl -fsSL https://tinyjs.app/install | sh` (macOS/Linux)

## Develop

```sh
npm install
npm run dev            # tinyjs dev: starts ng serve on :4203 and opens the app window
npm start              # Angular only, in a browser (vault calls fail: no backend)
npm run package        # tinyjs build → dist/ (runs the Angular production build first)
npm run typecheck:backend
npm run i18n:extract   # public/i18n/{en,de}.json, including omm-ui strings
```

Changes to `src/` hot-reload; changes to `backend/` restart the backend.
`TINYJS_DEBUG=1 npm run dev` prints every page/backend message.

## How the vault is reached

The page has no file system. `vault-io.adapter.ts` implements `VaultIO` from
`encrypted-storage/local-file-vault` by calling backend functions over `tiny.api`:
`vaultPickNew`, `vaultPickExisting`, `vaultRead`, `vaultWrite`, `vaultExists`,
`vaultGetLastPath`, `vaultSetLastPath`, `vaultClearLastPath`.

- The bridge carries JSON only, so file bytes travel as base64.
- The backend reads or writes a path only after the user picked it in a native
  dialog this session, or when it is the remembered last vault.
- Writes go to `<file>.tmp` first and are renamed over the vault.
- The last vault path is kept in `tiny.store` (`%APPDATA%\app.dox.b24-energy\store.json`
  on Windows). Changing `id` in `tinyjs.json` resets it.

The vault format is unchanged (`B24E0001` magic), so vaults made by the Electron
version still open.

## Things that differ from a browser

The page loads as a real `file://` document. Under that origin Chromium/WebKit
reject `history.replaceState` to any other path, so `src/index.html` has **no
`<base href>`**: with hash routing, `#/…` URLs must resolve against `index.html`
itself. Don't add one back.

## Dependencies from dox

| Package | Source |
|---|---|
| `omm-ui` | `github:andelz/omm-ui-dist#v0.1.2` |
| `encrypted-storage` | `github:andelz/encrypted-storage-dist#v0.1.0`, imported only via `encrypted-storage/local-file-vault` (no Capacitor or cloud code) |

## Shipping

Build on the OS you ship for (`tinyjs build` can't cross-compile):

- Windows: ship the whole `dist/` folder (`b24-energy.exe` + `launcher.exe`).
- macOS: `tinyjs build --dmg`, then `tinyjs notarize`.
- Linux: the `dist/` folder.

`tinyjs publish` produces a zip and manifest for the built-in auto-updater.
