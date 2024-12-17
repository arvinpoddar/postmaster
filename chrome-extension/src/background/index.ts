import 'webextension-polyfill';

const connections = new Map<number, chrome.runtime.Port>();

chrome.runtime.onMessage.addListener((message, sender) => {
  if (sender.tab == null) return;

  if (sender.tab.id) {
    connections.get(sender.tab.id)?.postMessage(message);
  } else {
    console.log('Tab not found in connection list:', sender);
  }
});

chrome.runtime.onConnect.addListener(devToolsConnection => {
  function devToolsMessageListener(message: { type: string; tabId: number }) {
    if (message.type === 'POST_MASTER_INIT') {
      connections.set(message.tabId, devToolsConnection);

      chrome.scripting.executeScript({
        target: { tabId: message.tabId, allFrames: true },
        func: () => {
          const SCRIPT_EXECUTION_MARKER = 'data-postmaster-extension';
          if (window.document.documentElement.getAttribute(SCRIPT_EXECUTION_MARKER) != null) return;
          window.document.documentElement.setAttribute(SCRIPT_EXECUTION_MARKER, '');

          function isValidChromeRuntime(): boolean {
            try {
              return chrome.runtime?.getManifest() != null;
            } catch (err) {
              console.log(err);
              return false;
            }
          }

          function handlePostMessage(event: MessageEvent, meta?: { origin: string }) {
            if (!isValidChromeRuntime()) return;

            if (event.data instanceof MessagePort) {
              event.data.addEventListener('message', m =>
                handlePostMessage(m, {
                  origin: `${event.origin} (MessagePort)`,
                }),
              );
            }

            const messageData = event.data instanceof MessagePort ? '[MessagePort]' : event.data;

            chrome.runtime.sendMessage({
              origin: (event.origin || meta?.origin) ?? 'Unknown',
              destination: window.location.href,
              data: messageData,
              timestamp: event.timeStamp,
              datetime: Date.now(),
            });
          }

          self.addEventListener('message', handlePostMessage);
        },
      });
    } else if (message.type === 'PING') {
      devToolsConnection.postMessage({ type: 'PONG' });
    }
  }

  function cleanupDevToolsMessageListener(disconnectingConnection: chrome.runtime.Port) {
    devToolsConnection.onMessage.removeListener(devToolsMessageListener);

    for (const [tabId, connection] of connections.entries()) {
      if (connection === disconnectingConnection) {
        connections.delete(tabId);
        return;
      }
    }
  }

  devToolsConnection.onMessage.addListener(devToolsMessageListener);
  devToolsConnection.onDisconnect.addListener(cleanupDevToolsMessageListener);
});
