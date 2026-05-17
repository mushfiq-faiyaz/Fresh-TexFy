import { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';
import FreshTexfyLogo from './FreshTexfyLogo';
import { Image, ImageIcon, FileImage, Globe, Code2, FileText } from 'lucide-react';

// ── Canvas preset sizes ──────────────────────────────────────────────────────
const CANVAS_PRESETS = [
  { label: '800×600',   w: 800,  h: 600,  tag: 'Default' },
  { label: '1280×720',  w: 1280, h: 720,  tag: 'HD' },
  { label: '1920×1080', w: 1920, h: 1080, tag: 'Full HD' },
  { label: '1080×1080', w: 1080, h: 1080, tag: 'Square' },
  { label: '1080×1920', w: 1080, h: 1920, tag: 'Portrait' },
];

// ── Custom size modal ────────────────────────────────────────────────────────
function CustomSizeModal({ currentW, currentH, onApply, onClose }) {
  const [w, setW] = useState(String(currentW));
  const [h, setH] = useState(String(currentH));

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleApply = () => {
    const nw = parseInt(w, 10);
    const nh = parseInt(h, 10);
    if (!isNaN(nw) && !isNaN(nh) && nw > 0 && nh > 0) {
      onApply(nw, nh);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, rgba(35,35,52,0.98), rgba(22,22,36,0.98))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '24px 28px',
          minWidth: 280,
          boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>Custom Canvas Size</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 2px',
            }}
          >×</button>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Width</label>
            <input
              type="number"
              value={w}
              onChange={e => setW(e.target.value)}
              min={200}
              max={4000}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '7px 10px',
                color: '#fff',
                fontSize: 14,
                width: '100%',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18, marginTop: 18 }}>×</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Height</label>
            <input
              type="number"
              value={h}
              onChange={e => setH(e.target.value)}
              min={200}
              max={4000}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '7px 10px',
                color: '#fff',
                fontSize: 14,
                width: '100%',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>
        <button
          onClick={handleApply}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            padding: '9px 0',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ── Canvas size picker button ────────────────────────────────────────────────
function CanvasSizeButton({ canvasResizeRef }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const applySize = (w, h) => {
    setSize({ w, h });
    setOpen(false);
    setShowCustom(false);
    if (canvasResizeRef && canvasResizeRef.current) {
      canvasResizeRef.current(w, h);
    }
  };

  return (
    <>
      <div ref={wrapperRef} style={{ position: 'relative' }}>
        <button
          id="canvas-size-btn"
          onClick={() => setOpen(v => !v)}
          title="Canvas size"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            height: 30,
            padding: '0 10px',
            borderRadius: 8,
            background: open ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.06)',
            border: open ? '1px solid rgba(124,58,237,0.55)' : '1px solid rgba(255,255,255,0.1)',
            color: open ? '#c4b5fd' : 'rgba(255,255,255,0.75)',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
          {size.w}×{size.h}
          <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 1 }}>▾</span>
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 999999,
              background: 'rgba(22, 22, 36, 0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 12,
              padding: '4px 0',
              minWidth: 190,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              animation: 'menuFadeIn 120ms ease-out',
            }}
          >
            <style>{`
              @keyframes menuFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to   { opacity: 1; transform: scale(1); }
              }
              .cs-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 12px;
                height: 32px;
                margin: 0 4px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                color: #fff;
                font-family: Inter, system-ui, sans-serif;
              }
              .cs-item:hover { background: rgba(255,255,255,0.08); }
            `}</style>
            {CANVAS_PRESETS.map(p => (
              <div key={p.label} className="cs-item" onClick={() => applySize(p.w, p.h)}>
                <span>{p.label}</span>
                <span style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  background: 'rgba(124,58,237,0.2)',
                  color: '#c4b5fd',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}>{p.tag}</span>
              </div>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 12px' }} />
            <div
              className="cs-item"
              onClick={() => { setOpen(false); setShowCustom(true); }}
            >
              <span>Custom…</span>
              <span style={{ fontSize: 13, opacity: 0.4 }}>&#9999;</span>
            </div>
          </div>
        )}
      </div>

      {showCustom && (
        <CustomSizeModal
          currentW={size.w}
          currentH={size.h}
          onApply={applySize}
          onClose={() => setShowCustom(false)}
        />
      )}
    </>
  );
}

