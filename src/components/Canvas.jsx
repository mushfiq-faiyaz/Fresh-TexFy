import { useEffect, useRef, useCallback, useState } from 'react';
import * as fabric from 'fabric';

import LayerPanel from './LayerPanel';

// ── Cursor names — native OS cursors (Windows/macOS style) ──────────────────
// These map to the system cursor set shown in the cursor reference image:
//   move       → Sizeall   (4-way arrows ✛)
//   nwse-resize→ Sizenwse  (↖↘ diagonal, for TL & BR corners)
//   nesw-resize→ Sizenesw  (↗↙ diagonal, for TR & BL corners)
//   ns-resize  → Sizens    (↕ vertical,  for top & bottom edges)
//   ew-resize  → Sizeew    (↔ horizontal, for left & right edges)
//   crosshair  → Crosshair (+ for rotation handle)
//   text       → Ibeam     (I-beam for text objects)
//   grab       → Hand      (open hand on hover-drag)
//   grabbing   → (closed hand while dragging)
//   default    → Arrow     (empty canvas)
// No custom SVG needed — browser renders native OS shapes.

// ── Apply fabric v7 global selection style defaults ───────────────────────────
if (fabric.InteractiveFabricObject) {
  Object.assign(fabric.InteractiveFabricObject.ownDefaults, {
    borderColor: 'rgba(107, 95, 228, 0.85)',       // #6B5FE4 Figma/Linear style
    borderDashArray: null,
    cornerColor: '#ffffff',
    cornerStrokeColor: 'rgba(107, 95, 228, 0.85)',
    cornerStyle: 'rect',
    cornerSize: 8,
    borderScaleFactor: 1.5,
    transparentCorners: false,
    borderOpacity: 1,
    padding: 0,                   // crisp padding
  });
} else {
  fabric.Object.prototype.borderColor = 'rgba(107, 95, 228, 0.85)';
  fabric.Object.prototype.borderDashArray = null;
  fabric.Object.prototype.cornerColor = '#ffffff';
  fabric.Object.prototype.cornerStrokeColor = 'rgba(107, 95, 228, 0.85)';
  fabric.Object.prototype.cornerStyle = 'rect';
  fabric.Object.prototype.cornerSize = 8;
  fabric.Object.prototype.borderScaleFactor = 1.5;
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.borderOpacity = 1;
  fabric.Object.prototype.padding = 0;
}

// Ensure default hover cursor for text is 'move' (unless editing)
fabric.IText.prototype.hoverCursor = 'move';

// ── Custom control render functions ────────────────────────────────────────────
// Small rounded square for corner handles
function renderCornerSquare(key, ctx, left, top, _styleOverride, fabricObject) {
  const canvas = fabricObject.canvas;
  const isHovered = canvas && canvas._hoveredCorner === key && canvas._hoveredTarget === fabricObject;
  const size = isHovered ? 8 * 1.2 : 8;

  ctx.save();
  ctx.translate(left, top);
  if (fabricObject.angle) ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));

  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  const r = 2; // border-radius
  const w = size, h = size;
  const x = -w / 2, y = -h / 2;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#6B5FE4';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// Even smaller rounded square for edge handles
function renderEdgeSquare(key, ctx, left, top, _styleOverride, fabricObject) {
  const canvas = fabricObject.canvas;
  const isHovered = canvas && canvas._hoveredCorner === key && canvas._hoveredTarget === fabricObject;
  const size = isHovered ? 6 * 1.2 : 6;

  ctx.save();
  ctx.translate(left, top);
  if (fabricObject.angle) ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));

  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  const r = 1.5;
  const w = size, h = size;
  const x = -w / 2, y = -h / 2;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(107, 95, 228, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

// Rotate handle — sleek curved arrow icon (↻)
function renderRotateHandle(key, ctx, left, top, _styleOverride, fabricObject) {
  const canvas = fabricObject.canvas;
  const isHovered = canvas && canvas._hoveredCorner === key && canvas._hoveredTarget === fabricObject;
  const size = isHovered ? 18 * 1.15 : 18;

  ctx.save();
  ctx.translate(left, top);
  if (fabricObject.angle) ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));

  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Curved arrow icon
  ctx.beginPath();
  const arcRadius = size * 0.28;
  ctx.arc(0, 0, arcRadius, -Math.PI * 0.6, Math.PI * 0.8);
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const tipX = arcRadius * Math.cos(Math.PI * 0.8);
  const tipY = arcRadius * Math.sin(Math.PI * 0.8);
  ctx.beginPath();
  ctx.moveTo(tipX + 2.5, tipY - 0.5);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(tipX + 0.5, tipY - 3);
  ctx.stroke();

  ctx.restore();
}

// ── Custom SVG Cursors for Canvas Resizing ───────────────────────────────────
// Custom rotated I-beam cursor for text
function getRotatedIBeamCursor(angle) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g transform='rotate(${angle || 0},12,12)' stroke='black' stroke-width='1.5' stroke-linecap='round'><path d='M10,4L14,4M12,4L12,20M10,20L14,20'/></g></svg>`;
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `url("data:image/svg+xml,${encoded}") 12 12, text`;
}
const CURSOR_NWSE = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2724%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cg%20transform%3D%27rotate%28-45%2C12%2C12%29%27%20fill%3D%27black%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M12%2C4L17%2C8L13.5%2C8L13.5%2C16L17%2C16L12%2C20L7%2C16L10.5%2C16L10.5%2C8L7%2C8Z%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") 12 12, nwse-resize`;

const CURSOR_NESW = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2724%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cg%20transform%3D%27rotate%2845%2C12%2C12%29%27%20fill%3D%27black%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M12%2C4L17%2C8L13.5%2C8L13.5%2C16L17%2C16L12%2C20L7%2C16L10.5%2C16L10.5%2C8L7%2C8Z%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") 12 12, nesw-resize`;

const CURSOR_NS = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2724%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cg%20fill%3D%27black%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M12%2C4L17%2C8L13.5%2C8L13.5%2C16L17%2C16L12%2C20L7%2C16L10.5%2C16L10.5%2C8L7%2C8Z%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") 12 12, ns-resize`;

const CURSOR_EW = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2724%27%20height%3D%2724%27%20viewBox%3D%270%200%2024%2024%27%3E%3Cg%20transform%3D%27rotate%2890%2C12%2C12%29%27%20fill%3D%27black%27%20stroke%3D%27white%27%20stroke-width%3D%271.5%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M12%2C4L17%2C8L13.5%2C8L13.5%2C16L17%2C16L12%2C20L7%2C16L10.5%2C16L10.5%2C8L7%2C8Z%27%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") 12 12, ew-resize`;

