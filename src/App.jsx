import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Canvas from './components/Canvas';

export default function App() {
  const fabricRef = useRef(null);
  const canvasResizeRef = useRef(null); // Canvas stores resizeCanvas(w,h) here; Toolbar calls it

  // ── Selected object state ─────────────────────────────
  const [selectedObj, setSelectedObj] = useState(null);

  // ── Canvas / zoom ─────────────────────────────────────
  const [zoom, setZoom] = useState(100);
  const [bgColor, setBgColor] = useState('#ffffff');

  // ── Left sidebar state ────────────────────────────────
  const [fontFamily, setFontFamily] = useState('Inter');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState('left');
  const [textColor, setTextColor] = useState('#000000');

  // ── Sidebar open/close ────────────────────────────────
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // ── Right sidebar state (with defaults per spec) ──────
  const [fontSize, setFontSize] = useState(32);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [lineHeight, setLineHeight] = useState(1.2);
  const [opacity, setOpacity] = useState(100);
  const [effect, setEffect] = useState('normal');
  const [rotation, setRotation] = useState(0);

  // ── Undo/Redo history ─────────────────────────────────
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ── Layer state ───────────────────────────────────────
  // Each layer: { id, number, name, fabricObjectId, visible, locked }
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);

  // ── Sync sidebar state from selected object ───────────
  useEffect(() => {
    if (!selectedObj) return;
    setFontFamily(selectedObj.fontFamily || 'Inter');
    setBold(selectedObj.fontWeight === 'bold');
    setItalic(selectedObj.fontStyle === 'italic');
    setUnderline(!!selectedObj.underline);
    setAlign(selectedObj.textAlign || 'left');
    setTextColor(selectedObj.fill || '#000000');
    setFontSize(Math.round(selectedObj.fontSize || 32));
    setLetterSpacing(selectedObj.charSpacing ? Math.round(selectedObj.charSpacing / 10 * 10) / 10 : 0);
    setLineHeight(Math.round((selectedObj.lineHeight || 1.2) * 10) / 10);
    setOpacity(Math.round((selectedObj.opacity ?? 1) * 100));
    setRotation(Math.round(selectedObj.angle || 0));
  }, [selectedObj]);

  // ── Keyboard shortcuts (Ctrl+Z / Ctrl+Y) ─────────────
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('texfy-undo'));
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('texfy-redo'));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ── Layer callbacks (passed to Canvas & LayerPanel) ───

  /**
   * Called by Canvas when a new text object is added.
   * @param {object} fabricObj - the new fabric.IText instance
   */
  const onLayerAdd = useCallback((fabricObj) => {
    const layerNum = Date.now(); // unique sequential key via timestamp
    const id = `layer-${layerNum}`;
    fabricObj.__layerId = id; // tag the fabric object
    const name = (fabricObj.text || 'Your text here').slice(0, 20);
    setLayers(prev => [
      ...prev,
      { id, number: prev.length + 1, name, fabricObjectId: id, visible: true, locked: false }
    ]);
    setActiveLayerId(id);
  }, []);

  /**
   * Called by Canvas when a fabric object is selected.
   * Syncs active layer highlight in the panel.
   */
  const onLayerSelect = useCallback((fabricObj) => {
    if (!fabricObj) {
      setActiveLayerId(null);
      return;
    }
    if (fabricObj.__layerId) {
      setActiveLayerId(fabricObj.__layerId);
    }
  }, []);

  /**
   * Called by Canvas when text is edited (text:changed).
   * Updates the layer name to reflect new content.
   */
  const onLayerNameUpdate = useCallback((fabricObj) => {
    if (!fabricObj?.__layerId) return;
    const id = fabricObj.__layerId;
    const newName = (fabricObj.text || 'Your text here').slice(0, 20);
    setLayers(prev =>
      prev.map(l => l.id === id ? { ...l, name: newName } : l)
    );
  }, []);

  /**
   * Called when a layer object is removed from the canvas externally
   * (e.g. Delete key press). Removes the layer from state.
   */
  const onLayerRemove = useCallback((fabricObj) => {
    if (!fabricObj?.__layerId) return;
    const id = fabricObj.__layerId;
    setLayers(prev => prev.filter(l => l.id !== id));
    setActiveLayerId(prev => (prev === id ? null : prev));
  }, []);

  // ── Reorder layers (drag-and-drop in panel) ───────────
  // orderedIds: PANEL order = front-to-back (top → bottom)
  const handleReorderLayers = useCallback((orderedIds) => {
    // 1. Update React state (pure — no side effects inside)
    setLayers(prev => {
      const frontToBack = orderedIds
        .map(id => prev.find(l => l.id === id))
        .filter(Boolean);
      // Store back-to-front so layers.reverse() in LayerPanel = correct panel order
      return [...frontToBack].reverse();
    });

    // 2. Sync Fabric canvas z-order using official API (no internal hacks)
    const canvas = fabricRef.current;
    if (!canvas) return;

    // orderedIds[0] = panel top = frontmost
    // We want backmost first, frontmost last in canvas stack
    const backToFront = [...orderedIds].reverse();

    const userObjs = backToFront
      .map(id => canvas.getObjects().find(o => o.__layerId === id))
      .filter(Boolean);

    if (userObjs.length === 0) return;

    // Step 1: send all user layer objects to back (they pile up at index 0..n-1)
    // Do it in reverse so the first element ends up at the absolute back
    [...userObjs].reverse().forEach(obj => canvas.sendObjectToBack(obj));

    // Step 2: now the user objects are stacked in backToFront order at the bottom.
    // Non-layer objects (guides) were pushed above them by sendObjectToBack.
    // Bring non-layer objects back to the very bottom so they don't interfere:
    canvas.getObjects()
      .filter(o => !o.__layerId)
      .forEach(o => canvas.sendObjectToBack(o));

    // Step 3: force a synchronous redraw
    canvas.renderAll();
  }, [fabricRef]);

  // ── Panel: select layer → select fabric object ────────
  const handleSelectLayer = useCallback((layerId) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.locked) return; // can't select locked
    const obj = canvas.getObjects().find(o => o.__layerId === layerId);
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      setSelectedObj(obj);
      setActiveLayerId(layerId);
    }
  }, [layers]);

  // ── Panel: toggle visibility ──────────────────────────
  const handleToggleVisibility = useCallback((layerId) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(o => o.__layerId === layerId);
    if (!obj) return;
    const nowVisible = !obj.visible;
    obj.set('visible', nowVisible);
    // If hiding the currently selected object, deselect it
    if (!nowVisible && canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
      setSelectedObj(null);
      setActiveLayerId(null);
    }
    canvas.requestRenderAll();
    setLayers(prev =>
      prev.map(l => l.id === layerId ? { ...l, visible: nowVisible } : l)
    );
  }, []);

  // ── Panel: toggle lock ────────────────────────────────
  const handleToggleLock = useCallback((layerId) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(o => o.__layerId === layerId);
    if (!obj) return;
    const layer = layers.find(l => l.id === layerId);
    const nowLocked = !layer?.locked;
    obj.set({
      selectable: !nowLocked,
      evented: !nowLocked,
    });
    // If locking the active object, deselect
    if (nowLocked && canvas.getActiveObject() === obj) {
      canvas.discardActiveObject();
      setSelectedObj(null);
      setActiveLayerId(null);
    }
    canvas.requestRenderAll();
    setLayers(prev =>
      prev.map(l => l.id === layerId ? { ...l, locked: nowLocked } : l)
    );
  }, [layers]);

  // ── Panel: delete layer ───────────────────────────────
  const handleDeleteLayer = useCallback((layerId) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects().find(o => o.__layerId === layerId);
    if (obj) {
      canvas.remove(obj);
      if (canvas.getActiveObject() === obj) {
        canvas.discardActiveObject();
        setSelectedObj(null);
      }
      canvas.requestRenderAll();
    }
    setLayers(prev => prev.filter(l => l.id !== layerId));
    setActiveLayerId(prev => (prev === layerId ? null : prev));
  }, []);

  // ── Panel: flatten selected layers into a Fabric.Group ──────────────────
  const handleFlattenLayers = useCallback((layerIds) => {
    if (!layerIds || layerIds.length < 2) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Gather fabric objects in the order they appear on canvas (back-to-front)
    const allObjs = canvas.getObjects();
    const targets = allObjs.filter(o => layerIds.includes(o.__layerId));
    if (targets.length < 2) return;

    // Deselect before grouping
    canvas.discardActiveObject();

    // Build a Fabric Group from the targets
    const group = new (targets[0].constructor.prototype.constructor.name === 'FabricImage'
      ? Object : Object)({
      // fallback – we’ll use fabric.Group via dynamic import
    });

    // Use fabric.Group directly
    import('fabric').then(({ Group }) => {
      const fabricGroup = new Group(targets, { interactive: false });
      const newId = `layer-group-${Date.now()}`;
      fabricGroup.__layerId = newId;

      // Remove originals and add group
      targets.forEach(o => canvas.remove(o));
      canvas.add(fabricGroup);

      // Group count for name
      setLayers(prev => {
        const groupCount = prev.filter(l => l.name?.startsWith('Group')).length + 1;
        // Find the topmost index among selected layers
        const selectedLayerObjs = prev.filter(l => layerIds.includes(l.id));
        const remaining = prev.filter(l => !layerIds.includes(l.id));
        // Insert group at position of the highest-z selected layer
        const topIdx = Math.max(...layerIds.map(id => prev.findIndex(l => l.id === id)));
        const insertIdx = Math.max(0, topIdx - (selectedLayerObjs.length - 1));
        const newLayer = {
          id: newId,
          number: insertIdx + 1,
          name: `Group ${groupCount}`,
          fabricObjectId: newId,
          visible: true,
          locked: false,
        };
        const next = [...remaining];
        // Find insert position in remaining (after removing selected)
        const refLayer = prev[topIdx];
        const refIdxInRemaining = refLayer ? remaining.findIndex(l => l.id === refLayer.id) : remaining.length;
        next.splice(Math.max(0, refIdxInRemaining), 0, newLayer);
        return next;
      });

      setActiveLayerId(newId);
      canvas.setActiveObject(fabricGroup);
      canvas.requestRenderAll();
      console.info(`[Texfy] Flattened ${targets.length} layers into a Group`);
    });
  }, []);

  // ── Shared toggle-tab style factory ────────────────────
  const tabStyle = (side) => ({
    position: 'absolute',
    [side === 'left' ? 'right' : 'left']: -15,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 15,
    height: 48,
    background: 'rgba(18, 18, 28, 0.97)',
    border: '1px solid rgba(124, 58, 237, 0.28)',
    borderLeft: side === 'left' ? 'none' : '1px solid rgba(124, 58, 237, 0.28)',
    borderRight: side === 'right' ? 'none' : '1px solid rgba(124, 58, 237, 0.28)',
    borderRadius: side === 'left' ? '0 7px 7px 0' : '7px 0 0 7px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    zIndex: 20,
    transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
    userSelect: 'none',
  });

  return (
    <div className="app-root">
      <Toolbar
        fabricRef={fabricRef}
        canvasResizeRef={canvasResizeRef}
        undoStack={undoStack}
        setUndoStack={setUndoStack}
        redoStack={redoStack}
        setRedoStack={setRedoStack}
      />
      <div className="app-body">

        {/* ── Left sidebar + toggle ── */}
        <div style={{ position: 'relative', flexShrink: 0, zIndex: 10 }}>
          <div style={{
            width: leftOpen ? 180 : 0,
            overflow: 'hidden',
            transition: 'width 0.25s ease',
            height: '100%',
          }}>
            <LeftSidebar
              fabricRef={fabricRef}
              selectedObj={selectedObj}
              fontFamily={fontFamily} setFontFamily={setFontFamily}
              bold={bold} setBold={setBold}
              italic={italic} setItalic={setItalic}
              underline={underline} setUnderline={setUnderline}
              align={align} setAlign={setAlign}
              textColor={textColor} setTextColor={setTextColor}
              bgColor={bgColor} setBgColor={setBgColor}
            />
          </div>
          {/* Left toggle tab */}
          <button
            onClick={() => setLeftOpen(v => !v)}
            style={tabStyle('left')}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.18)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(18,18,28,0.97)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.28)';
            }}
            title={leftOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {leftOpen ? '‹' : '›'}
          </button>
        </div>

        {/* ── Canvas ── */}
        <Canvas
          fabricRef={fabricRef}
          canvasResizeRef={canvasResizeRef}
          selectedObj={selectedObj}
          setSelectedObj={setSelectedObj}
          zoom={zoom}
          setZoom={setZoom}
          bgColor={bgColor}
          fontSize={fontSize} setFontSize={setFontSize}
          fontFamily={fontFamily}
          bold={bold}
          italic={italic}
          underline={underline}
          align={align}
          textColor={textColor}
          letterSpacing={letterSpacing} setLetterSpacing={setLetterSpacing}
          lineHeight={lineHeight} setLineHeight={setLineHeight}
          opacity={opacity} setOpacity={setOpacity}
          effect={effect}
          rotation={rotation} setRotation={setRotation}
          undoStack={undoStack} setUndoStack={setUndoStack}
          redoStack={redoStack} setRedoStack={setRedoStack}
          layers={layers}
          activeLayerId={activeLayerId}
          onLayerAdd={onLayerAdd}
          onLayerSelect={onLayerSelect}
          onLayerNameUpdate={onLayerNameUpdate}
          onLayerRemove={onLayerRemove}
          onSelectLayer={handleSelectLayer}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onDeleteLayer={handleDeleteLayer}
          onReorderLayers={handleReorderLayers}
          onFlattenLayers={handleFlattenLayers}
        />

        {/* ── Right sidebar + toggle ── */}
        <div style={{ position: 'relative', flexShrink: 0, zIndex: 10 }}>
          {/* Right toggle tab */}
          <button
            onClick={() => setRightOpen(v => !v)}
            style={tabStyle('right')}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,58,237,0.18)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.55)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(18,18,28,0.97)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.28)';
            }}
            title={rightOpen ? 'Collapse panel' : 'Expand panel'}
          >
            {rightOpen ? '›' : '‹'}
          </button>
          <div style={{
            width: rightOpen ? 190 : 0,
            overflow: 'hidden',
            transition: 'width 0.25s ease',
            height: '100%',
          }}>
            <RightSidebar
              fabricRef={fabricRef}
              selectedObj={selectedObj}
              fontSize={fontSize} setFontSize={setFontSize}
              letterSpacing={letterSpacing} setLetterSpacing={setLetterSpacing}
              lineHeight={lineHeight} setLineHeight={setLineHeight}
              opacity={opacity} setOpacity={setOpacity}
              effect={effect} setEffect={setEffect}
              rotation={rotation} setRotation={setRotation}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
