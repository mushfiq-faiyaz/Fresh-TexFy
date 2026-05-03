const EFFECTS = [
  { key: 'normal', label: 'Normal', icon: '○' },
  { key: 'shadow', label: 'Shadow', icon: '◐' },
  { key: 'glow', label: 'Glow', icon: '✦' },
  { key: 'outline', label: 'Outline', icon: '◻' },
  { key: 'neon', label: 'Neon', icon: '⚡' },
];

// Build CSS for a colored slider track (filled up to current value)
function sliderStyle(value, min, max, gradFrom, gradTo) {
  const pct = ((value - min) / (max - min)) * 100;
  return {
    background: `linear-gradient(to right, ${gradFrom} 0%, ${gradTo} ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
    width: '100%',
    display: 'block',
  };
}

function useScrollOnSlider(setter, min, max, step = 1) {
  return (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    setter(v => Math.max(min, Math.min(max, parseFloat((v + delta).toFixed(2)))));
  };
}

export default function RightSidebar({
  selectedObj,
  fontSize, setFontSize,
  letterSpacing, setLetterSpacing,
  lineHeight, setLineHeight,
  opacity, setOpacity,
  effect, setEffect,
  rotation, setRotation,
}) {
  const inc = () => setFontSize(s => Math.min(s + 1, 200));
  const dec = () => setFontSize(s => Math.max(s - 1, 8));

  const onScrollFontSize = useScrollOnSlider(setFontSize, 8, 200, 1);
  const onScrollLetterSp = useScrollOnSlider(setLetterSpacing, 0, 20, 0.5);
  const onScrollLineHeight = useScrollOnSlider(setLineHeight, 1.0, 3.0, 0.1);
  const onScrollOpacity = useScrollOnSlider(setOpacity, 0, 100, 1);
  const onScrollRotation = useScrollOnSlider(setRotation, -180, 180, 1);

  return (
    <aside
      className="glass right-sidebar"
    >
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Properties</div>
      </div>

      {/* ── FONT SIZE ── */}
      <div className="sidebar-section">
        <div className="section-label">Font Size</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="btn btn-icon" style={{ flexShrink: 0 }} onClick={dec}>−</button>
          <input
            type="number"
            className="number-input"
            value={fontSize}
            min={8}
            max={200}
            onChange={e => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) setFontSize(Math.min(200, Math.max(8, v)));
            }}
            onWheel={onScrollFontSize}
            style={{ flex: 1, width: 'auto' }}
          />
          <button className="btn btn-icon" style={{ flexShrink: 0 }} onClick={inc}>+</button>
        </div>
        {/* Prominent font-size slider */}
        <div style={{ marginTop: 10, width: '100%' }}>
          <input
            type="range"
            min={8}
            max={200}
            step={1}
            value={fontSize}
            onChange={e => setFontSize(parseInt(e.target.value))}
            onWheel={onScrollFontSize}
            className="slider-purple slider-fs"
            style={sliderStyle(fontSize, 8, 200, '#7c3aed', '#a78bfa')}
          />
        </div>
      </div>

      {/* ── SPACING ── */}
      <div className="sidebar-section">
        <div className="section-label">Spacing</div>

        <div style={{ marginBottom: 12, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Letter</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{letterSpacing}</span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={0.5}
            value={letterSpacing}
            onChange={e => setLetterSpacing(parseFloat(e.target.value))}
            onWheel={onScrollLetterSp}
            className="slider-blue"
            style={sliderStyle(letterSpacing, 0, 20, '#1d4ed8', '#60a5fa')}
          />
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Line Height</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{lineHeight.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={3.0}
            step={0.1}
            value={lineHeight}
            onChange={e => setLineHeight(parseFloat(e.target.value))}
            onWheel={onScrollLineHeight}
            className="slider-cyan"
            style={sliderStyle(lineHeight, 1.0, 3.0, '#0891b2', '#67e8f9')}
          />
        </div>
      </div>

      {/* ── OPACITY ── */}
      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Opacity</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{opacity}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={opacity}
          onChange={e => setOpacity(parseInt(e.target.value))}
          onWheel={onScrollOpacity}
          className="slider-green"
          style={sliderStyle(opacity, 0, 100, '#059669', '#6ee7b7')}
        />
      </div>

      {/* ── TEXT EFFECTS ── */}
      <div className="sidebar-section">
        <div className="section-label">Text Effects</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {EFFECTS.map(ef => (
            <button
              key={ef.key}
              className={`btn ${effect === ef.key ? 'btn-active' : ''}`}
              style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12, padding: '5px 8px' }}
              onClick={() => setEffect(ef.key)}
            >
              <span style={{ fontSize: 14 }}>{ef.icon}</span>
              {ef.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TRANSFORM / ROTATE ── */}
      <div className="sidebar-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Rotation</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{rotation}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={rotation}
          onChange={e => setRotation(parseInt(e.target.value))}
          onWheel={onScrollRotation}
          className="slider-orange"
          style={sliderStyle(rotation, -180, 180, '#d97706', '#fcd34d')}
        />
      </div>
    </aside>
  );
}
