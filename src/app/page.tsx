'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FalconLogo } from '@/components/FalconLogo';
import { FalconSearch } from '@/components/FalconSearch';
import { ShortcutsGrid } from '@/components/ShortcutsGrid';
import { DailyQuizPanel } from '@/components/DailyQuizPanel';
import { AuthProvider } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';

export default function HomePage() {
  const [theme, setTheme] = useState<string>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('falcon_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('falcon_theme', newTheme);
  };

  return (
    <AuthProvider>
      <div className="app-container">
        {/* Top Navigation & Status Bar */}
        <Header currentTheme={theme} onThemeChange={handleThemeChange} />

        {/* Two Pane Split Dashboard Layout */}
        <div className="split-dashboard">
          {/* Left Pane: Falcon Startpage, Search & Speed Dial Shortcuts */}
          <section className="left-google-pane" aria-label="Falcon Startpage">
            <div style={{ width: '100%', maxWidth: '620px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Falcon Minimalist Logo with user's logo.png */}
              <FalconLogo />

              {/* Falcon Search Bar with Live Suggestions, Math Solver, Voice & Visual Search */}
              <FalconSearch />

              {/* Customizable Speed Dial Shortcuts Grid */}
              <ShortcutsGrid />

              {/* Minimal Footer */}
              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '28px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-tertiary)',
                }}
              >
                <span>Falcon Hub v1.0</span>
                <span>•</span>
                <span>MongoDB Atlas Active</span>
                <span>•</span>
                <span>1-Yr JWT Security</span>
              </div>
            </div>
          </section>

          {/* Right Pane: Full-Height Daily Trivia Challenge Arena */}
          <aside className="right-quiz-pane" aria-label="Daily Trivia Challenge Panel">
            <DailyQuizPanel />
          </aside>
        </div>

        {/* Authentication Modal (Sign In / Sign Up) */}
        <AuthModal />
      </div>
    </AuthProvider>
  );
}