// ── Apply custom controls to all fabric objects ────────────────────────────────
function applyCustomControls(obj) {
  if (!obj || !obj.controls) return;

  const CONTROL_BASE_ANGLES = { mt: 0, tr: 45, mr: 90, br: 135, mb: 180, bl: 225, ml: 270, tl: 315 };
  const CURSOR_MAP = {
    0: CURSOR_NS, 1: CURSOR_NESW, 2: CURSOR_EW, 3: CURSOR_NWSE,
    4: CURSOR_NS, 5: CURSOR_NESW, 6: CURSOR_EW, 7: CURSOR_NWSE
  };

  ['tl', 'tr', 'bl', 'br', 'mt', 'mb', 'ml', 'mr'].forEach(key => {
    if (obj.controls[key]) {
      const isCorner = ['tl', 'tr', 'bl', 'br'].includes(key);
      obj.controls[key].render = isCorner ? renderCornerSquare.bind(null, key) : renderEdgeSquare.bind(null, key);
      obj.controls[key].sizeX = isCorner ? 12 : 10;
      obj.controls[key].sizeY = isCorner ? 12 : 10;

      // Dynamic rotation-aware cursor
      obj.controls[key].cursorStyleHandler = (eventData, control, fabricObject) => {
        const baseAngle = CONTROL_BASE_ANGLES[key];
        const objAngle = fabricObject.angle || 0;
        const totalAngle = baseAngle + objAngle;
        const step = ((Math.round(totalAngle / 45) % 8) + 8) % 8;
        return CURSOR_MAP[step];
      };
    }
  });

  if (obj.controls['mtr']) {
    obj.controls['mtr'].render = renderRotateHandle.bind(null, 'mtr');

    // Create custom SVG rotate cursor (or use crosshair/alias)
    const rotateSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><g fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'/><path d='M3 3v5h5'/></g></svg>`;
    const rotateEncoded = encodeURIComponent(rotateSvg).replace(/'/g, '%27').replace(/"/g, '%22');
    obj.controls['mtr'].cursorStyle = `url("data:image/svg+xml,${rotateEncoded}") 12 12, alias`;

    delete obj.controls['mtr'].cursorStyleHandler;
    obj.controls['mtr'].sizeX = 18;
    obj.controls['mtr'].sizeY = 18;
    obj.controls['mtr'].offsetY = -22; // Push it up slightly more
  }
}


const MIN_W = 200, MIN_H = 200;
const MAX_W = 2000, MAX_H = 2000;
const DEFAULT_W = 800;
const DEFAULT_H = 600;

export default function Canvas({
  fabricRef,
  selectedObj,
  setSelectedObj,
  zoom,
  setZoom,
  bgColor,
  // state from sidebars
  fontSize, setFontSize,
  fontFamily,
  bold, italic, underline,
  align,
  textColor,
  letterSpacing,
  lineHeight,
  opacity,
  effect,
  rotation,
  undoStack, setUndoStack,
  redoStack, setRedoStack,
  // 2-way sync callbacks
  setLetterSpacing,
  setLineHeight,
  setOpacity,
  setRotation,
  // Layer props
  layers,
  activeLayerId,
  onLayerAdd,
  onLayerSelect,
  onLayerNameUpdate,
  onLayerRemove,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onDeleteLayer,
  onReorderLayers,
  // Canvas resize ref — Toolbar stores resizeCanvas(w,h) function here
  canvasResizeRef,
}) {
  const canvasElRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const isHistorySaving = useRef(false);
  const blankLayerCountRef = useRef(0); // increments for each "+" blank layer added

  // Canvas dimensions (resizable)
  const [canvasSize, setCanvasSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const canvasSizeRef = useRef({ w: DEFAULT_W, h: DEFAULT_H });

  // Drag-and-drop state
  const [isDragOver, setIsDragOver] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null); // { message, visible }
  const toastTimerRef = useRef(null);

  // Layer separator loading overlay state
  const [isSeparating, setIsSeparating] = useState(false);

  // Resize handle dragging state
  const resizingRef = useRef(null); // { corner, startX, startY, startW, startH }

  // Keep layer callbacks in refs so canvas event handlers always see latest version
  const onLayerAddRef = useRef(onLayerAdd);
  const onLayerSelectRef = useRef(onLayerSelect);
  const onLayerNameUpdateRef = useRef(onLayerNameUpdate);
  const onLayerRemoveRef = useRef(onLayerRemove);

  useEffect(() => { onLayerAddRef.current = onLayerAdd; }, [onLayerAdd]);
  useEffect(() => { onLayerSelectRef.current = onLayerSelect; }, [onLayerSelect]);
  useEffect(() => { onLayerNameUpdateRef.current = onLayerNameUpdate; }, [onLayerNameUpdate]);
  useEffect(() => { onLayerRemoveRef.current = onLayerRemove; }, [onLayerRemove]);

  // ── Init fabric canvas ────────────────────────────────
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: DEFAULT_W,
      height: DEFAULT_H,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    // ── Context-sensitive cursors ─────────────────────────────────────────
    // Fabric automatically reads `cursorStyle` from controls and calls
    // canvas.setCursor(). We only need to set the defaults + text special-case.
    canvas.defaultCursor = 'default';   // Arrow — empty canvas
    canvas.hoverCursor = 'move';      // Sizeall — hovering any object
    canvas.moveCursor = 'grabbing';  // grabbing — while moving

    // Grabbing cursor while dragging
    const upper = canvas.upperCanvasEl;
    canvas.on('mouse:down', (e) => {
      if (e.target && !e.target.isGuide && !canvas.isDrawingMode) {
        if (upper) upper.style.cursor = 'grabbing';
      }
    });
    canvas.on('mouse:up', () => {
      // Let Fabric reset cursor on next mousemove naturally
      if (upper) upper.style.cursor = '';
    });

    // Dynamic text hover cursor (I-beam rotation)
    canvas.on('mouse:move', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'i-text') {
        if (!obj.__corner) {
          obj.hoverCursor = obj.isEditing ? getRotatedIBeamCursor(obj.angle) : 'move';
        }
      }
    });

    // Share rotation with the hidden textarea (native caret alignment) and lock custom cursor
    canvas.on('text:editing:entered', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'i-text') {
        const rotatedCursor = getRotatedIBeamCursor(obj.angle);

        // Fabric hardcodes these to 'text' internally when editing, so we must override them here
        obj.hoverCursor = rotatedCursor;
        canvas.defaultCursor = rotatedCursor;
        canvas.moveCursor = rotatedCursor;

        if (obj.hiddenTextarea) {
          obj.hiddenTextarea.style.transform = `rotate(${obj.angle}deg)`;
          obj.hiddenTextarea.style.transformOrigin = 'center center';
        }

        if (upper) upper.style.cursor = rotatedCursor;
      }
    });

    // Restore cursors when editing is finished
    canvas.on('text:editing:exited', (e) => {
      const obj = e.target;
      if (obj && obj.type === 'i-text') {
        obj.hoverCursor = 'move';
      }
      canvas.defaultCursor = 'default';
      canvas.moveCursor = 'grabbing';
      if (upper) upper.style.cursor = 'default';
    });

    // Object events
    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => {
      setSelectedObj(null);
      onLayerSelectRef.current(null);
    });
    canvas.on('object:modified', saveHistory);
    canvas.on('object:added', (e) => {
      // Skip guides, blank layers, and drawing-mode paths (path:created handles those)
      if (!e.target) return;
      if (e.target.isGuide || e.target.isCenterGuide || e.target.__isBlankLayer) return;
      if (e.target.type === 'path' && canvas.isDrawingMode) return; // path:created will save
      saveHistory();
    });

    // Apply custom controls whenever an object is added
    canvas.on('object:added', (e) => {
      if (e.target) applyCustomControls(e.target);
      canvas.requestRenderAll();
    });

    // ── 2-way sync: canvas → sidebar ──────────────────
    const updateSidebar = () => {
      const obj = canvas.getActiveObject();
      if (!obj) return;

      // For multi-selection (ActiveSelection), don't read individual angles
      // — doing so and writing back would rotate the whole group
      const isMultiSelection = obj.type === 'activeSelection' || obj.type === 'ActiveSelection';

      if (obj.type === 'i-text') {
        setFontSize(Math.round(obj.fontSize || 32));
        setLetterSpacing(obj.charSpacing ? Math.round(obj.charSpacing / 10 * 10) / 10 : 0);
        setLineHeight(Math.round((obj.lineHeight || 1.2) * 10) / 10);
        setOpacity(Math.round((obj.opacity ?? 1) * 100));
        if (!isMultiSelection) setRotation(Math.round(obj.angle || 0));
      } else {
        setOpacity(Math.round((obj.opacity ?? 1) * 100));
        // Only sync rotation for single objects — not group selections
        if (!isMultiSelection) setRotation(Math.round(obj.angle || 0));
      }
    };

    canvas.on('object:rotating', updateSidebar);
    canvas.on('object:scaling', updateSidebar);
    canvas.on('object:modified', updateSidebar);
    canvas.on('selection:created', updateSidebar);
    canvas.on('selection:updated', updateSidebar);

    // Update delete button position on any relevant event
    canvas.on('object:moving', updateDeletePos);
    canvas.on('object:scaling', updateDeletePos);
    canvas.on('object:rotating', updateDeletePos);
    canvas.on('selection:created', updateDeletePos);
    canvas.on('selection:updated', updateDeletePos);
    canvas.on('selection:cleared', () => setDeletePos(null));
    canvas.on('object:modified', updateDeletePos);

    // ── Text editing: update layer name when text changes ──
    canvas.on('text:changed', (e) => {
      if (e.target) onLayerNameUpdateRef.current(e.target);
    });

    // ── Object removed (e.g. Delete key): sync layer ──
    canvas.on('object:removed', (e) => {
      if (e.target) onLayerRemoveRef.current(e.target);
    });

    // ── path:created — auto-register free-drawn paths as layers ──
    // Fabric fires this after the user lifts the pen in drawing mode
    let drawingCount = 0;
    canvas.on('path:created', (e) => {
      const path = e.path;
      if (!path) return;
      drawingCount += 1;
      applyCustomControls(path);
      path.text = `Drawing ${drawingCount}`;
      onLayerAddRef.current(path);
      // Select the newly drawn path so the user can move/edit it
      canvas.setActiveObject(path);
      canvas.requestRenderAll();
      // Save history after path is fully set up (object:added fires before path:created)
      saveHistory();
    });

    // ── Double click to deselect ───────────────────────
    canvas.on('mouse:dblclick', (e) => {
      if (!e.target) {
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObj(null);
        onLayerSelectRef.current(null);
      }
    });

    // ── Keyboard shortcuts ───────────────────────────
    let _clipboard = null; // local clipboard for copy/paste

    const onKeyDown = (e) => {
      const isTyping =
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA';

      const active = canvas.getActiveObject();
      const isEditing = active?.isEditing;

      // ── Ctrl / Cmd combos ──────────────────────────
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          // Undo
          case 'z':
            if (!isTyping) {
              e.preventDefault();
              document.dispatchEvent(new CustomEvent('texfy-undo'));
            }
            break;

          // Redo (Ctrl+Y or Ctrl+Shift+Z)
          case 'y':
            if (!isTyping) {
              e.preventDefault();
              document.dispatchEvent(new CustomEvent('texfy-redo'));
            }
            break;

          // Copy
          case 'c':
            if (!isEditing && active) {
              e.preventDefault();
              active.clone().then(cloned => { _clipboard = cloned; });
            }
            break;

          // Cut — works for single & multi-selection
          case 'x':
            if (!isEditing && active) {
              e.preventDefault();
              active.clone().then(cloned => {
                _clipboard = cloned;
                const toRemove = canvas.getActiveObjects();
                canvas.discardActiveObject();
                toRemove.forEach(o => canvas.remove(o));
                canvas.renderAll();
                setSelectedObj(null);
              });
            }
            break;

          // Paste
          case 'v':
            if (!isTyping && _clipboard) {
              e.preventDefault();
              _clipboard.clone().then(cloned => {
                cloned.set({ left: (_clipboard.left ?? 50) + 20, top: (_clipboard.top ?? 50) + 20 });
                applyCustomControls(cloned);
                canvas.add(cloned);
                onLayerAddRef.current(cloned);
                canvas.setActiveObject(cloned);
                canvas.requestRenderAll();
                setSelectedObj(cloned);
                // Update clipboard offset so repeated pastes cascade
                _clipboard.left = (_clipboard.left ?? 50) + 20;
                _clipboard.top = (_clipboard.top ?? 50) + 20;
              });
            }
            break;

          // Duplicate (Ctrl+D)
          case 'd':
            if (!isEditing && active) {
              e.preventDefault();
              active.clone().then(cloned => {
                cloned.set({ left: active.left + 20, top: active.top + 20 });
                applyCustomControls(cloned);
                canvas.add(cloned);
                onLayerAddRef.current(cloned);
                canvas.setActiveObject(cloned);
                canvas.requestRenderAll();
                setSelectedObj(cloned);
              });
            }
            break;

          // Select All (Ctrl+A)
          case 'a':
            if (!isTyping && !isEditing) {
              e.preventDefault();
              const objs = canvas.getObjects().filter(o => !o.isGuide && !o.isCenterGuide);
              if (objs.length > 0) {
                canvas.setActiveObject(new fabric.ActiveSelection(objs, { canvas }));
                canvas.requestRenderAll();
              }
            }
            break;

          // Bring Forward (Ctrl+])
          case ']':
            if (!isTyping && active) {
              e.preventDefault();
              canvas.bringObjectForward(active);
              canvas.requestRenderAll();
            }
            break;

          // Send Backward (Ctrl+[)
          case '[':
            if (!isTyping && active) {
              e.preventDefault();
              canvas.sendObjectBackwards(active);
              canvas.requestRenderAll();
            }
            break;

          default:
            break;
        }
        return;
      }

      // ── Non-Ctrl keys ──────────────────────────────
      // Delete / Backspace — works for single & multi-selection, with undo support
      if ((e.key === 'Delete' || e.key === 'Backspace') && active && !isEditing && !isTyping) {
        e.preventDefault();
        const toRemove = canvas.getActiveObjects();
        canvas.discardActiveObject();
        toRemove.forEach(o => canvas.remove(o));
        canvas.renderAll();
        setSelectedObj(null);
        saveHistory(); // save AFTER removal so Ctrl+Z restores deleted objects
        return;
      }

      // Escape → deselect
      if (e.key === 'Escape' && active && !isEditing) {
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObj(null);
        return;
      }

      // Arrow keys → nudge (1px; 10px with Shift)
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && active && !isEditing && !isTyping) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const delta = {
          ArrowLeft: { left: active.left - step },
          ArrowRight: { left: active.left + step },
          ArrowUp: { top: active.top - step },
          ArrowDown: { top: active.top + step },
        }[e.key];
        active.set(delta);
        active.setCoords();
        canvas.requestRenderAll();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Save initial state
    setUndoStack([canvas.toJSON()]);

    // ── Marching ants animation ──────────────────────────
    let dashOffset = 0;
    let rafId;
    function animateMarchingAnts() {
      dashOffset = (dashOffset + 0.5) % 12;
      const activeObjs = canvas.getActiveObjects();
      if (activeObjs.length > 0) {
        activeObjs.forEach(obj => {
          obj.dirty = true;
          obj.borderDashOffset = dashOffset;
        });
        canvas.requestRenderAll();
      }
      rafId = requestAnimationFrame(animateMarchingAnts);
    }
    rafId = requestAnimationFrame(animateMarchingAnts);

    // ── Canva-style Smart Snapping ───────────────────────
    const SNAP_T = 7;   // normal snap threshold (px)
    const CENTER_T = 12;  // stronger magnetic pull near canvas center
    const PINK = '#e040fb'; // Canva alignment pink/magenta
    const PURPLE = '#9c27b0'; // canvas-center purple
    const TICK = 8;         // equal-spacing bracket tick size

    function clearGuides() {
      canvas.getObjects().filter(o => o.isGuide).forEach(o => canvas.remove(o));
    }

    // Generic guide-line factory
    function makeLine(x1, y1, x2, y2, color, width = 1, dash = null) {
      const l = new fabric.Line([x1, y1, x2, y2], {
        stroke: color, strokeWidth: width,
        strokeDashArray: dash,
        selectable: false, evented: false,
        hasControls: false, hasBorders: false,
        excludeFromExport: true, opacity: 1,
      });
      l.isGuide = true;
      canvas.add(l);
      canvas.sendObjectToBack(l);
    }

    // Full-canvas vertical guide (canvas center/edge snaps)
    function drawVFull(x, color) { makeLine(x, 0, x, canvas.getHeight(), color); }
    // Full-canvas horizontal guide
    function drawHFull(y, color) { makeLine(0, y, canvas.getWidth(), y, color); }

    // Short vertical guide spanning two objects
    function drawVBetween(x, yMin, yMax, color) {
      makeLine(x, yMin - 20, x, yMax + 20, color);
    }
    // Dashed horizontal baseline spanning ALL aligned objects
    function drawHDashed(y, xMin, xMax, color) {
      makeLine(xMin - 10, y, xMax + 10, y, color, 1, [4, 4]);
    }

    // Distance pill helper
    function drawPill(cx, cy, gap, color) {
      const label = String(Math.round(Math.abs(gap)));
      const pw = Math.max(24, label.length * 6 + 10);
      const pill = new fabric.Rect({
        left: cx - pw / 2, top: cy - 8, width: pw, height: 16, rx: 8, ry: 8,
        fill: color, selectable: false, evented: false,
        hasControls: false, hasBorders: false, excludeFromExport: true,
      });
      pill.isGuide = true;
      canvas.add(pill);
      const txt = new fabric.Text(label, {
        left: cx, top: cy, fontSize: 9,
        fontFamily: 'Inter, Arial, sans-serif', fontWeight: '700', fill: '#fff',
        originX: 'center', originY: 'center',
        selectable: false, evented: false,
        hasControls: false, hasBorders: false, excludeFromExport: true,
      });
      txt.isGuide = true;
      canvas.add(txt);
    }

    // Equal-spacing bracket (horizontal) with distance pill
    function drawBracketH(x1, x2, y, gap, color) {
      if (x2 - x1 < 3) return;
      makeLine(x1, y, x2, y, color);
      makeLine(x1, y - TICK / 2, x1, y + TICK / 2, color, 1.5);
      makeLine(x2, y - TICK / 2, x2, y + TICK / 2, color, 1.5);
      drawPill((x1 + x2) / 2, y, gap, color);
    }
    // Equal-spacing bracket (vertical) with distance pill
    function drawBracketV(y1, y2, x, gap, color) {
      if (y2 - y1 < 3) return;
      makeLine(x, y1, x, y2, color);
      makeLine(x - TICK / 2, y1, x + TICK / 2, y1, color, 1.5);
      makeLine(x - TICK / 2, y2, x + TICK / 2, y2, color, 1.5);
      drawPill(x, (y1 + y2) / 2, gap, color);
    }

    function onObjectMoving(e) {
      const obj = e.target;
      if (!obj) return;
      clearGuides();

      const cw = canvas.getWidth();
      const ch = canvas.getHeight();

      obj.setCoords();
      const bl = obj.getBoundingRect(true);
      const oL = bl.left, oT = bl.top;
      const oR = oL + bl.width, oB = oT + bl.height;
      const oCX = oL + bl.width / 2, oCY = oT + bl.height / 2;

      // Object's snap-anchor points on each axis
      const xAnchors = [{ v: oL, off: 0 }, { v: oCX, off: bl.width / 2 }, { v: oR, off: bl.width }];
      const yAnchors = [{ v: oT, off: 0 }, { v: oCY, off: bl.height / 2 }, { v: oB, off: bl.height }];

      const leftBase = obj.left - oL;  // transform from bounding-box coords to object.left
      const topBase = obj.top - oT;

      let bestX = null, bestY = null; // { newPos, guidePos, dist, isCanvas, objBounds }

      // ── 1. Canvas edges & center ──────────────────────
      [{ p: 0, isCenter: false },
      { p: cw / 2, isCenter: true },
      { p: cw, isCenter: false },
      ].forEach(({ p, isCenter }) => {
        const thr = isCenter ? CENTER_T : SNAP_T;
        xAnchors.forEach(({ v, off }) => {
          const d = Math.abs(v - p);
          if (d < thr && (!bestX || d < bestX.dist))
            bestX = { newLeft: p - off + leftBase, guidePos: p, dist: d, isCanvas: true, isCenter };
        });
      });

      [{ p: 0, isCenter: false },
      { p: ch / 2, isCenter: true },
      { p: ch, isCenter: false },
      ].forEach(({ p, isCenter }) => {
        const thr = isCenter ? CENTER_T : SNAP_T;
        yAnchors.forEach(({ v, off }) => {
          const d = Math.abs(v - p);
          if (d < thr && (!bestY || d < bestY.dist))
            bestY = { newTop: p - off + topBase, guidePos: p, dist: d, isCanvas: true, isCenter };
        });
      });

      // ── 2. Other objects ──────────────────────────────
      // Exclude the moved object AND all its children (when it's an ActiveSelection)
      // so we don't snap against our own selected items.
      const activeSet = new Set(canvas.getActiveObjects());
      activeSet.add(obj); // also exclude the ActiveSelection wrapper itself
      const others = canvas.getObjects().filter(
        o => !activeSet.has(o) && !o.isGuide && !o.isCenterGuide && !o.__isBlankLayer
      );
      others.forEach(other => {
        other.setCoords();
        const ob = other.getBoundingRect(true);
        const oxL = ob.left, oxR = ob.left + ob.width;
        const oxCX = ob.left + ob.width / 2;
        const oyT = ob.top, oyB = ob.top + ob.height;
        const oyCY = ob.top + ob.height / 2;

        [{ p: oxL }, { p: oxCX }, { p: oxR }].forEach(({ p }) => {
          xAnchors.forEach(({ v, off }) => {
            const d = Math.abs(v - p);
            if (d < SNAP_T && (!bestX || d < bestX.dist))
              bestX = { newLeft: p - off + leftBase, guidePos: p, dist: d, isCanvas: false, ob };
          });
        });

        [{ p: oyT }, { p: oyCY }, { p: oyB }].forEach(({ p }) => {
          yAnchors.forEach(({ v, off }) => {
            const d = Math.abs(v - p);
            if (d < SNAP_T && (!bestY || d < bestY.dist))
              bestY = { newTop: p - off + topBase, guidePos: p, dist: d, isCanvas: false, ob };
          });
        });
      });

      // ── 3. Apply snaps & draw guides ─────────────────
      if (bestX) {
        obj.set({ left: bestX.newLeft });
        obj.setCoords();
        if (bestX.isCanvas) {
          drawVFull(bestX.guidePos, bestX.isCenter ? PURPLE : PINK);
        } else {
          const newBl = obj.getBoundingRect(true);
          const ob = bestX.ob;
          const yMin = Math.min(ob.top, newBl.top);
          const yMax = Math.max(ob.top + ob.height, newBl.top + newBl.height);
          drawVBetween(bestX.guidePos, yMin, yMax, PINK);
        }
      }

      if (bestY) {
        obj.set({ top: bestY.newTop });
        obj.setCoords();
        if (bestY.isCanvas) {
          drawHFull(bestY.guidePos, bestY.isCenter ? PURPLE : PINK);
        } else {
          // Span ALL objects that share this Y anchor (dashed baseline like Canva)
          const gy = bestY.guidePos;
          const allBounds = [obj, ...others].map(o => { o.setCoords(); return o.getBoundingRect(true); });
          const sharing = allBounds.filter(b =>
            Math.abs(b.top - gy) < 2 ||
            Math.abs((b.top + b.height / 2) - gy) < 2 ||
            Math.abs((b.top + b.height) - gy) < 2
          );
          const xMin = Math.min(...sharing.map(b => b.left));
          const xMax = Math.max(...sharing.map(b => b.left + b.width));
          drawHDashed(gy, xMin, xMax, PINK);
        }
      }

      // ── 4. Equal-spacing guides (3 objects) ──────────
      if (others.length >= 2) {
        const objNow = obj.getBoundingRect(true);
        const all = others.map(o => { o.setCoords(); return o.getBoundingRect(true); });

        // Horizontal equal spacing: sort others by left, check if dragged obj fits
        const byLeft = [...all].sort((a, b) => a.left - b.left);
        byLeft.forEach((A, i) => {
          const B = byLeft[i + 1];
          if (!B) return;
          // Gap between A and B
          const gapAB = B.left - (A.left + A.width);
          if (gapAB < 0) return;
          // Check if obj is ~gapAB to the right of B
          const idealLeft = B.left + B.width + gapAB;
          if (Math.abs(objNow.left - idealLeft) < SNAP_T) {
            if (!bestX) { obj.set({ left: idealLeft + leftBase }); obj.setCoords(); }
            const cY = Math.min(A.top, B.top, objNow.top) - 14;
            drawBracketH(A.left + A.width, B.left, cY, gapAB, PINK);
            drawBracketH(B.left + B.width, idealLeft, cY, gapAB, PINK);
          }
          // Check to the left of A
          const idealObjR = A.left - gapAB;
          if (Math.abs((objNow.left + objNow.width) - idealObjR) < SNAP_T) {
            if (!bestX) { obj.set({ left: idealObjR - objNow.width + leftBase }); obj.setCoords(); }
            const cY = Math.min(A.top, B.top, objNow.top) - 14;
            drawBracketH(idealObjR - gapAB, idealObjR, cY, gapAB, PINK);
            drawBracketH(A.left + A.width, B.left, cY, gapAB, PINK);
          }
        });

        // Vertical equal spacing
        const byTop = [...all].sort((a, b) => a.top - b.top);
        byTop.forEach((A, i) => {
          const B = byTop[i + 1];
          if (!B) return;
          const gapAB = B.top - (A.top + A.height);
          if (gapAB < 2) return;
          const idealTop = B.top + B.height + gapAB;
          if (Math.abs(objNow.top - idealTop) < SNAP_T) {
            if (!bestY) { obj.set({ top: idealTop + topBase }); obj.setCoords(); }
            const cX = Math.min(A.left, B.left, objNow.left) - 14;
            drawBracketV(A.top + A.height, B.top, cX, gapAB, PINK);
            drawBracketV(B.top + B.height, idealTop, cX, gapAB, PINK);
          }
        });
      }

      // Keep guides behind content
      canvas.getObjects().filter(o => o.isGuide).forEach(g => canvas.sendObjectToBack(g));
      canvas.requestRenderAll();
    }

    function onObjectModified() { clearGuides(); canvas.requestRenderAll(); }
    function onMouseUp() { clearGuides(); canvas.requestRenderAll(); }

    canvas.on('object:moving', onObjectMoving);
    canvas.on('object:modified', onObjectModified);
    canvas.on('mouse:up', onMouseUp);
    // ── End Canva-style Smart Snapping ───────────────────


    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      canvas.off('object:moving', onObjectMoving);
      canvas.off('object:modified', onObjectModified);
      canvas.off('mouse:up', onMouseUp);
      canvas.dispose();
    };
  }, []);

  function handleSelection(e) {
    const obj = e.selected?.[0] || fabricRef.current?.getActiveObject();
    if (obj) {
      applyCustomControls(obj);
      fabricRef.current.requestRenderAll();
      setSelectedObj(obj);
      onLayerSelectRef.current(obj); // sync layer panel highlight
      if (obj.type === 'i-text') {
        setFontSize(Math.round(obj.fontSize || 32));
        if (setLetterSpacing) setLetterSpacing(obj.charSpacing ? Math.round(obj.charSpacing / 10 * 10) / 10 : 0);
        if (setLineHeight) setLineHeight(Math.round((obj.lineHeight || 1.2) * 10) / 10);
        if (setOpacity) setOpacity(Math.round((obj.opacity ?? 1) * 100));
        if (setRotation) setRotation(Math.round(obj.angle || 0));
      }
    }
  }

  // ── Save history ──────────────────────────────────────
  const saveHistory = useCallback(() => {
    if (isHistorySaving.current) return;
    const canvas = fabricRef.current;
    if (!canvas) return;
    const json = canvas.toJSON();
    setUndoStack(prev => [...prev, json]);
    setRedoStack([]);
  }, []);

  // ── Background color ──────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.backgroundColor = bgColor;
    canvas.renderAll();
  }, [bgColor]);

  // ── FONT SIZE ─────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type !== 'i-text') return;
    obj.set('fontSize', fontSize);
    canvas.renderAll();
  }, [fontSize]);

  // ── FONT FAMILY ───────────────────────────────────────
  useEffect(() => {
    applyProp('fontFamily', fontFamily);
  }, [fontFamily]);

  // ── BOLD ──────────────────────────────────────────────
  useEffect(() => {
    applyProp('fontWeight', bold ? 'bold' : 'normal');
  }, [bold]);

  // ── ITALIC ────────────────────────────────────────────
  useEffect(() => {
    applyProp('fontStyle', italic ? 'italic' : 'normal');
  }, [italic]);

  // ── UNDERLINE ─────────────────────────────────────────
  useEffect(() => {
    applyProp('underline', underline);
  }, [underline]);

  // ── ALIGN ─────────────────────────────────────────────
  useEffect(() => {
    applyProp('textAlign', align);
  }, [align]);

  // ── TEXT COLOR ────────────────────────────────────────
  useEffect(() => {
    applyProp('fill', textColor);
  }, [textColor]);

  // ── LETTER SPACING ────────────────────────────────────
  useEffect(() => {
    applyProp('charSpacing', letterSpacing * 10);
  }, [letterSpacing]);

  // ── LINE HEIGHT ───────────────────────────────────────
  useEffect(() => {
    applyProp('lineHeight', lineHeight);
  }, [lineHeight]);

  // ── OPACITY ──────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    obj.set('opacity', opacity / 100);
    canvas.renderAll();
  }, [opacity]);

  // ── ROTATION ─────────────────────────────────────────
  // Guard flag: only apply rotation when triggered by user (not canvas→sidebar reads)
  const isUserRotating = useRef(false);

  useEffect(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    // Never rotate a multi-selection via the sidebar slider
    const isMultiSelection = obj.type === 'activeSelection' || obj.type === 'ActiveSelection';
    if (isMultiSelection) return;

    // Break the feedback loop: only apply if the value genuinely differs
    // (when canvas→sidebar sets rotation, the effect fires but angle already matches)
    if (Math.round(obj.angle || 0) === rotation) return;

    obj.set('angle', rotation);
    obj.setCoords();
    canvas.renderAll();
  }, [rotation]);

  // ── TEXT EFFECTS ──────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type !== 'i-text') return;

    obj.set({ shadow: null, stroke: null, strokeWidth: 0 });

    switch (effect) {
      case 'shadow':
        obj.set('shadow', new fabric.Shadow({ color: '#00000066', blur: 10, offsetX: 3, offsetY: 3 }));
        break;
      case 'glow':
        obj.set('shadow', new fabric.Shadow({ color: '#4fc3f7', blur: 20, offsetX: 0, offsetY: 0 }));
        break;
      case 'outline':
        obj.set({ stroke: '#000000', strokeWidth: 2 });
        break;
      case 'neon':
        obj.set('shadow', new fabric.Shadow({ color: '#ff00ff', blur: 30, offsetX: 0, offsetY: 0 }));
        break;
      default:
        break;
    }
    canvas.renderAll();
  }, [effect]);

  // ── Helper: apply prop to active text ────────────────
  function applyProp(prop, value) {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type !== 'i-text') return;
    obj.set(prop, value);
    canvas.renderAll();
  }

  // ── Add Text ──────────────────────────────────────────
  const addText = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Always read live canvas dimensions so text is centered in the CURRENT canvas size
    const cx = canvas.getWidth() / 2;
    const cy = canvas.getHeight() / 2;
    const text = new fabric.IText('Your text here', {
      left: cx,
      top: cy,
      originX: 'center',
      originY: 'center',
      fontSize: 32,
      fontFamily: 'Inter',
      fill: '#000000',
      editable: true,
    });
    applyCustomControls(text);
    canvas.add(text);
    onLayerAddRef.current(text); // register with layer system BEFORE setActiveObject so ID is set
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    setSelectedObj(text);
    setFontSize(32);
    // Auto-enter editing mode so user can type immediately
    setTimeout(() => {
      text.enterEditing();
      text.selectAll();
      canvas.requestRenderAll();
    }, 50);
  }, []);

  // ── Add Blank Layer ────────────────────────────────────
  // Creates a named empty layer entry without adding visible content
  const addBlankLayer = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    blankLayerCountRef.current += 1;
    // Use an invisible placeholder rect (not selectable, not renderable visually)
    const placeholder = new fabric.Rect({
      left: -9999,
      top: -9999,
      width: 1,
      height: 1,
      opacity: 0,
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      excludeFromExport: true,
    });
    placeholder.__isBlankLayer = true;
    placeholder.text = `Layer ${blankLayerCountRef.current}`;
    canvas.add(placeholder);
    onLayerAddRef.current(placeholder);
    canvas.requestRenderAll();
  }, []);

  // ── Show toast notification ───────────────────────────
  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
      setTimeout(() => setToast(null), 500); // wait for fade-out animation
    }, 3000);
  }, []);

  // ── Add Image to canvas ───────────────────────────────
  const addImage = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        const fabricImg = new fabric.FabricImage(imgElement);

        const canvasW = canvasSizeRef.current.w;
        const canvasH = canvasSizeRef.current.h;
        const maxW = canvasW * 0.8;
        const maxH = canvasH * 0.8;
        const scaleX = maxW / fabricImg.width;
        const scaleY = maxH / fabricImg.height;
        const scale = Math.min(scaleX, scaleY, 1);

        fabricImg.set({
          left: canvasW / 2,
          top: canvasH / 2,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
        });

        applyCustomControls(fabricImg);
        canvas.add(fabricImg);

        // Build a layer name from the filename (strip extension, max 20 chars)
        const rawName = file.name.replace(/\.[^.]+$/, '').slice(0, 20);
        // Attach .text so onLayerAdd (in App.jsx) can derive the layer name
        fabricImg.text = rawName;
        onLayerAddRef.current(fabricImg); // assigns __layerId

        canvas.setActiveObject(fabricImg);
        canvas.requestRenderAll();
        setSelectedObj(fabricImg);

        showToast('💡 Best results with flat/solid color logos');
      };
      imgElement.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [showToast]);

  // ── Layer Separator ────────────────────────────────────────────────────────
  const separateLayers = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const fabricImg = canvas.getActiveObject();
    if (!fabricImg) return;
    // Only work on image objects
    if (!fabricImg._element && fabricImg.type !== 'image' && fabricImg.type !== 'FabricImage') return;

    setIsSeparating(true);

    // Flush state update before heavy CPU work
    await new Promise(resolve => setTimeout(resolve, 60));

    try {
      // ── STEP 1: Draw image onto temp canvas ───────────────────────
      const el = fabricImg._element || (fabricImg.getElement && fabricImg.getElement());
      if (!el) { setIsSeparating(false); return; }

      const srcW = el.naturalWidth || el.width;
      const srcH = el.naturalHeight || el.height;

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = srcW;
      tmpCanvas.height = srcH;
      const ctx = tmpCanvas.getContext('2d');
      ctx.drawImage(el, 0, 0, srcW, srcH);
      const imageData = ctx.getImageData(0, 0, srcW, srcH);
      const data = imageData.data;
      const totalPixels = srcW * srcH;

      // ── STEP 2: Color grouping with tolerance ─────────────────────
      const TOLERANCE = 15;
      const MAX_GROUPS = 8;
      const MIN_PERCENT = 0.005; // 0.5%

      const colorMap = new Map();
      const quantize = (v) => Math.round(v / TOLERANCE) * TOLERANCE;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 10) continue; // skip near-transparent pixels
        const qr = quantize(data[i]);
        const qg = quantize(data[i + 1]);
        const qb = quantize(data[i + 2]);
        const key = `${qr},${qg},${qb}`;
        if (!colorMap.has(key)) {
          colorMap.set(key, { r: qr, g: qg, b: qb, pixels: [], count: 0 });
        }
        const entry = colorMap.get(key);
        entry.pixels.push(i);
        entry.count++;
      }

      // Filter noise groups
      const minCount = totalPixels * MIN_PERCENT;
      let groups = Array.from(colorMap.values()).filter(g => g.count >= minCount);
      const rawGroupCount = groups.length;

      // Sort smallest → largest
      groups.sort((a, b) => a.count - b.count);

      // Merge closest groups until <= MAX_GROUPS
      while (groups.length > MAX_GROUPS) {
        let minDist = Infinity;
        let mergeA = 0, mergeB = 1;
        for (let a = 0; a < groups.length; a++) {
          for (let b = a + 1; b < groups.length; b++) {
            const dr = groups[a].r - groups[b].r;
            const dg = groups[a].g - groups[b].g;
            const db = groups[a].b - groups[b].b;
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) { minDist = dist; mergeA = a; mergeB = b; }
          }
        }
        const ga = groups[mergeA];
        const gb = groups[mergeB];
        const total = ga.count + gb.count;
        ga.r = Math.round((ga.r * ga.count + gb.r * gb.count) / total);
        ga.g = Math.round((ga.g * ga.count + gb.g * gb.count) / total);
        ga.b = Math.round((ga.b * ga.count + gb.b * gb.count) / total);
        ga.pixels = ga.pixels.concat(gb.pixels);
        ga.count = total;
        groups.splice(mergeB, 1);
      }

      // Re-sort smallest → largest
      groups.sort((a, b) => a.count - b.count);

      // Build pixel-index → groupIndex lookup (pixel unit, not byte unit)
      const pixelGroup = new Int16Array(totalPixels).fill(-1);
      groups.forEach((g, gi) => {
        g.pixels.forEach(byteIdx => {
          pixelGroup[byteIdx / 4] = gi;
        });
      });

      // ── STEP 3 & 4: Content-aware fill + fabric layer creation ────
      const originalLeft = fabricImg.left;
      const originalTop = fabricImg.top;
      const originalScaleX = fabricImg.scaleX;
      const originalScaleY = fabricImg.scaleY;
      const originalAngle = fabricImg.angle;
      const originalOriginX = fabricImg.originX;
      const originalOriginY = fabricImg.originY;

      // Neighbour-average fill: returns [r,g,b] or null
      function nearestNeighborColor(pixelIdx, groupIdx) {
        const px = pixelIdx % srcW;
        const py = Math.floor(pixelIdx / srcW);
        const radius = 3;
        let sumR = 0, sumG = 0, sumB = 0, cnt = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = px + dx;
            const ny = py + dy;
            if (nx < 0 || ny < 0 || nx >= srcW || ny >= srcH) continue;
            const ni = ny * srcW + nx;
            if (pixelGroup[ni] === groupIdx) {
              const di = ni * 4;
              sumR += data[di]; sumG += data[di + 1]; sumB += data[di + 2];
              cnt++;
            }
          }
        }
        if (cnt === 0) return null;
        return [Math.round(sumR / cnt), Math.round(sumG / cnt), Math.round(sumB / cnt)];
      }

      // Simple color name for layer label
      function rgbToColorName(r, g, b) {
        const palette = [
          { name: 'red', r: 255, g: 0, b: 0 },
          { name: 'green', r: 0, g: 128, b: 0 },
          { name: 'blue', r: 0, g: 0, b: 255 },
          { name: 'white', r: 255, g: 255, b: 255 },
          { name: 'black', r: 0, g: 0, b: 0 },
          { name: 'yellow', r: 255, g: 255, b: 0 },
          { name: 'orange', r: 255, g: 165, b: 0 },
          { name: 'purple', r: 128, g: 0, b: 128 },
          { name: 'pink', r: 255, g: 192, b: 203 },
          { name: 'cyan', r: 0, g: 255, b: 255 },
          { name: 'magenta', r: 255, g: 0, b: 255 },
          { name: 'gray', r: 128, g: 128, b: 128 },
          { name: 'brown', r: 139, g: 69, b: 19 },
          { name: 'lime', r: 0, g: 255, b: 0 },
          { name: 'navy', r: 0, g: 0, b: 128 },
          { name: 'teal', r: 0, g: 128, b: 128 },
          { name: 'maroon', r: 128, g: 0, b: 0 },
          { name: 'gold', r: 255, g: 215, b: 0 },
        ];
        const toHex = v => v.toString(16).padStart(2, '0');
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        let best = hex; let bestDist = Infinity;
        palette.forEach(c => {
          const d = (c.r - r) ** 2 + (c.g - g) ** 2 + (c.b - b) ** 2;
          if (d < bestDist) { bestDist = d; best = c.name; }
        });
        return bestDist < 15000 ? best : hex;
      }

      // Remove original image first
      canvas.remove(fabricImg);

      // Iterate largest-first so largest goes to back, smallest stays on top
      const groupsLargestFirst = [...groups].reverse();
      let layerIndex = 1;

      for (const group of groupsLargestFirst) {
        const groupIdx = groups.indexOf(group);
        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = srcW;
        layerCanvas.height = srcH;
        const lCtx = layerCanvas.getContext('2d');
        const layerImageData = lCtx.createImageData(srcW, srcH);
        const layerData = layerImageData.data;

        for (let i = 0; i < totalPixels; i++) {
          const di = i * 4;
          if (pixelGroup[i] === groupIdx) {
            // This pixel belongs to this group: copy original
            layerData[di] = data[di];
            layerData[di + 1] = data[di + 1];
            layerData[di + 2] = data[di + 2];
            layerData[di + 3] = data[di + 3];
          } else if (data[di + 3] > 10) {
            // Original pixel belongs to another group: content-aware fill
            const fill = nearestNeighborColor(i, groupIdx);
            if (fill) {
              layerData[di] = fill[0];
              layerData[di + 1] = fill[1];
              layerData[di + 2] = fill[2];
              layerData[di + 3] = 255;
            } else {
              layerData[di + 3] = 0;
            }
          } else {
            // Original was transparent: keep transparent
            layerData[di + 3] = 0;
          }
        }

        lCtx.putImageData(layerImageData, 0, 0);
        const dataURL = layerCanvas.toDataURL('image/png');

        await new Promise(resolve => {
          const imgEl = new Image();
          imgEl.onload = () => {
            const fi = new fabric.FabricImage(imgEl);
            fi.set({
              left: originalLeft,
              top: originalTop,
              scaleX: originalScaleX,
              scaleY: originalScaleY,
              angle: originalAngle,
              originX: originalOriginX,
              originY: originalOriginY,
            });

            const colorName = rgbToColorName(group.r, group.g, group.b);
            fi.text = `Layer ${layerIndex} (${colorName})`;
            layerIndex++;

            applyCustomControls(fi);
            canvas.add(fi);
            onLayerAddRef.current(fi);
            // Largest is at back (added first, sent to back)
            canvas.sendObjectToBack(fi);
            resolve();
          };
          imgEl.src = dataURL;
        });
      }

      // Keep guide lines at the very back
      canvas.getObjects().filter(o => o.isGuide).forEach(g => canvas.sendObjectToBack(g));
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setSelectedObj(null);
      setIsSeparating(false);

      if (rawGroupCount > 6) {
        showToast('⚠️ Complex image detected. Results may vary.');
        await new Promise(resolve => setTimeout(resolve, 3200));
      }
      showToast(`✅ Separated into ${groups.length} layer${groups.length !== 1 ? 's' : ''} successfully!`);

    } catch (err) {
      console.error('Layer separator error:', err);
      setIsSeparating(false);
      showToast('❌ Failed to separate layers. Try again.');
    }
  }, [showToast]);

  // ── Color Wise Layer Separator ─────────────────────────────────────────────
  const separateColorWise = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const fabricImg = canvas.getActiveObject();
    if (!fabricImg) return;
    if (!fabricImg._element && fabricImg.type !== 'image' && fabricImg.type !== 'FabricImage') return;

    setIsSeparating(true);
    // Allow React to flush the overlay before heavy CPU work
    await new Promise(resolve => setTimeout(resolve, 60));

    try {
      // ── STEP 1: Read pixels at NATURAL dimensions ─────────────────────────
      const el = fabricImg._element || (fabricImg.getElement && fabricImg.getElement());
      if (!el) { setIsSeparating(false); return; }

      const srcW = el.naturalWidth || el.width;
      const srcH = el.naturalHeight || el.height;

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = srcW;
      tmpCanvas.height = srcH;
      const ctx = tmpCanvas.getContext('2d');
      ctx.drawImage(el, 0, 0, srcW, srcH);
      const imageData = ctx.getImageData(0, 0, srcW, srcH);
      const data = imageData.data;
      const totalPixels = srcW * srcH;

      // ── STEP 2: Group pixels by colour (tolerance ±15) ────────────────────
      const TOLERANCE = 15;
      const MAX_GROUPS = 8;
      const MIN_PERCENT = 0.005; // 0.5 % of total pixels

      const colorMap = new Map();
      const quantize = v => Math.round(v / TOLERANCE) * TOLERANCE;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 10) continue; // skip transparent pixels
        const qr = quantize(data[i]);
        const qg = quantize(data[i + 1]);
        const qb = quantize(data[i + 2]);
        const key = `${qr},${qg},${qb}`;
        if (!colorMap.has(key)) {
          colorMap.set(key, { r: qr, g: qg, b: qb, pixels: [], count: 0 });
        }
        const entry = colorMap.get(key);
        entry.pixels.push(i >> 2); // store pixel index (not byte offset)
        entry.count++;
      }

      // Filter noise, sort smallest → largest
      const minCount = totalPixels * MIN_PERCENT;
      let groups = Array.from(colorMap.values()).filter(g => g.count >= minCount);
      const rawGroupCount = groups.length;
      groups.sort((a, b) => a.count - b.count);

      // Merge closest colour pairs until ≤ MAX_GROUPS
      while (groups.length > MAX_GROUPS) {
        let minDist = Infinity, mergeA = 0, mergeB = 1;
        for (let a = 0; a < groups.length; a++) {
          for (let b = a + 1; b < groups.length; b++) {
            const dr = groups[a].r - groups[b].r;
            const dg = groups[a].g - groups[b].g;
            const db = groups[a].b - groups[b].b;
            const dist = dr * dr + dg * dg + db * db;
            if (dist < minDist) { minDist = dist; mergeA = a; mergeB = b; }
          }
        }
        const ga = groups[mergeA];
        const gb = groups[mergeB];
        const total = ga.count + gb.count;
        ga.r = Math.round((ga.r * ga.count + gb.r * gb.count) / total);
        ga.g = Math.round((ga.g * ga.count + gb.g * gb.count) / total);
        ga.b = Math.round((ga.b * ga.count + gb.b * gb.count) / total);
        ga.pixels = ga.pixels.concat(gb.pixels);
        ga.count = total;
        groups.splice(mergeB, 1);
      }

      // Re-sort smallest → largest after merges
      groups.sort((a, b) => a.count - b.count);

      // Build pixel-index → group-index lookup table
      const pixelGroup = new Int16Array(totalPixels).fill(-1);
      groups.forEach((g, gi) => {
        g.pixels.forEach(px => { pixelGroup[px] = gi; });
      });

      // ── STEP 3: Capture original fabric transform ─────────────────────────
      const origLeft = fabricImg.left;
      const origTop = fabricImg.top;
      const origScaleX = fabricImg.scaleX;
      const origScaleY = fabricImg.scaleY;
      const origAngle = fabricImg.angle;
      const origOriginX = fabricImg.originX;
      const origOriginY = fabricImg.originY;

      const toHex = v => v.toString(16).padStart(2, '0');
      const rgbHex = (r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

      // Rename original layer panel entry → "Original"
      fabricImg.text = 'Original';
      onLayerNameUpdateRef.current(fabricImg);

      // ── STEP 4: Build one canvas layer per colour group ───────────────────
      // Process largest first so the largest colour sits lowest in the stack
      const groupsLargestFirst = [...groups].reverse();
      let colorIndex = 1;

      for (const group of groupsLargestFirst) {
        const gi = groups.indexOf(group);

        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = srcW;
        layerCanvas.height = srcH;
        const lCtx = layerCanvas.getContext('2d');
        const layerImageData = lCtx.createImageData(srcW, srcH);
        const ld = layerImageData.data;
        // ImageData is zero-initialised (alpha=0 by default)
        for (let i = 0; i < totalPixels; i++) {
          if (pixelGroup[i] !== gi) continue; // keep transparent
          const di = i * 4;
          ld[di] = data[di];
          ld[di + 1] = data[di + 1];
          ld[di + 2] = data[di + 2];
          ld[di + 3] = data[di + 3];
        }
        lCtx.putImageData(layerImageData, 0, 0);

        const dataURL = layerCanvas.toDataURL('image/png');
        const hex = rgbHex(group.r, group.g, group.b);

        await new Promise(resolve => {
          const imgEl = new Image();
          imgEl.onload = () => {
            const fi = new fabric.FabricImage(imgEl);
            fi.set({
              left: origLeft,
              top: origTop,
              scaleX: origScaleX,
              scaleY: origScaleY,
              angle: origAngle,
              originX: origOriginX,
              originY: origOriginY,
            });
            fi.text = `Color ${colorIndex} (${hex})`;
            colorIndex++;
            applyCustomControls(fi);
            canvas.add(fi);
            onLayerAddRef.current(fi);
            resolve();
          };
          imgEl.src = dataURL;
        });
      }

      // Send original image to back, then guides to very back
      canvas.sendObjectToBack(fabricImg);
      canvas.getObjects().filter(o => o.isGuide).forEach(g => canvas.sendObjectToBack(g));

      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setSelectedObj(null);
      setIsSeparating(false);

      if (rawGroupCount > 6) {
        showToast('⚠️ Complex image. Results may vary.');
        await new Promise(resolve => setTimeout(resolve, 3200));
      }
      showToast(`✅ Separated into ${groups.length} layers!`);

    } catch (err) {
      console.error('[Color Wise] Separator error:', err);
      setIsSeparating(false);
      showToast('❌ Failed to separate layers. Try again.');
    }
  }, [showToast]);

  // ── Area Wise Layer Separator (connected-component labeling) ──────────────
  const separateAreaWise = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const fabricImg = canvas.getActiveObject();
    if (!fabricImg) return;
    if (!fabricImg._element && fabricImg.type !== 'image' && fabricImg.type !== 'FabricImage') return;

    // ── PNG guard ─────────────────────────────────────────────────────────────
    const el = fabricImg._element || (fabricImg.getElement && fabricImg.getElement());
    if (!el) return;
    const src = el.src || '';
    const isJpeg = /data:image\/jpe?g/i.test(src) || /\.(jpe?g)(\?|$)/i.test(src);
    if (isJpeg) {
      showToast('⚠️ Area Wise requires a PNG image with transparency');
      return;
    }

    setIsSeparating(true);
    await new Promise(resolve => setTimeout(resolve, 60));

    try {
      // ── STEP 1: Read pixels at natural dimensions ────────────────────────────
      const srcW = el.naturalWidth || el.width;
      const srcH = el.naturalHeight || el.height;
      const totalPixels = srcW * srcH;

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = srcW;
      tmpCanvas.height = srcH;
      const ctx = tmpCanvas.getContext('2d');
      ctx.drawImage(el, 0, 0, srcW, srcH);
      const imageData = ctx.getImageData(0, 0, srcW, srcH);
      const data = imageData.data;

      // ── STEP 2: BFS connected-component labeling on alpha channel ────────────
      // -1 = unlabeled, ≥0 = region id
      const labels = new Int32Array(totalPixels).fill(-1);
      const isActive = px => data[px * 4 + 3] > 10;
      const regionSizes = []; // region id → size
      let regionCount = 0;

      // 4-connectivity neighbour offsets
      const DX = [0, 0, -1, 1];
      const DY = [-1, 1, 0, 0];

      for (let startPx = 0; startPx < totalPixels; startPx++) {
        if (!isActive(startPx) || labels[startPx] !== -1) continue;

        const labelId = regionCount++;
        regionSizes.push(0);
        labels[startPx] = labelId;

        // Iterative BFS with head pointer — avoids call-stack overflow
        const queue = [startPx];
        let head = 0;
        while (head < queue.length) {
          const px = queue[head++];
          regionSizes[labelId]++;
          const x = px % srcW;
          const y = Math.floor(px / srcW);
          for (let d = 0; d < 4; d++) {
            const nx = x + DX[d];
            const ny = y + DY[d];
            if (nx < 0 || ny < 0 || nx >= srcW || ny >= srcH) continue;
            const np = ny * srcW + nx;
            if (isActive(np) && labels[np] === -1) {
              labels[np] = labelId;
              queue.push(np);
            }
          }
        }
      }

      // ── STEP 3: Filter small regions, collect pixel lists ────────────────────
      const MIN_PERCENT = 0.005;
      const MAX_REGIONS = 8;
      const minCount = totalPixels * MIN_PERCENT;

      // Build region metadata from surviving label ids
      const keepIds = new Set();
      for (let id = 0; id < regionCount; id++) {
        if (regionSizes[id] >= minCount) keepIds.add(id);
      }
      const rawRegionCount = keepIds.size;

      // Allocate region objects
      // Map: labelId → region array index (for fast lookup during pixel scan)
      const idToIdx = new Map();
      let regions = [];
      keepIds.forEach(id => {
        idToIdx.set(id, regions.length);
        regions.push({ count: regionSizes[id], pixels: [] });
      });

      // Single-pass pixel scan to fill pixel arrays
      for (let px = 0; px < totalPixels; px++) {
        const lbl = labels[px];
        if (!keepIds.has(lbl)) continue;
        regions[idToIdx.get(lbl)].pixels.push(px);
      }

      // Sort smallest → largest
      regions.sort((a, b) => a.count - b.count);

      // Merge smallest into next until ≤ MAX_REGIONS
      while (regions.length > MAX_REGIONS) {
        regions[1].pixels = regions[1].pixels.concat(regions[0].pixels);
        regions[1].count += regions[0].count;
        regions.splice(0, 1);
      }
      regions.sort((a, b) => a.count - b.count);

      // Rebuild pixel → region-index lookup from (possibly merged) regions
      const pixelRegion = new Int32Array(totalPixels).fill(-1);
      regions.forEach((r, ri) => {
        r.pixels.forEach(px => { pixelRegion[px] = ri; });
      });

      // ── STEP 4: Capture original fabric transform ────────────────────────────
      const origLeft = fabricImg.left;
      const origTop = fabricImg.top;
      const origScaleX = fabricImg.scaleX;
      const origScaleY = fabricImg.scaleY;
      const origAngle = fabricImg.angle;
      const origOriginX = fabricImg.originX;
      const origOriginY = fabricImg.originY;

      // Rename original panel entry → "Original"
      fabricImg.text = 'Original';
      onLayerNameUpdateRef.current(fabricImg);

      // ── STEP 5: Create one fabric layer per region ───────────────────────────
      // Process largest first so it lands lowest in the visual stack
      const regionsLargestFirst = [...regions].reverse();
      let regionIndex = 1;

      for (const region of regionsLargestFirst) {
        const ri = regions.indexOf(region);

        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = srcW;
        layerCanvas.height = srcH;
        const lCtx = layerCanvas.getContext('2d');
        const layerImageData = lCtx.createImageData(srcW, srcH);
        const ld = layerImageData.data; // zero-initialised → alpha=0 by default

        for (let i = 0; i < totalPixels; i++) {
          if (pixelRegion[i] !== ri) continue;
          const di = i * 4;
          ld[di] = data[di];
          ld[di + 1] = data[di + 1];
          ld[di + 2] = data[di + 2];
          ld[di + 3] = data[di + 3];
        }
        lCtx.putImageData(layerImageData, 0, 0);
        const dataURL = layerCanvas.toDataURL('image/png');

        await new Promise(resolve => {
          const imgEl = new Image();
          imgEl.onload = () => {
            const fi = new fabric.FabricImage(imgEl);
            fi.set({
              left: origLeft,
              top: origTop,
              scaleX: origScaleX,
              scaleY: origScaleY,
              angle: origAngle,
              originX: origOriginX,
              originY: origOriginY,
            });
            fi.text = `Region ${regionIndex}`;
            regionIndex++;
            applyCustomControls(fi);
            canvas.add(fi);
            onLayerAddRef.current(fi);
            resolve();
          };
          imgEl.src = dataURL;
        });
      }

      // Send original to back, then guides to very back
      canvas.sendObjectToBack(fabricImg);
      canvas.getObjects().filter(o => o.isGuide).forEach(g => canvas.sendObjectToBack(g));

      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setSelectedObj(null);
      setIsSeparating(false);

      if (rawRegionCount > 6) {
        showToast('⚠️ Complex image. Results may vary.');
        await new Promise(resolve => setTimeout(resolve, 3200));
      }
      showToast(`✅ Separated into ${regions.length} regions!`);

    } catch (err) {
      console.error('[Area Wise] Separator error:', err);
      setIsSeparating(false);
      showToast('❌ Failed to separate layers. Try again.');
    }
  }, [showToast]);

  // ── Both Wise Layer Separator (color grouping × connected components) ───────
  const separateBothWise = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const fabricImg = canvas.getActiveObject();
    if (!fabricImg) return;
    if (!fabricImg._element && fabricImg.type !== 'image' && fabricImg.type !== 'FabricImage') return;

    setIsSeparating(true);
    await new Promise(resolve => setTimeout(resolve, 60));

    try {
      // ── STEP 1: Read pixels at natural dimensions ────────────────────────────
      const el = fabricImg._element || (fabricImg.getElement && fabricImg.getElement());
      if (!el) { setIsSeparating(false); return; }

      const srcW = el.naturalWidth || el.width;
      const srcH = el.naturalHeight || el.height;
      const totalPixels = srcW * srcH;

      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = srcW;
      tmpCanvas.height = srcH;
      const ctx = tmpCanvas.getContext('2d');
      ctx.drawImage(el, 0, 0, srcW, srcH);
      const imageData = ctx.getImageData(0, 0, srcW, srcH);
      const data = imageData.data;

      // ── STEP 2: Assign each active pixel a colour-group key ─────────────────
      const TOLERANCE = 15;
      const quantize = v => Math.round(v / TOLERANCE) * TOLERANCE;

      // colorKey[px] = quantised colour string, or '' for transparent
      const colorKey = new Array(totalPixels).fill('');
      // colourGroupPixels: Map<colourKey, Uint32Array-like list>
      const colorGroups = new Map(); // key → {r,g,b, pixels:[]}

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 10) continue;
        const qr = quantize(data[i]);
        const qg = quantize(data[i + 1]);
        const qb = quantize(data[i + 2]);
        const key = `${qr},${qg},${qb}`;
        const px = i >> 2;
        colorKey[px] = key;
        if (!colorGroups.has(key)) colorGroups.set(key, { r: qr, g: qg, b: qb, pixels: [] });
        colorGroups.get(key).pixels.push(px);
      }

      // ── STEP 3: Within each colour group run BFS to find connected blobs ──────
      const DX = [0, 0, -1, 1];
      const DY = [-1, 1, 0, 0];

      // visited[px] tracks whether we have already BFS-expanded this pixel
      const visited = new Uint8Array(totalPixels); // 0 = unvisited

      // All discovered sub-layers before size filtering
      // Each: { r, g, b, pixels: [] }
      const rawParts = [];

      for (const [, group] of colorGroups) {
        // Build a quick membership set for this colour group
        const inGroup = new Uint8Array(totalPixels);
        for (const px of group.pixels) inGroup[px] = 1;

        for (const startPx of group.pixels) {
          if (visited[startPx]) continue;

          // New connected blob within this colour group
          const partPixels = [];
          const queue = [startPx];
          let head = 0;
          visited[startPx] = 1;

          while (head < queue.length) {
            const px = queue[head++];
            partPixels.push(px);
            const x = px % srcW;
            const y = Math.floor(px / srcW);
            for (let d = 0; d < 4; d++) {
              const nx = x + DX[d];
              const ny = y + DY[d];
              if (nx < 0 || ny < 0 || nx >= srcW || ny >= srcH) continue;
              const np = ny * srcW + nx;
              if (inGroup[np] && !visited[np]) {
                visited[np] = 1;
                queue.push(np);
              }
            }
          }

          rawParts.push({ r: group.r, g: group.g, b: group.b, pixels: partPixels, count: partPixels.length });
        }
      }

      // ── STEP 4: Filter, cap, and sort layers ─────────────────────────────────
      const MIN_PERCENT = 0.005;
      const MAX_LAYERS = 10;
      const minCount = totalPixels * MIN_PERCENT;

      let parts = rawParts.filter(p => p.count >= minCount);
      const rawPartCount = parts.length;

      // Sort smallest → largest, then merge excess into the next-smallest
      parts.sort((a, b) => a.count - b.count);
      while (parts.length > MAX_LAYERS) {
        parts[1].pixels = parts[1].pixels.concat(parts[0].pixels);
        parts[1].count += parts[0].count;
        // Average the colour for the merged part
        const total = parts[1].count;
        parts[1].r = Math.round((parts[1].r * parts[1].count + parts[0].r * parts[0].count) / total);
        parts[1].g = Math.round((parts[1].g * parts[1].count + parts[0].g * parts[0].count) / total);
        parts[1].b = Math.round((parts[1].b * parts[1].count + parts[0].b * parts[0].count) / total);
        parts.splice(0, 1);
      }
      parts.sort((a, b) => a.count - b.count);

      // Build pixel → part-index lookup
      const pixelPart = new Int32Array(totalPixels).fill(-1);
      parts.forEach((p, pi) => p.pixels.forEach(px => { pixelPart[px] = pi; }));

      // ── STEP 5: Capture original fabric transform ────────────────────────────
      const origLeft = fabricImg.left;
      const origTop = fabricImg.top;
      const origScaleX = fabricImg.scaleX;
      const origScaleY = fabricImg.scaleY;
      const origAngle = fabricImg.angle;
      const origOriginX = fabricImg.originX;
      const origOriginY = fabricImg.originY;

      const toHex = v => v.toString(16).padStart(2, '0');
      const rgbHex = (r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

      // Rename original panel entry → "Original"
      fabricImg.text = 'Original';
      onLayerNameUpdateRef.current(fabricImg);

      // ── STEP 6: Create one fabric layer per part ────────────────────────────
      const partsLargestFirst = [...parts].reverse();
      let partIndex = 1;

      for (const part of partsLargestFirst) {
        const pi = parts.indexOf(part);

        const layerCanvas = document.createElement('canvas');
        layerCanvas.width = srcW;
        layerCanvas.height = srcH;
        const lCtx = layerCanvas.getContext('2d');
        const layerImageData = lCtx.createImageData(srcW, srcH);
        const ld = layerImageData.data; // zero-init → alpha=0

        for (let i = 0; i < totalPixels; i++) {
          if (pixelPart[i] !== pi) continue;
          const di = i * 4;
          ld[di] = data[di];
          ld[di + 1] = data[di + 1];
          ld[di + 2] = data[di + 2];
          ld[di + 3] = data[di + 3];
        }
        lCtx.putImageData(layerImageData, 0, 0);

        const dataURL = layerCanvas.toDataURL('image/png');
        const hex = rgbHex(part.r, part.g, part.b);

        await new Promise(resolve => {
          const imgEl = new Image();
          imgEl.onload = () => {
            const fi = new fabric.FabricImage(imgEl);
            fi.set({
              left: origLeft,
              top: origTop,
              scaleX: origScaleX,
              scaleY: origScaleY,
              angle: origAngle,
              originX: origOriginX,
              originY: origOriginY,
            });
            fi.text = `Part ${partIndex} (${hex})`;
            partIndex++;
            applyCustomControls(fi);
            canvas.add(fi);
            onLayerAddRef.current(fi);
            resolve();
          };
          imgEl.src = dataURL;
        });
      }

      // Send original to back, then guides to very back
      canvas.sendObjectToBack(fabricImg);
      canvas.getObjects().filter(o => o.isGuide).forEach(g => canvas.sendObjectToBack(g));

      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setSelectedObj(null);
      setIsSeparating(false);

      if (rawPartCount > 8) {
        showToast('⚠️ Complex image. Results may vary.');
        await new Promise(resolve => setTimeout(resolve, 3200));
      }
      showToast(`✅ Separated into ${parts.length} layers!`);

    } catch (err) {
      console.error('[Both Wise] Separator error:', err);
      setIsSeparating(false);
      showToast('❌ Failed to separate layers. Try again.');
    }
  }, [showToast]);

  // ── Expose addText, addImage, separators & addBlankLayer via fabricRef ───
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current._addText = addText;
      fabricRef.current._addImage = addImage;
      fabricRef.current._addBlankLayer = addBlankLayer;
      fabricRef.current._separateLayers = separateLayers;
      fabricRef.current._separateColorWise = separateColorWise;
      fabricRef.current._separateAreaWise = separateAreaWise;
      fabricRef.current._separateBothWise = separateBothWise;
    }
  }, [addText, addImage, addBlankLayer, separateLayers, separateColorWise, separateAreaWise, separateBothWise]);

  // ── Drag and Drop handlers ────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only react to file drags
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => /^image\/(png|jpe?g|webp)$/i.test(f.type));
    if (imageFile) addImage(imageFile);
  }, [addImage]);

  // ── Delete selected ───────────────────────────────────
  // Works for both single objects and multi-selections (ActiveSelection).
  // Calls saveHistory() AFTER removal so Ctrl+Z correctly restores deleted items.
  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const toRemove = canvas.getActiveObjects();
    if (toRemove.length === 0) return;
    canvas.discardActiveObject();
    toRemove.forEach(o => canvas.remove(o));
    canvas.renderAll();
    setSelectedObj(null);
    saveHistory(); // save AFTER removal so Ctrl+Z restores deleted objects
  }, [saveHistory]);

  // ── Delete button position ────────────────────────────
  const [deletePos, setDeletePos] = useState(null);

  const updateDeletePos = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj) { setDeletePos(null); return; }

    const z = zoom / 100;

    // Position delete button exactly 20px above the rotation handle
    if (obj.oCoords && obj.oCoords.mtr && obj.oCoords.mt) {
      const mtr = obj.oCoords.mtr;
      const mt = obj.oCoords.mt;
      const dx = mtr.x - mt.x;
      const dy = mtr.y - mt.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        // Push 28px further out from the rotation handle
        const push = 28 / dist;
        setDeletePos({
          x: (mtr.x + dx * push) * z,
          y: (mtr.y + dy * push) * z,
        });
        return;
      }
    }

    // Fallback if no rotation handle exists
    const bound = obj.getBoundingRect();
    setDeletePos({
      x: (bound.left + bound.width / 2) * z,
      y: bound.top * z - 40,
    });
  }, [zoom]);

  // Re-register delete position events whenever zoom changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const update = () => updateDeletePos();

    canvas.on('object:moving', update);
    canvas.on('object:scaling', update);
    canvas.on('object:rotating', update);
    canvas.on('selection:created', update);
    canvas.on('selection:updated', update);
    canvas.on('selection:cleared', () => setDeletePos(null));
    canvas.on('object:modified', update);

    update();

    return () => {
      canvas.off('object:moving', update);
      canvas.off('object:scaling', update);
      canvas.off('object:rotating', update);
      canvas.off('selection:created', update);
      canvas.off('selection:updated', update);
      canvas.off('selection:cleared');
      canvas.off('object:modified', update);
    };
  }, [zoom, updateDeletePos]);

  // ── Programmatic resize (called by Toolbar canvas-size picker) ────────────
  const resizeCanvas = useCallback((newW, newH) => {
    newW = Math.max(MIN_W, Math.min(MAX_W, Math.round(newW)));
    newH = Math.max(MIN_H, Math.min(MAX_H, Math.round(newH)));
    canvasSizeRef.current = { w: newW, h: newH };
    setCanvasSize({ w: newW, h: newH });
    const canvas = fabricRef.current;
    if (canvas) {
      // setDimensions is the correct Fabric v5/v6/v7 API — updates both the
      // DOM element size AND the internal backing store so toDataURL exports
      // at the correct pixel dimensions.
      canvas.setDimensions({ width: newW, height: newH });
      canvas.renderAll();
    }
  }, []);

  // Store resizeCanvas in the ref so Toolbar can call it
  useEffect(() => {
    if (canvasResizeRef) canvasResizeRef.current = resizeCanvas;
  }, [canvasResizeRef, resizeCanvas]);

  // ── Canvas Resize Handles ─────────────────────────────
  const handleResizeMouseDown = useCallback((e, corner) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startW: canvasSizeRef.current.w,
      startH: canvasSizeRef.current.h,
    };

    const onMouseMove = (ev) => {
      const r = resizingRef.current;
      if (!r) return;
      const dx = ev.clientX - r.startX;
      const dy = ev.clientY - r.startY;
      const s = zoom / 100;

      let newW = r.startW;
      let newH = r.startH;

      if (r.corner === 'se') {
        newW = r.startW + dx / s;
        newH = r.startH + dy / s;
      } else if (r.corner === 'sw') {
        newW = r.startW - dx / s;
        newH = r.startH + dy / s;
      } else if (r.corner === 'ne') {
        newW = r.startW + dx / s;
        newH = r.startH - dy / s;
      } else if (r.corner === 'nw') {
        newW = r.startW - dx / s;
        newH = r.startH - dy / s;
      }

      newW = Math.max(MIN_W, Math.min(MAX_W, Math.round(newW)));
      newH = Math.max(MIN_H, Math.min(MAX_H, Math.round(newH)));

      canvasSizeRef.current = { w: newW, h: newH };
      setCanvasSize({ w: newW, h: newH });

      const canvas = fabricRef.current;
      if (canvas) {
        canvas.setWidth(newW);
        canvas.setHeight(newH);
        canvas.renderAll();
      }
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [zoom]);

  return (
    <div
      className="canvas-viewport"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Layer Separator Loading Overlay ── */}
      {isSeparating && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 200,
          background: 'rgba(8, 10, 20, 0.82)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          borderRadius: 8,
        }}>
          {/* Spinner */}
          <div style={{
            width: 44,
            height: 44,
            border: '4px solid rgba(167,139,250,0.2)',
            borderTop: '4px solid #a78bfa',
            borderRadius: '50%',
            animation: 'texfy-spin 0.8s linear infinite',
          }} />
          <div style={{
            color: '#e2e8f0',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}>
            ⚡ Separating layers...
          </div>
          <style>{`
            @keyframes texfy-spin {
              0%   { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Full-viewport drag overlay */}
      {isDragOver && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          pointerEvents: 'none',
          border: '3px dashed #3b82f6',
          borderRadius: 8,
          background: 'rgba(59,130,246,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            color: '#60a5fa',
            fontSize: 22,
            fontWeight: 700,
            background: 'rgba(10,16,30,0.85)',
            padding: '14px 32px',
            borderRadius: 12,
            border: '2px dashed #3b82f6',
            letterSpacing: '0.01em',
            backdropFilter: 'blur(8px)',
          }}>
            🖼 Drop image here
          </div>
        </div>
      )}

      {/* Canvas wrapper with zoom transform */}
      <div
        ref={canvasWrapperRef}
        className="canvas-wrapper"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        <canvas ref={canvasElRef} className="canvas-element" />


        {/* Floating delete button — macOS/Canva style, centered above selection */}
        {selectedObj && deletePos && (
          <button
            className="delete-float"
            style={{
              left: deletePos.x,
              top: deletePos.y,
            }}
            onMouseDown={(e) => { e.preventDefault(); deleteSelected(); }}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Canvas size display */}
      <div className="canvas-size-badge">
        {canvasSize.w} × {canvasSize.h}
      </div>

      {/* Zoom slider */}
      <div className="zoom-controls glass">
        <span className="zoom-label">{zoom}%</span>
        <input
          type="range"
          className="zoom-slider"
          min={25}
          max={200}
          step={1}
          value={zoom}
          onChange={e => setZoom(parseInt(e.target.value))}
          onWheel={e => {
            e.preventDefault();
            setZoom(z => Math.max(25, Math.min(200, z + (e.deltaY < 0 ? 5 : -5))));
          }}
          title="Zoom"
        />
      </div>

      {/* ── Layer Panel ── positioned at bottom-left of viewport */}
      <LayerPanel
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectLayer={onSelectLayer}
        onToggleVisibility={onToggleVisibility}
        onToggleLock={onToggleLock}
        onDeleteLayer={onDeleteLayer}
        onAddLayer={addBlankLayer}
        onReorderLayers={onReorderLayers}
        fabricRef={fabricRef}
      />

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(15,17,26,0.95)',
            color: '#f8fafc',
            padding: '10px 22px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(10px)',
            whiteSpace: 'nowrap',
            opacity: toast.visible ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
