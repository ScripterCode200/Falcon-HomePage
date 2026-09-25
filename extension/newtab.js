const DEFAULT_URL = 'http://localhost:3000';

function loadFalcon() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(['falcon_url'], (res) => {
      const targetUrl = res.falcon_url || DEFAULT_URL;
      attemptRedirect(targetUrl);
    });
  } else {
    attemptRedirect(DEFAULT_URL);
  }
}

function attemptRedirect(url) {
  const badge = document.getElementById('target-url-badge');
  if (badge) badge.textContent = url;

  // Immediately redirect to Falcon
  window.location.replace(url);

  // If redirect does not unload the page within 1.5s (meaning server is offline/unreachable)
  setTimeout(() => {
    const errorCard = document.getElementById('error-card');
    if (errorCard) {
      errorCard.style.display = 'block';
    }
  }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  loadFalcon();

  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
});
