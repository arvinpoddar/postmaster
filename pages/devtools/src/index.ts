try {
  chrome.devtools.panels.create('Postmaster', '/icon-34.png', '/devtools-panel/index.html');
} catch (e) {
  console.error(e);
}
