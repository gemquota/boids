const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(code => code.trim());
assert.ok(scripts.length > 0, 'index.html should contain an application script');
for (let i = 0; i < scripts.length; i++) {
  new vm.Script(scripts[i], { filename: 'index.html:inline-script-' + i });
}
assert.ok(html.includes('id="exportExperiment"'), 'experiment export control must exist');
assert.ok(html.includes("m.type==='exportData'"), 'experiment export response must be handled');
const guardMatch = html.match(/function globalShortcutAllowed\\(active\\)\\{([\\s\\S]*?)\\}/);
assert.ok(guardMatch, 'global keyboard shortcut focus guard must exist');
const guardSandbox = { document: { body: {}, documentElement: {} } };
vm.runInNewContext('globalThis.guard = function(active){' + guardMatch[1] + '}', guardSandbox);
const canvas = { tagName: 'CANVAS' };
for (const target of [null, guardSandbox.document.body, guardSandbox.document.documentElement, canvas]) {
  assert.equal(guardSandbox.guard(target), true, 'shortcuts should work from the world or page background');
}
for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']) {
  assert.equal(guardSandbox.guard({ tagName }), false, 'shortcuts must not hijack focused ' + tagName + ' controls');
}
assert.match(html, /e\\.defaultPrevented\\|\\|e\\.metaKey\\|\\|e\\.ctrlKey\\|\\|e\\.altKey/, 'modified keyboard shortcuts must be ignored');
console.log('Inline JavaScript syntax, export wiring, and keyboard focus safeguards passed.');
