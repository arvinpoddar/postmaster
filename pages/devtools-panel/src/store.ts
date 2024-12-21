import { parseMessage, type PostMessage } from '@extension/shared';
import type { FilterFunction } from './components/RegexFilter';

type StoreState = {
  messages: PostMessage[];
  paused: boolean;
};

export function createStore(connection: chrome.runtime.Port, { maxMessages = 1000 } = {}) {
  let listeners: (() => void)[] = [];
  let currentState: StoreState = { messages: [], paused: false };
  let filterFunction: FilterFunction | null = null;

  function handleMessage(message: unknown) {
    if (currentState.paused) return;

    const parsedMessage = parseMessage(message);
    if (parsedMessage == null) return;

    if (filterFunction != null && filterFunction(parsedMessage)) return;

    if (currentState.messages.length >= maxMessages) {
      currentState.messages.shift();
    }
    currentState = {
      ...currentState,
      messages: currentState.messages.concat(parsedMessage),
    };
  }

  function subscribe(listener: () => void): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }

  function getSnapshot(): StoreState {
    return currentState;
  }

  function setFilterFunction(fn: FilterFunction | null): void {
    if (filterFunction === fn) return;
    filterFunction = fn;
    listeners.forEach(listener => listener());
  }

  function togglePause(): void {
    currentState = {
      ...currentState,
      paused: !currentState.paused,
    };
    listeners.forEach(listener => listener());
  }

  function clearMessages(): void {
    currentState = {
      ...currentState,
      messages: [],
    };
    listeners.forEach(listener => listener());
  }

  // Listen for messages from the extension
  connection.onMessage.addListener(message => {
    handleMessage(message);
    listeners.forEach(listener => listener());
  });

  return {
    subscribe,
    getSnapshot,
    togglePause,
    clearMessages,
    setFilterFunction,
  };
}
