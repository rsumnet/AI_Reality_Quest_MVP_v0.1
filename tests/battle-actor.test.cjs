const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inlineScript, 'inline application script exists');
new vm.Script(inlineScript[1], { filename: 'index.html inline script' });

test('visible app version, document title, and evidence schema version agree', () => {
  assert.match(html, /<title>AI Reality Quest — MVP v0\.4\.7<\/title>/);
  assert.match(html, /MVP v0\.4\.7 · Browser \/ On-device inference/);
  assert.match(inlineScript[1], /const ARQ_SCHEMA_VERSION='0\.4\.7';/);
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
  const outcomeMatch = inlineScript[1].match(/function handleGameOutcome\(\{[\s\S]*?\n\}/);
  const battleMatch = inlineScript[1].match(/function battle\(choice\)\{[\s\S]*?\n\}/);
  assert.ok(outcomeMatch, 'shared Quest outcome handler exists');
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
    selectedGame: () => ({ id: 'rps', name: '가위바위보', resolveRound: (a, { random }) => {
      const b = ['rock', 'paper', 'scissors'][Math.floor(random() * 3)];
      return { result: a === b ? 'DRAW' : ({ rock: 'scissors', paper: 'rock', scissors: 'paper' })[a] === b ? 'WIN' : 'LOSE', playerAction: a, opponentAction: b };
    } }),
    P3_RULE_ENGINE_VERSION: 'simple-0.1',
    esc: String,
    Math: { random: () => randomValue, floor: Math.floor },
    makeCollectedMonster: target => ({ id: 'captured', name: target.name, physical_object_id: target.physical_object_id }),
    save: () => {},
    render: () => {},
    toast: () => {}
  };
  vm.runInNewContext(outcomeMatch[0] + '\n' + battleMatch[0] + '\nthis.battle = battle;', sandbox);

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
  const script = inlineScript[1];
  const start = script.indexOf('function isConfirmedId(id){');
  const end = script.indexOf('\nfunction confirmedObjects', start);
  assert.ok(start >= 0 && end > start, 'sticky confirmation resolver exists');
  const fn = script.slice(start, end);
  const sandbox = { state: { evidence: [
    { physical_object_id: 'stable', confidence: 0.80, time: '2026-01-01T00:00:00Z' },
    { physical_object_id: 'stable', confidence: 0.522, time: '2026-01-02T00:00:00Z' },
    { physical_object_id: 'not-yet', confidence: 0.60, time: '2026-01-01T00:00:00Z' },
    { physical_object_id: 'not-yet', confidence: 0.70, time: '2026-01-02T00:00:00Z' }
  ] } };
  vm.runInNewContext(fn + '\nthis.isConfirmedId = isConfirmedId;', sandbox);
  assert.equal(sandbox.isConfirmedId('stable'), true, 'later 52.2% observation cannot revoke earlier confirmation');
  assert.equal(sandbox.isConfirmedId('not-yet'), false, 'an object that never reached the threshold stays unconfirmed');
});

test('P3 does not intervene on a first encounter and requires losing the same collected Monster', () => {
  const script = inlineScript[1];
  const start = script.indexOf('const P3_RULE_ENGINE=');
  const end = script.indexOf('\nconst PERSONAL_AI_SCHEMA', start);
  assert.ok(start >= 0 && end > start, 'P3 engine definition exists');
  const definition = script.slice(start, end).trim();
  const sandbox = {
    P3_RULE_ENGINE_VERSION: 'simple-0.1',
    objectStatsById: () => ({ count: 3, avg: 0.9, best: 0.95 }),
    isConfirmedId: () => true,
    battleStatsFrom: (battles, id) => {
      const matches = battles.filter(b => b.opponentPhysicalObjectId === id);
      return {
        missed: matches.filter(b => b.result === 'LOSE').length,
        collected: matches.filter(b => b.result === 'WIN').length,
        encounters: matches.length,
        ownMonsterLosses: battles.filter(x => x.actorPhysicalObjectId === id && x.actorType === 'collected_monster' && x.result === 'LOSE').length
      };
    }
  };
  vm.runInNewContext(definition + '\nthis.P3_RULE_ENGINE = P3_RULE_ENGINE;', sandbox);
  const context = { status: 'CONFIRMED', physical_object_id: 'object-A' };
  const candidate = { name: 'Object A', physical_object_id: 'object-A' };
  const first = sandbox.P3_RULE_ENGINE.evaluate({ contexts: [context], battles: [
    { opponentPhysicalObjectId: 'object-A', actorPhysicalObjectId: 'object-B', actorType: 'collected_monster', result: 'WIN' }
  ], candidates: [candidate] });
  assert.equal(first.applied, false, 'winning and capturing the object the first time must not trigger P3');
  const afterLoss = sandbox.P3_RULE_ENGINE.evaluate({
    contexts: [context],
    battles: [{ actorPhysicalObjectId: 'object-A', actorType: 'collected_monster', opponentPhysicalObjectId: 'object-B', result: 'LOSE' }],
    candidates: [candidate]
  });
  assert.equal(afterLoss.applied, true, 'P3 becomes eligible only after this context Monster is lost from our team');
  assert.equal(afterLoss.selected.physical_object_id, 'object-A');
});

test('Quest prompt changes automatically when the third confirmed object is added', () => {
  assert.ok(inlineScript[1].includes('게임 재료를 다 모았네요. 가위바위보 중에 하나를 고르세요.'));
  assert.ok(inlineScript[1].includes("state.questObjects.length>=3&&$('battleResult').textContent==='아직 3개 객체를 모으지 않았습니다.'"));
});

