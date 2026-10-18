// Chapter code is a single function. The page shows its source in the editor and runs it
// with a context object, so what you read is exactly what runs.
function code({ THREE, scene, camera, params, onFrame, status }) {
  // three.js uses a right-handed system:
  //   x points right (red), y points up (green), z points toward you (blue).
  scene.add(new THREE.GridHelper(10, 10, 0x8aa0b4, 0x5d7388)); // the floor, at y = 0
  scene.add(new THREE.AxesHelper(3));                          // 3 units along each axis

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xff5b1f })
  );
  scene.add(marker);

  // A line from the origin to the marker. We write into the same buffer every frame
  // instead of building a new geometry each time.
  const points = new Float32Array(6);
  const attribute = new THREE.BufferAttribute(points, 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', attribute);
  scene.add(new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xff5b1f })));

  camera.position.set(5, 4, 7);
  camera.lookAt(0, 0.5, 0);

  onFrame(() => {
    marker.position.set(params.x, params.y, params.z);
    points.set([0, 0, 0, params.x, params.y, params.z]);
    attribute.needsUpdate = true; // tell the GPU the buffer changed
    status(
      `position = (${params.x}, ${params.y}, ${params.z})   ` +
      `distance from origin = ${marker.position.length().toFixed(2)}`
    );
  });
}

export default {
  id: 'coordinates',
  title: 'Where things are',
  summary: 'Axes, units and the origin. Everything else in 3D is built on knowing where a point sits.',
  notes: [
    '<p>A 3D scene is a coordinate system. Every object has a <code>position</code>, a point written as three numbers: how far along <strong>x</strong> (right), <strong>y</strong> (up) and <strong>z</strong> (toward the viewer) it sits from the <strong>origin</strong> at <code>(0, 0, 0)</code>.</p>',
    '<p>three.js has no built-in unit. One unit can be a metre, a centimetre or a pixel; you choose, then stay consistent. Most people treat 1 unit as 1 metre because physical lights and cameras work out more naturally that way.</p>',
    '<p>The red, green and blue lines in the scene are an <code>AxesHelper</code>. Drag the sliders and watch the marker move along each axis. Rotating the camera will come later; for now the camera is fixed so you can read the axes.</p>',
  ],
  controls: [
    { key: 'x', label: 'x (right)', type: 'range', min: -4, max: 4, step: 0.1, value: 2 },
    { key: 'y', label: 'y (up)', type: 'range', min: -2, max: 4, step: 0.1, value: 1 },
    { key: 'z', label: 'z (toward you)', type: 'range', min: -4, max: 4, step: 0.1, value: 1.5 },
  ],
  tryThis: [
    'Set <code>z</code> to a negative number. Which way does the marker go?',
    'Change <code>AxesHelper(3)</code> to <code>AxesHelper(1)</code> and run the code.',
    'Add a second marker at <code>(-2, 0, 0)</code> using <code>marker.clone()</code>.',
  ],
  gotchas: [
    'Mixing up which way is up. In three.js <code>y</code> is up; many 3D modelling tools use <code>z</code> up.',
    'Forgetting that <code>position.set(x, y, z)</code> is relative to the object\'s parent, not always to the world. Chapter 5 covers this.',
  ],
  code,
};
