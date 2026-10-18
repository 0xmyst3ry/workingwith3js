function code({ THREE, scene, camera, params, onFrame, status }) {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2, 5, 6);
  scene.add(sun);

  // Two cubes cross the screen. The orange one moves a fixed step per frame.
  // The blue one moves by speed * time, so it covers the same distance per second on any device.
  const frameBased = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xff5b1f }));
  const timeBased = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x3555d6 }));
  frameBased.position.set(-3.2, 1.3, 0);
  timeBased.position.set(-3.2, 0.1, 0);

  // A ball that eases toward a moving target instead of snapping to it.
  const target = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8), new THREE.MeshBasicMaterial({ color: 0x8aa0b4 }));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 16), new THREE.MeshStandardMaterial({ color: 0x1f8a57 }));
  scene.add(frameBased, timeBased, target, ball);

  camera.position.set(0, 0.4, 8);
  camera.lookAt(0, -0.2, 0);

  let pending = 0;
  onFrame((dt, t) => {
    // Pretend the device can only draw `fps` frames per second by skipping updates in between.
    const fps = Number(params.fps);
    pending += dt;
    if (pending < 1 / fps) return;
    const step = pending; // the real time that has passed since the last update
    pending = 0;

    frameBased.position.x += 0.06;            // always 0.06 per update: speed depends on fps
    timeBased.position.x += params.speed * step; // speed * time: same speed at any fps
    if (frameBased.position.x > 3.2) frameBased.position.x = -3.2;
    if (timeBased.position.x > 3.2) timeBased.position.x = -3.2;

    // Exponential smoothing. Using dt in the exponent keeps the feel the same at any frame rate.
    target.position.set(Math.sin(t * 1.3) * 3, -1.7 + Math.cos(t * 2.1) * 0.5, 0);
    const k = 1 - Math.exp(-params.ease * step);
    ball.position.lerp(target.position, k);

    status(`updates per second: ${fps}   orange x = ${frameBased.position.x.toFixed(2)}   blue x = ${timeBased.position.x.toFixed(2)}`);
  });
}

export default {
  id: 'animation',
  title: 'The animation loop',
  summary: 'Moving things over time without making speed depend on the frame rate.',
  notes: [
    '<p>Animation in three.js is just changing numbers a little every frame. <code>onFrame</code> here wraps <code>requestAnimationFrame</code> and hands you <code>dt</code>, the seconds since the previous frame, and <code>t</code>, the seconds since the scene started.</p>',
    '<p>The classic bug is <code>x += 0.06</code>. On a 60 Hz screen that is 3.6 units a second; on a 120 Hz screen, 7.2; on a struggling phone at 20 fps, 1.2. Multiplying by time fixes it: <code>x += speed * dt</code>. Use the <strong>Updates per second</strong> menu to fake a slow device and watch the orange cube change speed while the blue one does not.</p>',
    '<p>For smooth following, <code>lerp</code> by a fixed fraction every frame also depends on frame rate. The green ball uses <code>1 - Math.exp(-ease * dt)</code>, which behaves the same at any rate.</p>',
  ],
  controls: [
    {
      key: 'fps', label: 'Updates per second', type: 'select', value: '60',
      options: [{ value: '60', label: '60' }, { value: '30', label: '30' }, { value: '10', label: '10' }],
    },
    { key: 'speed', label: 'Blue cube speed (units/s)', type: 'range', min: 1, max: 8, step: 0.1, value: 3.6 },
    { key: 'ease', label: 'Follow stiffness', type: 'range', min: 1, max: 20, step: 0.5, value: 6 },
  ],
  tryThis: [
    'Set updates to 10. The orange cube slows to a crawl while blue keeps pace.',
    'Raise the follow stiffness to 20, then drop it to 1.',
    'Add <code>timeBased.rotation.y = t</code> to spin the blue cube, tied to time rather than frames.',
  ],
  gotchas: [
    'Per-frame increments with no <code>dt</code>. They look fine on your machine and wrong on everyone else\'s.',
    'Giant jumps after switching browser tabs. The browser pauses animation, then <code>dt</code> is huge. This site caps <code>dt</code> at 0.1 s; do the same.',
    'Using <code>setInterval</code> to animate. It is not synced to the screen and keeps running in the background.',
  ],
  code,
};
