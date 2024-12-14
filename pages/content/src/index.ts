let interval: number | null = null;

function removeInterval() {
  if (interval != null) window.clearInterval(interval);
}

interval = setInterval(() => {
  try {
    chrome.runtime.sendMessage({ type: 'PING' });
  } catch {
    removeInterval();
  }
}, 10000);
