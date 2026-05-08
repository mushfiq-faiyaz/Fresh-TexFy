import { useState, useRef, useEffect, useCallback } from 'react';

/* ─── Eye icon ──────────────────────────────────────────────────────────── */
function EyeIcon({ hidden }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {hidden ? (
        <>
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
    <svg width="14" height="14" viewBox="0 0 24 24"
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
    <svg width="14" height="14" viewBox="0 0 24 24"
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
        padding: '3px 4px',
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

/* ─── Render a fabric object into a 2d context, centered & scaled to fit ─── */
function renderObjIntoCtx(obj, ctx, W, H, pad = 4) {
  return obj.clone().then(cloned => {
    // Reset angle and position so we measure intrinsic size only
    cloned.angle  = 0;
    cloned.left   = 0;
    cloned.top    = 0;
    cloned.originX = 'left';
    cloned.originY = 'top';
    cloned.setCoords();

    // Use fabric's getScaledWidth/Height — gives true visual dimensions
    const natW = cloned.getScaledWidth();
    const natH = cloned.getScaledHeight();
    if (!natW || !natH) return;

    const availW = W - pad * 2;
    const availH = H - pad * 2;

    // Scale UP or DOWN so the object fills the available area
    const scale = Math.min(availW / natW, availH / natH);

    cloned.scaleX = (cloned.scaleX || 1) * scale;
    cloned.scaleY = (cloned.scaleY || 1) * scale;

    // Center within the canvas
    const drawnW = natW * scale;
    const drawnH = natH * scale;
    cloned.left = pad + (availW - drawnW) / 2;
    cloned.top  = pad + (availH - drawnH) / 2;

    cloned.selectable = false;
    cloned.evented    = false;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    cloned.setCoords();
    cloned.render(ctx);
    ctx.restore();
  }).catch(() => {});
}


/* ─── Layer thumbnail ────────────────────────────────────────────────────── */
function LayerThumbnail({ layer, fabricRef }) {
  const canvasRef = useRef(null);
  const W = 68, H = 44;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fab = fabricRef?.current;
    if (!fab) return;
    const obj = fab.getObjects().find(o => o.__layerId === layer.id);
    if (!obj) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    renderObjIntoCtx(obj, ctx, W, H, 3);
  }, [layer.id, layer.name, fabricRef]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        width: W,
        height: H,
        borderRadius: 5,
        border: '1px solid rgba(255,255,255,0.15)',
        background: '#fff',
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}

/* ─── Popup hover preview ─────────────────────────────────────────────────── */
function LayerPreviewPopup({ layer, fabricRef, anchorRect }) {
  const canvasRef = useRef(null);
  const POP_W = 220;
  const POP_H = 160;
  const LABEL_H = 22;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const fab = fabricRef?.current;
    if (!fab) return;
    const obj = fab.getObjects().find(o => o.__layerId === layer.id);
    if (!obj) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, POP_W, POP_H - LABEL_H);
    renderObjIntoCtx(obj, ctx, POP_W, POP_H - LABEL_H, 12);
  }, [layer.id, fabricRef]);

  if (!anchorRect) return null;

  // Position: to the right of the panel row, vertically centered on it
  const spaceRight = window.innerWidth - anchorRect.right;
  let left, top;
  if (spaceRight >= POP_W + 12) {
    left = anchorRect.right + 10;
    top  = anchorRect.top + anchorRect.height / 2 - POP_H / 2;
  } else {
    // Not enough room right → show above
    left = anchorRect.left;
    top  = anchorRect.top - POP_H - 8;
  }
  // Clamp within viewport
  top  = Math.max(8, Math.min(top,  window.innerHeight - POP_H - 8));
  left = Math.max(8, Math.min(left, window.innerWidth  - POP_W - 8));

  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 99999,
        width: POP_W,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.65), 0 0 0 1.5px rgba(99,102,241,0.5)',
        background: '#ffffff',
        pointerEvents: 'none',
        animation: 'layerPopIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <style>{`
        @keyframes layerPopIn {
          from { opacity: 0; transform: scale(0.9) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Header label */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 700,
        color: '#fff',
        letterSpacing: '0.03em',
        height: LABEL_H,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ opacity: 0.7, fontSize: 9 }}>PREVIEW</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.name || 'Layer'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={POP_W}
        height={POP_H - LABEL_H}
        style={{ display: 'block', width: POP_W, height: POP_H - LABEL_H }}
      />
    </div>
  );
}

