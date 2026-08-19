// Chapter ledger — the single data contract for camera endpoints, world channels and DOM sync.
// Positions are in island world units (see world/layout.js). Desktop and mobile compositions authored separately.
export const CHAPTERS = [
  {
    id: 'surface', section: '#hero', weight: 1.0,
    camera: { position: [25.1, 19.9, 28.3], target: [-1.8, -1.5, 2.2], fov: 20, mobile: { position: [26.5, 21.2, 29.8], target: [-1.8, -1.5, 2.2], fov: 30 } },
    world: { light: 0.85, cutaway: 0, candle: 0.15, field: 0, wind: 0.6, fog: 0.0, dim: 0, flow: 0.7 },
  },
  {
    id: 'descent', section: '#descent', weight: 1.5,
    camera: { position: [-1.4, 1.2, 12.5], target: [-4.9, -1.6, 5.0], fov: 28, mobile: { position: [-0.6, 1.4, 16.5], target: [-4.9, -1.8, 5.0], fov: 38 } },
    world: { light: 0.35, cutaway: 0.6, candle: 0.2, field: 0, wind: 0.2, fog: 0.02, dim: 0 },
  },
  {
    id: 'tool', section: '#wellfi', weight: 1.4,
    camera: { position: [-2.9, -2.1, 8.4], target: [-4.25, -3.15, 4.95], fov: 24, mobile: { position: [-2.4, -1.9, 10.6], target: [-4.25, -3.15, 4.95], fov: 34 } },
    world: { light: 0.22, cutaway: 0.85, candle: 0.35, field: 0, wind: 0.05, fog: 0.03, dim: 0 },
  },
  {
    id: 'signal', section: '#journey', weight: 1.6,
    camera: { position: [0.6, -0.4, 17.5], target: [-1.2, -2.6, 3.4], fov: 26, mobile: { position: [0.2, 0.2, 23.0], target: [-1.6, -2.4, 3.4], fov: 36 } },
    world: { light: 0.02, cutaway: 0.9, candle: 1.0, field: 1.0, wind: 0.0, fog: 0.05, dim: 0 },
  },
  {
    id: 'deployment', section: '#insight', weight: 1.5,
    camera: { position: [-3.6, -2.4, 7.2], target: [-4.25, -3.15, 4.95], fov: 22, mobile: { position: [-3.0, -2.2, 9.4], target: [-4.25, -3.15, 4.95], fov: 32 } },
    world: { light: 0.3, cutaway: 0.95, candle: 0.4, field: 0.15, wind: 0.05, fog: 0.03, dim: 0 },
  },
  {
    id: 'yotin', section: '#company', weight: 1.0,
    camera: { position: [-6.5, 5.2, 14.5], target: [-4.6, 0.6, 3.6], fov: 34, mobile: { position: [-6.0, 5.8, 18.5], target: [-4.6, 0.6, 3.6], fov: 44 } },
    world: { light: 0.7, cutaway: 0.2, candle: 0.1, field: 0.4, wind: 1.0, fog: 0.0, dim: 0 },
  },
  {
    id: 'fit', section: '#contact', weight: 1.3,
    camera: { position: [-0.9, 0.2, 11.8], target: [-4.6, -2.2, 5.0], fov: 28, mobile: { position: [-0.4, 0.4, 15.5], target: [-4.6, -2.3, 5.0], fov: 38 } },
    world: { light: 0.4, cutaway: 0.8, candle: 0.5, field: 0.3, wind: 0.15, fog: 0.02, dim: 0 },
  },
];

export const CHAPTER_IDS = CHAPTERS.map((c) => c.id);
