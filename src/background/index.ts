import type { Message } from '../shared/types';

async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendMessageToContentScript<T>(message: Message): Promise<T> {
  const tab = await getCurrentTab();
  if (!tab?.id) {
    throw new Error('No active tab found');
  }
  return chrome.tabs.sendMessage(tab.id, message);
}

chrome.runtime.onMessage.addListener(
  (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
    (async () => {
      try {
        switch (message.type) {
          case 'START_RECORDING':
          case 'STOP_RECORDING':
          case 'GET_STATE': {
            const response = await sendMessageToContentScript(message);
            sendResponse(response);
            break;
          }

          case 'GENERATE_REPORT': {
            // Content script handles download directly via Blob URL to avoid
            // stack overflow from sending large htmlContent through Chrome messaging
            const response = await sendMessageToContentScript<{ success: boolean; filename?: string; error?: string }>(message);
            sendResponse(response);
            break;
          }

          default:
            sendResponse({ error: 'Unknown message type' });
        }
      } catch (error) {
        console.error('[BugStream] Background error:', error);
        sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    })();

    return true;
  }
);

console.log('[BugStream] Background service worker loaded');
