import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { useDispatch, useSelector } from 'react-redux';
import { Viewport } from 'pixi-viewport';
import type { RootState } from '../store';
import { addRoute, type RoutePoint, ROUTE_COLORS } from '../store/routeSlice';
import { addStop } from '../store/infrastructureSlice';
import { updateCatchment } from '../store/gridSlice';
import { store } from '../store';

const CELL_SIZE = 20;
const GRID_W = 100;
const MAX_DENSITY = 150;

const ViewportCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const heatmapGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const routeGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const infraGraphicsRef = useRef<PIXI.Graphics | null>(null);
  const colorIndexRef = useRef(0);

  const grid = useSelector((state: RootState) => state.grid);
  const { routes } = useSelector((state: RootState) => state.route);
  // Always read latest tool mode through a ref so async event handlers see it
  const toolModeRef = useRef<string>('select');
  const toolMode = useSelector((state: RootState) => state.tool.mode);
  useEffect(() => { toolModeRef.current = toolMode; }, [toolMode]);

  // ─── Draw helpers ─────────────────────────────────────────
  const drawHeatmap = useCallback((cells: RootState['grid']['cells']) => {
    const g = heatmapGraphicsRef.current;
    if (!g) return;
    g.clear();
    cells.forEach((cell) => {
      if (cell.population > 0) {
        const commuter = Math.round(Math.max(0, Math.min(1, cell.commuterRatio)) * 255);
        const allPurpose = Math.round(Math.max(0, Math.min(1, cell.allPurposeRatio)) * 255);
        const alpha = Math.min(1, cell.population / MAX_DENSITY);
        const fillColor = (commuter << 16) | allPurpose;
        g.beginFill(fillColor, alpha);
        g.drawRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        g.endFill();
      }
      if (cell.catchmentMultiplier > 0) {
        g.beginFill(0x22ff88, cell.catchmentMultiplier * 0.18);
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
      if (route.points.length < 2) return;
      const weight = Math.max(4, 4 + route.serviceLoad / 5);
      g.setStrokeStyle({ width: weight, color: new PIXI.Color(route.color) });
      g.moveTo(route.points[0].x * CELL_SIZE, route.points[0].y * CELL_SIZE);
      for (let i = 1; i < route.points.length; i++) {
        g.lineTo(route.points[i].x * CELL_SIZE, route.points[i].y * CELL_SIZE);
      }
      g.stroke();
    });
  }, []);

  useEffect(() => { drawHeatmap(grid.cells); }, [grid.cells, drawHeatmap]);
  useEffect(() => { drawRoutes(routes); }, [routes, drawRoutes]);

  // ─── Core PixiJS init ─────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;
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

      // Scroll-wheel zoom only — NO drag plugin.
      // We handle all pointer events ourselves so tool modes are totally clean.
      viewport.wheel().clampZoom({ minScale: 0.15, maxScale: 8 });

      // Center on the populated 10×10 urban core
      viewport.moveCenter(GRID_W * CELL_SIZE / 2, GRID_W * CELL_SIZE / 2);
      viewport.setZoom(2.5);

      // ── Layers ────────────────────────────────────────────
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

      const iGraphics = new PIXI.Graphics();
      viewport.addChild(iGraphics);
      infraGraphicsRef.current = iGraphics;

      // Draw initial state
      const s = store.getState();
      drawHeatmap(s.grid.cells);
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

      const getLocal = (screenX: number, screenY: number): PIXI.Point => {
        return viewport.toLocal(new PIXI.Point(screenX, screenY));
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

      const drawCurrentPath = () => {
        rGraphics.clear();
        drawRoutes(store.getState().route.routes);
        if (currentPathRef.current.length < 2) return;
        const previewColor = ROUTE_COLORS[colorIndexRef.current % ROUTE_COLORS.length];
        rGraphics.setStrokeStyle({ width: 4, color: new PIXI.Color(previewColor), alpha: 0.75 });
        rGraphics.moveTo(currentPathRef.current[0].x * CELL_SIZE, currentPathRef.current[0].y * CELL_SIZE);
        for (let i = 1; i < currentPathRef.current.length; i++) {
          rGraphics.lineTo(currentPathRef.current[i].x * CELL_SIZE, currentPathRef.current[i].y * CELL_SIZE);
        }
        rGraphics.stroke();
      };

      // ── Raw DOM events on the canvas element ─────────────
      // Using raw DOM events bypasses ALL pixi-viewport plugin conflicts.
      const canvas = app.canvas;

      const onPointerDown = (e: PointerEvent) => {
        const mode = toolModeRef.current;

        if (mode === 'select') {
          // Pan: record start position
          if (e.button === 0) {
            isPanningRef.current = true;
            panStartRef.current = {
              screenX: e.clientX,
              screenY: e.clientY,
              vpX: viewport.x,
              vpY: viewport.y,
            };
            canvas.setPointerCapture(e.pointerId);
          }
          return;
        }

        if (mode === 'drawRoute' && e.button === 0) {
          isDrawingRef.current = true;
          const snapped = getSnapped(e.clientX, e.clientY);
          currentPathRef.current = [snapped];
          canvas.setPointerCapture(e.pointerId);
          return;
        }

        if (mode === 'placeStop' && e.button === 0) {
          const snapped = getSnapped(e.clientX, e.clientY);
          const id = crypto.randomUUID();
          dispatch(addStop({ id, x: snapped.x, y: snapped.y }));
          iGraphics.beginFill(0x000000);
          iGraphics.drawCircle(snapped.x * CELL_SIZE, snapped.y * CELL_SIZE, 5);
          iGraphics.endFill();
          calculateCatchment(snapped.x, snapped.y);
          return;
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        const mode = toolModeRef.current;

        if (mode === 'select' && isPanningRef.current) {
          const dx = e.clientX - panStartRef.current.screenX;
          const dy = e.clientY - panStartRef.current.screenY;
          viewport.x = panStartRef.current.vpX + dx;
          viewport.y = panStartRef.current.vpY + dy;
          return;
        }

        if (mode === 'drawRoute' && isDrawingRef.current) {
          const snapped = getSnapped(e.clientX, e.clientY);
          const pts = currentPathRef.current;
          const last = pts[pts.length - 1];
          if (snapped.x !== last.x || snapped.y !== last.y) {
            // Orthogonal snap: move horizontally first, then vertically
            if (snapped.x !== last.x && snapped.y !== last.y) {
              pts.push({ x: snapped.x, y: last.y });
            }
            pts.push(snapped);
            drawCurrentPath();
          }
          return;
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        const mode = toolModeRef.current;

        if (mode === 'select' && isPanningRef.current) {
          isPanningRef.current = false;
          canvas.releasePointerCapture(e.pointerId);
          return;
        }

        if (mode === 'drawRoute' && isDrawingRef.current) {
          isDrawingRef.current = false;
          canvas.releasePointerCapture(e.pointerId);
          if (currentPathRef.current.length >= 2) {
            const color = ROUTE_COLORS[colorIndexRef.current % ROUTE_COLORS.length];
            colorIndexRef.current++;
            dispatch(addRoute({
              id: crypto.randomUUID(),
              name: `Route ${colorIndexRef.current}`,
              points: [...currentPathRef.current],
              color,
              weeklyFrequency: Array(168).fill(0),
              serviceLoad: 0,
            }));
          }
          currentPathRef.current = [];
          return;
        }
      };

      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        viewport.resize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      cleanupFn = () => {
        window.removeEventListener('resize', handleResize);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        app.destroy(true, { children: true, texture: true });
        viewportRef.current = null;
        heatmapGraphicsRef.current = null;
        routeGraphicsRef.current = null;
        infraGraphicsRef.current = null;
      };
    };

    initPixi();
    return () => { if (cleanupFn) cleanupFn(); };
  }, [dispatch, drawHeatmap, drawRoutes]);

  return (
    <div ref={canvasRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }} />
  );
};

export default ViewportCanvas;