/* ── Keyboard shortcuts reference ─────────────────────────────────────── */
const SHORTCUTS = [
  { group: 'History',    items: [
    { keys: ['Ctrl', 'Z'],         label: 'Undo' },
    { keys: ['Ctrl', 'Y'],         label: 'Redo' },
  ]},
  { group: 'Edit',       items: [
    { keys: ['Ctrl', 'C'],         label: 'Copy' },
    { keys: ['Ctrl', 'X'],         label: 'Cut' },
    { keys: ['Ctrl', 'V'],         label: 'Paste' },
    { keys: ['Ctrl', 'D'],         label: 'Duplicate' },
    { keys: ['Ctrl', 'A'],         label: 'Select All' },
    { keys: ['Del'],               label: 'Delete selected' },
    { keys: ['Esc'],               label: 'Deselect' },
  ]},
  { group: 'Arrange',    items: [
    { keys: ['Ctrl', '↑'],         label: 'Bring forward' },
    { keys: ['Ctrl', '↓'],         label: 'Send backward' },
    { keys: ['Ctrl', 'Shift', '↑'],label: 'Bring to front' },
    { keys: ['Ctrl', 'Shift', '↓'],label: 'Send to back' },
  ]},
  { group: 'Tools',      items: [
    { keys: ['Space (hold)'],      label: 'Pan canvas' },
    { keys: ['Shift', 'Click'],    label: 'Multi-select' },
    { keys: ['Mouse Wheel'],       label: 'Pan vertical' },
    { keys: ['Shift', 'Wheel'],    label: 'Pan horizontal' },
    { keys: ['Ctrl', 'Wheel'],     label: 'Zoom in/out' },
  ]},
];

function ShortcutsModal({ onClose }) {
  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        className="glass modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640,
          background: 'linear-gradient(145deg, rgba(35,35,50,0.95), rgba(25,25,35,0.95))',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, opacity: 0.8 }}>⌨️</span> Keyboard Shortcuts
          </h2>
          <button
            className="btn btn-icon"
            onClick={onClose}
            style={{ width: 32, height: 32, fontSize: 18 }}
          >×</button>
        </div>

        {/* Content */}
        <div style={{
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 24,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}>
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#8b5cf6'
              }}>
                {group.group}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.items.map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{item.label}</span>
                    <span style={{ display: 'flex', gap: 4 }}>
                      {item.keys.map((k, ki) => (
                        <span key={ki} style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 11,
                            color: '#fff',
                            fontFamily: 'monospace',
                            boxShadow: '0 2px 0 rgba(0,0,0,0.2)',
                            letterSpacing: '0.02em',
                          }}>
                            {k}
                          </span>
                          {ki < item.keys.length - 1 && (
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '0 2px' }}>+</span>
                          )}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Press <span style={{ color: 'rgba(255,255,255,0.4)' }}>Esc</span> or click outside to close
        </div>
      </div>
    </div>
  );
}

const EXPORT_FORMATS = [
  { key: 'png',  label: 'Export as PNG',  icon: <Image size={15} className="opacity-70" />,      badge: 'PNG' },
  { key: 'jpg',  label: 'Export as JPG',  icon: <ImageIcon size={15} className="opacity-70" />,  badge: 'JPG' },
  { key: 'jpeg', label: 'Export as JPEG', icon: <FileImage size={15} className="opacity-70" />,  badge: 'JPEG' },
  { key: 'webp', label: 'Export as WEBP', icon: <Globe size={15} className="opacity-70" />,      badge: 'WEBP' },
  { key: 'svg',  label: 'Export as SVG',  icon: <Code2 size={15} className="opacity-70" />,      badge: 'SVG' },
  { key: 'pdf',  label: 'Export as PDF',  icon: <FileText size={15} className="opacity-70" />,   badge: 'PDF' },
];

