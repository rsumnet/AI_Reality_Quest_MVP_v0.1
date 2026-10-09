const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inlineScript, 'inline application script exists');
new vm.Script(inlineScript[1], { filename: 'index.html inline script' });

test('visible app version, document title, and evidence schema version agree', () => {
  assert.match(html, /<title>AI Reality Quest — MVP v0\.4\.5<\/title>/);
  assert.match(html, /MVP v0\.4\.5 · Browser \/ On-device inference/);
  assert.match(inlineScript[1], /const ARQ_SCHEMA_VERSION='0\.4\.5';/);
  assert.doesNotMatch(html, /v0\.4\.[0-4](?:\D|$)/);
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

test('battle integration never sends the customer out while a team monster remains', () => {
  const battleMatch = inlineScript[1].match(/function battle\(choice\)\{[\s\S]*?\n\}/);
  assert.ok(battleMatch, 'battle function exists');
  const state = {
    questObjects: [
      { name: 'Quest A', physical_object_id: 'qa' },
      { name: 'Quest B', physical_object_id: 'qb' },
      { name: 'Quest C', physical_object_id: 'qc' }
    ],
    battlePending: {
      actorType: 'customer', actorId: null, actorName: '고객', opponent
    },
    monsters: [{ id: 'team-1', name: 'Team Monster', object: 'Team Monster' }],
    battleUnlocked: true,
    battles: []
  };
  const battleResultElement = { textContent: '', innerHTML: '' };
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
    Math: { random: () => 0 },
    save: () => {},
    render: () => {},
    toast: () => {}
  };
  vm.runInNewContext(battleMatch[0] + '\nthis.battle = battle;', sandbox);
  sandbox.battle('rock');
  assert.equal(state.battles.length, 1);
  assert.equal(state.battles[0].actor, 'Team Monster');
  assert.equal(state.battles[0].actorType, 'collected_monster');
  assert.equal(state.battlePending.actorType, 'monster');
  assert.equal(state.battlePending.actorId, 'team-1');
});
