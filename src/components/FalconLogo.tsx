'use client';

import React from 'react';
import Image from 'next/image';

export const FalconLogo: React.FC = () => {
  return (
    <div className="falcon-logo-container" aria-label="Falcon Startpage">
      {/* Falcon Custom Logo Image */}
      <div className="falcon-icon-wrapper">
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px var(--falcon-accent-soft)',
            border: '1px solid var(--card-border)',
            background: 'var(--card-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Falcon Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '6px',
            }}
            onError={(e) => {
              // Fallback to geometric emblem if image error
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Luxury Minimalist Brand Title */}
      <h1 className="falcon-brand-title">
        FALCON
      </h1>

      {/* Brand Subtitle */}
      <div className="falcon-brand-badge">
        <span>INTELLIGENT STARTPAGE & TRIVIA</span>
      </div>
    </div>
  );
};
