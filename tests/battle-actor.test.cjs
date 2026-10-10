const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inlineScript, 'inline application script exists');
new vm.Script(inlineScript[1], { filename: 'index.html inline script' });

test('visible app version, document title, and evidence schema version agree', () => {
  assert.match(html, /<title>AI Reality Quest — MVP v0\.4\.6<\/title>/);
  assert.match(html, /MVP v0\.4\.6 · Browser \/ On-device inference/);
  assert.match(inlineScript[1], /const ARQ_SCHEMA_VERSION='0\.4\.6';/);
  assert.doesNotMatch(html, /v0\.4\.[0-5](?:\D|$)/);
});

const helperMatch = inlineScript[1].match(/function resolveBattleActor\(monsters,pending\)\{[\s\S]*?\n\}/);
assert.ok(helperMatch, 'battle actor resolver exists');
const sandbox = {};
vm.runInNewContext(helperMatch[0] + '\nthis.resolveBattleActor = resolveBattleActor;', sandbox);
const resolveBattleActor = sandbox.resolveBattleActor;
const monsterA = { id: 'a', name: 'A' };
const monsterB = { id: 'b', name: 'B' };
const opponent = { name: 'Cancola', physical_object_id: 'opponent-1' };

test('new battle chooses a collected monster when the team has one', () => {
  const result = resolveBattleActor([monsterA], null);
  assert.equal(result.actorType, 'collected_monster');
  assert.deepEqual(result.candidates.map(m => m.id), ['a']);
  assert.equal(result.pending, null);
});

test('customer pending state cannot bypass a monster still in the team', () => {
  const result = resolveBattleActor([monsterA, monsterB], {
    actorType: 'customer', actorId: null, opponent
  });
  assert.equal(result.actorType, 'collected_monster');
  assert.equal(result.pending.actorType, 'monster');
  assert.equal(result.pending.opponent.name, 'Cancola');
  assert.equal(result.pending.actorId, null);
  assert.equal(result.resumed, true);
});

test('a valid pending monster continues the same battle', () => {
  const pending = { actorType: 'monster', actorId: 'b', opponent };
  const result = resolveBattleActor([monsterA, monsterB], pending);
  assert.equal(result.actor, monsterB);
  assert.equal(result.actorType, 'collected_monster');
  assert.equal(result.pending, pending);
  assert.equal(result.resumed, true);
});

test('stale monster ID selects another available monster and preserves opponent', () => {
  const result = resolveBattleActor([monsterA], {
    actorType: 'monster', actorId: 'missing', opponent
  });
  assert.equal(result.actorType, 'collected_monster');
  assert.equal(result.pending.actorType, 'monster');
  assert.equal(result.pending.opponent.name, 'Cancola');
  assert.equal(result.pending.actorId, null);
});

test('customer continues an existing battle only when the team is empty', () => {
  const result = resolveBattleActor([], {
    actorType: 'customer', actorId: null, opponent
  });
  assert.equal(result.actorType, 'customer');
  assert.equal(result.pending.actorType, 'customer');
  assert.equal(result.pending.opponent.name, 'Cancola');
  assert.equal(result.resumed, true);
});

test('if a pending monster disappeared and the team is empty, customer inherits that battle', () => {
  const result = resolveBattleActor([], {
    actorType: 'monster', actorId: 'missing', opponent
  });
  assert.equal(result.actorType, 'customer');
  assert.equal(result.pending.actorType, 'customer');
  assert.equal(result.pending.opponent.name, 'Cancola');
});

test('a new battle with no team monster is assigned to the customer', () => {
  const result = resolveBattleActor([], null);
  assert.equal(result.actorType, 'customer');
  assert.equal(result.pending, null);
});

test('invalid null entries cannot hide a valid team monster', () => {
  const result = resolveBattleActor([null, monsterA], null);
  assert.equal(result.actorType, 'collected_monster');
  assert.deepEqual(result.candidates.map(m => m.id), ['a']);
});

test('battle flow uses the tested resolver', () => {
  assert.match(inlineScript[1], /resolveBattleActor\(state\.monsters,state\.battlePending\)/);
  assert.match(inlineScript[1], /state\.battlePending=pending/);
});

test('battle integration never sends the customer out while a team monster remains and resumes the same monster after a draw', () => {
  const battleMatch = inlineScript[1].match(/function battle\(choice\)\{[\s\S]*?\n\}/);
  assert.ok(battleMatch, 'battle function exists');
  const teamMonsterA = { id: 'team-1', name: 'Team Monster A', object: 'Team Monster A' };
  const teamMonsterB = { id: 'team-2', name: 'Team Monster B', object: 'Team Monster B' };
  const state = {
    questObjects: [
      { name: 'Quest A', physical_object_id: 'qa' },
      { name: 'Quest B', physical_object_id: 'qb' },
      { name: 'Quest C', physical_object_id: 'qc' }
    ],
    battlePending: {
      actorType: 'customer', actorId: null, actorName: '고객', opponent
    },
    monsters: [teamMonsterA, teamMonsterB],
    battleUnlocked: true,
    battles: []
  };
  const battleResultElement = { textContent: '', innerHTML: '' };
  let randomValue = 0;
  const sandbox = {
    state,
    resolveBattleActor,
    $: () => battleResultElement,
    playerNick: () => '고객',
    p3SelectOpponent: () => ({ opponent, decision: { applied: false, reason: 'test' } }),
    P3_RULE_ENGINE_VERSION: 'simple-0.1',
    labels: { rock: 'rock', paper: 'paper', scissors: 'scissors' },
    beats: { rock: 'scissors', paper: 'rock', scissors: 'paper' },
    rpsResult: (a, b) => a === b ? 'DRAW' : ({ rock: 'scissors', paper: 'rock', scissors: 'paper' })[a] === b ? 'WIN' : 'LOSE',
    esc: String,
    Math: { random: () => randomValue, floor: Math.floor },
    makeCollectedMonster: target => ({ id: 'captured', name: target.name, physical_object_id: target.physical_object_id }),
    save: () => {},
    render: () => {},
    toast: () => {}
  };
  vm.runInNewContext(battleMatch[0] + '\nthis.battle = battle;', sandbox);

  sandbox.battle('rock'); // rock vs rock => DRAW
  assert.equal(state.battles[0].actor, 'Team Monster A');
  assert.equal(state.battles[0].actorType, 'collected_monster');
  assert.equal(state.battlePending.actorId, 'team-1');

  randomValue = 0.99; // If pending identity is lost, this would select Monster B.
  sandbox.battle('rock'); // rock beats scissors => WIN
  assert.equal(state.battles[1].actor, 'Team Monster A');
  assert.equal(state.battles[1].actorType, 'collected_monster');
  assert.notEqual(state.battles[1].actor, '고객');
  assert.ok(state.monsters.some(m => m.id === 'team-2'), 'the other team monster remains available');
});

