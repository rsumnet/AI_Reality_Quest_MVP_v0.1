const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadRuntime() {
  const sandbox = { console };
  sandbox.window = sandbox;
  for (const path of ['games/game-registry.js', 'games/game-runtime.js']) {
    vm.runInNewContext(fs.readFileSync(path, 'utf8'), sandbox, { filename: path });
  }
  return sandbox;
}

test('registry normalizes optional metadata and keeps metadata immutable', () => {
  const sandbox = loadRuntime();
  sandbox.ARQGameRegistry.register({
    id: 'test-game',
    name: 'Test Game',
    description: 'Test',
    metadata: { apiVersion: 2, version: '2.1.0', difficulty: 'easy', tags: ['logic', '', 3, 'turn-based'] },
    renderControls() {}
  });
  const module = sandbox.ARQGameRegistry.get('test-game');
  assert.deepEqual(JSON.parse(JSON.stringify(module.metadata)), {
    apiVersion: 2, version: '2.1.0', difficulty: 'easy', tags: ['logic', 'turn-based']
  });
  assert.equal(Object.isFrozen(module.metadata), true);
  assert.equal(Object.isFrozen(module.metadata.tags), true);
});

test('registry rejects invalid IDs, duplicate IDs, and non-function resolveRound values', () => {
  const sandbox = loadRuntime();
  const base = { id: 'safe-id', name: 'Safe', renderControls() {} };
  assert.throws(() => sandbox.ARQGameRegistry.register({ ...base, id: 'bad id' }), /unsupported characters/);
  sandbox.ARQGameRegistry.register(base);
  assert.throws(() => sandbox.ARQGameRegistry.register({ ...base }), /Duplicate game module id/);
  assert.throws(() => sandbox.ARQGameRegistry.register({ id: 'bad-resolver', name: 'Bad', renderControls() {}, resolveRound: true }), /resolveRound must be a function/);
});

test('runtime catches render exceptions and clears partial controls', () => {
  const { ARQGameRuntime } = loadRuntime();
  const container = { innerHTML: 'partial UI' };
  const result = ARQGameRuntime.renderControls({
    id: 'broken-ui', name: 'Broken UI',
    renderControls() { throw new Error('render failure'); }
  }, container, () => {});
  assert.equal(result.ok, false);
  assert.match(result.message, /화면을 표시하지 못했습니다/);
  assert.equal(result.error.message, 'render failure');
  assert.equal(container.innerHTML, '');
});

test('runtime accepts normalized outcomes and copies serializable metadata', () => {
  const { ARQGameRuntime } = loadRuntime();
  const result = ARQGameRuntime.resolveRound({
    id: 'ok', name: 'OK',
    resolveRound() { return { result: 'WIN', playerAction: 7, opponentAction: 'AI', metadata: { round: 1 } }; }
  }, 'go', {});
  assert.equal(result.ok, true);
  assert.equal(result.outcome.result, 'WIN');
  assert.equal(result.outcome.playerAction, '7');
  assert.deepEqual(JSON.parse(JSON.stringify(result.outcome.metadata)), { round: 1 });
});

test('runtime rejects invalid outcomes, promise outcomes, and unsafe metadata', () => {
  const { ARQGameRuntime } = loadRuntime();
  assert.equal(ARQGameRuntime.validateOutcome({ result: 'MAYBE' }).ok, false);
  assert.equal(ARQGameRuntime.validateOutcome({ result: 'WIN', metadata: [] }).ok, false);
  const circular = {}; circular.self = circular;
  assert.equal(ARQGameRuntime.validateOutcome({ result: 'WIN', metadata: circular }).ok, false);
  assert.equal(ARQGameRuntime.resolveRound({ id: 'promise', name: 'Promise', resolveRound: () => Promise.resolve({ result: 'WIN' }) }, 'go', {}).ok, false);
});

test('runtime catches resolveRound exceptions and rejects unsupported result contracts', () => {
  const { ARQGameRuntime } = loadRuntime();
  const thrown = ARQGameRuntime.resolveRound({ id: 'thrower', name: 'Thrower', resolveRound() { throw new Error('resolve failure'); } }, 'go', {});
  assert.equal(thrown.ok, false);
  assert.equal(thrown.error.message, 'resolve failure');
  assert.equal(ARQGameRuntime.resolveRound({ id: 'missing', name: 'Missing' }, 'go', {}).ok, false);
});
