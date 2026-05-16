import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

function renderObjIntoCtx(obj, ctx, W, H, pad = 4) {
  try {
    // Generate an exact pixel-perfect canvas representation of the object
    // This perfectly handles rotation, stroke, groups, and relative coordinates natively.
    const objCanvas = obj.toCanvasElement({ multiplier: 1 });

    const natW = objCanvas.width;
    const natH = objCanvas.height;
    if (!natW || !natH) return;

    const availW = W - pad * 2;
    const availH = H - pad * 2;

    // Scale down to fit within the thumbnail area
    const scale = Math.min(availW / natW, availH / natH);

    const drawnW = natW * scale;
    const drawnH = natH * scale;
    const left = pad + (availW - drawnW) / 2;
    const top = pad + (availH - drawnH) / 2;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Smooth image scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(objCanvas, left, top, drawnW, drawnH);
  } catch (err) {
    console.warn('Layer thumbnail render error:', err);
  }
}


/* ─── Layer thumbnail ────────────────────────────────────────────────────── */
function LayerThumbnail({ layer, fabricRef, refreshKey }) {
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
  }, [layer.id, layer.name, fabricRef, refreshKey]);

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
function LayerPreviewPopup({ layer, fabricRef, anchorRect, refreshKey }) {
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
  }, [layer.id, fabricRef, refreshKey]);

  if (!anchorRect) return null;

  // Position: to the right of the panel row, vertically centered on it
  const spaceRight = window.innerWidth - anchorRect.right;
  let left, top;
  if (spaceRight >= POP_W + 12) {
    left = anchorRect.right + 10;
    top = anchorRect.top + anchorRect.height / 2 - POP_H / 2;
  } else {
    // Not enough room right → show above
    left = anchorRect.left;
    top = anchorRect.top - POP_H - 8;
  }
  // Clamp within viewport
  top = Math.max(8, Math.min(top, window.innerHeight - POP_H - 8));
  left = Math.max(8, Math.min(left, window.innerWidth - POP_W - 8));

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

/* ─── Grip handle icon ──────────────────────────────────────────────────── */
function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" style={{ display: 'block', flexShrink: 0 }}>
      {[0, 4].map(cx =>
        [2, 6, 10].map(cy => (
          <circle key={`${cx}-${cy}`} cx={cx + 1} cy={cy + 2} r="1.2" fill="rgba(255,255,255,0.4)" />
        ))
      )}
    </svg>
  );
}

