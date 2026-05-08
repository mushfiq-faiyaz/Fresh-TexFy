import { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';

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
  { group: 'Move',       items: [
    { keys: ['↑ ↓ ← →'],          label: 'Nudge 1 px' },
    { keys: ['Shift', '↑↓←→'],    label: 'Nudge 10 px' },
  ]},
  { group: 'Layer Order', items: [
    { keys: ['Ctrl', ']'],         label: 'Bring Forward' },
    { keys: ['Ctrl', '['],         label: 'Send Backward' },
  ]},
];

function ShortcutsModal({ onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(12,12,22,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 18,
          padding: '28px 32px',
          width: 420,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
          animation: 'shortcutsIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <style>{`
          @keyframes shortcutsIn {
            from { opacity: 0; transform: scale(0.92) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
              ⌨️ Keyboard Shortcuts
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              Speed up your workflow
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, padding: '4px 10px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Groups */}
        {SHORTCUTS.map(group => (
          <div key={group.group} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: 'rgba(167,139,250,0.8)', textTransform: 'uppercase', marginBottom: 8,
            }}>
              {group.group}
            </div>
            {group.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: i < group.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{item.label}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {item.keys.map((k, ki) => (
                    <span key={ki}>
                      <span style={{
                        background: 'rgba(99,102,241,0.18)',
                        border: '1px solid rgba(99,102,241,0.4)',
                        borderRadius: 5,
                        padding: '2px 7px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#a5b4fc',
                        fontFamily: 'monospace',
                        letterSpacing: '0.02em',
                      }}>
                        {k}
                      </span>
                      {ki < item.keys.length - 1 && (
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', margin: '0 2px' }}>+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Footer hint */}
        <div style={{ marginTop: 8, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Press <span style={{ color: 'rgba(255,255,255,0.4)' }}>Esc</span> or click outside to close
        </div>
      </div>
    </div>
  );
}

const EXPORT_FORMATS = [
  { key: 'png',  label: '🖼 Export as PNG',  icon: '🖼' },
  { key: 'jpg',  label: '📷 Export as JPG',  icon: '📷' },
  { key: 'jpeg', label: '📷 Export as JPEG', icon: '📷' },
  { key: 'webp', label: '🌐 Export as WEBP', icon: '🌐' },
  { key: 'svg',  label: '✏️ Export as SVG',  icon: '✏️' },
  { key: 'pdf',  label: '📄 Export as PDF',  icon: '📄' },
];

export default function Toolbar({ fabricRef, undoStack, setUndoStack, redoStack, setRedoStack }) {
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
      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 });
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('texfy-design.pdf');
    } else if (format === 'jpg' || format === 'jpeg') {
      const dataURL = canvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 2 });
      const link = document.createElement('a');
      link.download = `texfy-design.${format}`;
      link.href = dataURL;
      link.click();
    } else if (format === 'webp') {
      const dataURL = canvas.toDataURL({ format: 'webp', quality: 0.95, multiplier: 2 });
      const link = document.createElement('a');
      link.download = 'texfy-design.webp';
      link.href = dataURL;
      link.click();
    } else {
      // PNG default
      const dataURL = canvas.toDataURL({ format: 'png', multiplier: 2 });
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          boxShadow: '0 0 12px rgba(124,58,237,0.5)',
          flexShrink: 0,
        }}>Tx</div>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
          Texfy
        </span>
      </div>

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
          <div className="export-dropdown glass" onMouseLeave={() => setShowExport(false)}>
            {EXPORT_FORMATS.map(f => (
              <div
                key={f.key}
                className="export-item"
                onClick={() => handleExport(f.key)}
              >
                {f.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
