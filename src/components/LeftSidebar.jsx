import { useRef, useState } from 'react';

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

  return (
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
            background: isImageSelected
              ? 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(168,85,247,0.18) 100%)'
              : 'rgba(255,255,255,0.04)',
            border: isImageSelected
              ? '1px solid rgba(167,139,250,0.45)'
              : '1px solid rgba(255,255,255,0.1)',
            color: isImageSelected ? '#c4b5fd' : 'rgba(255,255,255,0.25)',
            fontWeight: 600,
            fontSize: 12,
            padding: '7px 10px',
            borderRadius: 7,
            cursor: isImageSelected ? 'pointer' : 'not-allowed',
            transition: 'background 0.18s, border-color 0.18s, color 0.18s',
            width: '100%',
            opacity: isImageSelected ? 1 : 0.55,
          }}
          onMouseEnter={e => {
            if (!isImageSelected) return;
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(168,85,247,0.3) 100%)';
            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.75)';
          }}
          onMouseLeave={e => {
            if (!isImageSelected) return;
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(168,85,247,0.18) 100%)';
            e.currentTarget.style.borderColor = 'rgba(167,139,250,0.45)';
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
        {/* Preview strip — shows selected font name rendered in that font */}
        <div
          style={{
            marginTop: 6,
            padding: '5px 8px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 5,
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: fontFamily,
            fontSize: 15,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            letterSpacing: '0.01em',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
          title={`Preview: ${fontFamily}`}
        >
          {fontFamily}
        </div>
      </div>

      {/* ── STYLE ── */}
      <div className="sidebar-section">
        <div className="section-label">Style</div>
        <div className="btn-group">
          <button
            className={`btn btn-icon ${bold ? 'btn-active' : ''}`}
            style={{ fontWeight: 700, fontSize: 13, width: '33%' }}
            onClick={() => setBold(b => !b)}
            title="Bold"
          >
            B
          </button>
          <button
            className={`btn btn-icon ${italic ? 'btn-active' : ''}`}
            style={{ fontStyle: 'italic', fontSize: 13, width: '33%' }}
            onClick={() => setItalic(i => !i)}
            title="Italic"
          >
            I
          </button>
          <button
            className={`btn btn-icon ${underline ? 'btn-active' : ''}`}
            style={{ textDecoration: 'underline', fontSize: 13, width: '33%' }}
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
            className={`btn ${align === 'left' ? 'btn-active' : ''}`}
            style={{ flex: 1, fontSize: 14, padding: '5px 4px' }}
            onClick={() => setAlign('left')}
            title="Left align"
          >
            ≡
          </button>
          <button
            className={`btn ${align === 'center' ? 'btn-active' : ''}`}
            style={{ flex: 1, fontSize: 14, padding: '5px 4px' }}
            onClick={() => setAlign('center')}
            title="Center align"
          >
            ☰
          </button>
          <button
            className={`btn ${align === 'right' ? 'btn-active' : ''}`}
            style={{ flex: 1, fontSize: 14, padding: '5px 4px' }}
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
            {/* Show current bg color as swatch label */}
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {bgColor}
            </span>
          </div>
        </div>
      </div>

      {/* ── Status hint ── */}
      <div style={{ marginTop: 'auto', padding: '10px 12px', fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
        {isSelected ? 'Text selected' : 'No text selected'}
      </div>
    </aside>
  );
}
