import CollapsibleSection from './CollapsibleSection';

const EFFECTS = [
  { key: 'normal',  label: 'Normal',  icon: '◎' },
  { key: 'shadow',  label: 'Shadow',  icon: '▣' },
  { key: 'glow',    label: 'Glow',    icon: '✸' },
  { key: 'outline', label: 'Outline', icon: '▢' },
  { key: 'neon',    label: 'Neon',    icon: '⚡' },
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
  fabricRef,
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

  // ── Canvas position alignment helper ──────────────────
  const alignObj = (fn) => {
    const canvas = fabricRef?.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) return;
    obj.setCoords();
    fn(obj, canvas);
    obj.setCoords();
    canvas.requestRenderAll();
  };

  return (
    <aside
      className="glass right-sidebar"
    >
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Properties</div>
      </div>

      {/* ── FONT SIZE ── */}
      <CollapsibleSection title="Font Size">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="btn btn-icon"
            style={{ flexShrink: 0, fontSize: 15, color: 'rgba(255,255,255,0.5)' }}
            onClick={dec}
          >−</button>
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
          <button
            className="btn btn-icon"
            style={{ flexShrink: 0, fontSize: 15, color: 'rgba(255,255,255,0.5)' }}
            onClick={inc}
          >+</button>
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
      </CollapsibleSection>

      {/* ── SPACING ── */}
      <CollapsibleSection title="Spacing">
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
            className="slider-purple"
            style={sliderStyle(letterSpacing, 0, 20, '#7c3aed', '#a78bfa')}
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
            className="slider-purple"
            style={sliderStyle(lineHeight, 1.0, 3.0, '#7c3aed', '#a78bfa')}
          />
        </div>
      </CollapsibleSection>

      {/* ── OPACITY ── */}
      <CollapsibleSection title="Opacity">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Value</span>
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
          className="slider-purple"
          style={sliderStyle(opacity, 0, 100, '#7c3aed', '#a78bfa')}
        />
      </CollapsibleSection>

      {/* ── TEXT EFFECTS ── */}
      <CollapsibleSection title="Text Effects">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {EFFECTS.map(ef => (
            <button
              key={ef.key}
              className={`btn btn-effect ${effect === ef.key ? 'btn-active' : ''}`}
              onClick={() => setEffect(ef.key)}
            >
              <span style={{ fontSize: 13, lineHeight: 1 }}>{ef.icon}</span>
              {ef.label}
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* ── ROTATION ── */}
      <CollapsibleSection title="Rotation">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Angle</span>
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
          className="slider-purple"
          style={sliderStyle(rotation, -180, 180, '#7c3aed', '#a78bfa')}
        />
      </CollapsibleSection>

      {/* ── POSITION ── */}
      {selectedObj && (
        <CollapsibleSection title="Position">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>

            {/* Center H */}
            <button
              className="btn"
              style={{ fontSize: 11, padding: '6px 4px', gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Center horizontally on canvas"
              onClick={() => alignObj((obj, cv) => {
                const bl = obj.getBoundingRect(true);
                obj.set({ left: obj.left + (cv.getWidth() / 2 - (bl.left + bl.width / 2)) });
              })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="2" x2="12" y2="22"/><rect x="4" y="7" width="16" height="10" rx="2"/>
              </svg>
              Center H
            </button>

            {/* Center V */}
            <button
              className="btn"
              style={{ fontSize: 11, padding: '6px 4px', gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Center vertically on canvas"
              onClick={() => alignObj((obj, cv) => {
                const bl = obj.getBoundingRect(true);
                obj.set({ top: obj.top + (cv.getHeight() / 2 - (bl.top + bl.height / 2)) });
              })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="2" y1="12" x2="22" y2="12"/><rect x="7" y="4" width="10" height="16" rx="2"/>
              </svg>
              Center V
            </button>

            {/* Left */}
            <button
              className="btn"
              style={{ fontSize: 11, padding: '6px 4px', gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Align to left edge of canvas"
              onClick={() => alignObj((obj) => {
                const bl = obj.getBoundingRect(true);
                obj.set({ left: obj.left - bl.left });
              })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="2" x2="4" y2="22"/><rect x="4" y="7" width="12" height="10" rx="2"/>
              </svg>
              Left
            </button>

            {/* Right */}
            <button
              className="btn"
              style={{ fontSize: 11, padding: '6px 4px', gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Align to right edge of canvas"
              onClick={() => alignObj((obj, cv) => {
                const bl = obj.getBoundingRect(true);
                obj.set({ left: obj.left + (cv.getWidth() - (bl.left + bl.width)) });
              })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="20" y1="2" x2="20" y2="22"/><rect x="8" y="7" width="12" height="10" rx="2"/>
              </svg>
              Right
            </button>

            {/* Top */}
            <button
              className="btn"
              style={{ fontSize: 11, padding: '6px 4px', gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Align to top edge of canvas"
              onClick={() => alignObj((obj) => {
                const bl = obj.getBoundingRect(true);
                obj.set({ top: obj.top - bl.top });
              })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="2" y1="4" x2="22" y2="4"/><rect x="7" y="4" width="10" height="12" rx="2"/>
              </svg>
              Top
            </button>

            {/* Bottom */}
            <button
              className="btn"
              style={{ fontSize: 11, padding: '6px 4px', gap: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Align to bottom edge of canvas"
              onClick={() => alignObj((obj, cv) => {
                const bl = obj.getBoundingRect(true);
                obj.set({ top: obj.top + (cv.getHeight() - (bl.top + bl.height)) });
              })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="2" y1="20" x2="22" y2="20"/><rect x="7" y="8" width="10" height="12" rx="2"/>
              </svg>
              Bottom
            </button>

          </div>
        </CollapsibleSection>
      )}
    </aside>
  );
}
