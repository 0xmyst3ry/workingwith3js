function code({ THREE, scene, camera, renderer, params, onFrame, onDispose, helpers, addons, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 8, 6);
  scene.add(sun);
  scene.add(new THREE.GridHelper(20, 20, 0x8aa0b4, 0x5d7388));

  // Six identical cubes in a line going away from the camera.
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 6; i++) {
    const cube = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.04 + i * 0.02, 0.9, 0.55), roughness: 0.5,
    }));
    cube.position.set(-1.2, 0.5, 3 - i * 2.2);
    scene.add(cube);
  }

  // Perspective: far things look smaller, like an eye. Orthographic: size never changes with distance.
  let active = camera;
  if (params.camera === 'orthographic') {
    active = helpers.makeOrtho(8);
    helpers.setCamera(active);
  }
  active.position.set(6, 4.5, 7);
  active.lookAt(0, 0.5, 0);

  // OrbitControls: drag to orbit, scroll or pinch to zoom, right-drag to pan.
  const controls = new addons.OrbitControls(active, renderer.domElement);
  controls.target.set(0, 0.5, -3);
  controls.enableDamping = true;
  onDispose(() => controls.dispose());

  onFrame(() => {
    if (active.isPerspectiveCamera && active.fov !== params.fov) {
      active.fov = params.fov;
      active.updateProjectionMatrix(); // required after changing fov, aspect, near or far
    }
    controls.update();
    const p = active.position;
    status(
      `${active.type}   camera at (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})` +
      (active.isPerspectiveCamera ? `   fov ${active.fov}°` : '')
    );
  });
}

export default {
  id: 'cameras',
  title: 'Cameras and controls',
  summary: 'Perspective versus orthographic, field of view, and letting people orbit the scene.',
  notes: [
    '<p>A <strong>PerspectiveCamera</strong> works like an eye or a photo: distant objects look smaller. Its <strong>field of view</strong> (fov) is how wide it sees, in degrees. A small fov feels like a telephoto lens, a large one like a fisheye.</p>',
    '<p>An <strong>OrthographicCamera</strong> has no perspective. The six cubes below are all the same size on screen however far away they are. It suits maps, CAD views, 2D games and isometric art.</p>',
    '<p><code>OrbitControls</code> is an add-on that turns mouse, touch and wheel input into camera movement. Drag on the scene to try it. Remember to call <code>controls.update()</code> every frame when damping is on.</p>',
  ],
  controls: [
    {
      key: 'camera', label: 'Camera type', type: 'select', value: 'perspective', rerun: true,
      options: [{ value: 'perspective', label: 'Perspective' }, { value: 'orthographic', label: 'Orthographic' }],
    },
    { key: 'fov', label: 'Field of view (°, perspective only)', type: 'range', min: 15, max: 110, step: 1, value: 50 },
  ],
  tryThis: [
    'Drag the field of view to 110 and then 20. Notice the cubes change shape, not just size.',
    'Set <code>controls.enableDamping = false</code> and compare how the orbit feels.',
    'Add <code>controls.minDistance = 3; controls.maxDistance = 20;</code> to limit zooming.',
  ],
  gotchas: [
    'Changing <code>camera.fov</code> and seeing nothing happen. You must call <code>camera.updateProjectionMatrix()</code> afterwards.',
    'A stretched image after a window resize. Update <code>camera.aspect</code> and the renderer size together (this site does that for you).',
    'Setting <code>camera.position</code> while OrbitControls is active, then wondering why it snaps back. Change <code>controls.target</code> or call <code>controls.update()</code>.',
  ],
  code,
};
