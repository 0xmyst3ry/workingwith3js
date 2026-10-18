function code({ THREE, scene, camera, renderer, params, onFrame, on, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 8, 5);
  scene.add(sun);

  // A 6 x 6 grid of bars with repeatable "random" heights.
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const group = new THREE.Group();
  const bars = [];
  for (let gx = 0; gx < 6; gx++) {
    for (let gz = 0; gz < 6; gz++) {
      const height = 0.4 + random() * 1.8;
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, height, 0.8),
        new THREE.MeshStandardMaterial({ color: 0x35506b, roughness: 0.6 })
      );
      bar.position.set((gx - 2.5) * 1, height / 2, (gz - 2.5) * 1);
      bar.name = `bar ${gx},${gz}`;
      bar.userData.picked = false;
      group.add(bar);
      bars.push(bar);
    }
  }
  scene.add(group);

  camera.position.set(5, 6, 7);
  camera.lookAt(0, 0.5, 0);

  // Raycasting: shoot a ray from the camera through the pointer and ask what it hits first.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9); // off-screen until the pointer moves
  const canvas = renderer.domElement;
  let hovered = null;

  on(canvas, 'pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  });
  on(canvas, 'pointerleave', () => pointer.set(9, 9));
  on(canvas, 'click', () => {
    if (hovered) hovered.userData.picked = !hovered.userData.picked;
  });

  const idle = new THREE.Color(0x35506b);
  const hover = new THREE.Color(0xff5b1f);
  const picked = new THREE.Color(0x3555d6);

  onFrame((dt) => {
    if (params.rotate) group.rotation.y += dt * 0.25;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(bars, false)[0]; // nearest first
    hovered = hit ? hit.object : null;
    for (const bar of bars) {
      const target = bar === hovered ? hover : bar.userData.picked ? picked : idle;
      bar.material.color.lerp(target, 0.25);
    }
    const count = bars.filter((b) => b.userData.picked).length;
    status(hit
      ? `pointing at ${hit.object.name}, ${hit.distance.toFixed(2)} units away   |   ${count} picked`
      : `move the pointer over the bars, click to pick   |   ${count} picked`);
  });
}

export default {
  id: 'picking',
  title: 'Picking with raycasting',
  summary: 'How to tell which 3D object is under the mouse or finger.',
  notes: [
    '<p>The screen is flat, but a click is a question about 3D space: which object is under that point? three.js answers with a <strong>Raycaster</strong>. It shoots an invisible ray from the camera through the pointer position and lists everything the ray hits, nearest first.</p>',
    '<p>The only fiddly part is converting the pointer from pixels to <strong>normalised device coordinates</strong>, where the canvas runs from -1 to 1 on both axes and y points up. The code does that in <code>pointermove</code>. Then <code>raycaster.setFromCamera(pointer, camera)</code> aims the ray and <code>intersectObjects(list)</code> returns hits with the object, the distance and the exact point.</p>',
    '<p>Hover over the bars, then click to pick or unpick one. The ray is tested every frame so the highlight still works while the group rotates.</p>',
  ],
  controls: [
    { key: 'rotate', label: 'Rotate the grid', type: 'checkbox', value: false },
  ],
  tryThis: [
    'Log <code>hit.point</code> to find the exact spot on the bar, and place a small sphere there.',
    'Change <code>intersectObjects(bars, false)</code> to <code>intersectObjects(scene.children, true)</code>. Why does it get slower?',
    'Make picked bars grow by setting <code>bar.scale.y</code> in the loop.',
  ],
  gotchas: [
    'Forgetting to flip y. Screen y goes down, normalised device y goes up.',
    'Using <code>window.innerWidth</code> for the pointer maths when the canvas is smaller than the window. Use the canvas rectangle.',
    'Ray-testing every object in a huge scene each frame. Test a short list of candidates, or only on click.',
  ],
  code,
};
