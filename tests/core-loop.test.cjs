const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'inline application script exists');
const script = match[1];

test('v0.5.1 title, badge, and schema version agree', () => {
  assert.match(html, /<title>AI Reality Quest — MVP v0\.5\.1<\/title>/);
  assert.match(html, /MVP v0\.5\.1 · Browser \/ On-device inference/);
  assert.match(script, /const ARQ_SCHEMA_VERSION='0\.5\.1';/);
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


test('P3 requires repeated evidence and an actual loss of the same physical object before selecting it again', () => {
  const objectStart = script.indexOf('function objectStatsById(id){');
  const objectEnd = script.indexOf('\nfunction displayNameFor', objectStart);
  const confirmedStart = script.indexOf('function isConfirmedId(id){');
  const confirmedEnd = script.indexOf('\nfunction confirmedObjects', confirmedStart);
  const battleStart = script.indexOf('function battleStatsFrom(battles,id){');
  const battleEnd = script.indexOf('\nfunction p2ContextText', battleStart);
  const p3Start = script.indexOf('const P3_RULE_ENGINE=');
  const p3End = script.indexOf('\nconst PERSONAL_AI_SCHEMA', p3Start);
  assert.ok(objectStart >= 0 && objectEnd > objectStart, 'real evidence statistics helper exists');
  assert.ok(confirmedStart >= 0 && confirmedEnd > confirmedStart, 'real confirmation helper exists');
  assert.ok(battleStart >= 0 && battleEnd > battleStart, 'real battle statistics helper exists');
  assert.ok(p3Start >= 0 && p3End > p3Start, 'real P3 rule engine exists');

  const sandbox = {
    state: { evidence: [
      { physical_object_id: 'hydrant-1', confidence: 0.80, time: '2026-10-01T00:00:00Z' }
    ] },
    P3_RULE_ENGINE_VERSION: 'simple-0.1'
  };
  const helpers = [
    script.slice(objectStart, objectEnd),
    script.slice(confirmedStart, confirmedEnd),
    script.slice(battleStart, battleEnd),
    script.slice(p3Start, p3End),
    'this.engine=P3_RULE_ENGINE;this.statsFor=battleStatsFrom;this.confirmed=isConfirmedId;this.objectStats=objectStatsById;'
  ].join('\n');
  vm.runInNewContext(helpers, sandbox);

  const contexts = [{ status: 'CONFIRMED', physical_object_id: 'hydrant-1' }];
  const candidates = [
    { name: 'Fire Hydrant', physical_object_id: 'hydrant-1' },
    { name: 'Street Sign', physical_object_id: 'sign-1' }
  ];
  const firstEncounter = [
    { actorPhysicalObjectId: 'other-monster', actorType: 'collected_monster', opponentPhysicalObjectId: 'hydrant-1', result: 'WIN' }
  ];

  assert.equal(sandbox.objectStats('hydrant-1').count, 1);
  assert.equal(sandbox.engine.evaluate({ contexts, battles: firstEncounter, candidates }).applied, false,
    'one observation is not enough to activate P3');

  sandbox.state.evidence.push(
    { physical_object_id: 'hydrant-1', confidence: 0.522, time: '2026-10-02T00:00:00Z' }
  );
  assert.equal(sandbox.confirmed('hydrant-1'), true,
    'a later low-confidence observation must not revoke earlier confirmation');
  assert.equal(sandbox.objectStats('hydrant-1').count, 2);
  assert.equal(sandbox.engine.evaluate({ contexts, battles: firstEncounter, candidates }).applied, false,
    're-observation alone does not activate P3 without a loss from our team');

  const afterOwnMonsterLoss = [
    ...firstEncounter,
    { actorPhysicalObjectId: 'hydrant-1', actorType: 'collected_monster', opponentPhysicalObjectId: 'sign-1', result: 'LOSE' }
  ];
  const decision = sandbox.engine.evaluate({ contexts, battles: afterOwnMonsterLoss, candidates });
  assert.equal(sandbox.statsFor(afterOwnMonsterLoss, 'hydrant-1').ownMonsterLosses, 1);
  assert.equal(decision.applied, true, 'P3 activates only after the same My AI object was lost from our team');
  assert.equal(decision.selected.physical_object_id, 'hydrant-1',
    'the re-observed physical identity is selected ahead of an unrelated Quest candidate');
});
