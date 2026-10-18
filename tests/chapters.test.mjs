import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chapters } from '../js/chapters/index.js';

const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;

test('there is a sensible number of chapters', () => {
  assert.ok(chapters.length >= 10);
});

test('ids are unique, lower-case and URL safe', () => {
  const ids = chapters.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, kebab);
});

for (const c of chapters) {
  test(`${c.id}: has the content every chapter needs`, () => {
    assert.ok(c.title && c.summary, 'title and summary');
    for (const field of ['notes', 'tryThis', 'gotchas']) {
      assert.ok(Array.isArray(c[field]) && c[field].length > 0, `${field} must be a non-empty array`);
      for (const item of c[field]) assert.equal(typeof item, 'string');
    }
    const html = [...c.notes, ...c.tryThis, ...c.gotchas].join('\n');
    assert.ok(!/<script/i.test(html), 'chapter text is injected as HTML, so it must not contain scripts');
  });

  test(`${c.id}: code is one function that parses`, () => {
    assert.equal(typeof c.code, 'function');
    const source = c.code.toString();
    const parsed = new Function(`"use strict"; return (${source});`)();
    assert.equal(typeof parsed, 'function');
  });

  test(`${c.id}: controls are well formed`, () => {
    const keys = new Set();
    for (const ctl of c.controls || []) {
      assert.ok(ctl.key && ctl.label, 'key and label');
      assert.ok(!keys.has(ctl.key), `duplicate control key ${ctl.key}`);
      keys.add(ctl.key);
      if (ctl.type === 'range') {
        assert.ok(ctl.min < ctl.max && ctl.step > 0, `${ctl.key}: range bounds`);
        assert.ok(ctl.value >= ctl.min && ctl.value <= ctl.max, `${ctl.key}: default inside range`);
      } else if (ctl.type === 'select') {
        assert.ok(ctl.options.length >= 2, `${ctl.key}: needs options`);
        assert.ok(ctl.options.some((o) => String(o.value) === String(ctl.value)), `${ctl.key}: default is an option`);
      } else if (ctl.type === 'checkbox') {
        assert.equal(typeof ctl.value, 'boolean');
      } else {
        assert.fail(`${ctl.key}: unknown control type ${ctl.type}`);
      }
    }
  });

  test(`${c.id}: every params.* the code reads has a control`, () => {
    const source = c.code.toString();
    const used = new Set([...source.matchAll(/params\.(\w+)/g)].map((m) => m[1]));
    for (const m of source.matchAll(/const\s*\{([^}]+)\}\s*=\s*params/g)) {
      for (const part of m[1].split(',')) used.add(part.split(':')[0].trim());
    }
    const defined = new Set((c.controls || []).map((x) => x.key));
    for (const key of used) assert.ok(defined.has(key), `code reads params.${key} but no control defines it`);
  });
}
