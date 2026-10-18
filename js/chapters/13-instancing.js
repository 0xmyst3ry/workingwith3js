function code({ THREE, scene, camera, renderer, params, onFrame, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(4, 6, 5);
  scene.add(sun);

  const count = params.count;
  const geometry = new THREE.IcosahedronGeometry(0.11, 0);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.55 });

  // Repeatable "random" numbers, so both modes build the very same cloud.
  let seed = 11;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const colour = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const world = new THREE.Group();
  scene.add(world);

  function place(i) {
    // a random point on a thick shell
    const radius = 2 + random() * 1.4;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    matrix.makeTranslation(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
    colour.setHSL(0.03 + random() * 0.1, 0.85, 0.5 + random() * 0.15);
  }

  if (params.mode === 'instanced') {
    // ONE mesh, drawn `count` times in a single call. Each copy has its own matrix and colour.
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    for (let i = 0; i < count; i++) {
      place(i);
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, colour);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    world.add(mesh);
  } else {
    // `count` separate meshes: each one costs the GPU a separate draw call.
    for (let i = 0; i < count; i++) {
      place(i);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: colour.clone(), roughness: 0.55 }));
      mesh.applyMatrix4(matrix);
      world.add(mesh);
    }
  }

  camera.position.set(0, 1.5, 8.5);
  camera.lookAt(0, 0, 0);

  let smooth = 60;
  onFrame((dt) => {
    world.rotation.y += dt * 0.2;
    smooth += (1 / Math.max(dt, 0.001) - smooth) * 0.05;
    const info = renderer.info.render;
    status(`${params.mode}: ${count.toLocaleString()} objects   draw calls ${info.calls}   triangles ${info.triangles.toLocaleString()}   ~${Math.round(smooth)} fps`);
  });
}

export default {
  id: 'instancing',
  title: 'Many objects: instancing',
  summary: 'Why a thousand meshes can be slow and one InstancedMesh is fast.',
  notes: [
    '<p>The GPU is happy to draw millions of triangles but dislikes being told what to do many times. Each separate mesh costs a <strong>draw call</strong>: the CPU prepares state and asks the GPU to draw. A few hundred is fine; thousands start to hurt, especially on phones.</p>',
    '<p><code>InstancedMesh</code> solves this when you have many copies of one shape. You give it a geometry, a material and a count, then set a matrix (position, rotation, scale) and optionally a colour for each copy. The whole lot is drawn in <strong>one</strong> call.</p>',
    '<p>Switch between the modes and compare the <code>draw calls</code> number in the status line. Both draw exactly the same picture. With a high count, the separate version drops the frame rate, while the instanced version barely changes.</p>',
  ],
  controls: [
    { key: 'count', label: 'Objects', type: 'range', min: 100, max: 4000, step: 100, value: 1500, rerun: true },
    {
      key: 'mode', label: 'How they are made', type: 'select', value: 'instanced', rerun: true,
      options: [{ value: 'instanced', label: 'InstancedMesh (1 draw call)' }, { value: 'separate', label: 'Separate meshes' }],
    },
  ],
  tryThis: [
    'Set 4000 objects and flip between the two modes while watching the fps.',
    'In instanced mode, call <code>mesh.setMatrixAt</code> inside <code>onFrame</code> for a few instances to animate them (set <code>instanceMatrix.needsUpdate</code> after).',
    'Change the geometry to <code>BoxGeometry</code>. The draw call count does not change.',
  ],
  gotchas: [
    'Forgetting <code>instanceMatrix.needsUpdate = true</code> after changing matrices.',
    'Using instancing for objects with different geometries. Instances share one geometry and one material.',
    'Picking a single instance with a raycaster. Hits report an <code>instanceId</code> so you can tell which copy was hit.',
  ],
  code,
};
