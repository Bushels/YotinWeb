// Interaction core (spec §5): a registry of hotspots, each with a 3D proxy (raycast target on its own layer)
// and a VISIBLE DOM twin (button/link ≥ 44 px). One finite state machine per hotspot —
// unavailable → idle ↔ hover/focus → active → idle — gated by exact chapter, and pointer/keyboard share one
// state setter so there is never a second visual code path. Raycasts run at most once per frame and only
// while a hotspot is available. Analytics: hotspot_activate on activate/keyboard only (never hover).
import * as THREE from 'three';
import { createOverUI, DIALOG } from './ui/overUI.js';

export const HOTSPOT_LAYER = 3;

export function createInteractions({ camera, canvas, world, getExact, requestRender, track }) {
  const registry = new Map();
  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(HOTSPOT_LAYER);
  const ndc = new THREE.Vector2();
  let pointerDirty = false, hovered = null, pointerInside = false, lastEvent = null;

  function register(id, { proxy, twin, chapters = [], apply3D = () => {}, onActivate = null, cursor = 'pointer' }) {
    if (proxy) { proxy.layers.enable(HOTSPOT_LAYER); proxy.userData.hotspot = id; }
    const item = { id, proxy, twin, chapters, apply3D, onActivate, cursor, state: 'unavailable', sticky: false };
    registry.set(id, item);
    if (twin) {
      twin.addEventListener('mouseenter', () => set(id, 'hover', 'pointer'));
      twin.addEventListener('mouseleave', () => { if (item.state === 'hover') set(id, 'idle', 'pointer'); });
      twin.addEventListener('focus', () => set(id, 'focus', 'key'));
      twin.addEventListener('blur', () => { if (item.state === 'focus') set(id, 'idle', 'key'); });
      twin.addEventListener('click', (e) => { activate(id, e.detail === 0 ? 'key' : 'pointer'); });
    }
    return item;
  }

  function available(item) {
    if (!item.chapters.length) return true;
    const p = getExact();
    return item.chapters.some(([a, b]) => p >= a && p < b);
  }

  function set(id, next, source) {
    const item = registry.get(id);
    if (!item) return;
    if (next !== 'unavailable' && !available(item)) next = 'unavailable';
    if (item.state === next) return;
    item.state = next;
    item.apply3D(next, item, source);
    if (item.twin) {
      item.twin.classList.toggle('is-hover', next === 'hover' || next === 'focus');
      item.twin.classList.toggle('is-active', next === 'active');
      item.twin.toggleAttribute('data-active', next === 'active');
      if (item.twin.hasAttribute('aria-expanded')) item.twin.setAttribute('aria-expanded', String(next === 'active'));
      item.twin.toggleAttribute('data-unavailable', next === 'unavailable');
    }
    requestRender();
  }

  function activate(id, source = 'pointer') {
    const item = registry.get(id);
    if (!item || !available(item)) return;
    const wasActive = item.state === 'active';
    // one active hotspot per group (siblings deactivate)
    registry.forEach((o) => { if (o !== item && o.state === 'active') set(o.id, 'idle', source); });
    set(id, wasActive ? 'idle' : 'active', source);
    if (!wasActive && item.onActivate) item.onActivate(item, source);
    if (!wasActive && track) track('hotspot_activate', { id, input: source });
  }

  // Pointer over the canvas layer: the DOM sits above the canvas with pointer-events on, so we listen on
  // window and only raycast when the pointer is over "empty" DOM (the target is main/section/body).
  function onPointerMove(e) { lastEvent = e; pointerDirty = true; }
  function onPointerDown(e) {
    lastEvent = e; pointerDirty = true;
    resolve();
    if (hovered && registry.get(hovered)) activate(hovered, e.pointerType === 'touch' ? 'touch' : 'pointer');
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerleave', () => { pointerInside = false; if (hovered) { set(hovered, 'idle', 'pointer'); hovered = null; } });

  const proxies = [];
  function refreshProxies() { proxies.length = 0; registry.forEach((it) => { if (it.proxy && available(it)) proxies.push(it.proxy); }); }

  const overUI = createOverUI(DIALOG);
  const overInteractiveDOM = (e) => overUI(e.target);

  function resolve() {
    if (!pointerDirty || !lastEvent) return;
    pointerDirty = false;
    const e = lastEvent;
    if (overInteractiveDOM(e)) { if (hovered) { set(hovered, 'idle', 'pointer'); hovered = null; canvas.style.cursor = ''; } return; }
    refreshProxies();
    if (!proxies.length) { if (hovered) { set(hovered, 'idle', 'pointer'); hovered = null; } return; }
    const r = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = ((e.clientY - r.top) / r.height) * -2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(proxies, false);
    const id = hits.length ? hits[0].object.userData.hotspot : null;
    if (id !== hovered) {
      if (hovered) set(hovered, 'idle', 'pointer');
      hovered = id;
      if (hovered) set(hovered, 'hover', 'pointer');
      document.body.style.cursor = hovered ? (registry.get(hovered).cursor || 'pointer') : '';
    }
  }

  // Chapter gating: when exact progress leaves a hotspot's range it becomes unavailable (and inactive).
  function updateAvailability() {
    registry.forEach((it) => {
      const ok = available(it);
      if (!ok && it.state !== 'unavailable') set(it.id, 'unavailable', 'chapter');
      else if (ok && it.state === 'unavailable') set(it.id, 'idle', 'chapter');
    });
  }

  function update() { resolve(); }

  // `hovered` is the hotspot the last resolved pointer event landed on (resolve() runs synchronously inside
  // onPointerDown). The tap ripple reads it to prove a hotspot took the tap first — hotspots always win.
  return { register, activate, set, get: (id) => registry.get(id), update, updateAvailability, registry, get hovered() { return hovered; } };
}
