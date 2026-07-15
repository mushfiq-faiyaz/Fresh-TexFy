import { useRef, useState } from 'react';
import CollapsibleSection from './CollapsibleSection';



// ── Simple color name helper ─────────────────────────────────────────────────
const NAMED_PALETTE = [
  ['White',   [255,255,255]], ['Black',   [0,0,0]],
  ['Red',     [220,38,38]],   ['Orange',  [234,88,12]],
  ['Yellow',  [234,179,8]],   ['Green',   [22,163,74]],
  ['Teal',    [20,184,166]],  ['Cyan',    [6,182,212]],
  ['Blue',    [37,99,235]],   ['Indigo',  [79,70,229]],
  ['Violet',  [124,58,237]],  ['Purple',  [168,85,247]],
  ['Pink',    [236,72,153]],  ['Rose',    [244,63,94]],
  ['Brown',   [120,53,15]],   ['Gray',    [107,114,128]],
  ['Silver',  [192,192,192]], ['Lime',    [132,204,22]],
  ['Amber',   [245,158,11]],  ['Maroon',  [127,29,29]],
  ['Navy',    [30,58,138]],   ['Olive',   [77,77,0]],
];

function colorName(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  let bestName = 'Color', bestDist = Infinity;
  for (const [name, [pr, pg, pb]] of NAMED_PALETTE) {
    const dist = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
    if (dist < bestDist) { bestDist = dist; bestName = name; }
  }
  return bestName;
}

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
  rotation, setRotation,
  imageColors,
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

      {/* ── COLORS DETECTED ── */}
      {imageColors && imageColors.length > 0 && (
        <ColorsDetectedSection imageColors={imageColors} fabricRef={fabricRef} />
      )}
    </aside>
  );
}

// ── Colors Detected section — self-contained with show-more state ──────────
const TOP_N = 5; // colors shown by default

function ColorsDetectedSection({ imageColors, fabricRef }) {
  const [expanded, setExpanded] = useState(false);

  const primary   = imageColors.slice(0, TOP_N);
  const secondary = imageColors.slice(TOP_N);
  const hasMore   = secondary.length > 0;

  return (
    <CollapsibleSection title="Colors Detected">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>

        {/* Primary colors — always visible */}
        {primary.map((item, idx) => (
          <DetectedColorRow
            key={`${item.hex}-${idx}`}
            item={item}
            fabricRef={fabricRef}
          />
        ))}

        {/* Secondary colors — hidden by default */}
        {hasMore && (
          <>
            {/* Animated reveal container */}
            <div
              style={{
                overflow: 'hidden',
                maxHeight: expanded ? `${secondary.length * 38}px` : '0px',
                transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingTop: 0 }}>
                {secondary.map((item, idx) => (
                  <DetectedColorRow
                    key={`${item.hex}-${TOP_N + idx}`}
                    item={item}
                    fabricRef={fabricRef}
                  />
                ))}
              </div>
            </div>

            {/* Toggle button */}
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px 0',
                color: 'rgba(255,255,255,0.38)',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.04em',
                transition: 'color 0.15s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
            >
              {/* Chevron icon */}
              <svg
                width="10" height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={{
                  flexShrink: 0,
                  transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {expanded ? 'Show fewer' : `${secondary.length} more color${secondary.length > 1 ? 's' : ''}`}
            </button>
          </>
        )}

        {/* Footer hint */}
        <div style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.22)',
          letterSpacing: '0.04em',
          paddingTop: 1,
        }}>
          Click a color to recolor it in the image
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ── Detected Color Row — one per palette entry ─────────────────────────────
// Renders a round circle + label + coverage bar + hex — matches LeftSidebar color-row.
// Clicking opens the native color picker; on change, replaces that color in
// the currently selected image on the canvas.
function DetectedColorRow({ item, fabricRef }) {
  const { hex, coverage } = item;
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const newHex = e.target.value;
    if (!newHex || !fabricRef?.current) return;
    const canvas = fabricRef.current;
    const img = canvas.getActiveObject?.();
    if (!img) return;
    const isImage = img._element || img.type === 'image' || img.type === 'FabricImage';
    if (!isImage) return;
    canvas._replaceImageColor?.(img, hex, newHex, 40);
  };

  return (
    <div
      className="color-row"
      style={{ cursor: 'pointer', alignItems: 'center' }}
      onClick={handleClick}
      title={`Click to change this color everywhere in the image`}
    >
      {/* Round circle swatch — hidden native color input styled via CSS */}
      <input
        ref={inputRef}
        type="color"
        value={hex}
        onChange={handleChange}
        title={`Change ${colorName(hex)} (${hex.toUpperCase()})`}
        style={{ pointerEvents: 'none', flexShrink: 0 }}
      />

      {/* Label + coverage bar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
            {colorName(hex)}
          </span>
          <span style={{
            fontSize: 9,
            color: 'rgba(255,255,255,0.32)',
            fontFamily: 'monospace',
            letterSpacing: '0.04em',
            flexShrink: 0,
            marginLeft: 6,
          }}>
            {hex.toUpperCase()}
          </span>
        </div>
        {/* Coverage bar */}
        {coverage > 0 && (
          <div style={{
            marginTop: 3,
            height: 2,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, coverage)}%`,
              borderRadius: 999,
              background: hex,
              opacity: 0.75,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}
