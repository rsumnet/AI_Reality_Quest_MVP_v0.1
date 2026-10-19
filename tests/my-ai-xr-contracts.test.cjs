const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadContracts() {
  const errors = [];
  const sandbox = { console: { error: (...args) => errors.push(args) } };
  sandbox.window = sandbox;
  for (const path of ['core/my-ai-runtime.js', 'core/xr-bridge.js']) {
    vm.runInNewContext(fs.readFileSync(path, 'utf8'), sandbox, { filename: path });
  }
  return { ...sandbox, errors };
}

test('My AI context package contains only confirmed personal contexts and minimized evidence', () => {
  const { ARQMyAIRuntime } = loadContracts();
  const context = ARQMyAIRuntime.buildContextPackage({
    question: 'What should I explore next?',
    sqResults: [{ instrument: 'SQ', score: 7 }],
    personalContexts: [
      { id: 'confirmed', status: 'CONFIRMED', purpose: 'learn', history: ['approved'] },
      { id: 'pending', status: 'PENDING', purpose: 'not approved' }
    ],
    evidence: [{
      id: 'e1', ai_label: 'book', confidence: 0.9, time: '2026-10-19T00:00:00Z',
      zone: 'Z12', source: 'camera', processing: 'local', physical_object_id: 'p1',
      location: { gps: { lat: 1, lon: 2 } }, rawImage: 'large-image-data'
    }]
  });
  assert.equal(context.schemaVersion, 'arq-my-ai-context/0.1');
  assert.equal(context.personalContexts.length, 1);
  assert.equal(context.personalContexts[0].id, 'confirmed');
  assert.equal(context.evidence[0].object, 'book');
  assert.equal(context.evidence[0].physical_object_id, 'p1');
  assert.equal('location' in context.evidence[0], false);
  assert.equal('rawImage' in context.evidence[0], false);
  assert.equal(context.sqResults[0].score, 7);
});

test('My AI runtime only registers explicit local providers and rejects duplicates', () => {
  const { ARQMyAIRuntime } = loadContracts();
  assert.throws(() => ARQMyAIRuntime.register({ id: 'remote', name: 'Remote', local: false, run() {} }), /only explicitly local/);
  assert.throws(() => ARQMyAIRuntime.register({ id: 'missing-run', name: 'Missing', local: true }), /run\(request\) is required/);
  ARQMyAIRuntime.register({ id: 'local', name: 'Local', local: true, run: () => 'ok' });
  assert.throws(() => ARQMyAIRuntime.register({ id: 'local', name: 'Duplicate', local: true, run: () => 'ok' }), /Duplicate My AI provider/);
  assert.deepEqual(JSON.parse(JSON.stringify(ARQMyAIRuntime.list())), [{ id: 'local', name: 'Local', local: true, model: 'unspecified' }]);
});

test('My AI runtime invokes the selected local provider with a copied context package', async () => {
  const { ARQMyAIRuntime } = loadContracts();
  let received;
  ARQMyAIRuntime.register({ id: 'local', name: 'Local Model', local: true, model: 'local-model', run: async request => { received = request; return { answer: 'explore the park' }; } });
  const source = { schemaVersion: 'arq-my-ai-context/0.1', question: 'next?', personalContexts: [], evidence: [] };
  const result = await ARQMyAIRuntime.run('local', source);
  assert.equal(result.ok, true);
  assert.equal(result.provider.local, true);
  assert.deepEqual(JSON.parse(JSON.stringify(result.result)), { answer: 'explore the park' });
  assert.notEqual(received, source);
});

test('My AI runtime handles missing, unavailable, and failing local providers', async () => {
  const { ARQMyAIRuntime } = loadContracts();
  assert.equal((await ARQMyAIRuntime.run('missing', {})).ok, false);
  ARQMyAIRuntime.register({ id: 'sleeping', name: 'Sleeping', local: true, isAvailable: () => false, run: () => 'should not run' });
  assert.match((await ARQMyAIRuntime.run('sleeping', {})).message, /사용할 수 없습니다/);
  ARQMyAIRuntime.register({ id: 'broken', name: 'Broken', local: true, run: () => { throw new Error('model failure'); } });
  const result = await ARQMyAIRuntime.run('broken', {});
  assert.equal(result.ok, false);
  assert.equal(result.error.message, 'model failure');
});

test('XR bridge publishes versioned in-memory events to subscribers', () => {
  const { ARQXRBridge } = loadContracts();
  const received = [];
  const unsubscribe = ARQXRBridge.subscribe('reality.evidence.created', event => received.push(event));
  const event = ARQXRBridge.publish('reality.evidence.created', { evidenceId: 'e1', physicalObjectId: 'p1' });
  assert.equal(event.schemaVersion, 'arq-xr-event/0.1');
  assert.equal(received.length, 1);
  assert.equal(received[0].payload.evidenceId, 'e1');
  unsubscribe();
  ARQXRBridge.publish('reality.evidence.created', { evidenceId: 'e2' });
  assert.equal(received.length, 1);
});

test('XR bridge validates event types and JSON-object payloads', () => {
  const { ARQXRBridge } = loadContracts();
  assert.throws(() => ARQXRBridge.subscribe('bad type', () => {}), /event type is invalid/);
  assert.throws(() => ARQXRBridge.publish('reality.evidence.created', []), /payload must be an object/);
  const circular = {}; circular.self = circular;
  assert.throws(() => ARQXRBridge.publish('reality.evidence.created', circular), /JSON serializable/);
});

test('XR bridge isolates subscriber failures so other subscribers still receive events', () => {
  const { ARQXRBridge, errors } = loadContracts();
  let called = false;
  ARQXRBridge.subscribe('quest.state.changed', () => { throw new Error('subscriber failed'); });
  ARQXRBridge.subscribe('quest.state.changed', () => { called = true; });
  ARQXRBridge.publish('quest.state.changed', { state: 'complete' });
  assert.equal(called, true);
  assert.equal(errors.length, 1);
});
