// Chapter 6 — fit (spec §4 row 6, §12). The qualifier stays the invited action; this module only LISTENS to the
// normalized `qualifier:state` events main.js dispatches ({ step, lift, fluid, temp, hasLength, landing, verdict }
// — no typed number, no raw text, spec §0) and:
//   · re-poses the live well through src/world/wellBuilder.js while #contact is the active chapter,
//   · writes one masked, aria-live caption per state change (words only — no numbers, no echoes of answers),
//   · adds "Download schematic" beside Send / Copy once the verdict renders — a 1200 by 630 title-block PNG drawn
//     client-side from the normalized state and saved through a temporary <a download>. Nothing leaves the page.
import '../styles/fit.css';
// wellBuilder is a world module: imported dynamically once the world is live so the stills path never
// requests a world-chunk byte (spec §6, reduced-motion contract).
let createWellBuilder = null;

const CAPTION = {
  lift: { pcp: 'PCP drive head at surface', rod: 'beam pump at surface', esp: 'ESP — wellhead only at surface', flow: 'flowing well — wellhead only' },
  fluid: { heavy: 'heavy-oil flow', light: 'light-oil flow', gas: 'gas flow', thermal: 'thermal — warm haze, near the temperature ceiling' },
  temp: { cool: 'runs cool downhole', warm: 'at spec temperature', over: 'above the rated temperature — collar dimmed', unsure: 'temperature unconfirmed' },
  landing: {
    shallower: 'Pump answered shallower · WellFi proposed inside the intermediate · inside casing — reduced signal',
    deeper: 'Pump answered deeper · Proposed outside-intermediate WellFi configuration — review required · open hole — strongest signal',
  },
  verdict: { strong: 'strong fit — WellFi lights at the proposed placement', review: 'likely fit — review required', future: 'high-temp version in development — tool dimmed' },
};
/* The standoff rule of thumb is printed in three places (masked caption, projected DOM caption,
   downloaded PNG); all three carry the provenance below, so the number never travels bare. */
const STANDOFF_SOURCE = 'Yotin deployment practice — internal rule of thumb, not a published figure';
// source: Yotin deployment practice — internal rule of thumb, not a published figure
const STANDOFF_TEXT = 'standoff line drawn — 10 % of intermediate';
const SPEC_LINE = '10,000 psia · 150 °C · 46 mm OD · 5+ yr · MODBUS RS-485 / 4-20 mA';
const FOOT_LINE = 'representative · not to scale · generated locally';
const VERDICT_LABEL = { strong: 'Strong fit', review: 'Likely fit — review required', future: 'High-temp version in development' };

function track(name, params) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) { /* analytics never breaks the page */ }
}

