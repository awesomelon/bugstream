# BugStream

**Privacy-first JavaScript SDK for generating self-contained HTML bug reports**

Screen recordings (rrweb), console logs, network requests, and keyboard events — all captured locally and packaged into a single HTML file. No server required.

## Features

- **DOM Recording** — Pixel-perfect screen recording via rrweb
- **Console Capture** — Logs, warnings, errors with deep serialization
- **Network Capture** — fetch/XHR requests with headers and bodies
- **Keyboard Capture** — Keystroke events with automatic password masking
- **Data Sanitization** — Sensitive fields (passwords, tokens, API keys) auto-masked
- **Self-Contained Reports** — Generated HTML works offline, includes synchronized timeline playback

## Quick Start

### Build

```bash
npm install
npm run build    # TypeScript check + Vite build → dist/bugstream-sdk.js
```

### Usage

```html
<script src="bugstream-sdk.js"></script>
<script>
  const bs = new BugStream({ bufferDuration: 60000 });
  bs.start();
  // ... reproduce bug ...
  bs.generateReport(); // auto-downloads HTML report
</script>
```

## API

| Method | Description |
|--------|-------------|
| `new BugStream(options?)` | Create instance. `options.bufferDuration` sets buffer window (default: 60000ms) |
| `start()` | Start recording (DOM, console, network, keyboard) |
| `stop()` | Stop recording, restore original APIs |
| `generateReport()` | Generate and auto-download self-contained HTML report |
| `getState()` | Get current recording state and buffer statistics |
| `destroy()` | Stop recording and clean up all resources |

## Architecture

SDK runs directly in the page context. Native APIs (console, fetch/XHR, keyboard) are wrapped in-place and restored on stop.

```
BugStream → recorders (API wrapping) → ring buffers (time-based) → report generator
```

- **Ring Buffer**: Time-based circular buffer, evicts entries older than `bufferDuration`
- **Report Pipeline**: Collect buffers → JSON serialize → gzip compress (fflate) → embed in HTML with rrweb-player
- **Sanitization**: Masks sensitive fields in network headers/bodies and console args before buffering

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite build --watch` | File watch + auto-rebuild |
| `build` | `tsc && vite build` | TypeScript check + production build |
| `preview` | `vite preview` | Local preview of build output |

## Dependencies

| Package | Purpose |
|---------|---------|
| [rrweb](https://github.com/rrweb-io/rrweb) | DOM recording |
| [fflate](https://github.com/101arrowz/fflate) | Gzip compression for report data |

## Security

- All processing happens locally in the browser
- No data is transmitted to any server
- Sensitive fields (passwords, tokens, API keys, authorization headers) are automatically masked
- Generated reports are self-contained HTML files

## Docs

- [CONTRIB.md](docs/CONTRIB.md) — Development setup, project structure, contribution workflow
- [RUNBOOK.md](docs/RUNBOOK.md) — Build, deploy, troubleshooting

## License

MIT
