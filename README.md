# BugStream

**보안 걱정 없는, 개발자를 위한 블랙박스**

Privacy-first Chrome extension that captures screen recordings, console logs, and network requests in a single, self-contained HTML file. No server transmission, no data leaks.

## Features

- **DOM Recording**: Pixel-perfect screen recording using rrweb
- **Console Capture**: Logs, warnings, and errors with stack traces
- **Network Capture**: XHR/Fetch requests with headers and bodies
- **Data Sanitization**: Automatic masking of passwords and sensitive data
- **Offline Viewer**: Generated HTML works without internet
- **Timeline Sync**: Synchronized playback of screen, console, and network

## Installation

### Development

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Development with hot reload
npm run dev
```

### Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `dist` folder

## Usage

1. Click the BugStream icon in your browser toolbar
2. The extension automatically records the last 60 seconds
3. When you encounter a bug, click "Save Report"
4. Open the downloaded HTML file to replay the session

## Architecture

```
bugstream/
├── src/
│   ├── content/          # Content scripts (rrweb, interceptors)
│   ├── background/       # Service worker
│   ├── popup/            # Extension popup UI
│   ├── generator/        # HTML report generator
│   └── shared/           # Types and utilities
└── dist/                 # Built extension
```

## Security

- All processing happens locally in your browser
- No data is transmitted to any server
- Sensitive fields (passwords, tokens) are automatically masked
- Generated reports are self-contained HTML files

## License

MIT
