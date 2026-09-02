'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid,
  Sun,
  Moon,
  Sparkles,
  Shield,
  Clock,
  Volume2,
  VolumeX,
  User as UserIcon,
  LogOut,
  Flame,
  Cloud,
  Lock,
} from 'lucide-react';
import { sounds } from '@/lib/soundEffects';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const FALCON_APPS = [
  { name: 'Search', icon: '⚡', url: 'https://www.google.com' },
  { name: 'GitHub', icon: '🐙', url: 'https://github.com' },
  { name: 'ChatGPT', icon: '🤖', url: 'https://chatgpt.com' },
  { name: 'YouTube', icon: '▶️', url: 'https://www.youtube.com' },
  { name: 'Reddit', icon: '💬', url: 'https://www.reddit.com' },
  { name: 'Wikipedia', icon: '📚', url: 'https://www.wikipedia.org' },
  { name: 'Notion', icon: '📝', url: 'https://www.notion.so' },
  { name: 'Maps', icon: '🗺️', url: 'https://maps.google.com' },
  { name: 'Daily Quiz', icon: '🎯', url: '#' },
];

export const Header: React.FC<HeaderProps> = ({ currentTheme, onThemeChange }) => {
  const { user, openAuthModal, logout } = useAuth();

  const [timeStr, setTimeStr] = useState('');
  const [greeting, setGreeting] = useState('');
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;

      setTimeStr(`${formattedHours}:${minutes} ${ampm}`);

      if (hours < 12) {
        setGreeting('Good morning');
      } else if (hours < 18) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    setIsMuted(sounds.getIsMuted());

    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowAppsMenu(false);
      setShowThemeMenu(false);
      setShowUserMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleSelectTheme = (theme: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    onThemeChange(theme);
    setShowThemeMenu(false);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="top-header">
      {/* Left: Clock & Greeting */}
      <div className="header-left">
        {timeStr && (
          <div className="clock-badge">
            <Clock size={13} style={{ color: 'var(--falcon-accent)' }} />
            <span>{timeStr}</span>
          </div>
        )}
        {greeting && (
          <span className="greeting-text">
            {user ? `${greeting}, ${user.name.split(' ')[0]}` : greeting}
          </span>
        )}
      </div>

      {/* Right: Quick Tools, Theme Switcher, Apps Launcher, Auth Profile */}
      <div className="header-right">
        {/* Audio Mute/Unmute */}
        <button
          type="button"
          className="icon-btn"
          onClick={handleToggleMute}
          title={isMuted ? 'Sound FX: Muted' : 'Sound FX: Enabled'}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Theme Selector */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              setShowThemeMenu(!showThemeMenu);
              setShowAppsMenu(false);
              setShowUserMenu(false);
            }}
            title="Switch Theme"
          >
            {currentTheme === 'dark' ? (
              <Moon size={17} style={{ color: 'var(--falcon-accent)' }} />
            ) : currentTheme === 'oled' ? (
              <Shield size={17} />
            ) : currentTheme === 'aurora' ? (
              <Sparkles size={17} style={{ color: 'var(--falcon-accent)' }} />
            ) : (
              <Sun size={17} style={{ color: 'var(--falcon-accent)' }} />
            )}
          </button>

          {showThemeMenu && (
            <div
              className="search-dropdown"
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '190px',
                borderRadius: '14px',
                padding: '6px 0',
                zIndex: 300,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`suggestion-item ${currentTheme === 'light' ? 'active-index' : ''}`}
                onClick={(e) => handleSelectTheme('light', e)}
              >
                <div className="suggestion-left">
                  <Sun size={15} style={{ color: '#f59e0b' }} />
                  <span>Soft Slate Light</span>
                </div>
              </div>

              <div
                className={`suggestion-item ${currentTheme === 'dark' ? 'active-index' : ''}`}
                onClick={(e) => handleSelectTheme('dark', e)}
              >
                <div className="suggestion-left">
                  <Moon size={15} style={{ color: 'var(--falcon-accent)' }} />
                  <span>Titanium Dark</span>
                </div>
              </div>

              <div
                className={`suggestion-item ${currentTheme === 'oled' ? 'active-index' : ''}`}
                onClick={(e) => handleSelectTheme('oled', e)}
              >
                <div className="suggestion-left">
                  <Shield size={15} />
                  <span>Obsidian OLED</span>
                </div>
              </div>

              <div
                className={`suggestion-item ${currentTheme === 'aurora' ? 'active-index' : ''}`}
                onClick={(e) => handleSelectTheme('aurora', e)}
              >
                <div className="suggestion-left">
                  <Sparkles size={15} style={{ color: '#c084fc' }} />
                  <span>Aurora Ambient</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 9-Dots Apps Launcher */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              sounds.playClick();
              setShowAppsMenu(!showAppsMenu);
              setShowThemeMenu(false);
              setShowUserMenu(false);
            }}
            title="Falcon Quick Launcher"
          >
            <Grid size={18} />
          </button>

          {showAppsMenu && (
            <div
              className="search-dropdown"
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '270px',
                padding: '16px',
                borderRadius: '16px',
                zIndex: 300,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {FALCON_APPS.map((app, i) => (
                <a
                  key={i}
                  href={app.url}
                  target={app.url.startsWith('http') ? '_blank' : '_self'}
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 4px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => sounds.playClick()}
                >
                  <span style={{ fontSize: '22px', marginBottom: '6px' }}>{app.icon}</span>
                  <span>{app.name}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* User Auth Section */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="user-avatar-btn"
              title={`${user.name} (${user.email})`}
              onClick={(e) => {
                e.stopPropagation();
                sounds.playClick();
                setShowUserMenu(!showUserMenu);
                setShowAppsMenu(false);
                setShowThemeMenu(false);
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div
                className="search-dropdown"
                style={{
                  position: 'absolute',
                  top: '46px',
                  right: '0',
                  width: '260px',
                  borderRadius: '16px',
                  padding: '16px',
                  zIndex: 300,
                  boxShadow: '0 12px 36px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    className="user-avatar-btn"
                    style={{ width: '42px', height: '42px', fontSize: '18px' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '14px',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cloud size={13} style={{ color: 'var(--falcon-accent)' }} />
                    <span>MongoDB Atlas Connected</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} style={{ color: 'var(--success-color)' }} />
                    <span>1-Year JWT Session Active</span>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid var(--card-border)',
                    background: 'var(--card-bg)',
                    color: 'var(--error-color)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="primary-action-btn"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              height: '36px',
              borderRadius: '10px',
            }}
            onClick={() => openAuthModal('login')}
          >
            <UserIcon size={14} />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
