function code({ THREE, scene, camera, params, onFrame, status }) {
  const s = params.segments; // how finely curved shapes are cut up
  const shapes = [
    ['Box', new THREE.BoxGeometry(1, 1, 1, Math.ceil(s / 6), Math.ceil(s / 6), Math.ceil(s / 6))],
    ['Sphere', new THREE.SphereGeometry(0.62, s, Math.max(2, Math.round(s / 2)))],
    ['Cylinder', new THREE.CylinderGeometry(0.45, 0.45, 1.1, s)],
    ['Cone', new THREE.ConeGeometry(0.55, 1.1, s)],
    ['Torus', new THREE.TorusGeometry(0.5, 0.2, 12, s)],
    ['TorusKnot', new THREE.TorusKnotGeometry(0.4, 0.14, s * 4, 8)],
    ['Icosahedron', new THREE.IcosahedronGeometry(0.66, Math.min(4, Math.floor(s / 12)))],
    ['Octahedron', new THREE.OctahedronGeometry(0.72)],
  ];

  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  const materials = [];
  const meshes = shapes.map(([, geometry], i) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(i / shapes.length, 0.65, 0.55),
      roughness: 0.5,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((i % 4 - 1.5) * 1.75, i < 4 ? 0.95 : -0.95, 0);
    scene.add(mesh);
    return mesh;
  });

  camera.position.set(0, 0.4, 7.2);
  camera.lookAt(0, 0, 0);

  // Count what the GPU has to draw for all eight shapes.
  let vertices = 0;
  let triangles = 0;
  for (const [, g] of shapes) {
    vertices += g.attributes.position.count;
    triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
  }

  onFrame((dt) => {
    for (const m of materials) m.wireframe = params.wireframe;
    for (const mesh of meshes) mesh.rotation.y += dt * 0.6;
    status(`${vertices.toLocaleString()} vertices, ${triangles.toLocaleString()} triangles in total`);
  });
}

export default {
  id: 'geometries',
  title: 'Geometries',
  summary: 'Shapes are lists of points and triangles. Learn the built-in ones and what they cost.',
  notes: [
    '<p>A <strong>geometry</strong> is the shape of an object: a list of vertices (points) and how they join into triangles. three.js ships dozens of ready-made ones: <code>BoxGeometry</code>, <code>SphereGeometry</code>, <code>CylinderGeometry</code>, <code>TorusGeometry</code> and more.</p>',
    '<p>Curved shapes are really made of flat triangles. The <code>segments</code> arguments control how many. More segments look smoother and cost more to draw. Switch on <strong>Wireframe</strong> to see the triangles, then slide <strong>Segments</strong> and watch the triangle count in the status line.</p>',
    '<p>Geometry holds memory on the GPU. When you are finished with one, call <code>geometry.dispose()</code>. This page does that for you when you leave a chapter.</p>',
  ],
  controls: [
    { key: 'segments', label: 'Segments', type: 'range', min: 3, max: 48, step: 1, value: 16, rerun: true },
    { key: 'wireframe', label: 'Wireframe', type: 'checkbox', value: true },
  ],
  tryThis: [
    'Set segments to 3. A cylinder becomes a triangular prism and a sphere becomes a rough crystal.',
    'Add <code>new THREE.PlaneGeometry(2, 2, 8, 8)</code> to the list. It is flat, so rotate it to see it.',
    'Compare the triangle count of <code>IcosahedronGeometry</code> at detail 1 and 3.',
  ],
  gotchas: [
    'Using 128 segments "to be safe". Every extra segment multiplies triangles, and many objects add up quickly.',
    'Creating a new geometry every frame. Build it once and change its attributes (chapter 10), or you will leak GPU memory.',
  ],
  code,
};
