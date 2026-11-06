/**
 * Pure-logic tests for the prompt form (no browser required).
 *
 * Run with: node --test test/format.test.mjs
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Capture the browser module definition without a browser. */
let definition = null;
globalThis.window = {
  __ModuleLoader__: {
    load(value) {
      definition = value;
    },
  },
};

const entry = fileURLToPath(new URL('../client.js', import.meta.url));
await import(pathToFileURL(entry).href);

const reactStub = {
  createElement: () => null,
  useCallback: (fn) => fn,
  useEffect: () => {},
  useLayoutEffect: () => {},
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useId: () => 'test',
};

const plugin = definition.factory((name) => {
  if (name === 'react') return reactStub;
  throw new Error('unexpected require: ' + name);
});

const T = plugin.__test;
const tZh = (key) => T.dict.zh[key] ?? key;
const tEn = (key) => T.dict.en[key] ?? key;

const FULL = {
  problem: '修复 composer 卡片在长文本下的闪烁',
  acceptance: '1. 不再闪烁\n2. 控制台无报错',
  time: '30',
  git: 'no',
  tests: 'yes',
  plan: 'ask',
  lang: 'zh',
  files: 'client.js',
  stack: '',
  constraints: '不要新增依赖',
  notes: '参考 #123',
};

test('a plain draft seeds only the problem description', () => {
  assert.equal(T.hydrate('随便写点什么'), null);
  assert.equal(T.hydrate(''), null);
  assert.equal(T.hydrate('   '), null);
});

test('a problem-only form serializes to a plain prompt', () => {
  const text = T.serialize({ ...T.EMPTY_FORM, problem: '只做这一件事' }, tZh);
  assert.equal(text, '只做这一件事');
});

test('an empty form serializes to an empty draft', () => {
  assert.equal(T.serialize(T.EMPTY_FORM, tZh), '');
});

