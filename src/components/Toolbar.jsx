import { useState, useRef } from 'react';
import * as fabric from 'fabric';
import { jsPDF } from 'jspdf';

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