/* ─── Single layer row ──────────────────────────────────────────────────── */
function LayerRow({ layer, isActive, onSelect, onToggleVisibility, onToggleLock, onDelete, fabricRef }) {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const rowRef = useRef(null);
  const popupTimerRef = useRef(null);

  const handleRowEnter = () => {
    if (rowRef.current) {
      setAnchorRect(rowRef.current.getBoundingClientRect());
    }
    popupTimerRef.current = setTimeout(() => setShowPopup(true), 150);
  };
  const handleRowLeave = () => {
    clearTimeout(popupTimerRef.current);
    setShowPopup(false);
  };

  useEffect(() => () => clearTimeout(popupTimerRef.current), []);

  return (
    <>
      <div
        ref={rowRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 50,
          cursor: 'pointer',
          borderRadius: 8,
          marginBottom: 4,
          border: isActive
            ? '1px solid rgba(99,102,241,0.7)'
            : '1px solid rgba(255,255,255,0.06)',
          background: isActive
            ? 'rgba(99,102,241,0.18)'
            : hovered
              ? 'rgba(255,255,255,0.09)'
              : 'rgba(22,22,40,0.85)',
          transition: 'background 0.15s, border-color 0.15s',
          overflow: 'hidden',
          position: 'relative',
        }}
        onMouseEnter={() => { setHovered(true); handleRowEnter(); }}
        onMouseLeave={() => { setHovered(false); handleRowLeave(); }}
        onClick={onSelect}
      >
        {/* Left accent bar */}
        <div style={{
          width: 3,
          height: '100%',
          background: isActive
            ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
            : 'rgba(255,255,255,0.08)',
          flexShrink: 0,
          borderRadius: '3px 0 0 3px',
          transition: 'background 0.15s',
        }} />

        {/* Layer number */}
        <span style={{
          width: 20,
          textAlign: 'center',
          fontSize: 10,
          color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
          fontWeight: 700,
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
          marginLeft: 4,
        }}>
          {layer.number}
        </span>

        {/* Thumbnail — inline, no separate hover zone needed */}
        <div
          style={{
            marginLeft: 6,
            marginRight: 6,
            flexShrink: 0,
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <LayerThumbnail layer={layer} fabricRef={fabricRef} />
        </div>

        {/* Layer name */}
        <span style={{
          flex: 1,
          fontSize: 11,
          color: layer.visible ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          paddingRight: 2,
          fontStyle: layer.visible ? 'normal' : 'italic',
          fontWeight: isActive ? 600 : 400,
        }}>
          {layer.name}
        </span>

        {/* Icon buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, paddingRight: 5, flexShrink: 0 }}>
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

      {/* Popup preview portal */}
      {showPopup && anchorRect && (
        <LayerPreviewPopup
          layer={layer}
          fabricRef={fabricRef}
          anchorRect={anchorRect}
        />
      )}
    </>
  );
}

/* ─── Add-layer \"+\" button ──────────────────────────────────────────────── */
function AddLayerBtn({ onAddLayer }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onAddLayer}
      title="Add new layer"
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
          ? 'linear-gradient(135deg, rgba(99,102,241,0.45), rgba(139,92,246,0.35))'
          : 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.15))',
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
const VISIBLE_ROWS = 4;
const ROW_H = 56; // 50px row + 4px margin + 2px buffer

export default function LayerPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onAddLayer,
  fabricRef,
}) {
  const [expanded, setExpanded] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const listRef = useRef(null);

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

  const headerH = 38;
  const footerH = hasMore ? 32 : 0;
  const upFootH = scrollOffset > 0 ? 32 : 0;
  const listH = visibleLayers.length * ROW_H;
  const expandedH = headerH + 10 + listH + footerH + upFootH + 12;

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        zIndex: 50,
        width: 268,
      }}
    >
      <div
        style={{
          background: 'rgba(12,12,22,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flex: 1,
              padding: '9px 8px 9px 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.88)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>⊙</span>
            <span>Layers</span>
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
            <span style={{
              marginLeft: 'auto',
              fontSize: 11,
              opacity: 0.45,
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>
              ▶
            </span>
          </button>

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
                padding: '16px 0',
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
                  background: 'rgba(255,255,255,0.07)',
                  marginBottom: 8,
                }} />

                {/* Scroll up button */}
                {scrollOffset > 0 && (
                  <button
                    onClick={() => setScrollOffset(o => Math.max(0, o - 1))}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      width: '100%', marginBottom: 4,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 6, color: 'rgba(255,255,255,0.4)',
                      fontSize: 11, cursor: 'pointer', padding: '5px 0',
                    }}
                  >
                    <span>⌃</span><span>Scroll up</span>
                  </button>
                )}

                {visibleLayers.map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    isActive={layer.id === activeLayerId}
                    onSelect={() => onSelectLayer(layer.id)}
                    onToggleVisibility={() => onToggleVisibility(layer.id)}
                    onToggleLock={() => onToggleLock(layer.id)}
                    onDelete={() => onDeleteLayer(layer.id)}
                    fabricRef={fabricRef}
                  />
                ))}

                {/* More layers button */}
                {hasMore && (
                  <button
                    onClick={() => setScrollOffset(o => Math.min(o + 1, maxOffset))}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      width: '100%', marginTop: 2,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 6, color: 'rgba(255,255,255,0.4)',
                      fontSize: 11, cursor: 'pointer', padding: '5px 0',
                    }}
                  >
                    <span>⌄</span>
                    <span>More layers ({totalLayers - scrollOffset - VISIBLE_ROWS} hidden)</span>
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
