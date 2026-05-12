import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as fabric from 'fabric';

const FONTS = [
  { name: 'Inter', label: 'Inter' },
  { name: 'Roboto', label: 'Roboto' },
  { name: 'Playfair Display', label: 'Playfair Display' },
  { name: 'Montserrat', label: 'Montserrat' },
  { name: 'Lobster', label: 'Lobster' },
  { name: 'Oswald', label: 'Oswald' },
  { name: 'Raleway', label: 'Raleway' },
  { name: 'Pacifico', label: 'Pacifico' },
  { name: 'Dancing Script', label: 'Dancing Script' },
  { name: 'Bebas Neue', label: 'Bebas Neue' },
  { name: 'Arial', label: 'Arial' },
  { name: 'Georgia', label: 'Georgia' },
];

export default function LeftSidebar({
  fabricRef,
  selectedObj,
  fontFamily, setFontFamily,
  bold, setBold,
  italic, setItalic,
  underline, setUnderline,
  align, setAlign,
  textColor, setTextColor,
  bgColor, setBgColor,
}) {
  const fileInputRef = useRef(null);
  const [showSeparatorModal, setShowSeparatorModal] = useState(false);

  // ── Draw Tools state ──────────────────────────────────
  const [showDrawTools, setShowDrawTools] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // null | 'pen' | 'marker' | 'highlighter' | 'calligraphy' | 'eraser'
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState('#e11d48');
  const [eraserSize, setEraserSize] = useState(20);

  // SVG cursor data URIs
  const PEN_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' stroke='%23333' stroke-width='1' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.42l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.82z'/%3E%3C/svg%3E") 0 24, crosshair`;
  const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='3' y='9' width='14' height='10' rx='2' fill='%23fff' stroke='%23888' stroke-width='1.5'/%3E%3Crect x='8' y='9' width='9' height='10' rx='2' fill='%23f0f0f0' stroke='%23888' stroke-width='1.5'/%3E%3Cline x1='3' y1='19' x2='20' y2='19' stroke='%23888' stroke-width='1.5'/%3E%3C/svg%3E") 0 20, cell`;

  // Sync fabric drawing mode whenever tool/size/color changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (!activeTool) {
      canvas.isDrawingMode = false;
      // Reset cursor
      const el = canvas.upperCanvasEl || canvas.wrapperEl?.querySelector('canvas');
      if (el) el.style.cursor = '';
      canvas.renderAll();
      return;
    }

    canvas.isDrawingMode = true;

    if (activeTool === 'eraser') {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = '#ffffff';
      canvas.freeDrawingBrush.width = eraserSize;
      canvas.freeDrawingCursor = ERASER_CURSOR;
    } else {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingCursor = PEN_CURSOR;
      if (activeTool === 'pen') {
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize;
      } else if (activeTool === 'marker') {
        canvas.freeDrawingBrush.color = brushColor + 'cc';
        canvas.freeDrawingBrush.width = brushSize * 3;
      } else if (activeTool === 'highlighter') {
        canvas.freeDrawingBrush.color = brushColor + '55';
        canvas.freeDrawingBrush.width = brushSize * 5;
      } else if (activeTool === 'calligraphy') {
        canvas.freeDrawingBrush.color = brushColor;
        canvas.freeDrawingBrush.width = brushSize * 2;
        canvas.freeDrawingBrush.decimate = 1;
      }
    }

    // Apply cursor directly to the upper canvas element
    const upperCanvas = canvas.upperCanvasEl ||
      canvas.wrapperEl?.querySelector('canvas:last-child') ||
      canvas.lowerCanvasEl?.parentElement?.querySelector('canvas:last-child');
    if (upperCanvas) {
      upperCanvas.style.cursor = activeTool === 'eraser' ? ERASER_CURSOR : PEN_CURSOR;
    }

    canvas.renderAll();
  }, [activeTool, brushSize, brushColor, eraserSize]);

  const handleToolSelect = (tool) => {
    setActiveTool(prev => (prev === tool ? null : tool));
  };

  // ── Keyboard shortcuts for draw tools ─────────────────
  useEffect(() => {
    if (!showDrawTools) return;
    const TOOL_KEYS = { p: 'pen', m: 'marker', h: 'highlighter', c: 'calligraphy', e: 'eraser' };
    const onKey = (ev) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const tool = TOOL_KEYS[ev.key.toLowerCase()];
      if (tool) {
        ev.preventDefault();
        setActiveTool(prev => (prev === tool ? null : tool));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDrawTools]);

  const handleClearDrawings = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Remove all path objects (free drawings)
    const paths = canvas.getObjects('path');
    paths.forEach(p => canvas.remove(p));
    canvas.renderAll();
  };

  const handleCloseDrawTools = () => {
    setShowDrawTools(false);
    setActiveTool(null); // exit drawing mode when closing
  };

  const handleLayerSeparatorClick = () => {
    if (isImageSelected) setShowSeparatorModal(true);
  };

  const handleSeparatorMode = (mode) => {
    setShowSeparatorModal(false);
    if (mode === 'color' && fabricRef.current?._separateColorWise) {
      fabricRef.current._separateColorWise();
    } else if (mode === 'area' && fabricRef.current?._separateAreaWise) {
      fabricRef.current._separateAreaWise();
    } else if (mode === 'both' && fabricRef.current?._separateBothWise) {
      fabricRef.current._separateBothWise();
    }
  };

  const handleAddText = () => {
    if (fabricRef.current?._addText) {
      fabricRef.current._addText();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && fabricRef.current?._addImage) {
      fabricRef.current._addImage(file);
    }
    // Reset so the same file can be picked again
    e.target.value = '';
  };

  const isSelected = !!selectedObj;
  // Layer Separator is only active when the selected object is a fabric image
  const isImageSelected = selectedObj && (selectedObj.type === 'image' || selectedObj.type === 'FabricImage' || selectedObj._element);

  const sidebar = (
    <aside
      className="glass"
      style={{
        width: 180,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── TEXT & IMAGE ── */}
      <div className="sidebar-section">
        <div className="section-label">Elements</div>
        <button className="btn btn-primary" onClick={handleAddText}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>T</span> Add Text
        </button>
        <button
          className="btn"
          onClick={handleUploadClick}
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.35)',
            color: '#93c5fd',
            fontWeight: 600,
            fontSize: 12,
            padding: '7px 10px',
            borderRadius: 7,
            cursor: 'pointer',
            transition: 'background 0.18s, border-color 0.18s',
            width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.28)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.65)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
            e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)';
          }}
          title="Upload an image (PNG, JPG, WEBP)"
        >
          📁 Upload Image
        </button>

        {/* ── Layer Separator Button ── */}
        <button
          className="btn"
          onClick={handleLayerSeparatorClick}
          disabled={!isImageSelected}
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'transparent',
            border: `1px solid ${isImageSelected ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
            color: isImageSelected ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.25)',
            fontWeight: 600,
            fontSize: 12,
            padding: '7px 10px',
            borderRadius: 9,
            cursor: isImageSelected ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            width: '100%',
            opacity: isImageSelected ? 1 : 0.45,
          }}
          onMouseEnter={e => {
            if (!isImageSelected) return;
            e.currentTarget.style.background = 'rgba(124,58,237,0.12)';
            e.currentTarget.style.borderColor = 'rgba(124,58,237,0.65)';
          }}
          onMouseLeave={e => {
            if (!isImageSelected) return;
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)';
          }}
          title={isImageSelected ? 'Separate image into color layers' : 'Select an image first'}
        >
          ⚡ Layer Separator
        </button>

        {/* ── Layer Separator Mode Modal ── */}
        {showSeparatorModal && (
          <div
            onClick={() => setShowSeparatorModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'rgba(15,15,25,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: 24,
                width: 320,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
              }}
            >
              {/* Title */}
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
                ⚡ Layer Separator
              </div>

              {/* Subtitle */}
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 4 }}>
                Choose separation mode:
              </div>

              {/* Button 1 — Color Wise */}
              <button
                onClick={() => handleSeparatorMode('color')}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  padding: '12px 14px',
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid #6366f1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.35)';
                  e.currentTarget.style.borderColor = '#818cf8';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>🎨</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>Color Wise</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Separates by similar colors</div>
                </div>
              </button>

              {/* Button 2 — Area Wise */}
              <button
                onClick={() => handleSeparatorMode('area')}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  padding: '12px 14px',
                  background: 'rgba(16,185,129,0.2)',
                  border: '1px solid #10b981',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(16,185,129,0.35)';
                  e.currentTarget.style.borderColor = '#34d399';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(16,185,129,0.2)';
                  e.currentTarget.style.borderColor = '#10b981';
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>📐</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>Area Wise</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Separates by connected regions (PNG only)</div>
                </div>
              </button>

              {/* Button 3 — Both Wise */}
              <button
                onClick={() => handleSeparatorMode('both')}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  padding: '12px 14px',
                  background: 'rgba(245,158,11,0.2)',
                  border: '1px solid #f59e0b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.35)';
                  e.currentTarget.style.borderColor = '#fbbf24';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(245,158,11,0.2)';
                  e.currentTarget.style.borderColor = '#f59e0b';
                }}
              >
                <span style={{ fontSize: 20, lineHeight: 1 }}>✨</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>Both Wise</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>Color + region combined (most accurate)</div>
                </div>
              </button>

              {/* Button 4 — Cancel */}
              <button
                onClick={() => setShowSeparatorModal(false)}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  padding: '12px 14px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FONT ── */}
      <div className="sidebar-section">
        <div className="section-label">Font</div>
        {/* Native select — each option displays in its own font via inline style.
            This works in Chromium-based browsers.
            The selected item in the box also shows the active font. */}
        <select
          className="font-select"
          value={fontFamily}
          onChange={e => setFontFamily(e.target.value)}
          style={{ fontFamily: fontFamily }}
        >
          {FONTS.map(f => (
            <option
              key={f.name}
              value={f.name}
              style={{ fontFamily: f.name, fontSize: '14px', padding: '4px 0' }}
            >
              {f.label}
            </option>
          ))}
        </select>

      </div>

      <div className="sidebar-section">
        <div className="section-label">Style</div>
        <div className="btn-group">
          <button
            className={`btn btn-icon ${bold ? 'btn-active' : ''}`}
            style={{ fontWeight: 700, flex: 1 }}
            onClick={() => setBold(b => !b)}
            title="Bold"
          >
            B
          </button>
          <button
            className={`btn btn-icon ${italic ? 'btn-active' : ''}`}
            style={{ fontStyle: 'italic', flex: 1 }}
            onClick={() => setItalic(i => !i)}
            title="Italic"
          >
            I
          </button>
          <button
            className={`btn btn-icon ${underline ? 'btn-active' : ''}`}
            style={{ textDecoration: 'underline', flex: 1 }}
            onClick={() => setUnderline(u => !u)}
            title="Underline"
          >
            U
          </button>
        </div>
      </div>

      {/* ── ALIGNMENT ── */}
      <div className="sidebar-section">
        <div className="section-label">Alignment</div>
        <div className="btn-group">
          <button
            className={`btn btn-icon ${align === 'left' ? 'btn-active' : ''}`}
            style={{ flex: 1, fontSize: 15 }}
            onClick={() => setAlign('left')}
            title="Left align"
          >
            ≡
          </button>
          <button
            className={`btn btn-icon ${align === 'center' ? 'btn-active' : ''}`}
            style={{ flex: 1, fontSize: 15 }}
            onClick={() => setAlign('center')}
            title="Center align"
          >
            ☰
          </button>
          <button
            className={`btn btn-icon ${align === 'right' ? 'btn-active' : ''}`}
            style={{ flex: 1, fontSize: 15 }}
            onClick={() => setAlign('right')}
            title="Right align"
          >
            ≡
          </button>
        </div>
      </div>

      {/* ── COLOR ── */}
      <div className="sidebar-section">
        <div className="section-label">Color</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="color-row">
            <input
              type="color"
              value={textColor}
              onChange={e => setTextColor(e.target.value)}
              title="Text color"
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Text Color</span>
          </div>
          <div className="color-row">
            <input
              type="color"
              value={bgColor}
              onChange={e => setBgColor(e.target.value)}
              title="Background color"
            />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>BG Color</span>
            {/* Show current bg color as hex label */}
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
              }}
            >
              {bgColor.toUpperCase()}
            </span>
          </div>
        </div>
      </div>


      {/* ── DRAW TOOLS ── */}
      <div className="sidebar-section">
        <div className="section-label">Draw Tools</div>
        <button
          id="draw-tools-btn"
          className="btn btn-primary"
          onClick={() => setShowDrawTools(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: showDrawTools
              ? 'linear-gradient(135deg, #6d28d9, #7c3aed)'
              : 'linear-gradient(135deg, #7c3aed, #9333ea)',
            boxShadow: showDrawTools
              ? '0 4px 18px rgba(124,58,237,0.55)'
              : '0 2px 12px rgba(124,58,237,0.32)',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            fontSize: 12,
            padding: '8px 10px',
            borderRadius: 9,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
          }}
          title="Open drawing tools"
        >
          ✏️ Draw Tools
        </button>
      </div>

      {/* ── Status hint ── */}
      <div style={{ padding: '8px 12px', fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
        {activeTool ? `✏ Drawing: ${activeTool}` : isSelected ? 'Text selected' : 'No text selected'}
      </div>

    </aside>
  );
  // The toolbox is rendered via a portal so it escapes the sidebar's scroll/stacking context
  return (
    <>
      {sidebar}
      {showDrawTools && createPortal(
        <div
          id="draw-toolbox"
          style={{
            position: 'fixed',
            left: 185,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 52,
            background: 'rgba(14,14,24,0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            padding: '8px 0 10px 0',
            animation: 'drawToolboxIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* ── Close button ── */}
          <button
            id="draw-toolbox-close"
            onClick={handleCloseDrawTools}
            title="Close draw tools"
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'rgba(220,38,38,0.8)',
              border: '1.5px solid rgba(239,68,68,0.5)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, transform 0.12s',
              marginBottom: 6,
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,1)';
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.8)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ✕
          </button>

          {/* ── Divider ── */}
          <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 6 }} />

          {/* ── Pen tools ── */}
          {[
            { id: 'pen',         key: 'P', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>), hint: 'Pen — fine tip  [P]', color: '#f87171' },
            { id: 'marker',      key: 'M', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /><line x1="15" y1="5" x2="19" y2="9" /></svg>), hint: 'Marker — bold stroke  [M]', color: '#60a5fa' },
            { id: 'highlighter', key: 'H', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 3.5L20.5 8.5L9 20H4V15L15.5 3.5Z" /><line x1="4" y1="20" x2="20" y2="20" /></svg>), hint: 'Highlighter — transparent  [H]', color: '#fbbf24' },
            { id: 'calligraphy', key: 'C', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17L9 11L13 15L21 7" /><path d="M21 7H15" /><path d="M21 7V13" /></svg>), hint: 'Calligraphy — stylized  [C]', color: '#a78bfa' },
          ].map(tool => (
            <button
              key={tool.id}
              id={`draw-tool-${tool.id}`}
              onClick={() => handleToolSelect(tool.id)}
              title={tool.hint}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: activeTool === tool.id
                  ? `rgba(${tool.id === 'pen' ? '248,113,113' : tool.id === 'marker' ? '96,165,250' : tool.id === 'highlighter' ? '251,191,36' : '167,139,250'},0.18)`
                  : 'transparent',
                border: activeTool === tool.id
                  ? `1.5px solid ${tool.color}`
                  : '1.5px solid transparent',
                color: activeTool === tool.id ? tool.color : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.14s ease',
                marginBottom: 2,
                boxShadow: activeTool === tool.id ? `0 0 10px ${tool.color}44` : 'none',
              }}
              onMouseEnter={e => {
                if (activeTool !== tool.id) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (activeTool !== tool.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }
              }}
            >
              {/* Shortcut badge */}
              <span style={{
                position: 'absolute',
                bottom: 3,
                right: 3,
                fontSize: 7,
                fontWeight: 800,
                fontFamily: 'monospace',
                color: activeTool === tool.id ? tool.color : 'rgba(255,255,255,0.22)',
                lineHeight: 1,
                letterSpacing: 0,
                pointerEvents: 'none',
                transition: 'color 0.14s',
              }}>{tool.key}</span>
              {tool.svg}
            </button>
          ))}

          {/* ── Divider ── */}
          <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

          {/* ── Eraser [E] ── */}
          <button
            id="draw-tool-eraser"
            onClick={() => handleToolSelect('eraser')}
            title="Eraser  [E]"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeTool === 'eraser' ? 'rgba(99,102,241,0.18)' : 'transparent',
              border: activeTool === 'eraser' ? '1.5px solid #818cf8' : '1.5px solid transparent',
              color: activeTool === 'eraser' ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.14s ease',
              marginBottom: 2,
              boxShadow: activeTool === 'eraser' ? '0 0 10px #818cf844' : 'none',
            }}
            onMouseEnter={e => {
              if (activeTool !== 'eraser') {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={e => {
              if (activeTool !== 'eraser') {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }
            }}
          >
            {/* Shortcut badge */}
            <span style={{
              position: 'absolute',
              bottom: 3,
              right: 3,
              fontSize: 7,
              fontWeight: 800,
              fontFamily: 'monospace',
              color: activeTool === 'eraser' ? '#a5b4fc' : 'rgba(255,255,255,0.22)',
              lineHeight: 1,
              pointerEvents: 'none',
              transition: 'color 0.14s',
            }}>E</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H7L3 16l10.5-10.5a2 2 0 0 1 2.83 0l3.17 3.17a2 2 0 0 1 0 2.83L12 19" />
              <path d="M6 11L13 18" />
            </svg>
          </button>

          {/* ── Color swatch (pen tools only) ── */}
          {activeTool && activeTool !== 'eraser' && (
            <div style={{ marginBottom: 2 }}>
              <input
                type="color"
                value={brushColor}
                onChange={e => setBrushColor(e.target.value)}
                title="Brush color"
                style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  padding: 2,
                  background: 'none',
                  display: 'block',
                }}
              />
            </div>
          )}


          {/* ── SIZE SLIDER — vertical ── */}
          {activeTool && (() => {
            const isEraser = activeTool === 'eraser';
            const size = isEraser ? eraserSize : brushSize;
            const maxSize = isEraser ? 60 : 30;
            const accentColor = isEraser ? '#818cf8' : brushColor;
            const dotDiam = Math.round(4 + (size / maxSize) * 18);

            return (
              <>
                <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

                {/* SIZE label */}
                <div style={{
                  fontSize: 8, fontWeight: 800,
                  letterSpacing: '0.1em',
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}>SIZE</div>

                {/* Live dot preview */}
                <div style={{
                  width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 2,
                }}>
                  <div style={{
                    width: dotDiam, height: dotDiam,
                    borderRadius: '50%',
                    background: isEraser ? 'rgba(255,255,255,0.9)' : brushColor,
                    boxShadow: `0 0 ${dotDiam + 4}px ${accentColor}bb`,
                    border: isEraser ? `1.5px solid ${accentColor}` : 'none',
                    transition: 'all 0.14s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                </div>

                {/* Vertical slider — rotated range input */}
                <div style={{
                  height: 80,
                  width: 38,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                  position: 'relative',
                }}>
                  <style>{`
                    #draw-size-slider {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 72px;
                      height: 4px;
                      border-radius: 4px;
                      background: linear-gradient(
                        to right,
                        ${accentColor} 0%,
                        ${accentColor} ${(size / maxSize) * 100}%,
                        rgba(255,255,255,0.1) ${(size / maxSize) * 100}%,
                        rgba(255,255,255,0.1) 100%
                      );
                      outline: none;
                      cursor: pointer;
                      transform: rotate(-90deg);
                    }
                    #draw-size-slider::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      width: 14px;
                      height: 14px;
                      border-radius: 50%;
                      background: ${accentColor};
                      box-shadow: 0 0 8px ${accentColor}99, 0 0 0 2px rgba(0,0,0,0.4);
                      cursor: pointer;
                      transition: transform 0.12s, box-shadow 0.12s;
                    }
                    #draw-size-slider::-webkit-slider-thumb:hover {
                      transform: scale(1.25);
                      box-shadow: 0 0 14px ${accentColor}cc, 0 0 0 3px rgba(0,0,0,0.4);
                    }
                    #draw-size-slider::-moz-range-thumb {
                      width: 14px; height: 14px;
                      border-radius: 50%;
                      background: ${accentColor};
                      border: none;
                      box-shadow: 0 0 8px ${accentColor}99;
                      cursor: pointer;
                    }
                    #draw-size-slider::-moz-range-track {
                      background: rgba(255,255,255,0.1);
                      height: 4px;
                      border-radius: 4px;
                    }
                  `}</style>
                  <input
                    id="draw-size-slider"
                    type="range"
                    min={isEraser ? 4 : 1}
                    max={maxSize}
                    value={size}
                    onChange={e => isEraser
                      ? setEraserSize(Number(e.target.value))
                      : setBrushSize(Number(e.target.value))
                    }
                  />
                </div>

                {/* Value badge */}
                <div style={{
                  width: 28, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}44`,
                  borderRadius: 6,
                  fontSize: 10, fontWeight: 800,
                  color: accentColor,
                  fontVariantNumeric: 'tabular-nums',
                  marginBottom: 2,
                  letterSpacing: '0.02em',
                }}>{size}px</div>
              </>
            );
          })()}

          {/* ── Divider ── */}
          <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

          {/* ── Clear ── */}
          <button
            id="draw-tool-clear"
            onClick={handleClearDrawings}
            title="Clear all drawings"
            style={{
              width: 38, height: 38,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: '1.5px solid transparent',
              color: 'rgba(255,100,100,0.55)',
              cursor: 'pointer',
              transition: 'all 0.14s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
              e.currentTarget.style.color = '#fca5a5';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,100,100,0.55)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>

        </div>,
        document.body
      )}
    </>
  );
}
