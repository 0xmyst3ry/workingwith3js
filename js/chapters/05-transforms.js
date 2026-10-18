function code({ THREE, scene, camera, params, onFrame, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(4, 6, 3);
  scene.add(sun);
  scene.add(new THREE.GridHelper(8, 8, 0x8aa0b4, 0x5d7388));

  const orange = new THREE.MeshStandardMaterial({ color: 0xff5b1f, roughness: 0.5 });
  const navy = new THREE.MeshStandardMaterial({ color: 0x35506b, roughness: 0.6 });

  // A robot arm is a chain of parents and children. A child moves, turns and scales with its
  // parent, and its own position is measured from the parent, not from the world.
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.3, 32), navy);
  base.position.y = 0.15;
  scene.add(base);

  const shoulder = new THREE.Object3D();   // an empty pivot the upper arm rotates around
  shoulder.position.y = 0.15;
  base.add(shoulder);

  const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.6, 0.34), orange);
  upperArm.position.y = 0.8;               // moved up so the pivot sits at the arm's bottom end
  shoulder.add(upperArm);

  const elbow = new THREE.Object3D();
  elbow.position.y = 1.6;                  // at the top of the upper arm
  shoulder.add(elbow);

  const foreArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.3, 0.28), orange);
  foreArm.position.y = 0.65;
  elbow.add(foreArm);

  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), navy);
  hand.position.y = 1.3;
  elbow.add(hand);

  const axes = [shoulder, elbow, hand].map((pivot) => {
    const helper = new THREE.AxesHelper(0.7);
    pivot.add(helper);
    return helper;
  });

  camera.position.set(4.5, 3.5, 5.5);
  camera.lookAt(0, 1.4, 0);

  const deg = THREE.MathUtils.degToRad;
  const where = new THREE.Vector3();
  onFrame(() => {
    base.rotation.y = deg(params.swing);
    shoulder.rotation.z = deg(params.shoulder);
    elbow.rotation.z = deg(params.elbow);
    for (const a of axes) a.visible = params.axes;
    hand.getWorldPosition(where); // the hand's position in the world, after all parents are applied
    status(`hand local y = ${hand.position.y}   hand in world = (${where.x.toFixed(2)}, ${where.y.toFixed(2)}, ${where.z.toFixed(2)})`);
  });
}

export default {
  id: 'transforms',
  title: 'Move, rotate, scale',
  summary: 'Position, rotation and scale, and how parents and children combine them.',
  notes: [
    '<p>Every object has a <code>position</code>, a <code>rotation</code> and a <code>scale</code>. Together they are its <strong>transform</strong>. Rotation uses radians, not degrees: a half turn is <code>Math.PI</code>. <code>THREE.MathUtils.degToRad()</code> converts.</p>',
    '<p>Objects can be nested with <code>parent.add(child)</code>. A child\'s transform is relative to its parent, so moving the parent carries every child along. That is how this arm works: turn the shoulder and the forearm and hand follow.</p>',
    '<p>To rotate something around a point other than its own centre, wrap it in an empty <code>Object3D</code> (a pivot) placed at that point and rotate the pivot. The shoulder and elbow here are pivots. Switch on <strong>Show pivot axes</strong> to see them.</p>',
  ],
  controls: [
    { key: 'swing', label: 'Base swing (°)', type: 'range', min: -180, max: 180, step: 1, value: 25 },
    { key: 'shoulder', label: 'Shoulder (°)', type: 'range', min: -80, max: 80, step: 1, value: 25 },
    { key: 'elbow', label: 'Elbow (°)', type: 'range', min: -120, max: 120, step: 1, value: -40 },
    { key: 'axes', label: 'Show pivot axes', type: 'checkbox', value: true },
  ],
  tryThis: [
    'Move <code>upperArm.position.y</code> to <code>0</code> and watch the arm pivot around its middle.',
    'Add <code>shoulder.scale.set(1, 1.5, 1)</code> and see the forearm stretch too.',
    'Add a third segment: another pivot and box inside <code>elbow</code>.',
  ],
  gotchas: [
    'Reading <code>hand.position</code> and expecting world coordinates. It is local to its parent; use <code>getWorldPosition()</code>.',
    'Entering degrees where radians are expected. A rotation of 90 is about 14 full turns.',
    'Rotation order surprises. Euler rotations apply in the order x, y, z by default, so combining all three can give unexpected results. Rotate pivots one axis at a time.',
  ],
  code,
};
