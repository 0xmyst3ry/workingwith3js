// The runtime behind every live scene. A chapter's code is a plain function that
// receives a context object (scene, camera, renderer, params, onFrame, ...) and builds
// whatever it wants. The stage owns the renderer and the animation loop, and cleans up
// everything a chapter created when the chapter changes or the code is re-run.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const DEFAULT_FRUSTUM = 5;

export function createStage({ host, onStatus, onError }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const clock = new THREE.Clock();
  let session = null;
  let paused = false;
  let elapsed = 0;
  let rafId = 0;
  let lastStatus = '';

  function stageBackground() {
    const css = getComputedStyle(document.documentElement).getPropertyValue('--stage-bg').trim();
    return new THREE.Color(css || '#dde5ea');
  }

  function fitCamera(camera) {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    const aspect = w / h;
    if (camera.isPerspectiveCamera) {
      camera.aspect = aspect;
    } else if (camera.isOrthographicCamera) {
      const f = camera.userData.frustum || DEFAULT_FRUSTUM;
      camera.left = -f * aspect / 2;
      camera.right = f * aspect / 2;
      camera.top = f / 2;
      camera.bottom = -f / 2;
    }
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    if (session) fitCamera(session.camera);
  }

  new ResizeObserver(resize).observe(host);

  function disposeObject(root) {
    root.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
      for (const m of mats) {
        for (const key of Object.keys(m)) {
          if (m[key] && m[key].isTexture) m[key].dispose();
        }
        m.dispose();
      }
    });
  }

  function teardown() {
    if (!session) return;
    for (const fn of session.disposers) {
      try { fn(); } catch { /* a disposer failing must not block the rest */ }
    }
    for (const [target, type, handler] of session.listeners) target.removeEventListener(type, handler);
    disposeObject(session.scene);
    if (session.scene.environment) session.scene.environment.dispose();
    session = null;
  }

  function fail(error) {
    onError(error);
    if (session) session.frame.length = 0;
  }

  function buildContext(params, source) {
    const scene = new THREE.Scene();
    scene.background = stageBackground();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
    camera.position.set(3, 2.5, 5);
    camera.lookAt(0, 0, 0);

    // Each run gets its own session object. Callbacks from a chapter that has already been
    // replaced (for example a model that finishes loading late) must not touch the new one.
    const s = { scene, camera, frame: [], listeners: [], disposers: [], source };
    session = s;
    fitCamera(camera);

    const ctx = {
      THREE,
      scene,
      camera,
      renderer,
      params,
      addons: { OrbitControls, GLTFLoader },
      onFrame: (fn) => { if (session === s) s.frame.push(fn); },
      on: (target, type, handler) => {
        if (session !== s) return;
        target.addEventListener(type, handler);
        s.listeners.push([target, type, handler]);
      },
      onDispose: (fn) => { if (session === s) s.disposers.push(fn); else fn(); },
      status: (text) => {
        if (session !== s) return;
        const line = String(text);
        if (line !== lastStatus) { lastStatus = line; onStatus(line); }
      },
      helpers: {
        setCamera: (cam) => { if (session === s) { s.camera = cam; fitCamera(cam); } },
        makeOrtho: (frustum = DEFAULT_FRUSTUM) => {
          const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
          cam.userData.frustum = frustum;
          fitCamera(cam);
          return cam;
        },
        useRoomEnvironment: () => {
          const pmrem = new THREE.PMREMGenerator(renderer);
          scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
          pmrem.dispose();
        },
      },
    };
    return ctx;
  }

  function run(source, params) {
    teardown();
    onError(null);
    onStatus('');
    lastStatus = '';
    elapsed = 0;
    resize();
    const ctx = buildContext(params, source);
    try {
      // The chapter source is a single function expression, so wrapping it in parentheses is enough.
      const fn = new Function(`"use strict"; return (${source});`)();
      if (typeof fn !== 'function') throw new TypeError('The code must be a single function.');
      fn(ctx);
    } catch (error) {
      fail(error);
    }
  }

  function tick() {
    rafId = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.1);
    if (!session) return;
    if (!paused) {
      elapsed += dt;
      for (const fn of session.frame) {
        try { fn(dt, elapsed); } catch (error) { fail(error); break; }
      }
    }
    renderer.render(session.scene, session.camera);
  }
  tick();

  return {
    run,
    resize,
    stop() { teardown(); },
    setPaused(value) { paused = value; },
    isPaused: () => paused,
    destroy() {
      cancelAnimationFrame(rafId);
      teardown();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
