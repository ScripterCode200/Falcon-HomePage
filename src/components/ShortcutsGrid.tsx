'use client';

import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, Copy, ExternalLink, RotateCcw, Check } from 'lucide-react';
import {
  Shortcut,
  DEFAULT_SHORTCUTS,
  loadSavedShortcuts,
  saveShortcutsToStorage,
  getFaviconUrl,
  formatCleanUrl,
} from '@/lib/shortcutsData';
import { sounds } from '@/lib/soundEffects';

import { useAuth } from '@/context/AuthContext';

export const ShortcutsGrid: React.FC = () => {
  const { user, syncCloudData } = useAuth();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user && user.shortcuts && user.shortcuts.length > 0) {
      setShortcuts(user.shortcuts);
    } else {
      setShortcuts(loadSavedShortcuts());
    }
  }, [user]);

  // Close open 3-dots menus when clicking outside
  useEffect(() => {
    const handleOutside = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const openAddModal = () => {
    sounds.playClick();
    setEditingShortcut(null);
    setTitleInput('');
    setUrlInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (sc: Shortcut, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setEditingShortcut(sc);
    setTitleInput(sc.title);
    setUrlInput(sc.url);
    setActiveMenuId(null);
    setIsModalOpen(true);
  };

  const handleDeleteShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const updated = shortcuts.filter((s) => s.id !== id);
    setShortcuts(updated);
    saveShortcutsToStorage(updated);
    syncCloudData(updated);
    setActiveMenuId(null);
  };

  const handleCopyLink = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    setActiveMenuId(null);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !urlInput.trim()) return;

    sounds.playClick();
    const cleanUrl = formatCleanUrl(urlInput);

    let updatedList: Shortcut[] = [];
    if (editingShortcut) {
      // Edit existing
      updatedList = shortcuts.map((s) =>
        s.id === editingShortcut.id
          ? {
              ...s,
              title: titleInput.trim(),
              url: cleanUrl,
            }
          : s
      );
    } else {
      // Add new
      const newShortcut: Shortcut = {
        id: `sc-${Date.now()}`,
        title: titleInput.trim(),
        url: cleanUrl,
      };
      updatedList = [...shortcuts, newShortcut];
    }

    setShortcuts(updatedList);
    saveShortcutsToStorage(updatedList);
    syncCloudData(updatedList);
    setIsModalOpen(false);
  };

  const handleResetDefaults = () => {
    sounds.playClick();
    if (confirm('Reset all shortcuts back to default Google Chrome set?')) {
      setShortcuts(DEFAULT_SHORTCUTS);
      saveShortcutsToStorage(DEFAULT_SHORTCUTS);
    }
  };

  const handleImageError = (id: string) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="shortcuts-section" aria-label="Web Shortcuts">
      <div className="shortcuts-grid">
        {shortcuts.map((sc) => {
          const favicon = getFaviconUrl(sc.url);
          const hasImageError = imageErrorMap[sc.id];

          return (
            <div key={sc.id} className="shortcut-tile-container" style={{ position: 'relative' }}>
              <a
                href={sc.url}
                className="shortcut-tile"
                title={`${sc.title} - ${sc.url}`}
                onClick={() => sounds.playClick()}
              >
                <div className="shortcut-icon-circle">
                  {favicon && !hasImageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={favicon}
                      alt={sc.title}
                      className="shortcut-favicon"
                      onError={() => handleImageError(sc.id)}
                      loading="lazy"
                    />
                  ) : (
                    <span className="shortcut-letter">{sc.title.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="shortcut-title">{sc.title}</span>
              </a>

              {/* 3-dots Context Menu Button */}
              <button
                type="button"
                className="tile-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.playClick();
                  setActiveMenuId(activeMenuId === sc.id ? null : sc.id);
                }}
                title="Options"
              >
                <MoreVertical size={14} />
              </button>

              {/* Context Dropdown Menu */}
              {activeMenuId === sc.id && (
                <div
                  className="search-dropdown"
                  style={{
                    position: 'absolute',
                    top: '32px',
                    right: '0',
                    width: '160px',
                    padding: '6px 0',
                    borderRadius: '12px',
                    zIndex: 200,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="suggestion-item"
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={(e) => openEditModal(sc, e)}
                  >
                    <div className="suggestion-left">
                      <Edit2 size={14} />
                      <span>Edit</span>
                    </div>
                  </div>

                  <div
                    className="suggestion-item"
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={(e) => handleCopyLink(sc.url, sc.id, e)}
                  >
                    <div className="suggestion-left">
                      {copiedId === sc.id ? <Check size={14} style={{ color: 'var(--google-green)' }} /> : <Copy size={14} />}
                      <span>{copiedId === sc.id ? 'Copied!' : 'Copy Link'}</span>
                    </div>
                  </div>

                  <div
                    className="suggestion-item"
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={() => {
                      window.open(sc.url, '_blank');
                      setActiveMenuId(null);
                    }}
                  >
                    <div className="suggestion-left">
                      <ExternalLink size={14} />
                      <span>Open New Tab</span>
                    </div>
                  </div>

                  <div
                    className="suggestion-item"
                    style={{ padding: '8px 14px', fontSize: '13px', color: 'var(--google-red)' }}
                    onClick={(e) => handleDeleteShortcut(sc.id, e)}
                  >
                    <div className="suggestion-left">
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add Shortcut Tile */}
        <button type="button" className="shortcut-tile" onClick={openAddModal} title="Add new shortcut link">
          <div className="shortcut-icon-circle">
            <Plus size={22} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <span className="shortcut-title">Add shortcut</span>
        </button>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingShortcut ? 'Edit Shortcut' : 'Add Shortcut'}</h2>
            </div>

            <form onSubmit={handleSaveModal}>
              <div className="modal-form-group">
                <label className="modal-label" htmlFor="shortcut-name-input">
                  Name
                </label>
                <input
                  id="shortcut-name-input"
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Google Maps"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label" htmlFor="shortcut-url-input">
                  URL
                </label>
                <input
                  id="shortcut-url-input"
                  type="text"
                  className="modal-input"
                  placeholder="e.g. maps.google.com"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                />
              </div>

              {urlInput && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span>Preview:</span>
                  <div className="shortcut-icon-circle" style={{ width: '32px', height: '32px', marginBottom: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFaviconUrl(urlInput)}
                      alt="preview"
                      style={{ width: '18px', height: '18px' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <span style={{ fontWeight: 500 }}>{titleInput || 'Shortcut'}</span>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="google-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-action-btn">
                  Done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
