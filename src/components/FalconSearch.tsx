'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Mic, Camera, Clock, ArrowUpRight, Sparkles, CornerDownLeft } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface FalconSearchProps {
  onSearchPerformed?: (query: string) => void;
}

const POPULAR_SUGGESTIONS = [
  'Latest world news',
  'Next.js 14 full tutorial',
  'Deep learning breakthroughs',
  'Daily knowledge trivia',
  'GitHub trending repos',
  'Minimalist web design systems',
  'Weather forecast',
  'Quantum computing explained',
];

export const FalconSearch: React.FC<FalconSearchProps> = ({ onSearchPerformed }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [isListening, setIsListening] = useState(false);
  const [mathResult, setMathResult] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('falcon_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Quick Math / Evaluation detector
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setMathResult(null);
      return;
    }

    const mathPattern = /^[0-9+\-*/().^%\s\^sqrt]+$/i;
    const isPercentage = /([0-9.]+)\s*%\s*of\s*([0-9.]+)/i.exec(trimmed);

    if (isPercentage) {
      const percent = parseFloat(isPercentage[1]);
      const total = parseFloat(isPercentage[2]);
      if (!isNaN(percent) && !isNaN(total)) {
        setMathResult(`${(percent / 100) * total}`);
        return;
      }
    }

    if (mathPattern.test(trimmed) && /[+\-*/^%]/.test(trimmed)) {
      try {
        const sanitized = trimmed
          .replace(/sqrt\(([^)]+)\)/gi, 'Math.sqrt($1)')
          .replace(/\^/g, '**');
        
        if (/^[0-9+\-*/().\s*Math.sqrt]+$/.test(sanitized)) {
          // eslint-disable-next-line no-new-func
          const evalFn = new Function(`return ${sanitized}`);
          const res = evalFn();
          if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
            setMathResult(`${res}`);
            return;
          }
        }
      } catch {
        setMathResult(null);
      }
    }

    setMathResult(null);
  }, [query]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save recent search
  const saveSearch = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    const updated = [clean, ...recentSearches.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('falcon_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Remove single recent search
  const removeRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    sounds.playClick();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    try {
      localStorage.setItem('falcon_recent_searches', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Perform Search
  const executeSearch = (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    sounds.playClick();
    saveSearch(q);
    setIsFocused(false);

    if (onSearchPerformed) {
      onSearchPerformed(q);
    }

    // If query is a valid URL, navigate directly
    if (/^(https?:\/\/|www\.)[^\s]+$/i.test(q)) {
      const url = q.startsWith('http') ? q : `https://${q}`;
      window.location.href = url;
      return;
    }

    // Standard Google Search redirection with clean parameters
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    window.location.href = searchUrl;
  };

  // "I'm Feeling Lucky" action
  const handleLucky = () => {
    sounds.playClick();
    const q = query.trim() || 'Fascinating Facts';
    saveSearch(q);
    const luckyUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&btnI=1`;
    window.location.href = luckyUrl;
  };

  // Web Speech API Voice Search
  const handleVoiceSearch = () => {
    sounds.playClick();
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser. Please try Google Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        setTimeout(() => {
          executeSearch(transcript);
        }, 500);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Lens / Visual search shortcut
  const handleLens = () => {
    sounds.playClick();
    window.open('https://lens.google.com', '_blank');
  };

  // Suggestions computation
  const filteredSuggestions = query.trim()
    ? POPULAR_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()) && s.toLowerCase() !== query.toLowerCase()).slice(0, 5)
    : recentSearches;

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && filteredSuggestions[activeSuggestionIndex]) {
        executeSearch(filteredSuggestions[activeSuggestionIndex]);
      } else {
        executeSearch();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  return (
    <div className="search-container" ref={searchContainerRef}>
      {/* Search Input Box */}
      <div className={`search-box ${isFocused && (filteredSuggestions.length > 0 || mathResult) ? 'is-focused' : ''}`}>
        <Search className="search-icon-left" size={18} />

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search the web or type a URL..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />

        <div className="search-actions-right">
          {query && (
            <button
              type="button"
              className="tool-icon-btn"
              onClick={() => {
                setQuery('');
                setMathResult(null);
                inputRef.current?.focus();
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}

          {/* Minimal Voice Search Icon */}
          <button
            type="button"
            className={`tool-icon-btn ${isListening ? 'mic-icon-active' : ''}`}
            onClick={handleVoiceSearch}
            title={isListening ? 'Listening...' : 'Search by voice'}
          >
            <Mic size={17} />
          </button>

          {/* Minimal Lens Camera Icon */}
          <button
            type="button"
            className="tool-icon-btn"
            onClick={handleLens}
            title="Visual search"
          >
            <Camera size={17} />
          </button>
        </div>
      </div>

      {/* Autocomplete / Suggestions Dropdown */}
      {isFocused && (filteredSuggestions.length > 0 || mathResult) && (
        <div className="search-dropdown">
          {/* Instant Math / Calculator Result */}
          {mathResult && (
            <div className="math-solver-preview" onClick={() => executeSearch(`${query} = ${mathResult}`)}>
              <div>
                <div className="math-title">Instant Calculation</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{query} =</div>
              </div>
              <div className="math-result">{mathResult}</div>
            </div>
          )}

          {/* Suggestions List */}
          {filteredSuggestions.map((item, index) => {
            const isRecent = recentSearches.includes(item) && !query;
            return (
              <div
                key={`${item}-${index}`}
                className={`suggestion-item ${index === activeSuggestionIndex ? 'active-index' : ''}`}
                onClick={() => executeSearch(item)}
              >
                <div className="suggestion-left">
                  {isRecent ? (
                    <Clock size={15} style={{ color: 'var(--text-tertiary)' }} />
                  ) : (
                    <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
                  )}
                  <span className="suggestion-query-text">{item}</span>
                </div>

                {isRecent ? (
                  <button
                    type="button"
                    className="tool-icon-btn"
                    onClick={(e) => removeRecentSearch(e, item)}
                    title="Remove from history"
                  >
                    <X size={13} />
                  </button>
                ) : (
                  <ArrowUpRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Minimal Action Buttons */}
      <div className="search-buttons-row">
        <button type="button" className="google-btn" onClick={() => executeSearch()}>
          <Search size={14} />
          Falcon Search
        </button>
        <button type="button" className="google-btn" onClick={handleLucky}>
          <Sparkles size={14} style={{ color: 'var(--falcon-accent)' }} />
          I&apos;m Feeling Lucky
        </button>
      </div>
    </div>
  );
};
