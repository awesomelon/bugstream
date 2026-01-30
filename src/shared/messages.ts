import type { Message, MessageType } from './types';

export function createMessage<T>(type: MessageType, payload?: T): Message<T> {
  return { type, payload };
}

export function sendMessageToBackground<T, R>(message: Message<T>): Promise<R> {
  return chrome.runtime.sendMessage(message);
}

export function sendMessageToTab<T, R>(tabId: number, message: Message<T>): Promise<R> {
  return chrome.tabs.sendMessage(tabId, message);
}
