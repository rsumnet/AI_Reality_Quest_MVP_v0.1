const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'inline application script exists');
const script = match[1];

test('v0.4.8 title, badge, and schema version agree', () => {
  assert.match(html, /<title>AI Reality Quest — MVP v0\.4\.8<\/title>/);
  assert.match(html, /MVP v0\.4\.8 · Browser \/ On-device inference/);
  assert.match(script, /const ARQ_SCHEMA_VERSION='0\.4\.8';/);
});

test('P3 engine exposes reusable eligibility rules', () => {
  const start = script.indexOf('const P3_RULE_ENGINE={');
  const end = script.indexOf('\nconst PERSONAL_AI_SCHEMA', start);
  assert.ok(start >= 0 && end > start, 'P3 engine block exists');
  const sandbox = {
    P3_RULE_ENGINE_VERSION: 'simple-0.1',
    objectStatsById: id => ({ count: id === 'eligible' ? 2 : 1 }),
    battleStatsFrom: (battles, id) => ({
      ownMonsterLosses: id === 'eligible' ? 1 : 0,
      encounters: id === 'eligible' ? 4 : 0,
      missed: 0
    }),
    isConfirmedId: id => id === 'eligible'
  };
  vm.runInNewContext(script.slice(start, end) + '\nthis.engine=P3_RULE_ENGINE;', sandbox);
  assert.equal(typeof sandbox.engine.eligibleContexts, 'function');
});

test('P3 eligibility requires a confirmed object, repeated evidence, and own-team loss', () => {
  const start = script.indexOf('const P3_RULE_ENGINE={');
  const end = script.indexOf('\nconst PERSONAL_AI_SCHEMA', start);
  const sandbox = {
    P3_RULE_ENGINE_VERSION: 'simple-0.1',
    objectStatsById: id => ({ count: id === 'eligible' ? 2 : 1 }),
    battleStatsFrom: (battles, id) => ({
      ownMonsterLosses: id === 'eligible' ? 1 : 0,
      encounters: id === 'eligible' ? 4 : 0,
      missed: 0
    }),
    isConfirmedId: id => id === 'eligible'
  };
  vm.runInNewContext(script.slice(start, end) + '\nthis.engine=P3_RULE_ENGINE;', sandbox);
  const contexts = [
    { physical_object_id: 'eligible', status: 'CONFIRMED' },
    { physical_object_id: 'not-enough-evidence', status: 'CONFIRMED' },
    { physical_object_id: 'not-confirmed', status: 'PENDING' }
  ];
  const eligible = sandbox.engine.eligibleContexts({ contexts, battles: [] });
  assert.deepEqual(Array.from(eligible, x => x.physical_object_id), ['eligible']);
});

test('P3 evaluation selects a candidate from eligible Personal Context', () => {
  const start = script.indexOf('const P3_RULE_ENGINE={');
  const end = script.indexOf('\nconst PERSONAL_AI_SCHEMA', start);
  const sandbox = {
    P3_RULE_ENGINE_VERSION: 'simple-0.1',
    objectStatsById: id => ({ count: id === 'eligible' ? 2 : 1 }),
    battleStatsFrom: (battles, id) => ({
      ownMonsterLosses: id === 'eligible' ? 1 : 0,
      encounters: id === 'eligible' ? 4 : 0,
      missed: 0
    }),
    isConfirmedId: id => id === 'eligible'
  };
  vm.runInNewContext(script.slice(start, end) + '\nthis.engine=P3_RULE_ENGINE;', sandbox);
  const contexts = [{ physical_object_id: 'eligible', status: 'CONFIRMED' }];
  const candidates = [
    { physical_object_id: 'other', name: 'Other' },
    { physical_object_id: 'eligible', name: 'Previously lost Monster' }
  ];
  const result = sandbox.engine.evaluate({ contexts, battles: [], candidates });
  assert.equal(result.applied, true);
  assert.equal(result.selected.name, 'Previously lost Monster');
});

test('P3 status is visible in the UI and refreshed during render', () => {
  assert.match(html, /id="p3EngineVersion"/);
  assert.match(html, /id="p3Status"/);
  assert.ok(script.includes('function p3Priorities()'));
  assert.ok(script.includes('function renderP3Status()'));
  assert.ok(script.includes('renderP3Status();'));
});

test('Quest completion and battle result safeguards are present', () => {
  assert.ok(script.includes('function questPromptText()'));
  assert.ok(script.includes('state.battleOutcomeShown=true'));
  assert.ok(script.includes('객체 3개 수집 완료! 이제 게임을 시작할 수 있습니다.'));
  assert.ok(script.includes("if(!state.battleOutcomeShown&&$('battleResult').textContent==='아직 3개 객체를 모으지 않았습니다.')"));
});
