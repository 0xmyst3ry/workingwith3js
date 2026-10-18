function code({ THREE, scene, camera, params, onFrame, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 6, 2);
  scene.add(sun);

  // Start from a flat grid of 64 x 64 squares, then move its vertices ourselves.
  const geometry = new THREE.PlaneGeometry(7, 7, 64, 64);
  geometry.rotateX(-Math.PI / 2); // lay it flat so height is the y axis

  const position = geometry.attributes.position;
  const count = position.count;
  const baseX = new Float32Array(count);
  const baseZ = new Float32Array(count);
  for (let i = 0; i < count; i++) { baseX[i] = position.getX(i); baseZ[i] = position.getZ(i); }

  // A custom attribute: one colour per vertex.
  const colors = new Float32Array(count * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide });
  const surface = new THREE.Mesh(geometry, material);
  scene.add(surface);

  camera.position.set(4.5, 4, 6);
  camera.lookAt(0, 0, 0);

  const low = new THREE.Color(0x35506b);
  const high = new THREE.Color(0xff5b1f);
  const mix = new THREE.Color();

  onFrame((dt, t) => {
    const { amplitude: amp, frequency: freq } = params;
    for (let i = 0; i < count; i++) {
      const x = baseX[i];
      const z = baseZ[i];
      const h = Math.sin(x * freq + t) * Math.cos(z * freq * 0.8 + t * 0.7);
      position.setY(i, h * amp);
      mix.copy(low).lerp(high, (h + 1) / 2);
      colors[i * 3] = mix.r; colors[i * 3 + 1] = mix.g; colors[i * 3 + 2] = mix.b;
    }
    position.needsUpdate = true;                 // upload the new positions
    geometry.attributes.color.needsUpdate = true; // and the new colours
    geometry.computeVertexNormals();             // so lighting follows the new shape

    if (material.flatShading !== params.flat) { material.flatShading = params.flat; material.needsUpdate = true; }
    material.wireframe = params.wireframe;
    status(`${count.toLocaleString()} vertices updated per frame`);
  });
}

export default {
  id: 'custom-geometry',
  title: 'Building your own geometry',
  summary: 'Geometry is just typed arrays. Change them and the shape changes.',
  notes: [
    '<p>Under every geometry is a <code>BufferGeometry</code> holding <strong>attributes</strong>: flat arrays of numbers. <code>position</code> has three numbers per vertex. <code>normal</code> says which way each vertex faces, for lighting. <code>uv</code> maps textures. You can add any attribute you like; here we add <code>color</code>.</p>',
    '<p>The surface starts as a flat <code>PlaneGeometry</code>. Every frame the code reads each vertex\'s starting x and z, works out a height, and writes it back with <code>position.setY()</code>. Two things are easy to forget: set <code>needsUpdate = true</code> so the GPU gets the new numbers, and call <code>computeVertexNormals()</code> so the lighting matches the new shape.</p>',
    '<p>Updating thousands of vertices in JavaScript each frame is fine for a few thousand points. For much more, move the work onto the GPU with a shader (the next chapter).</p>',
  ],
  controls: [
    { key: 'amplitude', label: 'Wave height', type: 'range', min: 0, max: 1.5, step: 0.05, value: 0.6 },
    { key: 'frequency', label: 'Wave frequency', type: 'range', min: 0.5, max: 4, step: 0.1, value: 1.6 },
    { key: 'flat', label: 'Flat shading', type: 'checkbox', value: false },
    { key: 'wireframe', label: 'Wireframe', type: 'checkbox', value: false },
  ],
  tryThis: [
    'Change the height formula to <code>Math.sin(Math.hypot(x, z) * freq - t * 2)</code> for ripples from the centre.',
    'Raise the grid from 64 to 128 segments. Does it still run smoothly?',
    'Remove <code>computeVertexNormals()</code> and watch the lighting stop following the waves.',
  ],
  gotchas: [
    'Editing <code>position</code> without <code>needsUpdate = true</code>. Nothing visibly changes.',
    'Allocating new arrays or Vector3 objects inside the per-frame loop. It creates garbage and causes stutter; reuse them.',
    'Adding vertices after the first render. A buffer\'s size is fixed once uploaded, so create a new geometry instead.',
  ],
  code,
};
