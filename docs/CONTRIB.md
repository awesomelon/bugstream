# Contributing to BugStream

## Development Environment

### Prerequisites

- Node.js (LTS)
- npm

### Setup

```bash
git clone <repo-url>
cd bugstream
npm install
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite build --watch` | File watch + auto-rebuild |
| `build` | `tsc && vite build` | TypeScript check + production build (`dist/bugstream-sdk.js`) |
| `preview` | `vite preview` | Local preview of build output |

Environment variables: none required. No `.env` file needed.

## Project Structure

```
src/sdk/
  index.ts                  # Entry point, registers window.BugStream
  BugStream.ts              # Main class (start, stop, getState, generateReport, destroy)
  types.ts                  # TypeScript interfaces
  constants.ts              # Buffer duration (60s), body size limits
  buffer/
    ringBuffer.ts           # Time-based circular buffer
  recorders/
    rrwebRecorder.ts        # DOM recording via rrweb
    consoleRecorder.ts      # Console method wrapping
    networkRecorder.ts      # fetch + XHR interception
    keyboardRecorder.ts     # Keyboard event capture
  sanitizer/
    dataSanitizer.ts        # Sensitive data masking
  generator/
    generateReport.ts       # HTML report builder
    compression.ts          # gzip + chunked base64
vite.config.ts              # IIFE library build config
test.html                   # Manual test page
```

## Adding a New Recorder

1. **Types** — Add entry interface to `src/sdk/types.ts`, add field to `BugStreamReport`
2. **Recorder** — Create `src/sdk/recorders/{name}Recorder.ts`
   - Export `startXxxRecording(callback)` — wrap the native API, save originals for restoration
   - Export `stopXxxRecording()` — restore original API references
3. **Wire up** — In `src/sdk/BugStream.ts`:
   - Create a RingBuffer instance
   - Call start/stop in recording lifecycle
   - Include buffer data in `generateReport()` and `getState()`
4. **Report UI** — Add tab button and render function in `src/sdk/generator/generateReport.ts`

## Testing

No automated test suite. Verify changes manually:

1. Build the SDK:
   ```bash
   npm run build
   ```
2. Open `test.html` in a browser (serve it locally or open directly)
3. Use the BugStream controls on the test page to:
   - Start recording
   - Interact with the page (console logs, network requests, keyboard input)
   - Generate a report
4. Open the generated HTML report and verify all captured data displays correctly

## Code Conventions

- TypeScript strict mode
- Each recorder wraps native APIs in-place and restores originals on stop
- Guard flags prevent double-start on recorders
- Time-based ring buffer eviction (not fixed-capacity)
