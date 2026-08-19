// Capability gate — decided synchronously, BEFORE any three.js byte is requested (spec §2, §7).
// Reduced motion, Save-Data, no WebGL2, or tier 0 → the stills path; otherwise the world may load.
// Exposes the decision on <html> so CSS can react from first paint (html.world-on / html.stills-on).
export const gate = decide();

function decide() {
  const out = { world: false, reason: 'unknown', tier: 0, coarse: false, reduce: false, saveData: false, webgl2: false, renderer: '' };
  try {
    out.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    out.saveData = Boolean(navigator.connection && navigator.connection.saveData);
    out.coarse = window.matchMedia('(pointer: coarse)').matches;
    let gl = null;
    try {
      const c = document.createElement('canvas');
      gl = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) || c.getContext('webgl2');
      if (gl) {
        const info = gl.getExtension('WEBGL_debug_renderer_info');
        if (info) out.renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
        const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
      }
    } catch (e) { gl = null; }
    out.webgl2 = Boolean(gl);
    // Tier: 0 = stills, 1 = phone, 2 = tablet, 3 = desktop. Weak-GPU regex from the island's quality.ts.
    const weak = /Mali-4|Mali-T[0-6]|Adreno [1-4]\d\d|PowerVR SGX|Intel\(R\) HD Graphics [2-4]\d{3}|SwiftShader|llvmpipe|Software/i.test(out.renderer);
    const w = window.innerWidth;
    if (!out.webgl2) out.tier = 0;
    else if (weak && !/SwiftShader|llvmpipe|Software/i.test(out.renderer)) out.tier = 1;
    else if (/SwiftShader|llvmpipe|Software/i.test(out.renderer)) out.tier = new URLSearchParams(location.search).has('world') ? 3 : 0; // headless/software: stills unless ?world (our own frame jobs)
    else if (out.coarse && w <= 820) out.tier = 1;
    else if (out.coarse) out.tier = 2;
    else out.tier = 3;
    const forced = new URLSearchParams(location.search).get('world');
    if (forced === '1') { out.tier = Math.max(out.tier, 1); }
    if (out.reduce && forced !== '1') { out.reason = 'reduced-motion'; }
    else if (out.saveData) { out.reason = 'save-data'; }
    else if (!out.webgl2) { out.reason = 'no-webgl2'; }
    else if (out.tier === 0) { out.reason = 'tier-0'; }
    else { out.world = true; out.reason = 'ok'; }
  } catch (e) { out.world = false; out.reason = 'error'; }
  const html = document.documentElement;
  html.classList.toggle('world-on', out.world);
  html.classList.toggle('stills-on', !out.world);
  html.dataset.worldTier = String(out.tier);
  return out;
}
