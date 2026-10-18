function code({ THREE, scene, camera, renderer, params, onFrame, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.3));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  // Textures are images. Here we draw one with the 2D canvas so the page needs no image files.
  function makeTexture(kind) {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const g = canvas.getContext('2d');
    if (kind === 'stripes') {
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#0b1f33' : '#ff5b1f';
        g.fillRect(0, (i * size) / 8, size, size / 8);
      }
    } else if (kind === 'gradient') {
      const gr = g.createLinearGradient(0, 0, size, size);
      gr.addColorStop(0, '#ff5b1f'); gr.addColorStop(0.5, '#f7d046'); gr.addColorStop(1, '#3555d6');
      g.fillStyle = gr; g.fillRect(0, 0, size, size);
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; g.strokeRect(2, 2, size - 4, size - 4);
    } else {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        g.fillStyle = (x + y) % 2 ? '#0b1f33' : '#f2f5f7';
        g.fillRect((x * size) / 8, (y * size) / 8, size / 8, size / 8);
      }
      g.fillStyle = '#ff5b1f'; g.fillRect(0, 0, size / 8, size / 8); // marks the top-left corner
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;           // colour images are sRGB; data maps are not
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // tile instead of stretching the edge pixel
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // sharper at glancing angles
    return texture;
  }

  const texture = makeTexture(params.kind);
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 });

  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), material);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.9, 48, 32), material);
  cube.position.x = -1.5;
  ball.position.x = 1.5;
  scene.add(cube, ball);

  camera.position.set(0, 1.3, 5.5);
  camera.lookAt(0, 0, 0);

  onFrame((dt) => {
    texture.repeat.set(params.repeat, params.repeat);
    texture.center.set(0.5, 0.5);        // rotate around the middle of the image
    texture.rotation = THREE.MathUtils.degToRad(params.angle);
    const filter = params.pixelated ? THREE.NearestFilter : THREE.LinearFilter;
    if (texture.magFilter !== filter) { texture.magFilter = filter; texture.needsUpdate = true; }
    cube.rotation.y += dt * 0.5;
    ball.rotation.y -= dt * 0.35;
    status(`repeat ${params.repeat}×${params.repeat}   rotation ${params.angle}°   ${params.pixelated ? 'nearest' : 'linear'} filtering`);
  });
}

export default {
  id: 'textures',
  title: 'Textures and UVs',
  summary: 'Wrapping an image around a shape: UV coordinates, repeat, colour space and filtering.',
  notes: [
    '<p>A <strong>texture</strong> is an image used by a material, most often as its <code>map</code> (the colour). To know which part of the image lands on which point of a shape, every vertex carries <strong>UV coordinates</strong>: a position in the image from <code>(0, 0)</code> to <code>(1, 1)</code>. The built-in geometries come with UVs already.</p>',
    '<p>Here the texture is drawn on a canvas so it needs no file. In your own project you would load one with <code>new THREE.TextureLoader().load(\'wood.jpg\')</code>. The orange square in the checker marks the image\'s top-left corner, which helps you see how the image wraps and flips.</p>',
    '<p>Two settings catch most beginners. Colour images need <code>texture.colorSpace = THREE.SRGBColorSpace</code> or colours look washed out. And <code>repeat</code> only tiles if <code>wrapS</code> and <code>wrapT</code> are <code>RepeatWrapping</code>.</p>',
  ],
  controls: [
    {
      key: 'kind', label: 'Image', type: 'select', value: 'checker', rerun: true,
      options: [{ value: 'checker', label: 'Checker' }, { value: 'stripes', label: 'Stripes' }, { value: 'gradient', label: 'Gradient' }],
    },
    { key: 'repeat', label: 'Repeat', type: 'range', min: 1, max: 8, step: 1, value: 1 },
    { key: 'angle', label: 'Rotation (°)', type: 'range', min: 0, max: 360, step: 5, value: 0 },
    { key: 'pixelated', label: 'Pixelated (nearest filter)', type: 'checkbox', value: false },
  ],
  tryThis: [
    'Set repeat to 8 with the checker image, then turn on pixelated.',
    'Delete the line <code>texture.colorSpace = ...</code> and run it. Compare the colours.',
    'Apply the same material to a <code>PlaneGeometry</code> and see how the UVs lay out on a flat shape.',
  ],
  gotchas: [
    'Washed-out colours: the texture is missing <code>colorSpace = SRGBColorSpace</code>.',
    'Images that will not tile. Check <code>wrapS</code> and <code>wrapT</code>.',
    'Huge texture files. A 4096×4096 image uses about 64 MB of GPU memory once decoded, however small the file is.',
    'Changing a texture\'s size or filter and seeing no effect. Set <code>texture.needsUpdate = true</code>.',
  ],
  code,
};
