function code({ THREE, scene, camera, params, onFrame, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.6)); // soft fill so shadows are not pitch black

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshStandardMaterial({ color: 0xaab7c2, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2; // planes face +z by default, so lay it down
  floor.receiveShadow = true;
  scene.add(floor);

  const material = new THREE.MeshStandardMaterial({ color: 0xff5b1f, roughness: 0.5 });
  const objects = [
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material),
    new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 16), material),
    new THREE.Mesh(new THREE.TorusKnotGeometry(0.45, 0.16, 96, 12), material),
  ];
  objects[0].position.set(-1.8, 0.5, 0);
  objects[1].position.set(0, 0.6, 0.6);
  objects[2].position.set(1.8, 0.95, 0);
  for (const o of objects) { o.castShadow = true; o.receiveShadow = true; scene.add(o); }

  // Three kinds of light. Their intensity units are physical (candela and lux), so values differ.
  let light;
  let base;
  if (params.type === 'spot') {
    light = new THREE.SpotLight(0xffffff, 400, 0, Math.PI / 5, 0.4, 1.5);
    base = 400;
  } else if (params.type === 'point') {
    light = new THREE.PointLight(0xffffff, 150, 0, 2);
    base = 150;
  } else {
    light = new THREE.DirectionalLight(0xffffff, 3);
    base = 3;
    light.shadow.camera.left = -6; light.shadow.camera.right = 6;
    light.shadow.camera.top = 6; light.shadow.camera.bottom = -6;
  }
  light.position.set(3, 5, 3);
  light.castShadow = params.shadows;
  light.shadow.mapSize.set(1024, 1024);
  scene.add(light);

  // A small sphere shows where the light is.
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
  scene.add(bulb);

  camera.position.set(0, 4.5, 8);
  camera.lookAt(0, 0.5, 0);

  onFrame((dt, t) => {
    if (params.orbit) light.position.set(Math.cos(t * 0.7) * 4, 5, Math.sin(t * 0.7) * 4);
    light.intensity = base * params.intensity;
    bulb.position.copy(light.position);
    status(`${params.type} light, intensity ${light.intensity.toFixed(1)}, shadows ${params.shadows ? 'on' : 'off'}`);
  });
}

export default {
  id: 'lights',
  title: 'Lights and shadows',
  summary: 'Three light types, what each is good for, and how to switch shadows on.',
  notes: [
    '<p>Lit materials need lights. <strong>Directional</strong> light is parallel rays, like the sun: position matters only for direction. <strong>Point</strong> light spreads in all directions from a spot, like a bulb. <strong>Spot</strong> light is a cone, like a torch. <code>AmbientLight</code> and <code>HemisphereLight</code> fill everything evenly and cast no shadows.</p>',
    '<p>Shadows take three switches: the renderer allows them (done for you), the light has <code>castShadow = true</code>, and each object either <code>castShadow</code> or <code>receiveShadow</code>. Shadows are rendered from the light\'s point of view into a texture, so each shadow-casting light costs a whole extra render.</p>',
    '<p>Since r155, light intensities use physical units. A directional light of 3 is bright, while a spot light needs hundreds because it is measured in candela. If your scene looks black after upgrading from an old tutorial, raise the intensity.</p>',
  ],
  controls: [
    {
      key: 'type', label: 'Light type', type: 'select', value: 'directional', rerun: true,
      options: [{ value: 'directional', label: 'Directional' }, { value: 'spot', label: 'Spot' }, { value: 'point', label: 'Point' }],
    },
    { key: 'intensity', label: 'Intensity (× default)', type: 'range', min: 0, max: 2, step: 0.05, value: 1 },
    { key: 'shadows', label: 'Cast shadows', type: 'checkbox', value: true, rerun: true },
    { key: 'orbit', label: 'Move the light', type: 'checkbox', value: true },
  ],
  tryThis: [
    'Switch to Point light and uncheck shadows. Is the scene cheaper to render?',
    'Change <code>light.shadow.mapSize.set(1024, 1024)</code> to <code>(256, 256)</code> and look at the shadow edges.',
    'Set <code>objects[1].castShadow = false</code> so the sphere casts no shadow.',
  ],
  gotchas: [
    'Shadows that do not appear: one of <code>light.castShadow</code>, <code>mesh.castShadow</code> or <code>mesh.receiveShadow</code> is missing.',
    'Cut-off shadows from a directional light. Widen <code>light.shadow.camera</code> so it covers the area you want shadowed.',
    'Adding many shadow-casting lights. Each one is an extra render of the whole scene.',
  ],
  code,
};
