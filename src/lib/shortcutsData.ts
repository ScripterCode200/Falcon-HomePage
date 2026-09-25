export interface Shortcut {
  id: string;
  title: string;
  url: string;
  color?: string;
  customIcon?: string;
  isPinned?: boolean;
}

export const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'sc-1',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    color: '#FF0000',
  },
  {
    id: 'sc-2',
    title: 'GitHub',
    url: 'https://github.com',
    color: '#24292e',
  },
  {
    id: 'sc-3',
    title: 'ChatGPT',
    url: 'https://chatgpt.com',
    color: '#10A37F',
  },
  {
    id: 'sc-4',
    title: 'Reddit',
    url: 'https://www.reddit.com',
    color: '#FF4500',
  },
  {
    id: 'sc-5',
    title: 'Wikipedia',
    url: 'https://www.wikipedia.org',
    color: '#000000',
  },
  {
    id: 'sc-6',
    title: 'X / Twitter',
    url: 'https://twitter.com',
    color: '#1DA1F2',
  },
  {
    id: 'sc-7',
    title: 'Gmail',
    url: 'https://mail.google.com',
    color: '#EA4335',
  },
  {
    id: 'sc-8',
    title: 'Notion',
    url: 'https://www.notion.so',
    color: '#000000',
  },
];

const SHORTCUTS_STORAGE_KEY = 'falcon_custom_shortcuts_v2';

export function getFaviconUrl(urlStr: string): string {
  try {
    let cleanUrl = urlStr.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const domain = new URL(cleanUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return '';
  }
}

export function formatCleanUrl(urlStr: string): string {
  let clean = urlStr.trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean;
}

export function loadSavedShortcuts(): Shortcut[] {
  if (typeof window === 'undefined') return DEFAULT_SHORTCUTS;
  try {
    const saved = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fail gracefully
  }
  return DEFAULT_SHORTCUTS;
}

export function saveShortcutsToStorage(shortcuts: Shortcut[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcuts));
  }
}

// --- Direct Database API calls for Shortcuts ---

export async function fetchShortcutsApi(): Promise<Shortcut[]> {
  try {
    const res = await fetch('/api/shortcuts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.shortcuts) && data.shortcuts.length > 0) {
        saveShortcutsToStorage(data.shortcuts);
        return data.shortcuts;
      }
    }
  } catch (err) {
    console.warn('[fetchShortcutsApi] Network error:', err);
  }
  return loadSavedShortcuts();
}

export async function addShortcutApi(shortcut: Shortcut): Promise<void> {
  try {
    await fetch('/api/shortcuts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shortcut),
    });
  } catch (err) {
    console.warn('[addShortcutApi] Failed to sync to DB:', err);
  }
}

export async function updateShortcutApi(shortcut: Shortcut): Promise<void> {
  try {
    await fetch('/api/shortcuts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shortcut),
    });
  } catch (err) {
    console.warn('[updateShortcutApi] Failed to sync to DB:', err);
  }
}

export async function deleteShortcutApi(id: string): Promise<void> {
  try {
    await fetch(`/api/shortcuts?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[deleteShortcutApi] Failed to delete from DB:', err);
  }
}
