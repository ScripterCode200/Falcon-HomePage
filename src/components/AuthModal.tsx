'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Mail, User, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sounds } from '@/lib/soundEffects';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, register, openAuthModal } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isAuthModalOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    if (authModalTab === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Login failed. Please check your credentials.');
      }
    } else {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        setIsSubmitting(false);
        return;
      }
      const res = await register(name, email, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Registration failed.');
      }
    }

    setIsSubmitting(false);
  };

  const switchTab = (tab: 'login' | 'register') => {
    sounds.playClick();
    setErrorMessage('');
    openAuthModal(tab);
  };

  return createPortal(
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        {/* Header with Close */}
        <div className="modal-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--falcon-accent-soft)',
                color: 'var(--falcon-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <h2 className="modal-title">{authModalTab === 'login' ? 'Welcome Back' : 'Create Falcon Account'}</h2>
          </div>

          <button type="button" className="tool-icon-btn" onClick={closeAuthModal} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* 1-Year JWT Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--card-border)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
            marginBottom: '18px',
          }}
        >
          <Lock size={12} style={{ color: 'var(--falcon-accent)' }} />
          <span>1-Year JWT Session Active (Persistent Sync)</span>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-secondary)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid var(--card-border)',
          }}
        >
          <button
            type="button"
            style={{
              padding: '8px 0',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: authModalTab === 'login' ? 'var(--card-bg)' : 'transparent',
              color: authModalTab === 'login' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: authModalTab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => switchTab('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              padding: '8px 0',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: authModalTab === 'register' ? 'var(--card-bg)' : 'transparent',
              color: authModalTab === 'register' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: authModalTab === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
            onClick={() => switchTab('register')}
          >
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--error-color)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '16px',
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {authModalTab === 'register' && (
            <div className="modal-form-group">
              <label className="modal-label" htmlFor="auth-name">
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                  }}
                />
                <input
                  id="auth-name"
                  type="text"
                  className="modal-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="e.g. Shivam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="modal-form-group">
            <label className="modal-label" htmlFor="auth-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                id="auth-email"
                type="email"
                className="modal-input"
                style={{ paddingLeft: '40px' }}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-form-group">
            <label className="modal-label" htmlFor="auth-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                }}
              />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="modal-input"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              type="submit"
              className="primary-action-btn"
              style={{ width: '100%', justifyContent: 'center', height: '46px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin-animate" /> Processing...
                </>
              ) : authModalTab === 'login' ? (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Create Free Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
