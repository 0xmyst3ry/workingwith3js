function code({ THREE, scene, camera, params, onFrame, status }) {
  // A shader is a small program that runs on the GPU. The vertex shader places each point;
  // the fragment shader colours each pixel. Both are written in GLSL.
  const vertexShader = `
    uniform float uTime;
    uniform float uStrength;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      vec3 p = position;
      // push every vertex along its normal by a moving wave
      float wave = sin(p.x * 3.0 + uTime) * sin(p.y * 3.0 + uTime * 1.3) * sin(p.z * 3.0 + uTime * 0.7);
      p += normal * wave * uStrength;

      vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vViewDir = normalize(-viewPosition.xyz);
      gl_Position = projectionMatrix * viewPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 uBase;
    uniform vec3 uRim;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      // Fresnel: surfaces seen at a glancing angle glow more
      float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.5);
      gl_FragColor = vec4(mix(uBase, uRim, fresnel), 1.0);
    }
  `;

  const palettes = {
    ember: [new THREE.Color(0x1b2a3a), new THREE.Color(0xff5b1f)],
    ocean: [new THREE.Color(0x0b1f33), new THREE.Color(0x4cc9f0)],
    moss: [new THREE.Color(0x10261c), new THREE.Color(0x9be564)],
  };
  const [base, rim] = palettes[params.palette];

  // uniforms are values you pass from JavaScript into the shader
  const uniforms = {
    uTime: { value: 0 },
    uStrength: { value: params.strength },
    uBase: { value: base },
    uRim: { value: rim },
  };

  const blob = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.3, 16),
    new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
  );
  scene.add(blob);

  camera.position.set(0, 0.5, 5);
  camera.lookAt(0, 0, 0);

  onFrame((dt, t) => {
    uniforms.uTime.value = t * params.speed;
    uniforms.uStrength.value = params.strength;
    blob.rotation.y += dt * 0.25;
    status(`ShaderMaterial   uTime ${uniforms.uTime.value.toFixed(1)}   uStrength ${params.strength}`);
  });
}

export default {
  id: 'shaders',
  title: 'Shaders',
  summary: 'Small programs on the GPU that place every vertex and colour every pixel.',
  notes: [
    '<p>Built-in materials are shaders someone else wrote. A <code>ShaderMaterial</code> lets you write your own in GLSL. There are two stages. The <strong>vertex shader</strong> runs once per vertex and sets where it ends up on screen. The <strong>fragment shader</strong> runs once per pixel and sets its colour.</p>',
    '<p>JavaScript talks to the shader through <strong>uniforms</strong>: values that are the same for every vertex and pixel, such as time, a colour or a strength. <strong>Varyings</strong> carry data from the vertex stage to the fragment stage. Here the vertex shader ripples the sphere along its normals, and the fragment shader adds a rim glow using a Fresnel term.</p>',
    '<p>Because the maths runs on the GPU in parallel, this icosahedron has over 17,000 vertices moving at no visible cost. Chapter 10 did a similar per-vertex job in JavaScript, which is why it stays at a few thousand points.</p>',
    '<p>GLSL errors appear in the browser console, not in the status line. If the shape goes missing, open the console first.</p>',
  ],
  controls: [
    { key: 'strength', label: 'Ripple strength', type: 'range', min: 0, max: 0.6, step: 0.01, value: 0.18 },
    { key: 'speed', label: 'Speed', type: 'range', min: 0, max: 4, step: 0.1, value: 1.2 },
    {
      key: 'palette', label: 'Colours', type: 'select', value: 'ember', rerun: true,
      options: [{ value: 'ember', label: 'Ember' }, { value: 'ocean', label: 'Ocean' }, { value: 'moss', label: 'Moss' }],
    },
  ],
  tryThis: [
    'Change the Fresnel exponent <code>2.5</code> to <code>1.0</code> and then <code>6.0</code>.',
    'In the vertex shader, replace <code>normal</code> with <code>vec3(0.0, 1.0, 0.0)</code> so the shape only moves up and down.',
    'Make the base colour depend on position: pass <code>p</code> through a varying and mix colours by <code>p.y</code>.',
  ],
  gotchas: [
    'A shader that compiles in one browser and fails in another is usually a missing <code>.0</code> on a float: write <code>2.0</code>, not <code>2</code>.',
    'Forgetting <code>normalize()</code> on vectors you compare with <code>dot</code>.',
    'Passing a Vector3 where the shader expects a colour, or the reverse. Uniform types must match the GLSL declaration.',
  ],
  code,
};
