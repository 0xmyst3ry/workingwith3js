import coordinates from './00-coordinates.js';
import scene from './01-scene.js';
import geometries from './02-geometries.js';
import materials from './03-materials.js';
import lights from './04-lights.js';
import transforms from './05-transforms.js';
import cameras from './06-cameras.js';
import animation from './07-animation.js';
import textures from './08-textures.js';
import picking from './09-picking.js';
import customGeometry from './10-custom-geometry.js';
import shaders from './11-shaders.js';
import models from './12-models.js';
import instancing from './13-instancing.js';

// The order here is the order of the book. Each chapter leans on the ones before it.
export const chapters = [
  coordinates,
  scene,
  geometries,
  materials,
  lights,
  transforms,
  cameras,
  animation,
  textures,
  picking,
  customGeometry,
  shaders,
  models,
  instancing,
];
