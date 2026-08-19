// Camera rig: authored Catmull-Rom position/target curves through chapter endpoints (desktop or mobile set),
// per-segment fov lerp, tall-aspect pullback, and a separate input rig for pointer micro-parallax.
import * as THREE from 'three';

export function createCameraRig(camera, chapters, { mobile = false } = {}) {
  const pathRig = new THREE.Group();   // authored
  const inputRig = new THREE.Group();  // pointer micro-parallax
  pathRig.add(inputRig);
  inputRig.add(camera);
  camera.position.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  let posCurve, tgtCurve, fovs, useMobile = mobile;
  const _pos = new THREE.Vector3(), _tgt = new THREE.Vector3(), _dir = new THREE.Vector3(), _m = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0);
  const parallax = { x: 0, y: 0, strength: 1 };
  const smoothParallax = { x: 0, y: 0 };

  function endpoint(ch) { return useMobile && ch.camera.mobile ? ch.camera.mobile : ch.camera; }

  function build() {
    const P = chapters.map((c) => new THREE.Vector3(...endpoint(c).position));
    const T = chapters.map((c) => new THREE.Vector3(...endpoint(c).target));
    fovs = chapters.map((c) => endpoint(c).fov ?? 30);
    posCurve = new THREE.CatmullRomCurve3(P, false, 'centripetal', 0.5);
    tgtCurve = new THREE.CatmullRomCurve3(T, false, 'centripetal', 0.5);
  }
  build();

  // Sample per-segment so chapter i..i+1 maps exactly to curve param between control points i and i+1.
  function segmentParam(progress) {
    const n = chapters.length - 1;
    return n <= 0 ? 0 : Math.min(1, Math.max(0, progress / n));
  }

  function apply(progress, dt = 1 / 60, aspect = 16 / 9) {
    const u = segmentParam(progress);
    // Catmull-Rom getPoint (not getPointAt) keeps control points at uniform parameter spacing → chapter i at u=i/n exactly.
    posCurve.getPoint(u, _pos);
    tgtCurve.getPoint(u, _tgt);
    const i = Math.min(chapters.length - 2, Math.max(0, Math.floor(progress)));
    const t = Math.min(1, Math.max(0, progress - i));
    let fov = THREE.MathUtils.lerp(fovs[i], fovs[Math.min(fovs.length - 1, i + 1)], t);

    // Tall-aspect emergency: pull back and open the fov so the landmark stays in frame.
    const tall = Math.max(0, 1 / aspect - 1.15);
    _dir.copy(_pos).sub(_tgt).normalize();
    if (tall > 0) { _pos.addScaledVector(_dir, tall * 8.2); fov = Math.min(80, fov * (1 + tall * 0.4)); }

    pathRig.position.copy(_pos);
    // Camera convention (look down -Z): Object3D.lookAt on a Group would aim +Z at the target.
    _m.lookAt(_pos, _tgt, UP);
    pathRig.quaternion.setFromRotationMatrix(_m);

    // pointer parallax (radians), damped; fades with strength
    const k = 1 - Math.exp(-6 * dt);
    smoothParallax.x += (parallax.x - smoothParallax.x) * k;
    smoothParallax.y += (parallax.y - smoothParallax.y) * k;
    inputRig.rotation.y = -smoothParallax.x * 0.026 * parallax.strength;
    inputRig.rotation.x = smoothParallax.y * 0.016 * parallax.strength;

    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    if (Math.abs(camera.aspect - aspect) > 1e-4) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
  }

  return {
    root: pathRig, pathRig, inputRig, apply, parallax,
    setMobile(v) { if (v !== useMobile) { useMobile = v; build(); } },
    poseAt(progress) { const u = segmentParam(progress); return { position: posCurve.getPoint(u, new THREE.Vector3()), target: tgtCurve.getPoint(u, new THREE.Vector3()) }; },
    curves: () => ({ posCurve, tgtCurve }),
  };
}
