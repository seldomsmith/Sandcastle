import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useDispatch, useSelector } from 'react-redux';
import { Viewport } from 'pixi-viewport';
import type { RootState } from '../store';
import { addRoute, updateRoutePoints, type RoutePoint, ROUTE_COLORS } from '../store/routeSlice';
import { addStop } from '../store/infrastructureSlice';
import { updateCatchment } from '../store/gridSlice';
import { setToolMode } from '../store/toolSlice';
import { store } from '../store';

const CELL_SIZE = 20;
const GRID_W = 100;
const MAX_DENSITY = 150;

interface ViewportCanvasProps {
  heatmapVisible: boolean;
  coverageVisible: boolean;
}

const ViewportCanvas: React.FC<ViewportCanvasProps> = ({ heatmapVisible, coverageVisible }) => {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const heatmapGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const routeGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const previewGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const infraGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const colorIndexRef = useRef(0);

  const grid = useSelector((state: RootState) => state.grid);
  const { routes } = useSelector((state: RootState) => state.route);
  // Always read latest tool mode through a ref so async event handlers see it
  const toolModeRef = useRef<string>('select');
  const toolMode = useSelector((state: RootState) => state.tool.mode);
  const editingRouteId = useSelector((state: RootState) => state.tool.editingRouteId);
  const editingRouteIdRef = useRef<string | null>(null);
  useEffect(() => { toolModeRef.current = toolMode; }, [toolMode]);
  useEffect(() => { editingRouteIdRef.current = editingRouteId; }, [editingRouteId]);

  // ─── Draw helpers ─────────────────────────────────────────
  const drawHeatmap = useCallback((cells: RootState['grid']['cells'], showHeatmap: boolean, showCoverage: boolean) => {
    const g = heatmapGraphicsRef.current;
    if (!g) return;
    g.clear();
    cells.forEach((cell) => {
      if (showHeatmap && cell.population > 0) {
        const commuter = Math.round(Math.max(0, Math.min(1, cell.commuterRatio)) * 255);
        const allPurpose = Math.round(Math.max(0, Math.min(1, cell.allPurposeRatio)) * 255);
        const alpha = Math.min(1, cell.population / MAX_DENSITY);
        const fillColor = (commuter << 16) | allPurpose;
        g.beginFill(fillColor, alpha);
        g.drawRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        g.endFill();
      }
      if (showCoverage && cell.catchmentMultiplier > 0) {
        const alpha = 0.18 + cell.catchmentMultiplier * 0.22;
        g.beginFill(0x22ff88, Math.min(0.6, alpha));
        g.drawRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        g.endFill();
      }
    });
  }, []);

  const drawRoutes = useCallback((routeList: RootState['route']['routes']) => {
    const g = routeGraphicsRef.current;
    if (!g) return;
    g.clear();
    routeList.forEach((route) => {
      if (!route.visible) return; // Skip hidden routes
      if (route.points.length < 2) return;
      const weight = Math.min(10, Math.max(4, 4 + route.serviceLoad / 10));
      const colorValue = parseInt(route.color.replace('#', ''), 16);

      g.lineStyle(weight, colorValue, 0.88);
      g.moveTo(route.points[0].x * CELL_SIZE, route.points[0].y * CELL_SIZE);
      for (let i = 1; i < route.points.length; i++) {
        g.lineTo(route.points[i].x * CELL_SIZE, route.points[i].y * CELL_SIZE);
      }
      g.stroke();
    });
  }, []);

  useEffect(() => { drawHeatmap(grid.cells, heatmapVisible, coverageVisible); }, [grid.generation, drawHeatmap, heatmapVisible, coverageVisible]);
  useEffect(() => { drawRoutes(routes); }, [routes, drawRoutes]);

  // ─── Core PixiJS init ─────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
    let isCancelled = false;
    let cleanupFn: (() => void) | undefined;

    const initPixi = async () => {
      const app = new PIXI.Application();
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xFFFFFF,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (isCancelled) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      if (!canvasRef.current) { app.destroy(true); return; }
      canvasRef.current.appendChild(app.canvas);

      const viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: GRID_W * CELL_SIZE,
        worldHeight: GRID_W * CELL_SIZE,
        events: app.renderer.events,
      });
      app.stage.addChild(viewport);
      viewportRef.current = viewport;

      // Scroll-wheel zoom only — no drag plugin
      viewport.wheel().clampZoom({ minScale: 0.15, maxScale: 8 });

      // Center on the populated 10×10 urban core
      const coreCenter = ((GRID_W - 1) / 2) * CELL_SIZE;
      viewport.moveCenter(coreCenter, coreCenter);
      viewport.setZoom(2.5);

      // ── Layers (z-order matters) ───────────────────────────
      const gridGraphics = new PIXI.Graphics();
      viewport.addChild(gridGraphics);
      gridGraphics.setStrokeStyle({ width: 0.5, color: 0xCCCCCC });
      for (let x = 0; x <= GRID_W; x++) {
        gridGraphics.moveTo(x * CELL_SIZE, 0);
        gridGraphics.lineTo(x * CELL_SIZE, GRID_W * CELL_SIZE);
      }
      for (let y = 0; y <= GRID_W; y++) {
        gridGraphics.moveTo(0, y * CELL_SIZE);
        gridGraphics.lineTo(GRID_W * CELL_SIZE, y * CELL_SIZE);
      }
      gridGraphics.stroke();

      const hGraphics = new PIXI.Graphics();
      viewport.addChild(hGraphics);
      heatmapGraphicsRef.current = hGraphics;

      const rGraphics = new PIXI.Graphics();
      viewport.addChild(rGraphics);
      routeGraphicsRef.current = rGraphics;

      // Separate preview layer — never touches committed routes
      const pGraphics = new PIXI.Graphics();
      viewport.addChild(pGraphics);
      previewGraphicsRef.current = pGraphics;

      const iGraphics = new PIXI.Graphics();
      viewport.addChild(iGraphics);
      infraGraphicsRef.current = iGraphics;

      // Draw initial state
      const s = store.getState();
      drawHeatmap(s.grid.cells, heatmapVisible, coverageVisible);
      drawRoutes(s.route.routes);

      // ── Custom pointer state ──────────────────────────────
      const isDrawingRef = { current: false };
      const isPanningRef = { current: false };
      const panStartRef = { current: { screenX: 0, screenY: 0, vpX: 0, vpY: 0 } };
      const currentPathRef = { current: [] as RoutePoint[] };

      const getSnapped = (screenX: number, screenY: number): RoutePoint => {
        const local = viewport.toLocal(new PIXI.Point(screenX, screenY));
        return {
          x: Math.round(local.x / CELL_SIZE),
          y: Math.round(local.y / CELL_SIZE),
        };
      };

      const calculateCatchment = (sx: number, sy: number) => {
        const updates: { index: number; multiplier: number }[] = [];
        for (let dy = -4; dy <= 4; dy++) {
          for (let dx = -4; dx <= 4; dx++) {
            const tx = sx + dx; const ty = sy + dy;
            if (tx >= 0 && tx < GRID_W && ty >= 0 && ty < GRID_W) {
              const md = Math.abs(dx) + Math.abs(dy);
              if (md >= 1 && md <= 4) {
                const multiplier = 1.0 - (md - 1) * 0.3;
                if (multiplier > 0) updates.push({ index: ty * GRID_W + tx, multiplier });
              }
            }
          }
        }
        dispatch(updateCatchment(updates));
      };

      // Preview draw — uses pGraphics (separate layer), never touches rGraphics
      const drawPreview = (path: RoutePoint[], color: string) => {
        pGraphics.clear();
        if (path.length < 2) return;
        const previewColor = parseInt(color.replace('#', ''), 16);
        pGraphics.lineStyle(4, previewColor, 0.7);
        pGraphics.moveTo(path[0].x * CELL_SIZE, path[0].y * CELL_SIZE);
        for (let i = 1; i < path.length; i++) {
          pGraphics.lineTo(path[i].x * CELL_SIZE, path[i].y * CELL_SIZE);
        }
        pGraphics.stroke();
      };

      // ── Raw DOM events on the canvas ──────────────────────
      const canvas = app.canvas;
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = 'none';
      canvas.style.webkitUserSelect = 'none';

      const getClientPoint = (e: PointerEvent | MouseEvent) => ({ x: e.clientX, y: e.clientY });
      const isLeftButton = (e: PointerEvent | MouseEvent) => ('button' in e ? e.button === 0 : true);

      const onInputDown = (e: PointerEvent | MouseEvent) => {
        const mode = toolModeRef.current;
        if (!isLeftButton(e)) return;

        const { x, y } = getClientPoint(e);

        if (mode === 'select') {
          isPanningRef.current = true;
          panStartRef.current = {
            screenX: x,
            screenY: y,
            vpX: viewport.x,
            vpY: viewport.y,
          };
          if ('pointerId' in e) {
            canvas.setPointerCapture(e.pointerId);
          }
          return;
        }

        if (mode === 'drawRoute' || mode === 'editRoute') {
          isDrawingRef.current = true;

          if (mode === 'editRoute' && editingRouteIdRef.current) {
            const st = store.getState();
            const editRoute = st.route.routes.find(r => r.id === editingRouteIdRef.current);
            if (editRoute && editRoute.points.length > 0) {
              currentPathRef.current = [...editRoute.points];
            } else {
              currentPathRef.current = [getSnapped(x, y)];
            }
          } else {
            currentPathRef.current = [getSnapped(x, y)];
          }

          if ('pointerId' in e) {
            canvas.setPointerCapture(e.pointerId);
          }
          return;
        }

        if (mode === 'placeStop') {
          const snapped = getSnapped(x, y);
          const id = crypto.randomUUID();
          dispatch(addStop({ id, x: snapped.x, y: snapped.y }));
          iGraphics.beginFill(0x000000);
          iGraphics.drawCircle(snapped.x * CELL_SIZE, snapped.y * CELL_SIZE, 5);
          iGraphics.endFill();
          calculateCatchment(snapped.x, snapped.y);
          return;
        }
      };

      const onInputMove = (e: PointerEvent | MouseEvent) => {
        const mode = toolModeRef.current;
        const { x, y } = getClientPoint(e);

        if (mode === 'select' && isPanningRef.current) {
          const dx = x - panStartRef.current.screenX;
          const dy = y - panStartRef.current.screenY;
          viewport.x = panStartRef.current.vpX + dx;
          viewport.y = panStartRef.current.vpY + dy;
          return;
        }

        if ((mode === 'drawRoute' || mode === 'editRoute') && isDrawingRef.current) {
          const snapped = getSnapped(x, y);
          const pts = currentPathRef.current;
          const last = pts[pts.length - 1];
          if (snapped.x !== last.x || snapped.y !== last.y) {
            if (snapped.x !== last.x && snapped.y !== last.y) {
              pts.push({ x: snapped.x, y: last.y });
            }
            pts.push(snapped);

            const previewColor = mode === 'editRoute'
              ? (store.getState().route.routes.find(r => r.id === editingRouteIdRef.current)?.color || '#FFFFFF')
              : ROUTE_COLORS[colorIndexRef.current % ROUTE_COLORS.length];
            drawPreview(pts, previewColor);
          }
          return;
        }
      };

      const onInputUp = (e: PointerEvent | MouseEvent) => {
        const mode = toolModeRef.current;

        if (mode === 'select' && isPanningRef.current) {
          isPanningRef.current = false;
          if ('pointerId' in e) {
            canvas.releasePointerCapture(e.pointerId);
          }
          return;
        }

        if ((mode === 'drawRoute' || mode === 'editRoute') && isDrawingRef.current) {
          isDrawingRef.current = false;
          if ('pointerId' in e) {
            canvas.releasePointerCapture(e.pointerId);
          }
          pGraphics.clear(); // Clear preview layer

          if (currentPathRef.current.length >= 2) {
            if (mode === 'editRoute' && editingRouteIdRef.current) {
              dispatch(updateRoutePoints({
                routeId: editingRouteIdRef.current,
                points: [...currentPathRef.current],
              }));
              dispatch(setToolMode('select'));
            } else {
              const color = ROUTE_COLORS[colorIndexRef.current % ROUTE_COLORS.length];
              colorIndexRef.current++;
              dispatch(addRoute({
                id: crypto.randomUUID(),
                name: `Route ${colorIndexRef.current}`,
                points: [...currentPathRef.current],
                color,
                weeklyFrequency: Array(168).fill(0),
                serviceLoad: 0,
                visible: true,
              }));
            }
          }
          currentPathRef.current = [];
          return;
        }
      };

      const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;
      if (supportsPointer) {
        canvas.addEventListener('pointerdown', onInputDown);
        canvas.addEventListener('pointermove', onInputMove);
        canvas.addEventListener('pointerup', onInputUp);
      } else {
        canvas.addEventListener('mousedown', onInputDown);
        window.addEventListener('mousemove', onInputMove);
        window.addEventListener('mouseup', onInputUp);
      }
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        viewport.resize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      cleanupFn = () => {
        window.removeEventListener('resize', handleResize);
        if (supportsPointer) {
          canvas.removeEventListener('pointerdown', onInputDown);
          canvas.removeEventListener('pointermove', onInputMove);
          canvas.removeEventListener('pointerup', onInputUp);
        } else {
          canvas.removeEventListener('mousedown', onInputDown);
          window.removeEventListener('mousemove', onInputMove);
          window.removeEventListener('mouseup', onInputUp);
        }
        app.destroy(true, { children: true, texture: true });
        viewportRef.current = null;
        heatmapGraphicsRef.current = null;
        routeGraphicsRef.current = null;
        previewGraphicsRef.current = null;
        infraGraphicsRef.current = null;
      };
    };

    initPixi();
    return () => { 
      isCancelled = true;
      if (cleanupFn) cleanupFn(); 
    };
  }, [dispatch, drawHeatmap, drawRoutes]);

  return (
    <div ref={canvasRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
  );
};

export default ViewportCanvas;
