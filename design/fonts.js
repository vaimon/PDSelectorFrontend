// Self-hosted Console fonts — Golos Text (sans) + JetBrains Mono (numbers/mono fields).
// Mirrors core-frontend/src/fonts.ts. Import ONCE at app entry (e.g. src/main.jsx: `import './../design/fonts.js'`).
//
// Requires deps (add to package.json, then `npm i`):
//   npm i @fontsource/golos-text @fontsource/jetbrains-mono
//
// This REPLACES the Google Fonts CDN <link> tags currently injected in
// src/components/header/Header.jsx (lines ~8–25) — remove those (152-ФЗ: no client
// requests to fonts.googleapis.com), along with the boxicons/unpkg + jQuery/code.jquery.com
// tags in the same block.

import '@fontsource/golos-text/400.css';
import '@fontsource/golos-text/500.css';
import '@fontsource/golos-text/600.css';
import '@fontsource/golos-text/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
