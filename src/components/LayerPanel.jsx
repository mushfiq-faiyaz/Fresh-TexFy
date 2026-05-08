import { useState, useRef, useEffect } from 'react';

/* ─── Eye icon (with optional strikethrough) ────────────────────────────── */
function EyeIcon({ hidden }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {hidden ? (
        <>
          {/* eye-off */}
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M1 1l22 22" stroke="#ef4444" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

/* ─── Lock icon ─────────────────────────────────────────────────────────── */
function LockIcon({ locked }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, color: locked ? '#f59e0b' : 'inherit' }}
    >
      {locked ? (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      ) : (
        <>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 9.9-1" />
        </>
      )}
    </svg>
  );
}

/* ─── Trash icon ────────────────────────────────────────────────────────── */
function TrashIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/* ─── Single layer row ──────────────────────────────────────────────────── */
function LayerRow({ layer, isActive, onSelect, onToggleVisibility, onToggleLock, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    height: 32,
    cursor: 'pointer',
    borderRadius: 6,
    marginBottom: 2,
    border: isActive
      ? '1px solid #6366f1'
      : '1px solid transparent',
    background: isActive
      ? 'rgba(99,102,241,0.18)'
      : hovered
        ? 'rgba(255,255,255,0.07)'
        : 'rgba(30,30,50,0.8)',
    transition: 'background 0.15s, border-color 0.15s',
    overflow: 'hidden',
    position: 'relative',
  };

  return (
    <div
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {/* Left indicator bar */}
      <div style={{
        width: 3,
        height: '100%',
        background: isActive ? '#6366f1' : 'rgba(255,255,255,0.1)',
        flexShrink: 0,
        borderRadius: '2px 0 0 2px',
        transition: 'background 0.15s',
      }} />

      {/* Layer number */}
      <span style={{
        width: 22,
        textAlign: 'center',
        fontSize: 10,
        color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
        fontWeight: 600,
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {layer.number}
      </span>

      {/* Layer name */}
      <span style={{
        flex: 1,
        fontSize: 12,
        color: layer.visible ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        paddingRight: 4,
        fontStyle: layer.visible ? 'normal' : 'italic',
      }}>
        {layer.name}
      </span>

      {/* Icon buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingRight: 6, flexShrink: 0 }}>
        <IconBtn
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
          color={layer.visible ? undefined : '#ef4444'}
        >
          <EyeIcon hidden={!layer.visible} />
        </IconBtn>
        <IconBtn
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
          color={layer.locked ? '#f59e0b' : undefined}
        >
          <LockIcon locked={layer.locked} />
        </IconBtn>
        <IconBtn
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete layer"
          danger
        >
          <TrashIcon />
        </IconBtn>
      </div>
    </div>
  );
}

/* ─── Small icon button ─────────────────────────────────────────────────── */
function IconBtn({ children, onClick, title, color, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 3px',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color
          ? color
          : hov
            ? danger ? '#ef4444' : '#ffffff'
            : 'rgba(255,255,255,0.4)',
        transition: 'color 0.15s',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

/* ─── Add-layer "+" button ──────────────────────────────────────────────── */
function AddLayerBtn({ onAddLayer }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onAddLayer}
      title="Add new text layer (T)"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 26,
        height: 26,
        borderRadius: 7,
        flexShrink: 0,
        marginRight: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hov
          ? 'linear-gradient(135deg, rgba(99,102,241,0.45) 0%, rgba(139,92,246,0.35) 100%)'
          : 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(139,92,246,0.15) 100%)',
        border: hov
          ? '1px solid rgba(139,92,246,0.75)'
          : '1px solid rgba(99,102,241,0.4)',
        color: hov ? '#c4b5fd' : '#a5b4fc',
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 1,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: hov ? '0 0 10px rgba(99,102,241,0.35)' : 'none',
      }}
    >
      +
    </button>
  );
}

/* ─── Main LayerPanel ───────────────────────────────────────────────────── */
const VISIBLE_ROWS = 5;

export default function LayerPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onAddLayer,
}) {
  const [expanded, setExpanded] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const listRef = useRef(null);

  // Reset scroll when panel collapses
  useEffect(() => {
    if (!expanded) setScrollOffset(0);
  }, [expanded]);

  const totalLayers = layers.length;
  const maxOffset = Math.max(0, totalLayers - VISIBLE_ROWS);
  const visibleLayers = layers.slice(scrollOffset, scrollOffset + VISIBLE_ROWS);
  const hasMore = totalLayers > VISIBLE_ROWS && scrollOffset + VISIBLE_ROWS < totalLayers;

  const handleWheel = (e) => {
    if (!expanded) return;
    e.preventDefault();
    if (e.deltaY > 0) {
      setScrollOffset(o => Math.min(o + 1, maxOffset));
    } else {
      setScrollOffset(o => Math.max(0, o - 1));
    }
  };

  // panel height calculation
  const rowH = 34; // row height + gap
  const headerH = 36;
  const footerH = hasMore ? 30 : 0;
  const listH = visibleLayers.length * rowH;
  const expandedH = headerH + 8 + listH + footerH + 10; // padding

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        zIndex: 50,
        width: 240,
      }}
    >
      <div
        style={{
          background: 'rgba(15,15,25,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Toggle header ── */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
              padding: '8px 8px 8px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {/* Layers "target" icon */}
            <span style={{ fontSize: 15, lineHeight: 1 }}>⊙</span>
            <span>Layers</span>
            {/* Count badge */}
            {totalLayers > 0 && (
              <span style={{
                background: 'rgba(99,102,241,0.35)',
                color: '#a5b4fc',
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: 10,
                fontWeight: 700,
                marginLeft: 2,
              }}>
                {totalLayers}
              </span>
            )}
            {/* Chevron rotates on expand */}
            <span style={{
              marginLeft: 'auto',
              fontSize: 11,
              opacity: 0.5,
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>
              ▶
            </span>
          </button>

          {/* ── Add Layer (+) button ── */}
          <AddLayerBtn onAddLayer={() => { onAddLayer?.(); setExpanded(true); }} />
        </div>

        {/* ── Layer list (animated expand) ── */}
        <div
          style={{
            maxHeight: expanded ? `${expandedH}px` : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            ref={listRef}
            onWheel={handleWheel}
            style={{ padding: '0 8px 8px 8px' }}
          >
            {totalLayers === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '12px 0',
                fontSize: 11,
                color: 'rgba(255,255,255,0.25)',
                fontStyle: 'italic',
              }}>
                No layers yet — press <strong style={{ color: 'rgba(255,255,255,0.4)' }}>+</strong> to add
              </div>
            ) : (
              <>
                {/* Separator */}
                <div style={{
                  height: 1,
                  background: 'rgba(255,255,255,0.06)',
                  marginBottom: 6,
                }} />

                {visibleLayers.map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    isActive={layer.id === activeLayerId}
                    onSelect={() => onSelectLayer(layer.id)}
                    onToggleVisibility={() => onToggleVisibility(layer.id)}
                    onToggleLock={() => onToggleLock(layer.id)}
                    onDelete={() => onDeleteLayer(layer.id)}
                  />
                ))}

                {/* More layers button */}
                {hasMore && (
                  <button
                    onClick={() => setScrollOffset(o => Math.min(o + 1, maxOffset))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 5,
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: '4px 0',
                      marginTop: 2,
                    }}
                  >
                    <span>⌄</span>
                    <span>More layers ({totalLayers - scrollOffset - VISIBLE_ROWS} hidden)</span>
                  </button>
                )}

                {/* Scroll up button if offset > 0 */}
                {scrollOffset > 0 && (
                  <button
                    onClick={() => setScrollOffset(o => Math.max(0, o - 1))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 5,
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: '4px 0',
                      marginBottom: 2,
                    }}
                  >
                    <span>⌃</span>
                    <span>Scroll up</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