test('win and loss messages identify both monsters and the collection change', () => {
  assert.ok(inlineScript[1].includes('${esc(actorName)}가 ${esc(opponent.name)}을 이겨서 Monster Collection에 ${esc(opponent.name)}를 수집하였습니다.'));
  assert.ok(inlineScript[1].includes('${esc(actorName)}가 ${esc(opponent.name)}에게 져서 Monster Collection에서 ${esc(actorName)}이 사라졌습니다.'));
});

test('battle records the physical identity of our Monster so a later loss can trigger P3 on re-scan', () => {
  assert.ok(inlineScript[1].includes('actorPhysicalObjectId:actor?.physical_object_id||null'));
  assert.ok(inlineScript[1].includes("b.actorPhysicalObjectId===id&&b.actorType==='collected_monster'&&b.result==='LOSE'"));
  assert.ok(inlineScript[1].includes('x.battleStats.ownMonsterLosses>0'));
});

test('a loss of our collected My AI Monster is counted as one missed/lost event', () => {
  const start = inlineScript[1].indexOf('function battleStatsFrom(battles,id){');
  const end = inlineScript[1].indexOf('\nfunction p2ContextText', start);
  assert.ok(start >= 0 && end > start, 'battle stats function exists');
  const sandbox = {};
  vm.runInNewContext(inlineScript[1].slice(start, end) + '\nthis.battleStatsFrom=battleStatsFrom;', sandbox);
  const stats = sandbox.battleStatsFrom([
    { actorPhysicalObjectId: 'my-ai-object', actorType: 'collected_monster', result: 'LOSE', opponentPhysicalObjectId: 'other' }
  ], 'my-ai-object');
  assert.equal(stats.ownMonsterLosses, 1);
  assert.equal(stats.missed, 1, 'loss from our collection must also be visible as one missed/lost event');
  assert.equal(stats.opponentMisses, 0, 'the own-Monster loss remains distinguishable from failing to capture an opponent');
});

test('battle records the lost My AI object identity and a readable missed/lost event', () => {
  assert.match(inlineScript[1], /actorPhysicalObjectId:actor\?\.physical_object_id\|\|null/);
  assert.match(inlineScript[1], /rec\.missed=actorName\+' MONSTER';rec\.lostFromCollection=\{monsterId:actor\.id,physical_object_id:actor\.physical_object_id\|\|null,name:actorName\}/);
  assert.match(inlineScript[1], /if\(b\.actorPhysicalObjectId===id&&b\.actorType==='collected_monster'&&b\.result==='LOSE'\)\{ownMonsterLosses\+\+;missed\+\+;\}/);
});

test('Quest games are loaded from replaceable modules rather than hard-coded RPS buttons', () => {
  assert.match(html, /games\/game-registry\.js/);
  assert.match(html, /games\/rps\.js/);
  assert.match(html, /games\/odd-even\.js/);
  assert.match(html, /id="gameSelector"/);
  assert.match(html, /game\.renderControls\(\$\('gameControls'\),action=>battle\(action\)/);
  assert.match(inlineScript[1], /game\.resolveRound\(choice,\{actor,actorType,opponent,quest,random:Math\.random\}\)/);
});

test('losing the first collected My AI Monster persists its identity and increments missed exactly once', () => {
  const handler = inlineScript[1].match(/function handleGameOutcome\(\{[\s\S]*?\n\}/);
  const stats = inlineScript[1].match(/function battleStatsFrom\(battles,id\)\{[\s\S]*?\n\}/);
  assert.ok(handler && stats, 'shared outcome and stats handlers exist');
  const actor = { id: 'monster-1', name: 'Fire Hydrant', object: 'Fire Hydrant', physical_object_id: 'my-ai-fire-hydrant' };
  const opponent = { name: 'Street Sign', physical_object_id: 'quest-street-sign' };
  const resultElement = { innerHTML: '', textContent: '' };
  const state = { monsters: [actor], battles: [], questObjects: [{}, {}, {}], battlePending: null };
  const sandbox = {
    state, playerNick: () => 'Customer', esc: String, $: () => resultElement,
    makeCollectedMonster: () => ({}), save: () => {}, render: () => {}, toast: () => {},
    Math: { floor: Math.floor, random: () => 0 }
  };
  vm.runInNewContext(handler[0] + '\n' + stats[0] + '\nthis.handleGameOutcome=handleGameOutcome;this.battleStatsFrom=battleStatsFrom;', sandbox);
  sandbox.handleGameOutcome({
    choice: 'rock', game: { id: 'rps', name: '가위바위보' }, actor, actorType: 'collected_monster', opponent,
    p3Info: { applied: false, engine: 'simple-0.1', reason: 'test' },
    quest: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
    gameOutcome: { result: 'LOSE', playerAction: '바위', opponentAction: '보' }
  });
  assert.equal(state.monsters.length, 0, 'lost Monster is removed from collection');
  assert.equal(state.battles.length, 1, 'loss is persisted to Battle History');
  assert.equal(state.battles[0].actorPhysicalObjectId, 'my-ai-fire-hydrant');
  assert.equal(state.battles[0].missed, 'Fire Hydrant MONSTER');
  assert.equal(state.battles[0].lostFromCollection.physical_object_id, 'my-ai-fire-hydrant');
  const totals = sandbox.battleStatsFrom(state.battles, 'my-ai-fire-hydrant');
  assert.equal(totals.ownMonsterLosses, 1);
  assert.equal(totals.missed, 1);
});
