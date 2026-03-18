import React, { useState } from 'react';

/**
 * Navigation bar — dark burnished wood with inabel stripe accent.
 * Shows logo, navigation links, and a mobile hamburger menu.
 */
export default function Navbar({ currentView, onViewChange }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { id: 'editor', label: 'Editor', icon: '\u270E' },
    { id: 'about', label: 'About the Language', icon: '\u26F0' },
  ];

  return (
    <nav className="navbar select-none">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <button
          className="flex items-center gap-2 text-[var(--color-parchment)] hover:text-[var(--color-palay)] transition-colors"
          onClick={() => onViewChange('editor')}
          aria-label="Go to editor"
        >
          <span className="text-xl" role="img" aria-hidden="true">🌾</span>
          <span className="logo text-lg font-bold tracking-wide">Elokano IDE</span>
        </button>

        {/* Desktop links */}
        <div className="navbar-links hidden md:flex items-center gap-1">
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
        </div>

        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn hidden text-[var(--color-parchment)] text-xl p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? '\u2715' : '\u2630'}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-soil)] px-4 pb-2">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => { onViewChange(link.id); setMobileOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-sm ${
                currentView === link.id
                  ? 'text-[var(--color-palay)]'
                  : 'text-[var(--color-limestone)]'
              }`}
              aria-label={link.label}
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
