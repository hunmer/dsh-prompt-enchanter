/**
 * Prompt Form — browser half.
 *
 * Adds a compact trigger at the top-right corner of the resident composer card
 * (the `conversation.input.overlay` slot). Clicking it opens a structured
 * prompt form whose edits are serialized to Markdown and written straight into
 * the composer draft, so the input box always reflects the form.
 *
 * The first time the form is opened for a session, the current draft becomes
 * the initial "problem" text (unstructured drafts) or is parsed back into all
 * fields (drafts already produced by this form).
 *
 * @module dsh-prompt-enhancer/client
 */

window.__ModuleLoader__.load({
  id: 'dsh-prompt-enhancer',
  factory(require) {
    'use strict';

    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } = React;

    /** Locale dictionary namespace owned by this plugin. */
    const NS = 'prompt-enhancer';

    // ---------------------------------------------------------------------
    // Copy
    // ---------------------------------------------------------------------

    const zh = {
      'meta.title': '提示词表单',
      'meta.description': '在输入框右上角打开结构化提示词表单，实时改写输入内容。',

      'trigger.label': '提示词表单',
      'trigger.title': '提示词表单',

      'panel.title': '提示词表单',
      'panel.subtitle': '修改会实时同步到输入框',
      'panel.close': '关闭',
      'panel.done': '完成',
      'panel.clear': '清空',
      'panel.read': '从输入框读取',

      'preset.label': '预设',
      'preset.custom': '自定义',
      'preset.saveAs': '另存为',
      'preset.save': '保存',
      'preset.cancel': '取消',
      'preset.namePh': '预设名称',
      'preset.setDefault': '设为默认',
      'preset.isDefault': '已默认',
      'preset.defaultBadge': '默认',
      'preset.remove': '删除当前预设',
      'preset.saved': '已保存',
      'preset.updated': '已更新',
      'preset.removed': '已删除',
      'preset.applied': '已应用',
      'preset.defaultSet': '已设为默认',
      'preset.builtin.quick': '快速修复',
      'preset.builtin.standard': '标准交付',

      'field.problem': '问题描述',
      'field.problem.ph': '要做什么？补充背景、目标和期望结果',
      'field.acceptance': '验收标准',
      'field.acceptance.ph': '怎样算完成？逐条列出可验证的标准',
      'field.time': '预期执行时间',
      'field.time.hint': '决定思考深度',
      'field.git': '是否自动提交 git',
      'field.tests': '是否需要自动化测试',
      'field.plan': '执行方式',
      'field.files': '涉及文件 / 模块',
      'field.files.ph': '如 src/composer.ts、packages/ui',
      'field.stack': '技术栈 / 框架',
      'field.stack.ph': '如 React 18 + Cordis',
      'field.constraints': '约束与禁止事项',
      'field.constraints.ph': '如不要新增依赖、不要改动公开 API',
      'field.lang': '输出语言',
      'field.notes': '其他补充',
      'field.notes.ph': '参考链接、复现步骤、期望风格等',

      'advanced': '高级选项',
      'common.unspecified': '不指定',
      'common.yes': '是',
      'common.no': '否',

      'time.none': '不指定',
      'time.option.5': '5 分钟 · 快速',
      'time.option.15': '15 分钟 · 标准',
      'time.option.30': '30 分钟 · 深入',
      'time.option.60': '1 小时 · 深度',
      'time.option.120': '2 小时以上 · 极深',
      'time.line.5': '5 分钟（思考深度：快速）',
      'time.line.15': '15 分钟（思考深度：标准）',
      'time.line.30': '30 分钟（思考深度：深入）',
      'time.line.60': '1 小时（思考深度：深度）',
      'time.line.120': '2 小时以上（思考深度：极深）',

      'git.yes': '完成后自动提交',
      'git.no': '不要提交，保留改动',
      'tests.yes': '需要，完成后运行相关测试',
      'tests.no': '不需要',
      'plan.ask': '先给出简短方案，确认后再动手',
      'plan.direct': '直接执行，无需确认',
      'plan.ask.short': '先给方案',
      'plan.direct.short': '直接执行',
      'lang.follow': '跟随项目',
      'lang.zh': '中文',
      'lang.en': 'English',

      'exec.time': '预期执行时间',
      'exec.git': 'Git',
      'exec.tests': '自动化测试',
      'exec.plan': '执行方式',
      'adv.files': '涉及文件/模块',
      'adv.stack': '技术栈/框架',
      'adv.constraints': '约束与禁止',
      'adv.lang': '输出语言',
      'adv.notes': '补充说明',
      'label.sep': '：',

      'section.problem': '问题描述',
      'section.acceptance': '验收标准',
      'section.execution': '执行要求',
      'section.context': '补充信息',
    };

    const en = {
      'meta.title': 'Prompt Form',
      'meta.description': 'Open a structured prompt form from the top-right corner of the composer; edits sync to the input box live.',

      'trigger.label': 'Prompt form',
      'trigger.title': 'Prompt form',

      'panel.title': 'Prompt form',
      'panel.subtitle': 'Edits sync to the composer live',
      'panel.close': 'Close',
      'panel.done': 'Done',
      'panel.clear': 'Clear',
      'panel.read': 'Read composer',

      'preset.label': 'Presets',
      'preset.custom': 'Custom',
      'preset.saveAs': 'Save as',
      'preset.save': 'Save',
      'preset.cancel': 'Cancel',
      'preset.namePh': 'Preset name',
      'preset.setDefault': 'Set default',
      'preset.isDefault': 'Default',
      'preset.defaultBadge': 'default',
      'preset.remove': 'Delete this preset',
      'preset.saved': 'Saved',
      'preset.updated': 'Updated',
      'preset.removed': 'Deleted',
      'preset.applied': 'Applied',
      'preset.defaultSet': 'Default preset saved',
      'preset.builtin.quick': 'Quick fix',
      'preset.builtin.standard': 'Standard delivery',

      'field.problem': 'Problem',
      'field.problem.ph': 'What should be done? Add background, goals and the expected result',
      'field.acceptance': 'Acceptance criteria',
      'field.acceptance.ph': 'When is it done? List verifiable criteria',
      'field.time': 'Expected duration',
      'field.time.hint': 'sets the thinking depth',
      'field.git': 'Auto-commit to git',
      'field.tests': 'Automated tests',
      'field.plan': 'Execution style',
      'field.files': 'Files / modules',
      'field.files.ph': 'e.g. src/composer.ts, packages/ui',
      'field.stack': 'Tech stack',
      'field.stack.ph': 'e.g. React 18 + Cordis',
      'field.constraints': 'Constraints & prohibitions',
      'field.constraints.ph': 'e.g. no new dependencies, keep the public API stable',
      'field.lang': 'Output language',
      'field.notes': 'Additional notes',
      'field.notes.ph': 'Links, reproduction steps, style preferences…',

      'advanced': 'Advanced options',
      'common.unspecified': 'Unspecified',
      'common.yes': 'Yes',
      'common.no': 'No',

      'time.none': 'Unspecified',
      'time.option.5': '5 min · quick',
      'time.option.15': '15 min · standard',
      'time.option.30': '30 min · deep',
      'time.option.60': '1 hour · intensive',
      'time.option.120': '2+ hours · maximum',
      'time.line.5': '5 minutes (thinking depth: quick)',
      'time.line.15': '15 minutes (thinking depth: standard)',
      'time.line.30': '30 minutes (thinking depth: deep)',
      'time.line.60': '1 hour (thinking depth: intensive)',
      'time.line.120': '2+ hours (thinking depth: maximum)',

      'git.yes': 'Commit automatically when done',
      'git.no': 'Do not commit; leave changes',
      'tests.yes': 'Yes — write and run relevant tests',
      'tests.no': 'Not required',
      'plan.ask': 'Outline a short plan first, then proceed after confirmation',
      'plan.direct': 'Proceed directly, no confirmation needed',
      'plan.ask.short': 'Plan first',
      'plan.direct.short': 'Proceed',
      'lang.follow': 'Follow project',
      'lang.zh': '中文',
      'lang.en': 'English',

      'exec.time': 'Expected duration',
      'exec.git': 'Git',
      'exec.tests': 'Automated tests',
      'exec.plan': 'Execution style',
      'adv.files': 'Files/modules',
      'adv.stack': 'Tech stack',
      'adv.constraints': 'Constraints',
      'adv.lang': 'Output language',
      'adv.notes': 'Notes',
      'label.sep': ': ',

      'section.problem': 'Problem',
      'section.acceptance': 'Acceptance criteria',
      'section.execution': 'Execution requirements',
      'section.context': 'Additional context',
    };

    // ---------------------------------------------------------------------
    // Styles (theme tokens only; light and dark come from the host theme)
    // ---------------------------------------------------------------------

    const CSS = `
.dsh-pe{position:absolute;top:5px;right:9px;z-index:6;display:flex;flex-direction:column;align-items:flex-end}
.dsh-pe-trigger{position:relative;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:7px;background:color-mix(in srgb, var(--dsw-alias-bg-overlay, #fff) 74%, transparent);color:var(--dsw-alias-label-tertiary, #8a8f98);cursor:pointer;transition:background-color .15s ease,color .15s ease;appearance:none;-webkit-appearance:none;font:inherit}
.dsh-pe-trigger:hover,.dsh-pe-trigger:focus-visible{background:var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.14));color:var(--dsw-alias-label-primary, #1f2329);outline:none}
.dsh-pe-trigger[data-open="true"]{background:var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.14));color:var(--dsw-alias-brand-primary, #4d6bfe)}
.dsh-pe-dot{position:absolute;top:3px;right:3px;width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-brand-primary, #4d6bfe);box-shadow:0 0 0 1.5px var(--dsw-alias-bg-overlay, #fff)}
.dsh-pe-panel{position:fixed;z-index:60;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;color:var(--dsw-alias-label-primary, #1f2329);background:var(--dsw-alias-bg-overlay, #fff);border:1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12));border-radius:12px;box-shadow:0 18px 48px rgba(0,0,0,.18),0 2px 8px rgba(0,0,0,.08);font-size:12px;line-height:1.5;animation:dsh-pe-pop .13s ease-out}
@keyframes dsh-pe-pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.dsh-pe-head{display:flex;align-items:flex-start;gap:8px;padding:11px 12px 8px}
.dsh-pe-heading{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}
.dsh-pe-title{font-size:13px;font-weight:600;line-height:18px}
.dsh-pe-sub{font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-tertiary, #8a8f98)}
.dsh-pe-x{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary, #8a8f98);cursor:pointer}
.dsh-pe-x:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.14));color:var(--dsw-alias-label-primary, #1f2329)}
.dsh-pe-body{display:flex;flex-direction:column;gap:10px;padding:2px 12px 10px;overflow:auto;overscroll-behavior:contain}
.dsh-pe-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.dsh-pe-labelrow{display:flex;align-items:baseline;gap:8px;min-width:0}
.dsh-pe-label{font-size:11px;font-weight:500;color:var(--dsw-alias-label-secondary, #5f6672)}
.dsh-pe-hint{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:10px;color:var(--dsw-alias-label-tertiary, #8a8f98)}
.dsh-pe-input{width:100%;box-sizing:border-box;min-height:30px;padding:5px 8px;border:1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.1));border-radius:8px;background:var(--dsw-alias-bg-layer-1, #fff);color:var(--dsw-alias-label-primary, #1f2329);font:inherit;font-size:12px;line-height:1.45;outline:none;resize:vertical;transition:border-color .15s ease,box-shadow .15s ease}
.dsh-pe-input::placeholder{color:var(--dsw-alias-label-tertiary, #8a8f98)}
.dsh-pe-input:focus{border-color:var(--dsw-alias-brand-primary, #4d6bfe);box-shadow:0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary, #4d6bfe) 16%, transparent)}
.dsh-pe-select{appearance:none;-webkit-appearance:none;padding-right:26px;cursor:pointer;background-image:linear-gradient(45deg,transparent 50%,var(--dsw-alias-label-tertiary, #8a8f98) 50%),linear-gradient(135deg,var(--dsw-alias-label-tertiary, #8a8f98) 50%,transparent 50%);background-position:calc(100% - 14px) 50%,calc(100% - 9px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat}
.dsh-pe-seg{display:flex;gap:2px;padding:2px;border:1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.08));border-radius:8px;background:var(--dsw-alias-bg-layer-2, #f2f3f5)}
.dsh-pe-seg-btn{flex:1 1 0;min-width:0;padding:3px 4px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary, #5f6672);font:inherit;font-size:11px;line-height:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.dsh-pe-seg-btn:hover{color:var(--dsw-alias-label-primary, #1f2329)}
.dsh-pe-seg-btn[data-on="true"]{background:var(--dsw-alias-bg-layer-1, #fff);color:var(--dsw-alias-label-primary, #1f2329);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.14)}
.dsh-pe-adv-toggle{display:flex;align-items:center;gap:6px;width:100%;padding:5px 8px;border:1px dashed var(--dsw-alias-border-l2, rgba(0,0,0,.16));border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary, #5f6672);font:inherit;font-size:11px;cursor:pointer}
.dsh-pe-adv-toggle:hover{color:var(--dsw-alias-label-primary, #1f2329);border-color:var(--dsw-alias-label-tertiary, #8a8f98)}
.dsh-pe-adv-count{margin-left:auto;min-width:15px;padding:0 4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2, #f2f3f5);color:var(--dsw-alias-label-secondary, #5f6672);font-size:10px;line-height:15px;text-align:center}
.dsh-pe-adv{display:flex;flex-direction:column;gap:10px;margin-top:2px;padding-top:8px;border-top:1px dashed var(--dsw-alias-border-l1, rgba(0,0,0,.08))}
.dsh-pe-foot{display:flex;align-items:center;gap:4px;padding:7px 10px;border-top:1px solid var(--dsw-alias-border-l1, rgba(0,0,0,.08));background:color-mix(in srgb, var(--dsw-alias-bg-layer-2, #f2f3f5) 45%, transparent)}
.dsh-pe-spacer{flex:1}
.dsh-pe-btn{padding:3px 8px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary, #5f6672);font:inherit;font-size:11px;line-height:18px;cursor:pointer}
.dsh-pe-btn:hover{background:var(--dsw-alias-interactive-bg-hover, rgba(127,127,127,.14));color:var(--dsw-alias-label-primary, #1f2329)}
.dsh-pe-btn:disabled{opacity:.4;cursor:default;background:transparent;color:var(--dsw-alias-label-tertiary, #8a8f98)}
.dsh-pe-btn-primary{background:var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary, #4d6bfe));color:var(--dsw-alias-label-primary-foreground, #fff)}
.dsh-pe-btn-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-fill, var(--dsw-alias-brand-primary, #4d6bfe));color:var(--dsw-alias-label-primary-foreground, #fff);opacity:.9}
.dsh-pe-presets{display:flex;align-items:center;flex-wrap:wrap;gap:4px;min-width:0;padding-bottom:8px;border-bottom:1px dashed var(--dsw-alias-border-l1, rgba(0,0,0,.08))}
.dsh-pe-presets-label{flex:none;font-size:10.5px;color:var(--dsw-alias-label-tertiary, #8a8f98)}
.dsh-pe-preset-select{flex:1 1 130px;min-width:110px;min-height:26px;padding:3px 26px 3px 7px;font-size:11px}
.dsh-pe-btn-tight{padding:3px 6px;white-space:nowrap}
.dsh-pe-saverow{display:flex;align-items:center;gap:4px;min-width:0}
.dsh-pe-saverow .dsh-pe-input{flex:1 1 auto;min-width:0;min-height:26px;padding:3px 7px;font-size:11px}
.dsh-pe-notice{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:10px;color:var(--dsw-alias-state-success-primary, #2da44e)}
`;

    const CSS_TAG = 'dsh-prompt-enhancer/client.css';
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(CSS_TAG) + ']') === null) {
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-prompt-enhancer';
      tag.dataset.pluginCss = CSS_TAG;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    // ---------------------------------------------------------------------
    // Form model, serialization and hydration
    // ---------------------------------------------------------------------

    const TIME_VALUES = ['5', '15', '30', '60', '120'];

    const EMPTY_FORM = {
      problem: '',
      acceptance: '',
      time: '',
      git: '',
      tests: '',
      plan: '',
      lang: '',
      files: '',
      stack: '',
      constraints: '',
      notes: '',
    };

    const ADVANCED_KEYS = ['plan', 'files', 'stack', 'constraints', 'lang', 'notes'];
    const EXTRA_KEYS = ['acceptance', 'time', 'git', 'tests'].concat(ADVANCED_KEYS);

    /** Trimmed string value of a form field. */
    function text(value) {
      return typeof value === 'string' ? value : '';
    }

    const FORM_KEYS = Object.keys(EMPTY_FORM);

    /** A complete form from a possibly partial one (unknown keys dropped). */
    function normalize(form) {
      const source = form && typeof form === 'object' ? form : {};
      const out = {};
      for (const key of FORM_KEYS) out[key] = typeof source[key] === 'string' ? source[key] : '';
      return out;
    }

    /** True when any field beyond the problem description carries a value. */
    function hasExtras(form) {
      if (!form) return false;
      for (const key of EXTRA_KEYS) {
        if (text(form[key]).trim() !== '') return true;
      }
      return false;
    }

    /** Number of filled advanced fields. */
    function advancedCount(form) {
      if (!form) return 0;
      let count = 0;
      for (const key of ADVANCED_KEYS) {
        if (text(form[key]).trim() !== '') count += 1;
      }
      return count;
    }

    // ---------------------------------------------------------------------
    // Presets (reusable execution options, persisted in localStorage)
    // ---------------------------------------------------------------------

    const PRESET_STORAGE_KEY = 'dsh-prompt-enhancer.presets.v1';

    /**
     * Fields a preset remembers. The problem, acceptance criteria and notes are
     * task-specific, so switching a preset never overwrites them.
     */
    const PRESET_KEYS = ['time', 'git', 'tests', 'plan', 'lang', 'files', 'stack', 'constraints'];

    const BUILTIN_PRESETS = [
      {
        id: 'builtin:quick',
        builtin: true,
        nameKey: 'preset.builtin.quick',
        values: { time: '5', git: 'no', tests: 'no', plan: 'direct', lang: '', files: '', stack: '', constraints: '' },
      },
      {
        id: 'builtin:standard',
        builtin: true,
        nameKey: 'preset.builtin.standard',
        values: { time: '30', git: 'yes', tests: 'yes', plan: 'ask', lang: '', files: '', stack: '', constraints: '' },
      },
    ];

    /** The reusable values of a form (unknown keys dropped). */
    function presetValues(form) {
      const out = {};
      for (const key of PRESET_KEYS) out[key] = text(form && form[key]);
      return out;
    }

    /** True when a preset would actually configure something. */
    function presetFilled(values) {
      for (const key of PRESET_KEYS) {
        if (text(values && values[key]).trim() !== '') return true;
      }
      return false;
    }

    /** Exact comparison over the preset fields only. */
    function samePresetValues(a, b) {
      for (const key of PRESET_KEYS) {
        if (text(a && a[key]) !== text(b && b[key])) return false;
      }
      return true;
    }

    /** Id of the preset whose values exactly match the form, or ''. */
    function matchPreset(form, presets) {
      const values = presetValues(form);
      for (const preset of presets) {
        if (samePresetValues(values, preset.values)) return preset.id;
      }
      return '';
    }

    function findPreset(presets, id) {
      for (const preset of presets) {
        if (preset.id === id) return preset;
      }
      return null;
    }

    function sanitizePreset(raw) {
      if (!raw || typeof raw !== 'object') return null;
      const id = typeof raw.id === 'string' ? raw.id.trim() : '';
      const name = typeof raw.name === 'string' ? raw.name.trim() : '';
      if (!id || !name) return null;
      const values = presetValues(raw.values);
      if (!presetFilled(values)) return null;
      return { id, name, values };
    }

    /** Read saved presets; a broken or unavailable store yields empty state. */
    function readPresets() {
      const empty = { presets: [], defaultId: '' };
      try {
        if (typeof window === 'undefined' || !window.localStorage) return empty;
        const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
        if (!raw) return empty;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return empty;
        const presets = Array.isArray(parsed.presets) ? parsed.presets.map(sanitizePreset).filter(Boolean) : [];
        const defaultId = typeof parsed.defaultId === 'string' ? parsed.defaultId : '';
        return { presets: presets.slice(0, 32), defaultId };
      } catch (error) {
        return empty;
      }
    }

    function writePresets(state) {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(
          PRESET_STORAGE_KEY,
          JSON.stringify({ v: 1, presets: state.presets, defaultId: state.defaultId }),
        );
      } catch (error) {
        /* Storage can be unavailable (private mode / quota): keep in memory. */
      }
    }

    /** All localized spellings of one dictionary key. */
    const labelCache = new Map();
    function labels(key) {
      let cached = labelCache.get(key);
      if (cached === undefined) {
        cached = [];
        if (typeof zh[key] === 'string') cached.push(zh[key]);
        if (typeof en[key] === 'string' && en[key] !== zh[key]) cached.push(en[key]);
        labelCache.set(key, cached);
      }
      return cached;
    }

    /** Whether a parsed label equals one dictionary key in any locale. */
    function isLabel(label, key) {
      return labels(key).indexOf(label) !== -1;
    }

    /** Serialize the form into the Markdown-ish prompt written to the composer. */
    function serialize(form, t) {
      const f = normalize(form);
      const problem = text(f.problem).trim();
      const acceptance = text(f.acceptance).trim();
      const notes = text(f.notes).trim();
      const sep = t('label.sep');

      const exec = [];
      if (f.time) exec.push(t('exec.time') + sep + t('time.line.' + f.time));
      if (f.git) exec.push(t('exec.git') + sep + t('git.' + f.git));
      if (f.tests) exec.push(t('exec.tests') + sep + t('tests.' + f.tests));
      if (f.plan) exec.push(t('exec.plan') + sep + t('plan.' + f.plan));

      const context = [];
      if (text(f.files).trim()) context.push(t('adv.files') + sep + text(f.files).trim());
      if (text(f.stack).trim()) context.push(t('adv.stack') + sep + text(f.stack).trim());
      if (text(f.constraints).trim()) context.push(t('adv.constraints') + sep + text(f.constraints).trim());
      if (f.lang) context.push(t('adv.lang') + sep + t('lang.' + f.lang));

      const sections = [];
      if (problem) sections.push('## ' + t('section.problem') + '\n\n' + problem);
      if (acceptance) sections.push('## ' + t('section.acceptance') + '\n\n' + acceptance);
      if (exec.length > 0) {
        sections.push('## ' + t('section.execution') + '\n\n' + exec.map((line) => '- ' + line).join('\n'));
      }
      if (context.length > 0 || notes) {
        let body = context.map((line) => '- ' + line).join('\n');
        if (notes) body = body ? body + '\n\n' + notes : notes;
        sections.push('## ' + t('section.context') + '\n\n' + body);
      }

      if (sections.length === 0) return '';
      // A plain problem description stays a plain prompt: no wrapping headings.
      if (problem && !acceptance && exec.length === 0 && context.length === 0 && !notes) return problem;
      return sections.join('\n\n');
    }

    /** Parse a duration value back from a serialized execution line. */
    function parseTime(value) {
      for (const v of TIME_VALUES) {
        const candidates = labels('time.line.' + v);
        for (const candidate of candidates) {
          if (value.indexOf(candidate) !== -1) return v;
        }
      }
      const minutes = /(\d+(?:\.\d+)?)\s*(分钟|minutes?|min)/i.exec(value);
      if (minutes) {
        const n = Number(minutes[1]);
        if (n <= 5) return '5';
        if (n <= 15) return '15';
        if (n <= 30) return '30';
        if (n <= 60) return '60';
        return '120';
      }
      const hours = /(\d+(?:\.\d+)?)\s*(小时|hours?|h\b)/i.exec(value);
      if (hours) return Number(hours[1]) >= 2 ? '120' : '60';
      return '';
    }

    /** Map a serialized value back onto a tri-state form value. */
    function parseTri(value, yesKey, noKey, yesPattern, noPattern) {
      const yes = labels(yesKey);
      const no = labels(noKey);
      for (const candidate of no) {
        if (value.indexOf(candidate) !== -1) return 'no';
      }
      for (const candidate of yes) {
        if (value.indexOf(candidate) !== -1) return 'yes';
      }
      if (noPattern.test(value)) return 'no';
      if (yesPattern.test(value)) return 'yes';
      return '';
    }

    /** Map a serialized language value back onto the select value. */
    function parseLang(value) {
      for (const candidate of labels('lang.zh')) {
        if (value.indexOf(candidate) !== -1) return 'zh';
      }
      for (const candidate of labels('lang.en')) {
        if (value.indexOf(candidate) !== -1) return 'en';
      }
      return '';
    }

    /** Map a serialized execution-style value back onto `ask` / `direct`. */
    function parsePlan(value) {
      for (const candidate of labels('plan.direct')) {
        if (value.indexOf(candidate) !== -1) return 'direct';
      }
      for (const candidate of labels('plan.ask')) {
        if (value.indexOf(candidate) !== -1) return 'ask';
      }
      if (/directly|直接执行/i.test(value)) return 'direct';
      if (/plan first|先给出|先说明/i.test(value)) return 'ask';
      return '';
    }

    /** Apply one execution-requirements bullet to the form. */
    function applyExecLine(line, form) {
      const split = line.search(/[:：]/);
      if (split === -1) return;
      const label = line.slice(0, split).trim();
      const value = line.slice(split + 1).trim();
      if (isLabel(label, 'exec.time')) form.time = parseTime(value);
      else if (isLabel(label, 'exec.git')) form.git = parseTri(value, 'git.yes', 'git.no', /auto-?commit|自动提交/i, /do not commit|不要提交/i);
      else if (isLabel(label, 'exec.tests')) form.tests = parseTri(value, 'tests.yes', 'tests.no', /\b(yes|required)\b|需要/i, /not required|不需要|no automated/i);
      else if (isLabel(label, 'exec.plan')) form.plan = parsePlan(value);
    }

    /** Apply one context bullet to the form; false when it is free-form text. */
    function applyContextLine(line, form) {
      const split = line.search(/[:：]/);
      if (split === -1) return false;
      const label = line.slice(0, split).trim();
      const value = line.slice(split + 1).trim();
      if (isLabel(label, 'adv.files')) form.files = value;
      else if (isLabel(label, 'adv.stack')) form.stack = value;
      else if (isLabel(label, 'adv.constraints')) form.constraints = value;
      else if (isLabel(label, 'adv.lang')) form.lang = parseLang(value);
      else return false;
      return true;
    }

    /**
     * Parse a draft produced by this form back into all fields.
     * Returns null for unstructured drafts (the caller then seeds the problem).
     */
    function hydrate(draft) {
      if (typeof draft !== 'string' || draft.trim() === '') return null;
      const sections = {
        [labels('section.problem')[0]]: 'problem',
        [labels('section.acceptance')[0]]: 'acceptance',
        [labels('section.execution')[0]]: 'execution',
        [labels('section.context')[0]]: 'context',
      };
      for (const key of ['section.problem', 'section.acceptance', 'section.execution', 'section.context']) {
        for (const candidate of labels(key)) sections[candidate] = key.slice('section.'.length);
      }
      const form = normalize(null);
      let current = null;
      let found = false;
      const lines = draft.replace(/\r\n/g, '\n').split('\n');
      const bodies = [];
      for (const line of lines) {
        const heading = /^##\s+(.+?)\s*$/.exec(line);
        if (heading && sections[heading[1]] !== undefined) {
          current = { key: sections[heading[1]], lines: [] };
          bodies.push(current);
          found = true;
        } else if (current) {
          current.lines.push(line);
        }
      }
      if (!found) return null;
      for (const section of bodies) {
        const body = section.lines.join('\n').trim();
        if (section.key === 'problem') {
          form.problem = body;
        } else if (section.key === 'acceptance') {
          form.acceptance = body;
        } else if (section.key === 'execution') {
          for (const raw of body.split('\n')) {
            const line = raw.replace(/^\s*[-*]\s*/, '').trim();
            if (line) applyExecLine(line, form);
          }
        } else if (section.key === 'context') {
          const notes = [];
          for (const raw of body.split('\n')) {
            const line = raw.replace(/^\s*[-*]\s*/, '').trim();
            if (!line) continue;
            if (!applyContextLine(line, form)) notes.push(line);
          }
          form.notes = notes.join('\n').trim();
        }
      }
      return form;
    }

    // Per-session form memory: survives panel close and session switches,
    // resets on page reload (the draft is re-parsed when the panel reopens).
    const memory = new Map();

    function recall(sessionId) {
      const form = memory.get(sessionId);
      return form === undefined ? null : form;
    }

    function remember(sessionId, form) {
      memory.set(sessionId, form);
    }

    // ---------------------------------------------------------------------
    // Small presentational helpers
    // ---------------------------------------------------------------------

    function IconForm() {
      return h(
        'svg',
        {
          width: 15,
          height: 15,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M4 5h16' }),
        h('path', { d: 'M4 12h10' }),
        h('path', { d: 'M4 19h7' }),
        h('path', { d: 'M17.5 13.5v6' }),
        h('path', { d: 'M14.5 16.5h6' }),
      );
    }

    function IconChevron({ open }) {
      return h(
        'svg',
        {
          width: 12,
          height: 12,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: open ? 'M6 14l6-6 6 6' : 'M6 10l6 6 6-6' }),
      );
    }

    function IconClose() {
      return h(
        'svg',
        {
          width: 13,
          height: 13,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2,
          strokeLinecap: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M6 6l12 12' }),
        h('path', { d: 'M18 6L6 18' }),
      );
    }

    function Field(props) {
      return h(
        'div',
        { className: 'dsh-pe-field' },
        h(
          'div',
          { className: 'dsh-pe-labelrow' },
          h('label', { className: 'dsh-pe-label', htmlFor: props.htmlFor }, props.label),
          props.hint ? h('span', { className: 'dsh-pe-hint' }, props.hint) : null,
        ),
        props.children,
      );
    }

    function Segmented(props) {
      return h(
        'div',
        { className: 'dsh-pe-seg', role: 'group', 'aria-label': props.label },
        props.options.map((option) =>
          h(
            'button',
            {
              key: option.value === '' ? 'none' : option.value,
              type: 'button',
              className: 'dsh-pe-seg-btn',
              'data-on': props.value === option.value ? 'true' : 'false',
              'aria-pressed': props.value === option.value,
              title: option.title || option.label,
              onClick: () => props.onChange(option.value),
            },
            option.label,
          ),
        ),
      );
    }

    // ---------------------------------------------------------------------
    // The overlay entry
    // ---------------------------------------------------------------------

    function PromptForm(props) {
      // `locale: NS` normally binds `t`; fall back to the raw dictionaries so a
      // missing binding never breaks the composer.
      const t =
        typeof props.t === 'function'
          ? props.t
          : (key) => (typeof zh[key] === 'string' ? zh[key] : typeof en[key] === 'string' ? en[key] : key);
      const sessionId = props.sessionId;
      const useInput = props.useInput;
      const inputActions = props.inputActions;

      const draft = useInput((state) => state.draft);
      const draftRef = useRef(draft);
      draftRef.current = draft;

      const rootRef = useRef(null);
      const formRef = useRef(null);
      const uid = React.useId();

      const [open, setOpen] = useState(false);
      const [form, setForm] = useState(() => recall(sessionId));
      const [advancedOpen, setAdvancedOpen] = useState(false);
      const [geometry, setGeometry] = useState(null);
      const [pstore, setPstore] = useState(readPresets);
      const [selectedId, setSelectedId] = useState('');
      const [saving, setSaving] = useState(false);
      const [nameDraft, setNameDraft] = useState('');
      const [notice, setNotice] = useState('');

      const noticeTimer = useRef(null);
      const pstoreRef = useRef(pstore);
      pstoreRef.current = pstore;
      const allPresets = useMemo(() => pstore.presets.concat(BUILTIN_PRESETS), [pstore.presets]);
      const allPresetsRef = useRef(allPresets);
      allPresetsRef.current = allPresets;

      formRef.current = form;

      useEffect(
        () => () => {
          if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
        },
        [],
      );

      // Another tab may have changed the presets: mirror them.
      useEffect(() => {
        const onStorage = (event) => {
          if (event.key !== PRESET_STORAGE_KEY) return;
          const next = readPresets();
          pstoreRef.current = next;
          setPstore(next);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
      }, []);

      // A different session gets that session's remembered form.
      useEffect(() => {
        setOpen(false);
        setSelectedId('');
        setSaving(false);
        setNameDraft('');
        const remembered = recall(sessionId);
        formRef.current = remembered;
        setForm(remembered);
      }, [sessionId]);

      const commit = useCallback(
        (next) => {
          formRef.current = next;
          remember(sessionId, next);
          setForm(next);
          setSelectedId(matchPreset(next, allPresetsRef.current));
          const serialized = serialize(next, t);
          if (draftRef.current !== serialized) inputActions.setDraft(serialized);
        },
        [sessionId, t, inputActions],
      );

      const flash = useCallback((message) => {
        setNotice(message);
        if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
        noticeTimer.current = window.setTimeout(() => {
          noticeTimer.current = null;
          setNotice('');
        }, 1800);
      }, []);

      const commitPresets = useCallback((next) => {
        pstoreRef.current = next;
        setPstore(next);
        writePresets(next);
      }, []);

      const update = useCallback(
        (patch) => {
          const next = Object.assign({}, normalize(formRef.current), patch);
          commit(next);
        },
        [commit],
      );

      const openPanel = useCallback(() => {
        if (open) {
          setOpen(false);
          return;
        }
        const presets = allPresetsRef.current;
        let next = recall(sessionId);
        let seeded = false;
        if (next === null) {
          const current = draftRef.current || '';
          const parsed = hydrate(current);
          if (parsed) {
            // A draft produced by this form already carries its own options.
            next = parsed;
          } else {
            const fallback = findPreset(presets, pstoreRef.current.defaultId);
            next = Object.assign({}, EMPTY_FORM, fallback ? fallback.values : {}, { problem: current });
            seeded = fallback !== null;
          }
          remember(sessionId, next);
        }
        formRef.current = next;
        setForm(next);
        setAdvancedOpen(advancedCount(next) > 0);
        setSelectedId(matchPreset(next, presets));
        setSaving(false);
        setNameDraft('');
        setOpen(true);
        // A default preset is meant to shape new prompts: reflect it right away
        // (without a default preset opening the panel never touches the draft).
        if (seeded) {
          const serialized = serialize(next, t);
          if (draftRef.current !== serialized) inputActions.setDraft(serialized);
        }
      }, [open, sessionId, t, inputActions]);

      const readComposer = useCallback(() => {
        const current = draftRef.current || '';
        const next = hydrate(current) || Object.assign({}, EMPTY_FORM, { problem: current });
        formRef.current = next;
        remember(sessionId, next);
        setForm(next);
        setAdvancedOpen(advancedCount(next) > 0);
        setSelectedId(matchPreset(next, allPresetsRef.current));
        const serialized = serialize(next, t);
        if (serialized !== current) inputActions.setDraft(serialized);
      }, [sessionId, t, inputActions]);

      const clearForm = useCallback(() => {
        const next = normalize(null);
        formRef.current = next;
        remember(sessionId, next);
        setForm(next);
        setSelectedId('');
        setSaving(false);
        setNameDraft('');
        if (draftRef.current !== '') inputActions.setDraft('');
      }, [sessionId, inputActions]);

      const applyPreset = useCallback(
        (id) => {
          if (!id) {
            setSelectedId('');
            return;
          }
          const preset = findPreset(allPresetsRef.current, id);
          if (!preset) {
            setSelectedId('');
            return;
          }
          const next = Object.assign({}, normalize(formRef.current), preset.values);
          commit(next);
          setSelectedId(id);
          if (advancedCount(next) > 0) setAdvancedOpen(true);
          flash(t('preset.applied'));
        },
        [commit, flash, t],
      );

      const savePreset = useCallback(() => {
        const name = nameDraft.trim();
        const values = presetValues(formRef.current);
        if (!name || !presetFilled(values)) return;
        const current = pstoreRef.current;
        const existing = current.presets.find((preset) => preset.name === name);
        const id = existing ? existing.id : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const presets = existing
          ? current.presets.map((preset) => (preset.id === id ? { id, name, values } : preset))
          : current.presets.concat([{ id, name, values }]);
        commitPresets({ presets, defaultId: current.defaultId });
        setSelectedId(id);
        setSaving(false);
        setNameDraft('');
        flash(t(existing ? 'preset.updated' : 'preset.saved'));
      }, [nameDraft, commitPresets, flash, t]);

      const setDefaultPreset = useCallback(() => {
        if (!selectedId) return;
        const current = pstoreRef.current;
        commitPresets({ presets: current.presets, defaultId: selectedId });
        flash(t('preset.defaultSet'));
      }, [selectedId, commitPresets, flash, t]);

      const removePreset = useCallback(() => {
        const current = pstoreRef.current;
        const preset = current.presets.find((item) => item.id === selectedId);
        if (!preset) return;
        const presets = current.presets.filter((item) => item.id !== preset.id);
        commitPresets({ presets, defaultId: current.defaultId === preset.id ? '' : current.defaultId });
        setSelectedId(matchPreset(formRef.current, presets.concat(BUILTIN_PRESETS)));
        flash(t('preset.removed'));
      }, [selectedId, commitPresets, flash, t]);

      // Close on outside pointer press or Escape.
      useEffect(() => {
        if (!open) return undefined;
        const onPointerDown = (event) => {
          const root = rootRef.current;
          if (root && event.target instanceof Node && root.contains(event.target)) return;
          setOpen(false);
        };
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          setOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown, true);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('keydown', onKeyDown, true);
        };
      }, [open]);

      // Anchor the panel above the composer card, right-aligned with it.
      useLayoutEffect(() => {
        if (!open) {
          setGeometry(null);
          return undefined;
        }
        const measure = () => {
          const root = rootRef.current;
          const card = root && root.closest('[data-composer-card]');
          if (!card) return;
          const rect = card.getBoundingClientRect();
          const width = Math.min(440, Math.max(280, window.innerWidth - 24));
          const right = Math.max(8, Math.min(window.innerWidth - width - 8, window.innerWidth - rect.right + 8));
          const roomAbove = rect.top - 24;
          if (roomAbove >= 260) {
            setGeometry({
              width,
              right,
              bottom: Math.max(8, window.innerHeight - rect.top + 8),
              maxHeight: Math.min(window.innerHeight * 0.62, roomAbove),
            });
          } else {
            const top = rect.bottom + 8;
            setGeometry({
              width,
              right,
              top,
              maxHeight: Math.max(180, Math.min(window.innerHeight * 0.62, window.innerHeight - top - 12)),
            });
          }
        };
        measure();
        window.addEventListener('resize', measure);
        const root = rootRef.current;
        const card = root && root.closest('[data-composer-card]');
        const observer = typeof ResizeObserver === 'function' && card ? new ResizeObserver(measure) : null;
        if (observer) observer.observe(card);
        return () => {
          window.removeEventListener('resize', measure);
          if (observer) observer.disconnect();
        };
      }, [open]);

      const stop = (event) => event.stopPropagation();
      const active = hasExtras(form);
      const advanced = advancedCount(form);

      const trigger = h(
        'button',
        {
          type: 'button',
          className: 'dsh-pe-trigger',
          'data-open': open ? 'true' : 'false',
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          'aria-label': t('trigger.label'),
          title: t('trigger.title'),
          onClick: openPanel,
        },
        h(IconForm, null),
        active ? h('span', { className: 'dsh-pe-dot', 'aria-hidden': true }) : null,
      );

      if (!open || !form) {
        return h('div', { className: 'dsh-pe', ref: rootRef, onClick: stop, onPointerDown: stop, onMouseDown: stop }, trigger);
      }

      const f = form;
      const selectedPreset = findPreset(allPresets, selectedId);
      const presetName = (preset) => (preset.builtin ? t(preset.nameKey) : preset.name);
      const canSave = presetFilled(presetValues(f));
      const timeOptions = [['', t('time.none')]].concat(TIME_VALUES.map((value) => [value, t('time.option.' + value)]));
      const yesNo = [
        { value: '', label: t('common.unspecified') },
        { value: 'yes', label: t('common.yes') },
        { value: 'no', label: t('common.no') },
      ];
      const langOptions = [
        ['', t('lang.follow')],
        ['zh', t('lang.zh')],
        ['en', t('lang.en')],
      ];

      const panel = h(
        'div',
        {
          className: 'dsh-pe-panel',
          style: geometry
            ? Object.assign(
                { width: geometry.width, right: geometry.right, maxHeight: geometry.maxHeight },
                geometry.bottom !== undefined ? { bottom: geometry.bottom } : { top: geometry.top },
              )
            : { visibility: 'hidden', width: 440, right: 8, bottom: 8 },
          role: 'dialog',
          'aria-label': t('panel.title'),
          onKeyDown: (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          },
        },
        h(
          'div',
          { className: 'dsh-pe-head' },
          h(
            'div',
            { className: 'dsh-pe-heading' },
            h('span', { className: 'dsh-pe-title' }, t('panel.title')),
            h('span', { className: 'dsh-pe-sub' }, t('panel.subtitle')),
          ),
          h('button', { type: 'button', className: 'dsh-pe-x', onClick: () => setOpen(false), 'aria-label': t('panel.close'), title: t('panel.close') }, h(IconClose, null)),
        ),
        h(
          'div',
          { className: 'dsh-pe-body' },
          h(
            'div',
            { className: 'dsh-pe-presets' },
            h('span', { className: 'dsh-pe-presets-label' }, t('preset.label')),
            h(
              'select',
              {
                className: 'dsh-pe-input dsh-pe-select dsh-pe-preset-select',
                value: selectedId,
                'aria-label': t('preset.label'),
                title: t('preset.label'),
                onChange: (event) => applyPreset(event.target.value),
              },
              h('option', { value: '' }, t('preset.custom')),
              allPresets.map((preset) =>
                h(
                  'option',
                  { key: preset.id, value: preset.id },
                  presetName(preset) + (preset.id === pstore.defaultId ? ' · ' + t('preset.defaultBadge') : ''),
                ),
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-pe-btn dsh-pe-btn-tight',
                onClick: () => {
                  setSaving((value) => !value);
                  setNameDraft(selectedPreset && !selectedPreset.builtin ? selectedPreset.name : '');
                },
              },
              t('preset.saveAs'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dsh-pe-btn dsh-pe-btn-tight',
                disabled: !selectedId || selectedId === pstore.defaultId,
                title: t('preset.setDefault'),
                onClick: setDefaultPreset,
              },
              selectedId && selectedId === pstore.defaultId ? t('preset.isDefault') : t('preset.setDefault'),
            ),
            selectedPreset && !selectedPreset.builtin
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-pe-x',
                    title: t('preset.remove'),
                    'aria-label': t('preset.remove'),
                    onClick: removePreset,
                  },
                  h(IconClose, null),
                )
              : null,
          ),
          saving
            ? h(
                'div',
                { className: 'dsh-pe-saverow' },
                h('input', {
                  className: 'dsh-pe-input',
                  type: 'text',
                  placeholder: t('preset.namePh'),
                  value: nameDraft,
                  autoFocus: true,
                  maxLength: 40,
                  onChange: (event) => setNameDraft(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      savePreset();
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      event.stopPropagation();
                      setSaving(false);
                      setNameDraft('');
                    }
                  },
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-pe-btn dsh-pe-btn-primary',
                    disabled: !nameDraft.trim() || !canSave,
                    onClick: savePreset,
                  },
                  t('preset.save'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-pe-btn',
                    onClick: () => {
                      setSaving(false);
                      setNameDraft('');
                    },
                  },
                  t('preset.cancel'),
                ),
              )
            : null,
          h(
            Field,
            { label: t('field.problem'), htmlFor: uid + '-problem' },
            h('textarea', {
              id: uid + '-problem',
              className: 'dsh-pe-input',
              rows: 3,
              placeholder: t('field.problem.ph'),
              value: f.problem,
              onChange: (event) => update({ problem: event.target.value }),
            }),
          ),
          h(
            Field,
            { label: t('field.acceptance'), htmlFor: uid + '-acceptance' },
            h('textarea', {
              id: uid + '-acceptance',
              className: 'dsh-pe-input',
              rows: 2,
              placeholder: t('field.acceptance.ph'),
              value: f.acceptance,
              onChange: (event) => update({ acceptance: event.target.value }),
            }),
          ),
          h(
            Field,
            { label: t('field.time'), htmlFor: uid + '-time', hint: t('field.time.hint') },
            h(
              'select',
              {
                id: uid + '-time',
                className: 'dsh-pe-input dsh-pe-select',
                value: f.time,
                onChange: (event) => update({ time: event.target.value }),
              },
              timeOptions.map(([value, label]) => h('option', { key: value === '' ? 'none' : value, value }, label)),
            ),
          ),
          h(
            Field,
            { label: t('field.git') },
            h(Segmented, { label: t('field.git'), value: f.git, options: yesNo, onChange: (value) => update({ git: value }) }),
          ),
          h(
            Field,
            { label: t('field.tests') },
            h(Segmented, { label: t('field.tests'), value: f.tests, options: yesNo, onChange: (value) => update({ tests: value }) }),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dsh-pe-adv-toggle',
              'aria-expanded': advancedOpen,
              onClick: () => setAdvancedOpen((value) => !value),
            },
            h(IconChevron, { open: advancedOpen }),
            h('span', null, t('advanced')),
            advanced > 0 ? h('span', { className: 'dsh-pe-adv-count' }, String(advanced)) : null,
          ),
          advancedOpen
            ? h(
                'div',
                { className: 'dsh-pe-adv' },
                h(
                  Field,
                  { label: t('field.plan') },
                  h(Segmented, {
                    label: t('field.plan'),
                    value: f.plan,
                    options: [
                      { value: '', label: t('common.unspecified') },
                      { value: 'ask', label: t('plan.ask.short'), title: t('plan.ask') },
                      { value: 'direct', label: t('plan.direct.short'), title: t('plan.direct') },
                    ],
                    onChange: (value) => update({ plan: value }),
                  }),
                ),
                h(
                  Field,
                  { label: t('field.files'), htmlFor: uid + '-files' },
                  h('input', {
                    id: uid + '-files',
                    className: 'dsh-pe-input',
                    type: 'text',
                    placeholder: t('field.files.ph'),
                    value: f.files,
                    onChange: (event) => update({ files: event.target.value }),
                  }),
                ),
                h(
                  Field,
                  { label: t('field.stack'), htmlFor: uid + '-stack' },
                  h('input', {
                    id: uid + '-stack',
                    className: 'dsh-pe-input',
                    type: 'text',
                    placeholder: t('field.stack.ph'),
                    value: f.stack,
                    onChange: (event) => update({ stack: event.target.value }),
                  }),
                ),
                h(
                  Field,
                  { label: t('field.constraints'), htmlFor: uid + '-constraints' },
                  h('textarea', {
                    id: uid + '-constraints',
                    className: 'dsh-pe-input',
                    rows: 2,
                    placeholder: t('field.constraints.ph'),
                    value: f.constraints,
                    onChange: (event) => update({ constraints: event.target.value }),
                  }),
                ),
                h(
                  Field,
                  { label: t('field.lang'), htmlFor: uid + '-lang' },
                  h(
                    'select',
                    {
                      id: uid + '-lang',
                      className: 'dsh-pe-input dsh-pe-select',
                      value: f.lang,
                      onChange: (event) => update({ lang: event.target.value }),
                    },
                    langOptions.map(([value, label]) => h('option', { key: value === '' ? 'follow' : value, value }, label)),
                  ),
                ),
                h(
                  Field,
                  { label: t('field.notes'), htmlFor: uid + '-notes' },
                  h('textarea', {
                    id: uid + '-notes',
                    className: 'dsh-pe-input',
                    rows: 2,
                    placeholder: t('field.notes.ph'),
                    value: f.notes,
                    onChange: (event) => update({ notes: event.target.value }),
                  }),
                ),
              )
            : null,
        ),
        h(
          'div',
          { className: 'dsh-pe-foot' },
          h('button', { type: 'button', className: 'dsh-pe-btn', onClick: readComposer, title: t('panel.read') }, t('panel.read')),
          h('button', { type: 'button', className: 'dsh-pe-btn', onClick: clearForm, title: t('panel.clear') }, t('panel.clear')),
          notice ? h('span', { className: 'dsh-pe-notice', role: 'status' }, notice) : null,
          h('span', { className: 'dsh-pe-spacer' }),
          h('button', { type: 'button', className: 'dsh-pe-btn dsh-pe-btn-primary', onClick: () => setOpen(false) }, t('panel.done')),
        ),
      );

      return h(
        'div',
        { className: 'dsh-pe', ref: rootRef, onClick: stop, onPointerDown: stop, onMouseDown: stop },
        trigger,
        panel,
      );
    }

    // ---------------------------------------------------------------------
    // Plugin
    // ---------------------------------------------------------------------

    const apply = (ctx) => {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'prompt-enhancer: dictionaries');
      ctx.slots.inject('conversation.input.overlay', () =>
        ctx.slots.register(
          {
            name: 'conversation.input.overlay',
            id: 'prompt-form',
            order: 3,
            locale: NS,
          },
          PromptForm,
        ),
      );
    };

    return {
      inject: ['slots', 'locale'],
      apply,
      __test: {
        EMPTY_FORM,
        normalize,
        hasExtras,
        advancedCount,
        serialize,
        hydrate,
        PRESET_KEYS,
        BUILTIN_PRESETS,
        presetValues,
        presetFilled,
        matchPreset,
        PRESET_STORAGE_KEY,
        sanitizePreset,
        readPresets,
        writePresets,
        dict: { zh, en },
      },
    };
  },
});
