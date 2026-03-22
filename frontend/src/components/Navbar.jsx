import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function Navbar({ currentView, onViewChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(true); // default ON
  const [showBanner, setShowBanner] = useState(true);
  const audioRef = useRef(null);
  const startedRef = useRef(false);

  // Create audio element on mount
  useEffect(() => {
    audioRef.current = new Audio('/website_bg_music.ogg');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.4;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Autoplay on first user interaction (browsers block autoplay without gesture)
  useEffect(() => {
    if (startedRef.current) return;
    const startMusic = () => {
      if (!startedRef.current && audioRef.current && musicOn) {
        audioRef.current.play().catch(() => {});
        startedRef.current = true;
      }
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
      document.removeEventListener('touchstart', startMusic);
    };
    document.addEventListener('click', startMusic);
    document.addEventListener('keydown', startMusic);
    document.addEventListener('touchstart', startMusic);
    return () => {
      document.removeEventListener('click', startMusic);
      document.removeEventListener('keydown', startMusic);
      document.removeEventListener('touchstart', startMusic);
    };
  }, [musicOn]);

  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    if (musicOn) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
      startedRef.current = true;
    }
    setMusicOn(!musicOn);
  }, [musicOn]);

  const links = [
    { id: 'editor', label: 'Editor', icon: '\u270E' },
    { id: 'scenarios', label: 'Test Scenarios', icon: '\uD83E\uDDEA' },
    { id: 'about', label: 'About the Language', icon: '\u26F0' },
  ];

  return (
    <nav className="navbar select-none">
      {/* Song credit banner */}
      {showBanner && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--color-soil)] text-[var(--color-palay)] text-xs">
          <span>
            <span className="opacity-70">Now playing:</span>{' '}
            <strong>&quot;Sipot-Sipot&quot;</strong>{' '}
            <span className="opacity-70">&mdash; Ilocano folk song</span>
          </span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-3 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss music notice"
          >
            &times;
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <button
          className="flex items-center gap-2 text-[var(--color-parchment)] hover:text-[var(--color-palay)] transition-colors"
          onClick={() => { onViewChange('editor'); setMobileOpen(false); }}
          aria-label="Go to editor"
        >
          <span className="text-xl" role="img" aria-hidden="true">🌾</span>
          <span className="logo text-lg font-bold tracking-wide">Elokano IDE</span>
        </button>

        {/* Desktop links + music toggle (hidden on mobile via CSS) */}
        <div className="navbar-links flex items-center gap-1">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { onViewChange(link.id); setMobileOpen(false); }}
              className={`px-3 py-1.5 text-sm rounded-sm transition-colors ${
                currentView === link.id
                  ? 'text-[var(--color-palay)] bg-[rgba(212,180,131,0.1)]'
                  : 'text-[var(--color-limestone)] hover:text-[var(--color-palay)]'
              }`}
              aria-label={link.label}
            >
              <span className="mr-1.5" aria-hidden="true">{link.icon}</span>
              {link.label}
            </button>
          ))}

          {/* Music toggle — desktop */}
          <button
            onClick={toggleMusic}
            className={`ml-2 px-2.5 py-1.5 text-sm rounded-sm border transition-colors ${
              musicOn
                ? 'text-[var(--color-palay)] border-[var(--color-palay)] bg-[rgba(212,180,131,0.15)]'
                : 'text-[var(--color-stone)] border-[var(--color-stone)] hover:text-[var(--color-limestone)]'
            }`}
            aria-label={musicOn ? 'Pause music' : 'Play music'}
            title={musicOn ? 'Sipot-Sipot (Playing)' : 'Sipot-Sipot (Paused)'}
          >
            {musicOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
          </button>
        </div>

        {/* Right side: music toggle (mobile) + hamburger */}
        <div className="flex items-center gap-1">
          {/* Music toggle — mobile only */}
          <button
            onClick={toggleMusic}
            className={`mobile-music-btn hidden px-2.5 py-2 text-lg rounded-sm transition-colors ${
              musicOn
                ? 'text-[var(--color-palay)]'
                : 'text-[var(--color-stone)]'
            }`}
            aria-label={musicOn ? 'Pause music' : 'Play music'}
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {musicOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
          </button>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn hidden text-[var(--color-parchment)] text-2xl p-2 -mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {mobileOpen ? '\u2715' : '\u2630'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-soil)] px-4 pb-2">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { onViewChange(link.id); setMobileOpen(false); }}
              className={`block w-full text-left px-3 py-3 text-base ${
                currentView === link.id
                  ? 'text-[var(--color-palay)]'
                  : 'text-[var(--color-limestone)]'
              }`}
              aria-label={link.label}
              style={{ minHeight: 44 }}
            >
              <span className="mr-2" aria-hidden="true">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>
      )}

      {/* Inabel stripe */}
      <div className="stripe" aria-hidden="true"></div>
    </nav>
  );
}
