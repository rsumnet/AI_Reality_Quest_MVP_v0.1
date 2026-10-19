const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadModule() {
  const sandbox = { crypto: { randomUUID: () => 'uuid-' + Math.random().toString(36).slice(2) } };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync('core/storage-migrations.js', 'utf8'), sandbox, { filename: 'core/storage-migrations.js' });
  return sandbox.ARQStorageMigrations;
}
function fakeStore(initial) {
  const data = { ...initial };
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    dump() { return data; }
  };
}

test('quest objects saved as legacy strings are migrated to objects', () => {
  const store = fakeStore({ arq_quest_objects: JSON.stringify(['사물함', '소화전']) });
  const report = loadModule().migrate(store, '0.5.1');
  const parsed = JSON.parse(store.getItem('arq_quest_objects'));
  assert.deepEqual(parsed, [
    { name: '사물함', physical_object_id: null },
    { name: '소화전', physical_object_id: null }
  ]);
  assert.equal(report.changed, true);
});

test('invalid JSON in legacy keys does not crash and falls back to safe values', () => {
  const store = fakeStore({ arq_evidence: 'not-json', arq_quest_objects: '[{broken' });
  const report = loadModule().migrate(store, '0.5.1');
  assert.equal(store.getItem('arq_evidence'), '[]');
  assert.equal(store.getItem('arq_quest_objects'), '[]');
  assert.equal(report.changed, true);
});

test('evidence items receive a stable id and the current schema version', () => {
  const store = fakeStore({ arq_evidence: JSON.stringify([{ confidence: 0.8, time: '2026-01-01T00:00:00Z' }]) });
  const report = loadModule().migrate(store, '0.5.1');
  const evidence = JSON.parse(store.getItem('arq_evidence'));
  assert.equal(evidence.length, 1);
  assert.ok(evidence[0].id, 'legacy evidence without id gets one');
  assert.equal(evidence[0].schemaVersion, '0.5.1');
  assert.equal(report.evidence, 1);
});

test('legacy personal context schema version is normalized to the current version', () => {
  const store = fakeStore({ arq_personal_contexts: JSON.stringify([{ schemaVersion: '0.3.0', status: 'CONFIRMED', physical_object_id: 'x' }]) });
  loadModule().migrate(store, '0.5.1');
  const contexts = JSON.parse(store.getItem('arq_personal_contexts'));
  assert.equal(contexts[0].schemaVersion, '0.5.1');
  assert.equal(contexts[0].physical_object_id, 'x', 'data values remain intact');
});

test('legacy collected_monster pending state is preserved and migration is wired into the page', () => {
  const store = fakeStore({ arq_battle_pending: JSON.stringify({ actorType: 'collected_monster', actorId: 'm1', actorName: 'Fire Hydrant', opponent: { name: 'Street Sign', physical_object_id: 'x' } }) });
  loadModule().migrate(store, '0.5.1');
  assert.equal(JSON.parse(store.getItem('arq_battle_pending')).actorType, 'collected_monster', 'legacy pending is handled by the battle resolver');
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /core\/storage-migrations\.js/);
  assert.match(html, /ARQStorageMigrations\.migrate\(localStorage,ARQ_SCHEMA_VERSION\)/);
});

test('migration is idempotent for already-normal data', () => {
  const store = fakeStore({
    arq_quest_objects: JSON.stringify([{ name: '소화전', physical_object_id: 'p1' }]),
    arq_evidence: JSON.stringify([{ id: 'e1', schemaVersion: '0.5.1', confidence: 0.8 }])
  });
  const api = loadModule();
  api.migrate(store, '0.5.1');
  const first = JSON.stringify(store.dump());
  api.migrate(store, '0.5.1');
  assert.equal(JSON.stringify(store.dump()), first, 'second execution must not change stored values');
});

test('malformed battle pending and GPS values are normalized so state initialization cannot throw', () => {
  const store = fakeStore({ arq_battle_pending: '{broken', arq_gps: 'not-json' });
  const report = loadModule().migrate(store, '0.5.1');
  assert.equal(store.getItem('arq_battle_pending'), 'null');
  assert.equal(store.getItem('arq_gps'), 'null');
  assert.equal(report.battlePending, true);
  assert.equal(report.gps, true);
});
