import { createRoot } from 'react-dom/client';
import '@src/index.css';
import Panel from '@src/Panel';
import { useSyncExternalStore } from 'react';
import { createStore } from './store';

const backgroundPageConnection = chrome.runtime.connect({ name: 'devToolsPanel' });
const store = createStore(backgroundPageConnection);

function Root() {
  const { messages, paused } = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return (
    <Panel
      messages={messages}
      onClear={() => store.clearMessages()}
      paused={paused}
      onTogglePause={() => store.togglePause()}
      onFilterFunctionChange={filterFunction => store.setFilterFunction(filterFunction)}
    />
  );
}

function initializeApp() {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) {
    throw new Error('Can not find #app-container');
  }
  const root = createRoot(appContainer);

  root.render(<Root />);
}

let interval: number | null = null;

function removeInterval() {
  if (interval != null) {
    window.clearInterval(interval);
  }
}

function initializeTab() {
  try {
    backgroundPageConnection.postMessage({
      type: 'POST_MASTER_INIT',
      tabId: chrome.devtools.inspectedWindow.tabId,
    });

    if (interval != null) removeInterval();

    interval = window.setInterval(() => {
      try {
        backgroundPageConnection.postMessage({ type: 'PING' });
      } catch {
        removeInterval();
      }
    }, 10000);
  } catch (err) {
    console.error(err);
  }
}

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    initializeTab();
  }
});

initializeTab();
initializeApp();
