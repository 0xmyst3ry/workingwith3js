function code({ THREE, scene, camera, renderer, params, onFrame, onDispose, addons, helpers, status }) {
  helpers.useRoomEnvironment();
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(3, 5, 4);
  scene.add(sun);
  scene.add(new THREE.GridHelper(8, 8, 0x8aa0b4, 0x5d7388));

  camera.position.set(2.8, 2, 4.2);
  camera.lookAt(0, 1, 0);
  const controls = new addons.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.enableDamping = true;
  onDispose(() => controls.dispose());

  // glTF is the standard format for 3D models on the web. GLTFLoader reads .glb (one binary file)
  // or .gltf (JSON plus separate files). This model ships with three.js's own examples.
  const url = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/Flamingo.glb';
  let mixer = null;
  status('loading Flamingo.glb ...');

  new addons.GLTFLoader().load(
    url,
    (gltf) => {
      const model = gltf.scene;

      // Models come in any size and any origin. Measure it with a bounding box, then scale it
      // to a known height and put its feet on the floor.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scale = 2 / size.y;
      model.scale.setScalar(scale);
      box.setFromObject(model);
      const centre = box.getCenter(new THREE.Vector3());
      model.position.set(-centre.x, -box.min.y, -centre.z);
      scene.add(model);

      // Animations are clips. A mixer plays them on the model.
      if (gltf.animations.length) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
      }
      status(`loaded: ${gltf.animations.length} animation clip(s), original size ${size.x.toFixed(1)} x ${size.y.toFixed(1)} x ${size.z.toFixed(1)}`);
    },
    undefined,
    () => status('could not load the model: check your connection and run again')
  );

  onFrame((dt) => {
    if (mixer) mixer.update(dt * params.speed);
    controls.update();
  });
}

export default {
  id: 'models',
  title: 'Loading models and animations',
  summary: 'Bringing in a glTF file, fitting it to your scene, and playing its animation.',
  notes: [
    '<p>You will rarely hand-write geometry for characters or products. Artists make them in Blender or similar tools and export <strong>glTF</strong> (<code>.glb</code> or <code>.gltf</code>), the "JPEG of 3D". <code>GLTFLoader</code> turns the file into a normal three.js <code>Group</code> you can add to the scene, with its meshes, materials, textures and animation clips included.</p>',
    '<p>Loading is asynchronous: <code>load()</code> returns straight away and calls your function when the file arrives. That is why the status line says "loading" first.</p>',
    '<p>Models arrive at whatever size and origin the artist used. A <code>Box3</code> bounding box measures them so you can scale to a known height and sit them on the floor, as the code does. Animations are <strong>clips</strong>; an <code>AnimationMixer</code> plays them when you call <code>mixer.update(dt)</code> every frame.</p>',
    '<p>This example needs a network connection to fetch the model from a CDN. Drag to orbit around the flamingo.</p>',
  ],
  controls: [
    { key: 'speed', label: 'Animation speed', type: 'range', min: 0, max: 3, step: 0.1, value: 1 },
  ],
  tryThis: [
    'Change <code>2 / size.y</code> to <code>4 / size.y</code> to make the model twice as tall.',
    'Traverse the model and switch on shadows: <code>model.traverse((o) => { if (o.isMesh) o.castShadow = true; })</code>.',
    'Try another model URL from the same folder, such as <code>Soldier.glb</code>.',
  ],
  gotchas: [
    'A model that is enormous or invisible. It is usually a units mismatch; measure it with <code>Box3</code> first.',
    'Forgetting to call <code>mixer.update(dt)</code>. The model loads but never moves.',
    'Loading files straight from disk with <code>file://</code>. Browsers block it; serve the folder over HTTP.',
    'Shipping huge uncompressed models. Compress meshes (Draco or Meshopt) and textures (KTX2) for the web.',
  ],
  code,
};