export default function Toolbar({ fabricRef, canvasResizeRef, undoStack, setUndoStack, redoStack, setRedoStack }) {
  const [showExport, setShowExport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const exportRef = useRef(null);

  // ── Undo ──────────────────────────────────────────────
  const handleUndo = () => {
    if (undoStack.length <= 1) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const prev = undoStack[undoStack.length - 2];
    const current = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, current]);
    setUndoStack(u => u.slice(0, -1));
    canvas.loadFromJSON(prev).then(() => canvas.renderAll());
  };

  // ── Redo ──────────────────────────────────────────────
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, next]);
    setRedoStack(r => r.slice(0, -1));
    canvas.loadFromJSON(next).then(() => canvas.renderAll());
  };

  // ── Listen for texfy-undo / texfy-redo custom events (fired by Ctrl+Z / Ctrl+Y) ──
  useEffect(() => {
    const onUndo = () => handleUndo();
    const onRedo = () => handleRedo();
    document.addEventListener('texfy-undo', onUndo);
    document.addEventListener('texfy-redo', onRedo);
    return () => {
      document.removeEventListener('texfy-undo', onUndo);
      document.removeEventListener('texfy-redo', onRedo);
    };
  }, [undoStack, redoStack]);

  // ── Export ────────────────────────────────────────────
  const handleExport = (format) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Use multiplier:1 so the exported file is exactly the canvas pixel size.
    // (multiplier:2 would always double it, e.g. 800×600 → 1600×1200)
    const W = canvas.getWidth();
    const H = canvas.getHeight();

    if (format === 'svg') {
      const svgData = canvas.toSVG();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'texfy-design.svg';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
      const pdf = new jsPDF({
        orientation: W > H ? 'landscape' : 'portrait',
        unit: 'px',
        format: [W, H],
      });
      pdf.addImage(dataURL, 'PNG', 0, 0, W, H);
      pdf.save('texfy-design.pdf');
    } else if (format === 'jpg' || format === 'jpeg') {
      const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 1 });
      const link = document.createElement('a');
      link.download = `texfy-design.${format}`;
      link.href = dataURL;
      link.click();
    } else if (format === 'webp') {
      const dataURL = canvas.toDataURL({ format: 'webp', quality: 0.95, multiplier: 1 });
      const link = document.createElement('a');
      link.download = 'texfy-design.webp';
      link.href = dataURL;
      link.click();
    } else {
      // PNG default
      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 1 });
      const link = document.createElement('a');
      link.download = 'texfy-design.png';
      link.href = dataURL;
      link.click();
    }

    setShowExport(false);
  };

  return (
    <header
      className="glass"
      style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <FreshTexfyLogo />

      {/* Canvas Size Button */}
      <CanvasSizeButton canvasResizeRef={canvasResizeRef} />

      {/* Undo */}
      <button
        className="btn btn-icon"
        onClick={handleUndo}
        disabled={undoStack.length <= 1}
        title="Undo (Ctrl+Z)"
        style={{ opacity: undoStack.length <= 1 ? 0.35 : 1 }}
      >
        ↩
      </button>

      {/* Redo */}
      <button
        className="btn btn-icon"
        onClick={handleRedo}
        disabled={redoStack.length === 0}
        title="Redo (Ctrl+Y)"
        style={{ opacity: redoStack.length === 0 ? 0.35 : 1 }}
      >
        ↪
      </button>

      {/* Keyboard shortcuts help */}
      <button
        className="btn btn-icon"
        onClick={() => setShowShortcuts(v => !v)}
        title="Keyboard shortcuts (?)"
        style={{
          width: 30, height: 30,
          borderRadius: 8,
          background: showShortcuts
            ? 'rgba(99,102,241,0.28)'
            : 'rgba(255,255,255,0.06)',
          border: showShortcuts
            ? '1px solid rgba(99,102,241,0.6)'
            : '1px solid rgba(255,255,255,0.1)',
          color: showShortcuts ? '#a5b4fc' : 'rgba(255,255,255,0.55)',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        ?
      </button>

      {/* Shortcuts modal */}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Export */}
      <div style={{ position: 'relative' }} ref={exportRef}>
        <button
          className="btn btn-primary"
          style={{ width: 'auto', paddingLeft: 14, paddingRight: 14, gap: 6 }}
          onClick={() => setShowExport(v => !v)}
        >
          Export ▾
        </button>

        {showExport && (
          <div
            onMouseLeave={() => setShowExport(false)}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
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
            <style>{`
              @keyframes menuFadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .mac-export-item {
                height: 32px;
                margin: 0 4px;
                padding: 0 12px;
                border-radius: 8px;
                cursor: pointer;
                color: #ffffff;
                font-size: 13px;
                font-weight: 400;
                letter-spacing: 0.01em;
                display: flex;
                align-items: center;
              }
              .mac-export-item span.icon {
                margin-right: 8px;
                font-size: 16px;
                opacity: 0.85;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 16px;
              }
              .mac-export-item:hover {
                background: rgba(255,255,255,0.08);
              }
            `}</style>
            {EXPORT_FORMATS.map(f => (
              <div
                key={f.key}
                className="mac-export-item"
                onClick={() => handleExport(f.key)}
              >
                <span className="icon">{f.icon}</span>
                {f.label}
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  marginLeft: 'auto',
                  opacity: 0.6
                }}>{f.badge}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
