import { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Canvas from './components/Canvas';

export default function App() {
  const fabricRef = useRef(null);

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
  // orderedIds: array of layer IDs from PANEL TOP → BOTTOM
  // Panel top = canvas front (highest z-index)
  // Panel bottom = canvas back (lowest z-index)
  const handleReorderLayers = useCallback((orderedIds) => {
    setLayers(prev => {
      // Build new layers array in panel order (front→back)
      const frontToBack = orderedIds
        .map(id => prev.find(l => l.id === id))
        .filter(Boolean);

      // Sync fabric canvas: frontToBack[0] = front = highest canvas index
      const canvas = fabricRef.current;
      if (canvas) {
        frontToBack.forEach((layer, panelIdx) => {
          const obj = canvas.getObjects().find(o => o.__layerId === layer.id);
          if (!obj) return;
          // panelIdx 0 = front = canvas index (n-1), last = back = canvas index 0
          const targetIdx = frontToBack.length - 1 - panelIdx;
          // Move object to target index in the canvas stack
          const objs = canvas._objects;
          const cur = objs.indexOf(obj);
          if (cur !== -1 && cur !== targetIdx) {
            objs.splice(cur, 1);
            objs.splice(targetIdx, 0, obj);
          }
        });
        canvas.requestRenderAll();
      }

      // Store layers front-to-back so panel display (which reverses) shows top=front
      return frontToBack;
    });
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

  return (
    <div className="app-root">
      <Toolbar
        fabricRef={fabricRef}
        undoStack={undoStack}
        setUndoStack={setUndoStack}
        redoStack={redoStack}
        setRedoStack={setRedoStack}
      />
      <div className="app-body">
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
        <Canvas
          fabricRef={fabricRef}
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
          // Layer callbacks
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
        />
        <RightSidebar
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
  );
}
