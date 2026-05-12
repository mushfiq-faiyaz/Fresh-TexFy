import { useState } from 'react';

/**
 * Reusable accordion section for both sidebars.
 * Renders as a .sidebar-section wrapper with a clickable title row
 * and a smooth max-height collapse animation.
 */
export default function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="sidebar-section" style={{ padding: 0 }}>
      {/* ── Title / trigger row ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 14px 10px',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'background 0.12s ease',
          outline: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.32)',
          }}
        >
          {title}
        </span>

        {/* Chevron — rotates 90° when open */}
        <span
          style={{
            fontSize: 12,
            lineHeight: 1,
            color: 'rgba(255,255,255,0.25)',
            display: 'inline-block',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          ›
        </span>
      </div>

      {/* ── Collapsible body ── */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: open ? '700px' : '0px',
          transition: 'max-height 0.22s ease',
        }}
      >
        <div style={{ padding: '0 14px 14px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
