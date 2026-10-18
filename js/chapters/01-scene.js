function code({ THREE, scene, camera, params, onFrame, status }) {
  // 1. The scene holds everything you want to draw.
  // 2. The camera decides which part of it you see.
  // 3. The renderer (created for you) draws the scene as seen by the camera.

  // A mesh is a shape (geometry) plus a surface (material).
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshStandardMaterial({ color: 0xff5b1f, roughness: 0.4 })
  );
  scene.add(cube);

  // MeshStandardMaterial reacts to light. Without any light it renders black.
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.position.set(3, 4, 5);
  scene.add(sun);

  camera.position.set(2.5, 2, 4);
  camera.lookAt(0, 0, 0);

  // onFrame runs once per drawn frame. dt is the seconds since the last frame.
  onFrame((dt) => {
    cube.rotation.y += dt * params.speed;
    cube.rotation.x += dt * params.speed * 0.5;
    status(`rotation.y = ${cube.rotation.y.toFixed(2)} rad   objects in scene: ${scene.children.length}`);
  });
}

export default {
  id: 'scene',
  title: 'Scene, camera, renderer',
  summary: 'The three things every three.js program needs, and the smallest program that shows a 3D object.',
  notes: [
    '<p>Every three.js program is the same three parts. A <strong>scene</strong> is a container for the things in your world. A <strong>camera</strong> is a point of view. A <strong>renderer</strong> takes the scene and the camera and paints pixels onto a canvas.</p>',
    '<p>Things you can see are <code>Mesh</code> objects: a <strong>geometry</strong> (the shape) paired with a <strong>material</strong> (how the surface looks). You put them in the scene with <code>scene.add()</code>.</p>',
    '<p>On this site the scene, camera and renderer are created for you and passed into the code on the right. In your own page you would write <code>new THREE.Scene()</code>, <code>new THREE.PerspectiveCamera()</code> and <code>new THREE.WebGLRenderer()</code>, then call <code>renderer.render(scene, camera)</code> inside a loop.</p>',
  ],
  controls: [
    { key: 'speed', label: 'Spin speed (rad/s)', type: 'range', min: 0, max: 4, step: 0.1, value: 1 },
  ],
  tryThis: [
    'Change <code>0xff5b1f</code> to another hex colour.',
    'Replace <code>BoxGeometry</code> with <code>new THREE.SphereGeometry(0.9, 32, 16)</code>.',
    'Delete the <code>DirectionalLight</code> lines and run it. What changed?',
  ],
  gotchas: [
    'A black object usually means a lit material with no light. Add a light, or use <code>MeshBasicMaterial</code>, which ignores light.',
    'Forgetting <code>scene.add(mesh)</code>. Creating a mesh does not put it in the world.',
    'Moving things by a fixed amount each frame. Use <code>dt</code> so speed does not depend on the screen\'s refresh rate (chapter 7).',
  ],
  code,
};
