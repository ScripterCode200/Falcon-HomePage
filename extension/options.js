const DEFAULT_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('url-input');
  const saveBtn = document.getElementById('save-btn');
  const statusMsg = document.getElementById('status-msg');
  const presetLocal = document.getElementById('preset-local');

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['falcon_url'], (res) => {
      urlInput.value = res.falcon_url || DEFAULT_URL;
    });
  } else {
    urlInput.value = DEFAULT_URL;
  }

  saveBtn.addEventListener('click', () => {
    let val = urlInput.value.trim();
    if (!val) val = DEFAULT_URL;
    if (!val.startsWith('http://') && !val.startsWith('https://')) {
      val = 'https://' + val;
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ falcon_url: val }, () => {
        statusMsg.textContent = 'Settings saved!';
        setTimeout(() => { statusMsg.textContent = ''; }, 2000);
      });
    } else {
      statusMsg.textContent = 'Settings saved locally!';
      setTimeout(() => { statusMsg.textContent = ''; }, 2000);
    }
  });

  presetLocal.addEventListener('click', () => {
    urlInput.value = DEFAULT_URL;
  });
});