// Caption text from the normalized state only (no digits beyond the public "10 %" rule).
export function captionFor(s) {
  if (!s) return '';
  const parts = [];
  if (s.lift && CAPTION.lift[s.lift]) parts.push(CAPTION.lift[s.lift]);
  if (s.fluid && CAPTION.fluid[s.fluid]) parts.push(CAPTION.fluid[s.fluid]);
  if (s.temp && CAPTION.temp[s.temp]) parts.push(CAPTION.temp[s.temp]);
  if (s.hasLength && !s.landing) parts.push(STANDOFF_TEXT);
  if (s.landing && CAPTION.landing[s.landing]) parts.push(CAPTION.landing[s.landing]);
  if (s.verdict && CAPTION.verdict[s.verdict]) parts.push(CAPTION.verdict[s.verdict]);
  if (!parts.length) return '';
  const text = parts.join(' · ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Title-block schematic (1200 by 630) from the normalized state. Pure drawing — no DOM, no numbers the visitor typed.
export function drawSchematic(ctx, s, W = 1200, H = 630) {
  const SAND = '#e8dcc8', EMBER = '#f27622', CYAN = '#22D3EE', STEEL = '#9fb0bc', MUTED = '#8a969e';
  ctx.fillStyle = '#03070b'; ctx.fillRect(0, 0, W, H);
  // title block
  ctx.strokeStyle = 'rgba(232,220,200,0.35)'; ctx.lineWidth = 1;
  ctx.strokeRect(24.5, 24.5, W - 49, H - 49);
  ctx.beginPath(); ctx.moveTo(24.5, H - 96.5); ctx.lineTo(W - 24.5, H - 96.5); ctx.stroke();
  ctx.fillStyle = SAND; ctx.font = '600 30px system-ui, Segoe UI, sans-serif'; ctx.textBaseline = 'top';
  ctx.fillText('WellFi — proposed configuration', 48, 46);
  ctx.font = '500 15px ui-monospace, Consolas, monospace'; ctx.fillStyle = MUTED;
  ctx.fillText('Representative Clearwater well, Western Canada — schematic, not to scale', 48, 88);
  // wordmark
  ctx.font = '700 22px system-ui, Segoe UI, sans-serif'; ctx.fillStyle = EMBER; ctx.textAlign = 'right';
  ctx.fillText('Yotin', W - 48, 46);
  ctx.font = '500 13px ui-monospace, Consolas, monospace'; ctx.fillStyle = MUTED;
  ctx.fillText('yotinenergy.com', W - 48, 74);
  ctx.textAlign = 'left';
  // verdict badge
  const badge = VERDICT_LABEL[s.verdict] || 'Candidate well';
  const bc = s.verdict === 'strong' ? CYAN : s.verdict === 'review' ? EMBER : SAND; // strong = the signal arrived (cyan is licensed at the verdict, spec §6); no green in the palette
  ctx.font = '600 16px system-ui, Segoe UI, sans-serif';
  const bw = ctx.measureText(badge).width + 28;
  ctx.strokeStyle = bc; ctx.lineWidth = 1.5; ctx.strokeRect(W - 48 - bw, 100, bw, 34);
  ctx.fillStyle = bc; ctx.fillText(badge, W - 48 - bw + 14, 109);

  // schematic: surface line, casing string, intermediate shell, shoe, open hole
  const cx = 330, top = 215, shoeY = 430, bottom = H - 112;
  ctx.strokeStyle = 'rgba(232,220,200,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(120, top); ctx.lineTo(560, top); ctx.stroke();
  ctx.fillStyle = MUTED; ctx.font = '500 13px ui-monospace, Consolas, monospace'; ctx.fillText('surface', 120, top - 20);
  // surface equipment by lift
  ctx.fillStyle = STEEL;
  if (s.lift === 'rod') { ctx.fillRect(cx - 4, top - 54, 8, 54); ctx.save(); ctx.translate(cx, top - 54); ctx.rotate(-0.12); ctx.fillRect(-46, -5, 92, 8); ctx.restore(); ctx.fillRect(cx + 34, top - 64, 14, 22); }
  else if (s.lift === 'pcp' || s.lift == null) { ctx.fillRect(cx - 14, top - 40, 28, 40); ctx.fillStyle = '#7a2c20'; ctx.fillRect(cx + 14, top - 30, 22, 12); }
  else { ctx.fillRect(cx - 9, top - 26, 18, 26); }
  // intermediate shell (translucent) + production string
  ctx.fillStyle = 'rgba(125,211,232,0.10)'; ctx.fillRect(cx - 28, top, 56, shoeY - top);
  ctx.strokeStyle = 'rgba(125,211,232,0.45)'; ctx.strokeRect(cx - 28.5, top + 0.5, 57, shoeY - top);
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.strokeRect(cx - 12, top, 24, shoeY - top);
  // open hole below the shoe
  ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(232,220,200,0.45)'; ctx.lineWidth = 1;
  ctx.strokeRect(cx - 20.5, shoeY + 0.5, 41, bottom - shoeY); ctx.setLineDash([]);
  ctx.fillStyle = MUTED; ctx.textAlign = 'right';
  ctx.fillText('intermediate casing', cx - 48, top + 30);
  ctx.fillText('shoe', cx - 48, shoeY - 7);
  ctx.fillText('open hole', cx - 48, shoeY + 30);
  ctx.textAlign = 'left';
  // shoe
  ctx.fillStyle = '#d7e3ea'; ctx.fillRect(cx - 34, shoeY - 4, 68, 8);
  // standoff line at 0.9 of the string
  if (s.hasLength || s.landing) {
    const sy = top + (shoeY - top) * 0.9;
    ctx.setLineDash([8, 6]); ctx.strokeStyle = SAND; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 70, sy); ctx.lineTo(cx + 70, sy); ctx.stroke(); ctx.setLineDash([]);
    // source: STANDOFF_SOURCE — drawn under the caption, because the PNG is the artefact that gets forwarded.
    ctx.fillStyle = SAND; ctx.fillText('standoff — 10 % of intermediate', cx + 90, sy - 18);
    ctx.save(); ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = MUTED;
    ctx.fillText(STANDOFF_SOURCE, cx + 90, sy - 4); ctx.restore();
  }
  // pump marker at the answered band
  if (s.landing) {
    const deeper = s.landing === 'deeper';
    const py = top + (shoeY - top) * (deeper ? 0.31 : 0.20); // wellPath.PUMP_U — the forwarded PNG and the 3D must agree
    ctx.fillStyle = '#eef4f8'; ctx.fillRect(cx - 18, py - 6, 36, 12);
    ctx.strokeStyle = SAND; ctx.lineWidth = 1; ctx.strokeRect(cx - 22.5, py - 10.5, 45, 21);
    ctx.fillStyle = SAND; ctx.fillText(deeper ? 'pump — deeper landing' : 'pump — shallower landing', cx + 90, py - 2);
  }
  // tool position + signal label
  const toolInside = s.landing === 'shallower';
  const ty = toolInside ? top + (shoeY - top) * 0.66 : shoeY + (bottom - shoeY) * 0.5;
  const dim = s.temp === 'over' || s.verdict === 'future';
  ctx.fillStyle = dim ? 'rgba(34,211,238,0.25)' : CYAN;
  ctx.fillRect(cx - 6, ty - 22, 12, 44);
  ctx.fillStyle = '#d9e5ef'; ctx.fillRect(cx - 4, ty - 18, 8, 12); ctx.fillRect(cx - 4, ty + 6, 8, 12);
  ctx.fillStyle = dim ? MUTED : CYAN; ctx.font = '600 13px ui-monospace, Consolas, monospace';
  ctx.fillText(s.landing ? (toolInside ? 'WellFi — inside casing — reduced signal' : 'WellFi — open hole — strongest signal') : 'WellFi', cx + 90, ty - 7);
  if (dim) { ctx.fillStyle = MUTED; ctx.font = '500 13px ui-monospace, Consolas, monospace'; ctx.fillText('high-temp version in development', cx + 90, ty + 12); }

  // right-hand ledger: the normalized answers in words
  const lx = 700; let ly = 170;
  ctx.font = '600 13px ui-monospace, Consolas, monospace'; ctx.fillStyle = MUTED; ctx.fillText('CONFIGURATION', lx, ly); ly += 28;
  ctx.font = '500 16px system-ui, Segoe UI, sans-serif';
  const rows = [
    ['Lift', s.lift ? CAPTION.lift[s.lift] : '—'],
    ['Fluid', s.fluid ? CAPTION.fluid[s.fluid] : '—'],
    ['Temperature', s.temp ? CAPTION.temp[s.temp] : '—'],
    ['Pump landing', s.landing ? (s.landing === 'deeper' ? 'deeper landing' : 'shallower landing') : '—'],
    ['WellFi', s.landing ? (toolInside ? 'inside casing, on the tubing' : 'below the intermediate shoe (open hole)') : 'per pump landing'],
    ['Verdict', VERDICT_LABEL[s.verdict] || '—'],
  ];
  rows.forEach(([k, v]) => {
    ctx.fillStyle = MUTED; ctx.fillText(k, lx, ly);
    ctx.fillStyle = SAND; ctx.fillText(v, lx + 130, ly, W - 48 - (lx + 130));
    ly += 30;
  });
  // public spec line + footer
  ctx.font = '500 13px ui-monospace, Consolas, monospace'; ctx.fillStyle = SAND;
  ctx.fillText(SPEC_LINE, 48, H - 78);
  ctx.fillStyle = MUTED;
  ctx.fillText(FOOT_LINE, 48, H - 54);
  ctx.textAlign = 'right';
  ctx.fillText('kyle.gronning@yotinenergy.com', W - 48, H - 54);
  ctx.textAlign = 'left';
}

export function mountFit() {
  const caption = document.querySelector('[data-fit-caption]');
  const stageHost = document.querySelector('[data-qualifier-stage]');
  let state = null, world = null, builder = null, active = false, lastSaid = '';

  // The visible caption states the CHANGE (one sentence — spec §4 "masked mono caption states the change");
  // the full cumulative state goes to the aria-live channel as visually-hidden text (round 2: a log dump in a
  // box read as a debug console).
  let full = null;
  function say(text) {
    if (!caption || text === lastSaid) return;
    const prevParts = lastSaid ? lastSaid.split(' · ') : [];
    const parts = text ? text.split(' · ') : [];
    lastSaid = text;
    const changed = parts.filter((x) => !prevParts.includes(x));
    const visible = changed.length ? changed[changed.length - 1] : (parts[parts.length - 1] || '');
    if (!full) { full = document.createElement('span'); full.className = 'sr-only'; full.setAttribute('data-fit-caption-full', ''); }
    caption.textContent = visible ? visible.charAt(0).toUpperCase() + visible.slice(1) : '';
    full.textContent = text ? ' — ' + text : '';
    caption.appendChild(full);
    caption.hidden = !text;
  }

  // --- world side -------------------------------------------------------------------------------------------
  function ensureBuilder() {
    if (!builder && world && world.island && createWellBuilder) {
      try { builder = createWellBuilder(world.island, world.THREE || null, { scene: world.scene }); } catch (e) { builder = null; }
    }
    return builder;
  }
  // Standoff caption: "standoff — 10 % of intermediate" projected at the 0.9 line whenever the line is shown
  // (spec §4 row 6; round 2). source: Yotin deployment practice — internal rule of thumb, not a published figure.
  let standoffEl = null, vizRef = null;
  function syncStandoffCaption(b) {
    const show = active && state && (state.hasLength || state.landing) && b.objects && b.objects.standoff;
    if (!standoffEl) {
      standoffEl = document.createElement('p');
      standoffEl.className = 'surface-caption standoff-caption';
      standoffEl.setAttribute('data-standoff-caption', '');
      standoffEl.textContent = 'standoff — 10 % of intermediate';
      // source: STANDOFF_SOURCE — provenance rides on the element so a read of the DOM carries it too.
      standoffEl.setAttribute('data-source', STANDOFF_SOURCE);
      standoffEl.hidden = true;
      document.body.appendChild(standoffEl);
    }
    const apply = (viz) => { if (!viz || !viz.setStandoffCaption) return; standoffEl.hidden = !show; viz.setStandoffCaption(show ? standoffEl : null, show ? b.objects.standoff : null); };
    if (vizRef) apply(vizRef);
    else import('./tool.js').then((m) => m.getToolViz(world)).then((viz) => { vizRef = viz; apply(viz); }).catch(() => {});
  }
  function applyWorld() {
    const b = ensureBuilder();
    if (!b) return;
    if (active) b.apply(state); else b.reset();
    syncStandoffCaption(b);
    world.requestRender();
  }
  function setActive(next) {
    if (next === active) return;
    active = next;
    applyWorld();
  }
  document.addEventListener('world:first-frame', () => {
    world = window.__yotinWorld || null;
    if (!world) return;
    import('../world/wellBuilder.js').then((m) => {
      createWellBuilder = m.createWellBuilder;
      const st = world.state;
      setActive(Boolean(st && st.index === 6));
      applyWorld();
    });
  });
  document.addEventListener('world:chapter', (e) => { setActive(Boolean(e.detail && e.detail.id === 'fit')); });

  // --- qualifier side ---------------------------------------------------------------------------------------
  document.addEventListener('qualifier:state', (e) => {
    const d = e.detail || {};
    // keep only the normalized keys — nothing else is ever read from the event
    state = { step: d.step || null, lift: d.lift || null, fluid: d.fluid || null, temp: d.temp || null, hasLength: Boolean(d.hasLength), landing: d.landing || null, verdict: d.verdict || null };
    say(captionFor(state));
    applyWorld();
    if (state.verdict && state.step === 'verdict') addDownload();
  });

  function addDownload() {
    if (!stageHost) return;
    const actions = stageHost.querySelector('.qualifier-verdict .qualifier-actions');
    if (!actions || actions.querySelector('[data-fit-download]')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'button button-secondary fit-download';
    btn.setAttribute('data-fit-download', '');
    btn.textContent = 'Download schematic';
    btn.addEventListener('click', () => saveSchematic(btn));
    actions.appendChild(btn);
  }

  function saveSchematic(btn) {
    if (!state) return;
    const s = state;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200; canvas.height = 630;
      const ctx = canvas.getContext('2d');
      drawSchematic(ctx, s);
      const finish = (url, revoke) => {
        const a = document.createElement('a');
        a.href = url; a.download = 'wellfi-schematic.png'; a.rel = 'noopener';
        document.body.appendChild(a); a.click(); a.remove();
        if (revoke) setTimeout(() => URL.revokeObjectURL(url), 4000);
        track('qualifier_card_save', { fit: s.verdict });
        if (btn) { btn.textContent = 'Saved locally'; setTimeout(() => { btn.textContent = 'Download schematic'; }, 2200); }
      };
      if (canvas.toBlob && window.URL && URL.createObjectURL) canvas.toBlob((blob) => { if (blob) finish(URL.createObjectURL(blob), true); else finish(canvas.toDataURL('image/png'), false); }, 'image/png');
      else finish(canvas.toDataURL('image/png'), false);
    } catch (e) { if (btn) btn.textContent = 'Could not draw — try again'; }
  }

  return { get state() { return state; }, captionFor };
}