test('a full form round-trips through Chinese serialization', () => {
  const text = T.serialize(FULL, tZh);
  assert.match(text, /^## 问题描述\n\n修复 composer 卡片在长文本下的闪烁/);
  assert.match(text, /## 验收标准/);
  assert.match(text, /## 执行要求/);
  assert.match(text, /- 预期执行时间：30 分钟（思考深度：深入）/);
  assert.match(text, /- Git：不要提交，保留改动/);
  assert.match(text, /- 自动化测试：需要，完成后运行相关测试/);
  assert.match(text, /- 执行方式：先给出简短方案，确认后再动手/);
  assert.match(text, /## 补充信息/);
  assert.match(text, /- 涉及文件\/模块：client\.js/);
  assert.match(text, /- 约束与禁止：不要新增依赖/);
  assert.match(text, /- 输出语言：中文/);
  assert.match(text, /参考 #123$/);

  const back = T.hydrate(text);
  assert.deepEqual(back, { ...T.EMPTY_FORM, ...FULL });
});

test('a full form round-trips through English serialization', () => {
  const form = { ...FULL, lang: 'en', notes: 'see #123' };
  const text = T.serialize(form, tEn);
  assert.match(text, /^## Problem\n\n/);
  assert.match(text, /## Acceptance criteria/);
  assert.match(text, /## Execution requirements/);
  assert.match(text, /- Expected duration: 30 minutes \(thinking depth: deep\)/);
  assert.match(text, /- Git: Do not commit; leave changes/);
  assert.match(text, /- Automated tests: Yes — write and run relevant tests/);

  assert.deepEqual(T.hydrate(text), { ...T.EMPTY_FORM, ...form });
});

test('structured drafts are parsed regardless of the current locale', () => {
  const text = T.serialize(FULL, tEn);
  const back = T.hydrate(text);
  assert.equal(back.time, '30');
  assert.equal(back.git, 'no');
  assert.equal(back.tests, 'yes');
  assert.equal(back.plan, 'ask');
  assert.equal(back.lang, 'zh');
});

test('unknown labels inside the context section become free-form notes', () => {
  const back = T.hydrate('## 补充信息\n\n- 涉及文件/模块：a.ts\n- 自定义：foo\n- 第二条备注');
  assert.equal(back.files, 'a.ts');
  assert.equal(back.notes, '自定义：foo\n第二条备注');
});

test('time values are recovered from free-form durations', () => {
  assert.equal(T.hydrate('## 执行要求\n\n- 预期执行时间：3 分钟').time, '5');
  assert.equal(T.hydrate('## 执行要求\n\n- 预期执行时间：10 分钟').time, '15');
  assert.equal(T.hydrate('## 执行要求\n\n- 预期执行时间：45 分钟').time, '60');
  assert.equal(T.hydrate('## 执行要求\n\n- 预期执行时间：3 小时').time, '120');
});

test('hasExtras and advancedCount report the panel state', () => {
  assert.equal(T.hasExtras(T.EMPTY_FORM), false);
  assert.equal(T.hasExtras({ ...T.EMPTY_FORM, problem: 'x' }), false);
  assert.equal(T.hasExtras({ ...T.EMPTY_FORM, git: 'yes' }), true);
  assert.equal(T.hasExtras({ ...T.EMPTY_FORM, notes: 'x' }), true);
  assert.equal(T.advancedCount(T.EMPTY_FORM), 0);
  assert.equal(T.advancedCount({ ...T.EMPTY_FORM, plan: 'ask', files: 'a', notes: ' ' }), 2);
});

test('normalize keeps only known fields and fills defaults', () => {
  const form = T.normalize({ problem: 'x', unexpected: 1 });
  assert.equal(form.problem, 'x');
  assert.equal(form.acceptance, '');
  assert.equal('unexpected' in form, false);
});

test('presets keep only the reusable execution options', () => {
  const values = T.presetValues(FULL);
  assert.deepEqual(Object.keys(values).sort(), [...T.PRESET_KEYS].sort());
  assert.equal(values.time, '30');
  assert.equal(values.constraints, '不要新增依赖');
  assert.equal('problem' in values, false);
  assert.equal('acceptance' in values, false);
  assert.equal('notes' in values, false);
});

test('an all-empty preset is not worth saving', () => {
  assert.equal(T.presetFilled(T.presetValues(T.EMPTY_FORM)), false);
  assert.equal(T.presetFilled(T.presetValues({ ...T.EMPTY_FORM, time: '5' })), true);
  assert.equal(T.presetFilled(T.presetValues({ ...T.EMPTY_FORM, files: '  ' })), false);
});

test('matching a preset ignores the task-specific text', () => {
  const [quick, standard] = T.BUILTIN_PRESETS;
  const form = { ...T.EMPTY_FORM, problem: 'anything', acceptance: 'x', notes: 'n', ...quick.values };
  assert.equal(T.matchPreset(form, T.BUILTIN_PRESETS), quick.id);
  assert.equal(T.matchPreset({ ...T.EMPTY_FORM, ...standard.values }, T.BUILTIN_PRESETS), standard.id);
  assert.equal(T.matchPreset({ ...form, git: 'yes' }, T.BUILTIN_PRESETS), '');
  assert.equal(T.matchPreset(T.EMPTY_FORM, T.BUILTIN_PRESETS), '');
});

test('built-in presets are localized, filled and distinct', () => {
  const ids = new Set();
  for (const preset of T.BUILTIN_PRESETS) {
    ids.add(preset.id);
    assert.equal(typeof T.dict.zh[preset.nameKey], 'string');
    assert.equal(typeof T.dict.en[preset.nameKey], 'string');
    assert.equal(T.presetFilled(preset.values), true);
    assert.equal(T.matchPreset({ ...T.EMPTY_FORM, ...preset.values }, T.BUILTIN_PRESETS), preset.id);
  }
  assert.equal(ids.size, T.BUILTIN_PRESETS.length);
});

function fakeStorage(entries = {}) {
  const map = new Map(Object.entries(entries));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

test('a missing localStorage yields the empty preset state', () => {
  delete globalThis.window.localStorage;
  assert.deepEqual(T.readPresets(), { presets: [], defaultId: '' });
});

test('presets survive a localStorage round-trip', () => {
  const storage = fakeStorage();
  globalThis.window.localStorage = storage;
  const preset = {
    id: 'pabc',
    name: '我的预设',
    values: T.presetValues({ ...T.EMPTY_FORM, time: '15', git: 'yes', plan: 'ask', constraints: '不要新增依赖' }),
  };
  T.writePresets({ presets: [preset], defaultId: 'pabc' });
  assert.deepEqual(JSON.parse(storage.getItem(T.PRESET_STORAGE_KEY)), {
    v: 1,
    presets: [preset],
    defaultId: 'pabc',
  });
  assert.deepEqual(T.readPresets(), { presets: [preset], defaultId: 'pabc' });
  delete globalThis.window.localStorage;
});

test('a corrupt preset store degrades to the empty state', () => {
  globalThis.window.localStorage = fakeStorage({ [T.PRESET_STORAGE_KEY]: '{not json' });
  assert.deepEqual(T.readPresets(), { presets: [], defaultId: '' });
  globalThis.window.localStorage = fakeStorage({ [T.PRESET_STORAGE_KEY]: '[]' });
  assert.deepEqual(T.readPresets(), { presets: [], defaultId: '' });
  delete globalThis.window.localStorage;
});

test('invalid or blank saved presets are dropped on read', () => {
  const payload = {
    presets: [
      { id: 'ok', name: 'ok', values: { time: '5' } },
      { id: '', name: 'no id', values: { time: '5' } },
      { id: 'noname', name: '   ', values: { time: '5' } },
      { id: 'empty', name: 'empty', values: { problem: 'not a preset field' } },
      'garbage',
    ],
    defaultId: 'ok',
  };
  globalThis.window.localStorage = fakeStorage({ [T.PRESET_STORAGE_KEY]: JSON.stringify(payload) });
  const back = T.readPresets();
  assert.equal(back.presets.length, 1);
  assert.equal(back.presets[0].id, 'ok');
  assert.deepEqual(Object.keys(back.presets[0].values).sort(), [...T.PRESET_KEYS].sort());
  assert.equal(back.defaultId, 'ok');
  delete globalThis.window.localStorage;
});

test('the preset store is capped at 32 entries', () => {
  const presets = [];
  for (let index = 0; index < 40; index += 1) {
    presets.push({ id: 'p' + index, name: 'n' + index, values: { time: '5' } });
  }
  globalThis.window.localStorage = fakeStorage({
    [T.PRESET_STORAGE_KEY]: JSON.stringify({ presets, defaultId: '' }),
  });
  assert.equal(T.readPresets().presets.length, 32);
  delete globalThis.window.localStorage;
});
