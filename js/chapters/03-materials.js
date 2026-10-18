function code({ THREE, scene, camera, params, onFrame, helpers, status }) {
  // An environment map gives shiny surfaces something to reflect.
  helpers.useRoomEnvironment();
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 4, 5);
  scene.add(key);

  const geometry = new THREE.SphereGeometry(0.62, 48, 32);
  const physical = new THREE.MeshPhysicalMaterial({ color: 0xff5b1f, clearcoat: 1, clearcoatRoughness: 0.05 });
  const standard = new THREE.MeshStandardMaterial({ color: 0xff5b1f });

  const entries = [
    ['Basic', new THREE.MeshBasicMaterial({ color: 0xff5b1f })],
    ['Lambert', new THREE.MeshLambertMaterial({ color: 0xff5b1f })],
    ['Phong', new THREE.MeshPhongMaterial({ color: 0xff5b1f, shininess: 90 })],
    ['Standard', standard],
    ['Physical', physical],
    ['Toon', new THREE.MeshToonMaterial({ color: 0xff5b1f })],
    ['Normal', new THREE.MeshNormalMaterial()],
  ];

  // A small text label drawn on a canvas and shown as a sprite that always faces the camera.
  function label(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 64;
    const g = canvas.getContext('2d');
    g.fillStyle = 'rgba(11, 31, 51, 0.88)';
    g.beginPath(); g.roundRect(4, 8, 248, 48, 12); g.fill();
    g.fillStyle = '#ffffff';
    g.font = '600 28px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 128, 33);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.scale.set(1.5, 0.375, 1);
    return sprite;
  }

  entries.forEach(([name, material], i) => {
    const x = (i % 4 - 1.5) * 1.75;
    const y = i < 4 ? 0.95 : -0.95;
    const ball = new THREE.Mesh(geometry, material);
    ball.position.set(x, y, 0);
    scene.add(ball);
    const tag = label(name);
    tag.position.set(x, y - 0.95, 0);
    scene.add(tag);
  });

  camera.position.set(0, 0.3, 6.6);
  camera.lookAt(0, 0, 0);

  onFrame(() => {
    for (const m of [standard, physical]) {
      m.roughness = params.roughness;
      m.metalness = params.metalness;
    }
    status(`roughness = ${params.roughness}, metalness = ${params.metalness}   (Standard and Physical respond to the sliders)`);
  });
}

export default {
  id: 'materials',
  title: 'Materials',
  summary: 'The same sphere in seven materials. Pick the cheapest one that looks right.',
  notes: [
    '<p>A <strong>material</strong> decides how a surface reacts to light. Going from left to right in the lab, each one does more work per pixel:</p>',
    '<p><code>MeshBasicMaterial</code> ignores light completely (flat colour). <code>MeshLambertMaterial</code> and <code>MeshPhongMaterial</code> are cheap lit materials. <code>MeshStandardMaterial</code> is physically based: two numbers, <strong>roughness</strong> and <strong>metalness</strong>, describe most real surfaces. <code>MeshPhysicalMaterial</code> adds extras like a clear-coat layer, as on car paint.</p>',
    '<p>Shiny and metallic surfaces look dull without something to reflect. That is why the code calls <code>useRoomEnvironment()</code>: it adds a simple lit room as an environment map. Set metalness to 1 and roughness to 0.1 to see it reflected.</p>',
  ],
  controls: [
    { key: 'roughness', label: 'Roughness', type: 'range', min: 0, max: 1, step: 0.05, value: 0.35 },
    { key: 'metalness', label: 'Metalness', type: 'range', min: 0, max: 1, step: 0.05, value: 0.1 },
  ],
  tryThis: [
    'Set metalness to 1 and roughness to 0 on the Standard sphere.',
    'Change the Toon material\'s colour and compare how it handles shading.',
    'Make a ninth sphere with <code>MeshStandardMaterial({ color: 0x3555d6, flatShading: true })</code>.',
  ],
  gotchas: [
    'Using <code>MeshStandardMaterial</code> everywhere by default. On a phone with thousands of objects, Lambert or Basic may be plenty.',
    'A fully metallic surface (metalness 1) with no environment map looks nearly black. It has nothing to reflect.',
    'Sharing a material between meshes and then changing it. Every mesh using that material changes too.',
  ],
  code,
};
