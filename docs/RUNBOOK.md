# BugStream Runbook

## Build & Deploy

### Build

```bash
npm run build    # tsc && vite build
```

Output: `dist/bugstream-sdk.js` (~218KB, ~68KB gzip)

### Build Verification

1. **File exists**: `dist/bugstream-sdk.js` is generated
2. **Size check**: ~200-250KB (uncompressed), ~60-80KB (gzip)
3. **Global variable**: Open browser console and verify `window.BugStream` is a constructor after loading the script
4. **Smoke test**: Open `test.html`, start recording, generate report, verify HTML report opens correctly

### Deploy

Copy `dist/bugstream-sdk.js` to your target environment. Include via script tag:

```html
<script src="bugstream-sdk.js"></script>
```

## Troubleshooting

### TypeScript Compilation Errors

**Symptom**: `npm run build` fails at the `tsc` step.

**Fix**:
- Check `tsconfig.json` — `include` should be `["src/sdk"]`
- Run `npx tsc --noEmit` to see specific errors
- Ensure all imports reference files within `src/sdk/`

### IIFE Bundle Export Issue

**Symptom**: `window.BugStream` is undefined or not a constructor after loading the script.

**Cause**: Named exports in `src/sdk/index.ts` produce a namespace object instead of exposing the class directly.

**Fix**: `src/sdk/index.ts` must use a default export for the BugStream class. The Vite config (`vite.config.ts`) sets `lib.name: 'BugStream'` which maps the default export to `window.BugStream`.

### rrweb Recording Conflicts

**Symptom**: Recording doesn't start, or DOM snapshots are missing/corrupted.

**Cause**: rrwebRecorder uses module-level state — only one BugStream instance can record at a time.

**Fix**:
- Ensure only one `BugStream` instance calls `start()` at a time
- Call `destroy()` on the previous instance before creating a new one

### API Restoration Conflicts

**Symptom**: After `stop()`, console/fetch/XHR behaves unexpectedly. Other libraries that wrap the same APIs may lose their wrappers.

**Cause**: BugStream saves original API references on `start()` and restores them on `stop()`. If another library wraps the same API between start and stop, that library's wrapper gets removed.

**Fix**:
- Initialize BugStream before other API-wrapping libraries
- Or accept that stop/destroy will restore APIs to their state at the time BugStream started

### Large Report Generation Fails

**Symptom**: Report generation throws a stack overflow error.

**Cause**: `String.fromCharCode.apply()` fails on large `Uint8Array`s.

**Fix**: This should not happen with the current implementation (chunked 32KB processing). If it does, check that `src/sdk/generator/compression.ts` uses chunked base64 encoding.

## Rollback

To rollback to a previous version:

1. Restore the previous `dist/bugstream-sdk.js` from version control or backup
2. Replace the deployed file with the restored version
3. Verify with the build verification steps above