/* ─── Context Menu ──────────────────────────────────────────────────────── */
function LayerContextMenu({ x, y, onClose, onRename, onRefresh, onExport, onDelete }) {
  useEffect(() => {
    let mousedownHandler;
    const timer = setTimeout(() => {
      mousedownHandler = (e) => {
        // Only close on left clicks (button 0) to avoid closing when right-clicking again
        if (e.button === 0) onClose();
      };
      document.addEventListener('mousedown', mousedownHandler);
    }, 50);

    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);

    return () => {
      clearTimeout(timer);
      if (mousedownHandler) document.removeEventListener('mousedown', mousedownHandler);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Ensure menu stays within viewport
  const safeX = Math.min(x, window.innerWidth - 180);
  const safeY = Math.min(y, window.innerHeight - 180);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: safeY,
        left: safeX,
        zIndex: 999999,
        background: '#1e1e2e',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 6,
        minWidth: 160,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        animation: 'menuFadeIn 0.1s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes menuFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .mac-context-item {
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          color: #ffffff;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          transition: background 0.1s, color 0.1s;
        }
        .mac-context-item span {
          margin-right: 8px;
          font-size: 14px;
        }
        .mac-context-item:hover {
          background: #8b5cf6; /* Purple hover */
        }
        .mac-context-item.danger:hover {
          background: #ef4444; /* Red hover for delete */
        }
      `}</style>
      <div className="mac-context-item" onClick={() => { onRefresh(); onClose(); }}>
        <span>🔄</span> Refresh Thumbnail
      </div>
      <div className="mac-context-item" onClick={() => { onRename(); onClose(); }}>
        <span>✏️</span> Rename
      </div>
      <div className="mac-context-item" onClick={() => { onExport(); onClose(); }}>
        <span>📤</span> Export Layer
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px' }} />
      <div className="mac-context-item danger" style={{ color: '#ef4444' }} onClick={() => { onDelete(); onClose(); }}>
        <span>🗑️</span> Delete
      </div>
    </div>,
    document.body
  );
}

/* ─── Single layer row ──────────────────────────────────────────────────── */
function LayerRow({
  layer, isActive, onSelect, onToggleVisibility, onToggleLock, onDelete, onRenameLayer, fabricRef,
  isDragging, dropIndicator, onDragStart, onDragOver, onDragEnd, onDrop,
}) {
  const [hovered, setHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const rowRef = useRef(null);
  const popupTimerRef = useRef(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const commitRename = () => {
    setIsRenaming(false);
    if (editName.trim() && editName !== layer.name) {
      onRenameLayer?.(layer.id, editName.trim());
      layer.name = editName.trim();
    } else {
      setEditName(layer.name);
    }
  };

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

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = () => {
    setIsRenaming(true);
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const handleExport = () => {
    const fab = fabricRef?.current;
    if (!fab) return;
    const obj = fab.getObjects().find(o => o.__layerId === layer.id);
    if (!obj) return;

    // Isolate object on canvas
    const originalVisibility = fab.getObjects().map(o => ({ obj: o, visible: o.visible }));
    fab.getObjects().forEach(o => { o.visible = (o === obj); });

    // Save background and make it transparent
    const oldBg = fab.backgroundColor;
    fab.backgroundColor = 'transparent';

    fab.renderAll();

    // Export exact canvas size
    const dataURL = fab.toDataURL({ format: 'png', multiplier: 1 });

    // Restore state
    fab.backgroundColor = oldBg;
    originalVisibility.forEach(s => { s.obj.visible = s.visible; });
    fab.renderAll();

    // Trigger download
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `${layer.name || 'layer_export'}.png`;
    a.click();
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;

    const nativeContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };

    el.addEventListener('contextmenu', nativeContextMenu);
    return () => {
      el.removeEventListener('contextmenu', nativeContextMenu);
      clearTimeout(popupTimerRef.current);
    };
  }, []);

  return (
    <div
      style={{ position: 'relative', paddingBottom: 4 }}
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; onDragOver?.(layer.id, e); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop?.(layer.id); }}
      onContextMenu={handleContextMenu}
    >
      {/* Drop indicator ABOVE */}
      {dropIndicator === 'before' && (
        <div style={{
          position: 'absolute', top: -1, left: 4, right: 4, height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          boxShadow: '0 0 6px rgba(99,102,241,0.7)',
          zIndex: 10, pointerEvents: 'none'
        }} />
      )}

      <div
        ref={rowRef}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';

          // Modern box drag image
          const ghost = document.createElement('div');
          ghost.textContent = layer.name || 'Layer';
          ghost.style.background = '#252525';
          ghost.style.color = '#ffffff';
          ghost.style.padding = '6px 12px';
          ghost.style.borderRadius = '6px';
          ghost.style.border = '1px solid rgba(255,255,255,0.1)';
          ghost.style.fontFamily = 'Inter, sans-serif';
          ghost.style.fontSize = '12px';
          ghost.style.fontWeight = '500';
          ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
          ghost.style.position = 'absolute';
          ghost.style.top = '-1000px';
          ghost.style.left = '-1000px';
          ghost.style.zIndex = '999999';
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 15, 15);
          setTimeout(() => document.body.removeChild(ghost), 0);

          onDragStart?.(layer.id);
        }}
        onDragEnd={() => onDragEnd?.()}
        onContextMenu={handleContextMenu}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 50,
          cursor: 'pointer',
          borderRadius: 8,
          border: isActive
            ? '1px solid rgba(99,102,241,0.7)'
            : dropIndicator
              ? '1px solid rgba(99,102,241,0.35)'
              : '1px solid rgba(255,255,255,0.06)',
          background: isActive
            ? 'rgba(99,102,241,0.18)'
            : hovered
              ? 'rgba(255,255,255,0.09)'
              : 'rgba(22,22,40,0.85)',
          opacity: isDragging ? 0.35 : 1,
          transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
          overflow: 'hidden',
          position: 'relative',
          userSelect: 'none',
        }}
        onMouseEnter={() => { setHovered(true); handleRowEnter(); }}
        onMouseLeave={() => { setHovered(false); handleRowLeave(); }}
        onClick={onSelect}
      >
        {/* Left accent bar */}
        <div style={{
          width: 3, height: '100%', flexShrink: 0,
          borderRadius: '3px 0 0 3px',
          background: isActive
            ? 'linear-gradient(180deg, #6366f1, #8b5cf6)'
            : 'rgba(255,255,255,0.08)',
          transition: 'background 0.15s',
        }} />

        {/* Drag grip */}
        <div
          style={{ padding: '0 4px 0 5px', flexShrink: 0, cursor: 'grab', display: 'flex', alignItems: 'center', opacity: hovered ? 0.8 : 0.25, transition: 'opacity 0.15s' }}
          title="Drag to reorder"
        >
          <GripIcon />
        </div>

        {/* Layer number */}
        <span style={{
          width: 16, textAlign: 'center', fontSize: 10,
          color: isActive ? '#a5b4fc' : 'rgba(255,255,255,0.3)',
          fontWeight: 700, flexShrink: 0, fontVariantNumeric: 'tabular-nums',
        }}>
          {layer.number}
        </span>

        {/* Thumbnail */}
        <div style={{ marginLeft: 5, marginRight: 5, flexShrink: 0, borderRadius: 5, overflow: 'hidden' }}>
          <LayerThumbnail layer={layer} fabricRef={fabricRef} refreshKey={refreshKey} />
        </div>

        {/* Layer name */}
        {isRenaming ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setEditName(layer.name);
                setIsRenaming(false);
              }
            }}
            style={{
              flex: 1,
              fontSize: 11,
              color: '#fff',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid #8b5cf6',
              borderRadius: 3,
              padding: '2px 4px',
              outline: 'none',
              minWidth: 0,
              marginRight: 2,
            }}
          />
        ) : (
          <span style={{
            flex: 1, fontSize: 11,
            color: layer.visible ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            paddingRight: 2,
            fontStyle: layer.visible ? 'normal' : 'italic',
            fontWeight: isActive ? 600 : 400,
          }}
            onDoubleClick={handleRename}
          >
            {layer.name}
          </span>
        )}

        {/* Icon buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1, paddingRight: 5, flexShrink: 0 }}>
          <IconBtn onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            title={layer.visible ? 'Hide layer' : 'Show layer'}
            color={layer.visible ? undefined : '#ef4444'}>
            <EyeIcon hidden={!layer.visible} />
          </IconBtn>
          <IconBtn onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
            title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            color={layer.locked ? '#f59e0b' : undefined}>
            <LockIcon locked={layer.locked} />
          </IconBtn>
          <IconBtn onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete layer" danger>
            <TrashIcon />
          </IconBtn>
        </div>
      </div>

      {/* Drop indicator BELOW */}
      {dropIndicator === 'after' && (
        <div style={{
          position: 'absolute', bottom: 3, left: 4, right: 4, height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          boxShadow: '0 0 6px rgba(99,102,241,0.7)',
          zIndex: 10, pointerEvents: 'none'
        }} />
      )}

      {/* Hover popup */}
      {showPopup && anchorRect && (
        <LayerPreviewPopup layer={layer} fabricRef={fabricRef} anchorRect={anchorRect} refreshKey={refreshKey} />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <LayerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onDelete={onDelete}
        />
      )}
    </div>
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
const MAX_LIST_H = 240; // ~4 rows visible before scrolling kicks in

export default function LayerPanel({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onAddLayer,
  onReorderLayers,
  fabricRef,
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dropPos, setDropPos] = useState('before');

  // Front-to-back order (panel top = frontmost, like Canva)
  const displayLayers = [...layers].reverse();
  const totalLayers = layers.length;

  const handleDragStart = (id) => setDragId(id);

  const handleDragOver = (id, e) => {
    if (id === dragId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOverId(id);
    setDropPos(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
  };

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) { handleDragEnd(); return; }
    const fromIdx = displayLayers.findIndex(l => l.id === dragId);
    const toIdx = displayLayers.findIndex(l => l.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { handleDragEnd(); return; }
    const newDisplay = displayLayers.filter(l => l.id !== dragId);
    let insertAt = newDisplay.findIndex(l => l.id === targetId);
    if (dropPos === 'after') insertAt += 1;
    newDisplay.splice(insertAt, 0, displayLayers[fromIdx]);
    onReorderLayers?.(newDisplay.map(l => l.id));
    handleDragEnd();
  };

  const handleDragEnd = () => { setDragId(null); setDragOverId(null); };

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        zIndex: 50,
        width: 272,
      }}
    >
      {/* Custom scrollbar styles injected once */}
      <style>{`
        .texfy-layer-list {
          overflow-y: auto;
          max-height: ${MAX_LIST_H}px;
          scrollbar-width: thin;
          scrollbar-color: rgba(99,102,241,0.5) transparent;
        }
        .texfy-layer-list::-webkit-scrollbar {
          width: 4px;
        }
        .texfy-layer-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .texfy-layer-list::-webkit-scrollbar-thumb {
          background: rgba(99,102,241,0.45);
          border-radius: 99px;
        }
        .texfy-layer-list::-webkit-scrollbar-thumb:hover {
          background: rgba(139,92,246,0.75);
        }
      `}</style>

      <div
        style={{
          background: 'rgba(12,12,22,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
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
            maxHeight: expanded ? `${MAX_LIST_H + 24}px` : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Separator */}
          <div style={{
            height: 1,
            background: 'rgba(255,255,255,0.07)',
            margin: '0 8px',
          }} />

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
            /* Real scrollable list */
            <div className="texfy-layer-list" style={{ padding: '6px 8px 8px 8px' }}>
              {displayLayers.map((layer) => (
                <LayerRow
                  key={layer.id}
                  layer={layer}
                  isActive={layer.id === activeLayerId}
                  onSelect={() => onSelectLayer(layer.id)}
                  onToggleVisibility={() => onToggleVisibility(layer.id)}
                  onToggleLock={() => onToggleLock(layer.id)}
                  onDelete={() => onDeleteLayer(layer.id)}
                  fabricRef={fabricRef}
                  isDragging={dragId === layer.id}
                  dropIndicator={dragOverId === layer.id ? dropPos : null}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

