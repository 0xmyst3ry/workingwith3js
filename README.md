# The Three.js Playbook

An interactive playbook for working with 3D objects in [three.js](https://threejs.org). Every chapter has a live scene, the code behind it in an editable panel, and sliders that change the scene while it runs. Edit the code, press Run, and see what changed.

No build step and no dependencies to install: it is plain HTML, CSS and ES modules.

## Run it

Browsers refuse ES modules from `file://` URLs, so serve the folder over HTTP. With Node.js 20 or newer:

```bash
npm start
```

Then open [http://localhost:8080](http://localhost:8080). Any static server works too, for example `python3 -m http.server 8080`.

The page loads three.js r160 and the glTF example model from the jsDelivr CDN, so it needs a network connection. It also needs a browser with WebGL and import-map support (current Chrome, Edge, Firefox and Safari 16.4 or newer).

## The chapters

| # | Chapter | What you learn |
| --- | --- | --- |
| 00 | Where things are | Axes, units, the origin |
| 01 | Scene, camera, renderer | The smallest working program |
| 02 | Geometries | Built-in shapes, segments and triangle counts |
| 03 | Materials | Basic to physical materials, roughness and metalness |
| 04 | Lights and shadows | Directional, spot and point lights, and shadow switches |
| 05 | Move, rotate, scale | Transforms, parents and children, pivots |
| 06 | Cameras and controls | Perspective vs orthographic, field of view, OrbitControls |
| 07 | The animation loop | Delta time, frame-rate independence, easing |
| 08 | Textures and UVs | Mapping images, repeat, colour space, filtering |
| 09 | Picking with raycasting | Finding the object under the pointer |
| 10 | Building your own geometry | Buffer attributes, updating vertices each frame |
| 11 | Shaders | Vertex and fragment shaders, uniforms, varyings |
| 12 | Loading models and animations | glTF, bounding boxes, animation mixers |
| 13 | Many objects: instancing | Draw calls and `InstancedMesh` |

Each chapter also lists things to try and the mistakes that catch people out.

## How it is put together

```text
index.html            page shell and the three.js import map
css/style.css         layout and light/dark themes
js/main.js            navigation, chapter pages, sliders and the code editor
js/stage.js           the renderer, animation loop and per-chapter cleanup
js/chapters/*.js      one file per chapter
tests/                checks on the chapter definitions
scripts/serve.mjs     tiny static server used by npm start
```

A chapter's code is one plain function. The page shows that function's source in the editor and runs the text with a context object, so what you read is what runs:

```js
function code({ THREE, scene, camera, renderer, params, onFrame, on, onDispose, status, helpers, addons }) {
  // build the scene, then register per-frame work with onFrame((dt, t) => { ... })
}
```

| Context field | Purpose |
| --- | --- |
| `THREE` | the three.js namespace |
| `scene`, `camera`, `renderer` | created for you |
| `params` | current slider and checkbox values |
| `onFrame(fn)` | runs `fn(dt, t)` every frame |
| `on(target, type, fn)` | adds an event listener that is removed when the chapter ends |
| `onDispose(fn)` | runs `fn` on cleanup |
| `status(text)` | writes to the status line under the scene |
| `helpers` | `setCamera`, `makeOrtho`, `useRoomEnvironment` |
| `addons` | `OrbitControls`, `GLTFLoader` |

### Adding a chapter

1. Copy any file in `js/chapters/` and change the `id`, `title`, text and `code`.
2. Add `controls` for the sliders, checkboxes and menus the code reads from `params`. A control with `rerun: true` re-runs the whole code when it changes; otherwise the code is expected to read `params` inside `onFrame`.
3. Import it in `js/chapters/index.js` at the position you want it.
4. Run `npm test`.

## Tests

```bash
npm test
```

The tests check every chapter definition: unique URL-safe ids, required text, well-formed controls, that every `params.*` the code reads has a control, and that the code parses as a single function. They do **not** render the 3D scenes. Those were checked by loading each chapter in a browser and confirming that it runs without errors.

## Publishing on GitHub Pages

In the repository settings, open **Pages** and choose to deploy from the `main` branch root. The site is entirely static, so nothing else is needed.

## License

[MIT](LICENSE)