test('legacy collected_monster pending state resumes its exact actor', () => {
  const result = resolveBattleActor([monsterA, monsterB], {
    actorType: 'collected_monster', actorId: 'b', opponent
  });
  assert.equal(result.actor, monsterB);
  assert.equal(result.actorType, 'collected_monster');
  assert.equal(result.pending.actorType, 'collected_monster');
});


test('confirmed object status is monotonic after an evidence prefix reaches 75%', () => {
  const fn = inlineScript[1].match(/function isConfirmedId\(id\)\{[^\n]*\}/);
  assert.ok(fn, 'sticky confirmation resolver exists');
  const sandbox = { state: { evidence: [
    { physical_object_id: 'stable', confidence: 0.80, time: '2026-01-01T00:00:00Z' },
    { physical_object_id: 'stable', confidence: 0.522, time: '2026-01-02T00:00:00Z' },
    { physical_object_id: 'not-yet', confidence: 0.60, time: '2026-01-01T00:00:00Z' },
    { physical_object_id: 'not-yet', confidence: 0.70, time: '2026-01-02T00:00:00Z' }
  ] } };
  vm.runInNewContext(fn[0] + '\nthis.isConfirmedId = isConfirmedId;', sandbox);
  assert.equal(sandbox.isConfirmedId('stable'), true, 'later 52.2% observation cannot revoke earlier confirmation');
  assert.equal(sandbox.isConfirmedId('not-yet'), false, 'an object that never reached the threshold stays unconfirmed');
});

test('P3 does not intervene on a first encounter and requires a prior loss for that exact context object', () => {
  const start = inlineScript[1].indexOf('const P3_RULE_ENGINE=');
  const end = inlineScript[1].indexOf(';\nconst PERSONAL_AI_SCHEMA', start);
  assert.ok(start >= 0 && end > start, 'P3 engine definition exists');
  const definition = inlineScript[1].slice(start, end + 1);
  const sandbox = {
    objectStatsById: () => ({ count: 3, avg: 0.9, best: 0.95 }),
    isConfirmedId: () => true,
    battleStatsFrom: (battles, id) => {
      const matches = battles.filter(b => b.opponentPhysicalObjectId === id);
      return { missed: matches.filter(b => b.result === 'LOSE').length, collected: matches.filter(b => b.result === 'WIN').length, encounters: matches.length };
    }
  };
  vm.runInNewContext(definition + '\nthis.P3_RULE_ENGINE = P3_RULE_ENGINE;', sandbox);
  const context = { status: 'CONFIRMED', physical_object_id: 'object-A' };
  const candidate = { name: 'Object A', physical_object_id: 'object-A' };
  const first = sandbox.P3_RULE_ENGINE.evaluate({ contexts: [context], battles: [], candidates: [candidate] });
  assert.equal(first.applied, false, 'no prior loss means P3 must not intervene');
  const afterLoss = sandbox.P3_RULE_ENGINE.evaluate({
    contexts: [context],
    battles: [{ opponentPhysicalObjectId: 'object-A', result: 'LOSE' }],
    candidates: [candidate]
  });
  assert.equal(afterLoss.applied, true, 'the previously missed context object becomes eligible on a later Quest');
  assert.equal(afterLoss.selected.physical_object_id, 'object-A');
});

test('Quest prompt changes automatically when the third confirmed object is added', () => {
  assert.match(inlineScript[1], /게임 재료를 다 모았네요\. 가위바위보 중에 하나를 고르세요\./);
  assert.match(inlineScript[1], /state\.questObjects\.length>=3&&\$\('battleResult'\)\.textContent==='아직 3개 객체를 모으지 않았습니다\.'/);
});

test('win and loss messages identify both monsters and the collection change', () => {
  assert.match(inlineScript[1], /\$\{esc\(actorName\)\}가 \$\{esc\(opponent\.name\)\}을 이겨서 Monster Collection에 \$\{esc\(opponent\.name\)\}를 수집하였습니다/);
  assert.match(inlineScript[1], /\$\{esc\(actorName\)\}가 \$\{esc\(opponent\.name\)\}에게 져서 Monster Collection에서 \$\{esc\(actorName\)\}이 사라졌습니다/);
});
