const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)].map(match => match[1]).filter(code => code.trim());
assert.ok(scripts.length > 0, 'index.html should contain an application script');
for (let i = 0; i < scripts.length; i++) {
  new vm.Script(scripts[i], { filename: 'index.html:inline-script-' + i });
}
assert.ok(html.includes('id="exportExperiment"'), 'experiment export control must exist');
assert.ok(html.includes("m.type==='exportData'"), 'experiment export response must be handled');
console.log('Inline application JavaScript syntax and experiment export wiring passed.');
