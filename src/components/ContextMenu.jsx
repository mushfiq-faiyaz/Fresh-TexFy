import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

// ── Canvas presets (mirror Toolbar.jsx) ──────────────────────────────────────
const CANVAS_PRESETS = [
  { label: '800×600',   w: 800,  h: 600  },
  { label: '1280×720',  w: 1280, h: 720  },
  { label: '1920×1080', w: 1920, h: 1080 },
  { label: '1080×1080', w: 1080, h: 1080 },
  { label: '1080×1920', w: 1080, h: 1920 },
];

// ── Lucide-style SVG icons (15px stroke, matches LayerPanel's Lucide icons) ──
function Ico({ d, color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

// Icon paths
const IC = {
  copy:      'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2M8 4h8',
  paste:     'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
  duplicate: 'M7 9H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2M9 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z',
  trash:     'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
  front:     'M5 18h14v2H5zM12 2l-4 4h3v8h2V6h3z',
  back:      'M5 4h14v2H5zM12 22l4-4h-3v-8h-2v8H8z',
  forward:   'M12 4l-4 4h3v6h2V8h3z',
  backward:  'M12 20l4-4h-3v-6h-2v6H8z',
  edit:      'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  lock:      'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  unlock:    'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 9.9-1',
  rename:    'M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  align:     'M3 6h18M3 12h18M3 18h12',
  canvas:    'M3 3h18v18H3V3zM3 9h18M9 3v18',
  custom:    'M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 16.5-3.5z',
  text:      'M4 7V4h16v3M9 20h6M12 4v16',
  upload:    'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  replace:   'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15',
  flipH:     'M12 3v18M3 8h5v8H3zM16 8h5v8h-5z',
  flipV:     'M3 12h18M8 3h8v5H8zM8 16h8v5H8z',
  fitCanvas: 'M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3',
  info:      'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 16v-4M12 8h.01',
};

// ── Exact LayerPanel divider style ────────────────────────────────────────────
function Divider() {
  return <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0' }} />;
}

// ── Exact LayerPanel menu item style (.mac-context-item) ──────────────────────
// height: 32px; margin: 0 4px; padding: 0 12px; border-radius: 8px;
// color: #ffffff; font-size: 13px; font-weight: 400; letter-spacing: 0.01em;
// hover: rgba(255,255,255,0.08)
// danger color: #ff5f57 | danger hover: rgba(255, 95, 87, 0.15)
// icon span: margin-right 8px, font-size 16px, opacity 0.85, width 16px
function Item({ icon, label, danger, disabled, onClick, hasSubmenu, onMouseEnter, onMouseLeave, isActive }) {
  const [hov, setHov] = useState(false);

  const bg = hov
    ? danger ? 'rgba(255,95,87,0.15)' : 'rgba(255,255,255,0.08)'
    : isActive ? 'rgba(255,255,255,0.08)' : 'transparent';

  return (
    <div
      role="menuitem"
      aria-disabled={disabled}
      onMouseEnter={(e) => { setHov(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHov(false); onMouseLeave?.(e); }}
      onClick={disabled ? undefined : onClick}
      style={{
        height: 32,
        margin: '0 4px',
        padding: '0 12px',
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'rgba(255,255,255,0.28)' : danger ? '#ff5f57' : '#ffffff',
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: '0.01em',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        alignItems: 'center',
        background: bg,
        transition: 'background 0.1s ease',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {/* Icon — exact LayerPanel icon span */}
      <span style={{
        marginRight: 8,
        fontSize: 16,
        opacity: disabled ? 0.3 : 0.85,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        flexShrink: 0,
        color: danger ? '#ff5f57' : 'currentColor',
      }}>
        {icon && <Ico d={icon} color={disabled ? 'rgba(255,255,255,0.28)' : danger ? '#ff5f57' : undefined} />}
      </span>

      <span style={{ flex: 1 }}>{label}</span>

      {hasSubmenu && (
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginLeft: 4 }}>›</span>
      )}
    </div>
  );
}

// ── Submenu panel — same shell as main menu ───────────────────────────────────
function Submenu({ children, x, y }) {
  return createPortal(
    <div
      className="ctx-submenu"
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000001,
        minWidth: 200,
        background: 'rgba(30, 30, 40, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '4px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        animation: 'menuFadeIn 120ms ease-out',
        pointerEvents: 'all',
      }}
    >
      {children}
    </div>,
    document.body
  );
}

// ── Main ContextMenu ──────────────────────────────────────────────────────────
export default function ContextMenu({
  visible, x, y, contextType, onClose,
  onPaste, onAddText, onUploadImage, onResizeCanvas,
  onDuplicate, onDelete, onCopy,
  onBringToFront, onSendToBack, onBringForward, onSendBackward,
  onEditText, onToggleLock, onRenameLayer, onAlign,
  onReplaceImage, onFlipH, onFlipV,
  isLocked, hasClipboard, showCustomSizeModal,
  onFitCanvasToImage, selectedIsImage,
  onImageInfo,
}) {
  const menuRef = useRef(null);
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [submenuPos, setSubmenuPos] = useState({ x: 0, y: 0 });
  const submenuTimerRef = useRef(null);

  // Clamp to viewport
  const safeX = Math.min(x, window.innerWidth  - 220);
  const safeY = Math.min(y, window.innerHeight - 400);

  // Close on outside click / Escape (same as LayerPanel: 50ms delay)
  useEffect(() => {
    if (!visible) return;
    let handler;
    const timer = setTimeout(() => {
      handler = (e) => {
        if (e.button === 0) {
          const subs = document.querySelectorAll('.ctx-submenu');
          let inSub = false;
          subs.forEach(s => { if (s.contains(e.target)) inSub = true; });
          if (!inSub && menuRef.current && !menuRef.current.contains(e.target)) {
            onClose();
          }
        }
      };
      document.addEventListener('mousedown', handler);
    }, 50);
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      if (handler) document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, [visible, onClose]);

  const openSubmenu = useCallback((name, triggerEl) => {
    clearTimeout(submenuTimerRef.current);
    const rect = triggerEl.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const SW = 220, SH = 260;
    const overflow = rect.right + 4 + SW > vw - 8;
    const sx = overflow ? rect.left - SW - 4 : rect.right + 4;
    const sy = Math.max(8, Math.min(rect.top, vh - SH - 8));
    setSubmenuPos({ x: sx, y: sy });
    setActiveSubmenu(name);
  }, []);

  const closeSubmenu = useCallback(() => {
    submenuTimerRef.current = setTimeout(() => setActiveSubmenu(null), 180);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(submenuTimerRef.current);
  }, []);

  const run = useCallback((fn) => { onClose(); fn?.(); }, [onClose]);

  if (!visible) return null;

  // ── Canvas menu ─────────────────────────────────────────────────────────────
  const renderCanvas = () => (
    <>
      <Item icon={IC.paste}  label="Paste"        disabled={!hasClipboard} onClick={() => run(onPaste)} />
      <Item icon={IC.text}   label="Add Text"      onClick={() => run(onAddText)} />
      <Item icon={IC.upload} label="Upload Image"  onClick={() => run(onUploadImage)} />
      <Divider />
      <Item
        icon={IC.canvas} label="Canvas Size" hasSubmenu
        isActive={activeSubmenu === 'canvasSize'}
        onMouseEnter={e => openSubmenu('canvasSize', e.currentTarget)}
        onMouseLeave={closeSubmenu}
      />
      {activeSubmenu === 'canvasSize' && (
        <Submenu x={submenuPos.x} y={submenuPos.y}>
          <div onMouseEnter={cancelClose} onMouseLeave={closeSubmenu}>
            {CANVAS_PRESETS.map(p => (
              <Item key={p.label} icon={IC.canvas} label={p.label}
                onClick={() => run(() => onResizeCanvas(p.w, p.h))} />
            ))}
            <Divider />
            <Item icon={IC.custom} label="Custom size…"
              onClick={() => run(showCustomSizeModal)} />
          </div>
        </Submenu>
      )}
      <Item
        icon={IC.fitCanvas}
        label="Fit Canvas to Image"
        disabled={!selectedIsImage}
        onClick={() => run(onFitCanvasToImage)}
      />
    </>
  );

  // ── Align submenu (shared) ──────────────────────────────────────────────────
  const alignSubmenu = () => activeSubmenu === 'align' && (
    <Submenu x={submenuPos.x} y={submenuPos.y}>
      <div onMouseEnter={cancelClose} onMouseLeave={closeSubmenu}>
        <Item icon={IC.align} label="Center Horizontally" onClick={() => run(() => onAlign('centerH'))} />
        <Item icon={IC.align} label="Center Vertically"   onClick={() => run(() => onAlign('centerV'))} />
        <Divider />
        <Item icon={IC.align} label="Align Left"          onClick={() => run(() => onAlign('left'))} />
        <Item icon={IC.align} label="Align Right"         onClick={() => run(() => onAlign('right'))} />
        <Item icon={IC.align} label="Align Top"           onClick={() => run(() => onAlign('top'))} />
        <Item icon={IC.align} label="Align Bottom"        onClick={() => run(() => onAlign('bottom'))} />
      </div>
    </Submenu>
  );

  // ── Text menu ───────────────────────────────────────────────────────────────
  const renderText = () => (
    <>
      <Item icon={IC.copy}      label="Copy"           onClick={() => run(onCopy)} />
      <Item icon={IC.paste}     label="Paste"          disabled={!hasClipboard} onClick={() => run(onPaste)} />
      <Item icon={IC.duplicate} label="Duplicate"      onClick={() => run(onDuplicate)} />
      <Item icon={IC.trash}     label="Delete"  danger onClick={() => run(onDelete)} />
      <Divider />
      <Item icon={IC.front}    label="Bring to Front" onClick={() => run(onBringToFront)} />
      <Item icon={IC.back}     label="Send to Back"   onClick={() => run(onSendToBack)} />
      <Item icon={IC.forward}  label="Bring Forward"  onClick={() => run(onBringForward)} />
      <Item icon={IC.backward} label="Send Backward"  onClick={() => run(onSendBackward)} />
      <Divider />
      <Item icon={IC.edit}   label="Edit Text"   onClick={() => run(onEditText)} />
      <Item icon={isLocked ? IC.unlock : IC.lock}
            label={isLocked ? 'Unlock Layer' : 'Lock Layer'}
            onClick={() => run(onToggleLock)} />
      <Item icon={IC.rename} label="Rename Layer" onClick={() => run(onRenameLayer)} />
      <Item icon={IC.align}  label="Align" hasSubmenu
            isActive={activeSubmenu === 'align'}
            onMouseEnter={e => openSubmenu('align', e.currentTarget)}
            onMouseLeave={closeSubmenu} />
      {alignSubmenu()}
    </>
  );

  // ── Image menu ──────────────────────────────────────────────────────────────
  const renderImage = () => (
    <>
      <Item icon={IC.info} label="Image Info" onClick={() => run(onImageInfo)} />
      <Divider />
      <Item icon={IC.copy}      label="Copy"           onClick={() => run(onCopy)} />
      <Item icon={IC.paste}     label="Paste"          disabled={!hasClipboard} onClick={() => run(onPaste)} />
      <Item icon={IC.duplicate} label="Duplicate"      onClick={() => run(onDuplicate)} />
      <Item icon={IC.trash}     label="Delete"  danger onClick={() => run(onDelete)} />
      <Divider />
      <Item icon={IC.front}    label="Bring to Front" onClick={() => run(onBringToFront)} />
      <Item icon={IC.back}     label="Send to Back"   onClick={() => run(onSendToBack)} />
      <Item icon={IC.forward}  label="Bring Forward"  onClick={() => run(onBringForward)} />
      <Item icon={IC.backward} label="Send Backward"  onClick={() => run(onSendBackward)} />
      <Divider />
      <Item icon={IC.replace} label="Replace Image"    onClick={() => run(onReplaceImage)} />
      <Item icon={IC.flipH}   label="Flip Horizontal"  onClick={() => run(onFlipH)} />
      <Item icon={IC.flipV}   label="Flip Vertical"    onClick={() => run(onFlipV)} />
      <Divider />
      <Item icon={isLocked ? IC.unlock : IC.lock}
            label={isLocked ? 'Unlock Layer' : 'Lock Layer'}
            onClick={() => run(onToggleLock)} />
      <Item icon={IC.rename} label="Rename Layer" onClick={() => run(onRenameLayer)} />
      <Item icon={IC.align}  label="Align" hasSubmenu
            isActive={activeSubmenu === 'align'}
            onMouseEnter={e => openSubmenu('align', e.currentTarget)}
            onMouseLeave={closeSubmenu} />
      {alignSubmenu()}
    </>
  );

  // ── Render via portal (same as LayerContextMenu) ──────────────────────────
  return createPortal(
    <>
      <style>{`
        @keyframes menuFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div
        ref={menuRef}
        role="menu"
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: Math.max(8, safeY),
          left: Math.max(8, safeX),
          zIndex: 999999,
          background: 'rgba(30, 30, 40, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '4px 0',
          minWidth: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          animation: 'menuFadeIn 120ms ease-out',
        }}
      >
        {contextType === 'canvas' && renderCanvas()}
        {contextType === 'text'   && renderText()}
        {contextType === 'image'  && renderImage()}
      </div>
    </>,
    document.body
  );
}
