import type { BugStreamReport } from '../shared/types';
import { compressData } from './compression';

export async function generateHtmlReport(report: BugStreamReport): Promise<string> {
  // rrweb events are already plain serializable objects
  // Using native JSON.stringify avoids stack overflow from recursive serialization
  let jsonData: string;
  try {
    jsonData = JSON.stringify(report);
  } catch (e) {
    console.error('[BugStream] Stringify error:', e);
    throw new Error('Failed to serialize report data');
  }

  const compressedData = await compressData(jsonData);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BugStream Report - ${new Date(report.metadata.timestamp).toLocaleString()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-primary: #0f0f0f;
      --bg-secondary: #1a1a1a;
      --bg-tertiary: #252525;
      --text-primary: #ffffff;
      --text-secondary: #a0a0a0;
      --text-muted: #666666;
      --border-color: #333333;
      --accent-blue: #3b82f6;
      --accent-red: #ef4444;
      --accent-yellow: #eab308;
      --accent-green: #22c55e;
      --glass-bg: rgba(255, 255, 255, 0.05);
      --glass-border: rgba(255, 255, 255, 0.1);
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.5;
      overflow: hidden;
    }

    .container {
      display: flex;
      height: 100vh;
      gap: 1px;
      background: var(--border-color);
    }

    .player-section {
      flex: 1;
      min-width: 0;
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
    }

    .panels-section {
      width: 400px;
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--border-color);
    }

    .header {
      padding: 12px 16px;
      background: var(--glass-bg);
      border-bottom: 1px solid var(--glass-border);
      backdrop-filter: blur(10px);
    }

    .header h1 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .header .meta {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .player-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow: hidden;
    }

    .rr-player {
      max-width: 100%;
      max-height: 100%;
    }

    .tabs {
      display: flex;
      border-bottom: 1px solid var(--border-color);
    }

    .tab {
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab.active {
      color: var(--accent-blue);
      border-bottom: 2px solid var(--accent-blue);
    }

    .tab-content {
      flex: 1;
      overflow-y: auto;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 12px;
    }

    .log-entry {
      padding: 6px 12px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .log-entry:hover {
      background: var(--glass-bg);
    }

    .log-entry.log { border-left: 3px solid var(--text-muted); }
    .log-entry.info { border-left: 3px solid var(--accent-blue); }
    .log-entry.warn { border-left: 3px solid var(--accent-yellow); }
    .log-entry.error { border-left: 3px solid var(--accent-red); }
    .log-entry.debug { border-left: 3px solid var(--accent-green); }

    .log-time {
      color: var(--text-muted);
      font-size: 11px;
      flex-shrink: 0;
      min-width: 70px;
    }

    .log-level {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .log-level.log { background: var(--bg-tertiary); color: var(--text-secondary); }
    .log-level.info { background: rgba(59, 130, 246, 0.2); color: var(--accent-blue); }
    .log-level.warn { background: rgba(234, 179, 8, 0.2); color: var(--accent-yellow); }
    .log-level.error { background: rgba(239, 68, 68, 0.2); color: var(--accent-red); }
    .log-level.debug { background: rgba(34, 197, 94, 0.2); color: var(--accent-green); }

    .log-message {
      flex: 1;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--text-primary);
    }

    .network-entry {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color);
    }

    .network-entry:hover {
      background: var(--glass-bg);
    }

    .network-entry.error {
      background: rgba(239, 68, 68, 0.1);
    }

    .network-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .network-method {
      font-weight: 600;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      background: var(--accent-blue);
      color: white;
    }

    .network-method.POST { background: var(--accent-green); }
    .network-method.PUT { background: var(--accent-yellow); color: #000; }
    .network-method.DELETE { background: var(--accent-red); }

    .network-status {
      font-weight: 600;
      font-size: 12px;
    }

    .network-status.success { color: var(--accent-green); }
    .network-status.error { color: var(--accent-red); }

    .network-url {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--text-secondary);
      font-size: 12px;
    }

    .network-time {
      color: var(--text-muted);
      font-size: 11px;
    }

    .network-details {
      margin-top: 8px;
      padding: 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      display: none;
    }

    .network-entry.expanded .network-details {
      display: block;
    }

    .detail-section {
      margin-bottom: 8px;
    }

    .detail-section h4 {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .detail-section pre {
      font-size: 11px;
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--text-primary);
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
      font-size: 14px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-size: 16px;
      color: var(--text-secondary);
    }

    @media (max-width: 900px) {
      .container {
        flex-direction: column;
      }

      .panels-section {
        width: 100%;
        height: 300px;
        border-left: none;
        border-top: 1px solid var(--border-color);
      }
    }
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/rrweb-player@2.0.0-alpha.17/dist/style.css" />
</head>
<body>
  <div id="app" class="loading">Loading BugStream Report...</div>

  <script id="bugstream-data" type="application/json">${compressedData}</script>

  <script type="module">
    import rrwebPlayer from 'https://cdn.jsdelivr.net/npm/rrweb-player@2.0.0-alpha.17/+esm';
    import { strFromU8, gunzip } from 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm';

    async function decompressData(base64) {
      return new Promise((resolve, reject) => {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        gunzip(bytes, (err, decompressed) => {
          if (err) reject(err);
          else resolve(strFromU8(decompressed));
        });
      });
    }

    function formatTime(timestamp, startTime) {
      const elapsed = timestamp - startTime;
      const seconds = Math.floor(elapsed / 1000);
      const ms = elapsed % 1000;
      return \`\${seconds}.\${ms.toString().padStart(3, '0')}s\`;
    }

    function formatArgs(args) {
      return args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' ');
    }

    async function init() {
      const dataEl = document.getElementById('bugstream-data');
      const compressed = dataEl.textContent;
      const json = await decompressData(compressed);
      const report = JSON.parse(json);

      const startTime = report.events.length > 0 ? report.events[0].timestamp : report.metadata.timestamp;

      const app = document.getElementById('app');
      app.className = 'container';
      app.innerHTML = \`
        <div class="player-section">
          <div class="header">
            <h1>BugStream Report</h1>
            <div class="meta">
              <span>\${report.metadata.url}</span> •
              <span>\${new Date(report.metadata.timestamp).toLocaleString()}</span> •
              <span>\${(report.metadata.duration / 1000).toFixed(1)}s</span>
            </div>
          </div>
          <div class="player-wrapper" id="player-container"></div>
        </div>
        <div class="panels-section">
          <div class="tabs">
            <button class="tab active" data-panel="console">Console (\${report.console.length})</button>
            <button class="tab" data-panel="network">Network (\${report.network.length})</button>
          </div>
          <div class="tab-content" id="panel-content"></div>
        </div>
      \`;

      // Initialize player
      if (report.events.length > 0) {
        new rrwebPlayer({
          target: document.getElementById('player-container'),
          props: {
            events: report.events,
            showController: true,
            autoPlay: false,
            speedOption: [1, 2, 4, 8],
          },
        });
      }

      // Tab switching
      const tabs = document.querySelectorAll('.tab');
      const panelContent = document.getElementById('panel-content');

      function renderConsole() {
        if (report.console.length === 0) {
          panelContent.innerHTML = '<div class="empty-state">No console logs captured</div>';
          return;
        }

        panelContent.innerHTML = report.console.map(entry => \`
          <div class="log-entry \${entry.level}">
            <span class="log-time">\${formatTime(entry.timestamp, startTime)}</span>
            <span class="log-level \${entry.level}">\${entry.level}</span>
            <span class="log-message">\${formatArgs(entry.args).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
          </div>
        \`).join('');
      }

      function getUrlPath(url) {
        try {
          return new URL(url).pathname;
        } catch {
          // Handle relative URLs or invalid URLs
          return url.split('?')[0];
        }
      }

      function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }

      function renderNetwork() {
        if (report.network.length === 0) {
          panelContent.innerHTML = '<div class="empty-state">No network requests captured</div>';
          return;
        }

        try {
          panelContent.innerHTML = report.network.map(entry => {
          const isError = entry.status >= 400 || entry.error;
          const statusClass = isError ? 'error' : 'success';

          return \`
            <div class="network-entry \${isError ? 'error' : ''}" onclick="this.classList.toggle('expanded')">
              <div class="network-header">
                <span class="network-method \${entry.method}">\${entry.method}</span>
                <span class="network-status \${statusClass}">\${entry.status || entry.error || 'pending'}</span>
                <span class="network-url" title="\${escapeHtml(entry.url)}">\${escapeHtml(getUrlPath(entry.url))}</span>
                <span class="network-time">\${entry.duration ? entry.duration + 'ms' : ''}</span>
              </div>
              <div class="network-details">
                \${entry.requestHeaders && Object.keys(entry.requestHeaders).length > 0 ? \`
                  <div class="detail-section">
                    <h4>Request Headers</h4>
                    <pre>\${escapeHtml(JSON.stringify(entry.requestHeaders, null, 2))}</pre>
                  </div>
                \` : ''}
                \${entry.requestBody ? \`
                  <div class="detail-section">
                    <h4>Request Body</h4>
                    <pre>\${escapeHtml(entry.requestBody)}</pre>
                  </div>
                \` : ''}
                \${entry.responseHeaders && Object.keys(entry.responseHeaders).length > 0 ? \`
                  <div class="detail-section">
                    <h4>Response Headers</h4>
                    <pre>\${escapeHtml(JSON.stringify(entry.responseHeaders, null, 2))}</pre>
                  </div>
                \` : ''}
                \${entry.responseBody ? \`
                  <div class="detail-section">
                    <h4>Response Body</h4>
                    <pre>\${escapeHtml(entry.responseBody)}</pre>
                  </div>
                \` : ''}
              </div>
            </div>
          \`;
          }).join('');
        } catch (err) {
          console.error('Error rendering network tab:', err);
          panelContent.innerHTML = '<div class="empty-state">Error rendering network data</div>';
        }
      }

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');

          if (tab.dataset.panel === 'console') {
            renderConsole();
          } else {
            renderNetwork();
          }
        });
      });

      // Initial render
      renderConsole();
    }

    init().catch(console.error);
  </script>
</body>
</html>`;

  return html;
}
