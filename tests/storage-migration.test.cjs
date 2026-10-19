const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const migrationSource = fs.readFileSync('core/storage-migration.js', 'utf8');

function makeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    dump() { return Object.fromEntries(data); }
  };
}
function loadMigration(storage) {
  const sandbox = {};
  vm.runInNewContext(migrationSource, sandbox, { filename: 'core/storage-migration.js' });
  return sandbox.ARQStorageMigration.migrate(storage);
}

test('v0.5.1 title, badge, app schema and storage schema agree', () => {
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script, 'inline application script exists');
  assert.match(html, /<title>AI Reality Quest — MVP v0\.5\.1<\/title>/);
  assert.match(html, /MVP v0\.5\.1 · Browser \/ On-device inference/);
  assert.match(script[1], /const ARQ_SCHEMA_VERSION='0\.5\.1';/);
  assert.match(html, /core\/storage-migration\.js/);
  assert.match(script[1], /arq_schema_version/);
});

test('migration preserves existing evidence, monsters, battles and Personal Context while adding a schema marker', () => {
  const storage = makeStorage({
    arq_evidence: JSON.stringify([{ id: 'e1', physical_object_id: 'object-1', confidence: 0.91 }]),
    arq_monsters: JSON.stringify([{ id: 'm1', physical_object_id: 'object-1' }]),
    arq_battles: JSON.stringify([{ id: 'b1', result: 'WIN', actorPhysicalObjectId: 'object-1' }]),
    arq_personal_contexts: JSON.stringify([{ id: 'c1', physical_object_id: 'object-1', status: 'CONFIRMED' }]),
    arq_quest_objects: JSON.stringify([{ name: 'Object 1', physical_object_id: 'object-1' }]),
    arq_zone: 'Z12'
  });
  const migrated = loadMigration(storage);
  assert.equal(migrated.migrated, true);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.evidence)), [{ id: 'e1', physical_object_id: 'object-1', confidence: 0.91 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.monsters)), [{ id: 'm1', physical_object_id: 'object-1' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.battles)), [{ id: 'b1', result: 'WIN', actorPhysicalObjectId: 'object-1' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.personalContexts)), [{ id: 'c1', physical_object_id: 'object-1', status: 'CONFIRMED' }]);
  assert.equal(storage.getItem('arq_schema_version'), '0.5.1');
});

test('legacy string Quest objects are normalized without losing their names', () => {
  const storage = makeStorage({
    arq_quest_objects: JSON.stringify(['Fire Hydrant', 'Street Sign', 'Chair'])
  });
  const migrated = loadMigration(storage);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.questObjects)), [
    { name: 'Fire Hydrant', physical_object_id: null },
    { name: 'Street Sign', physical_object_id: null },
    { name: 'Chair', physical_object_id: null }
  ]);
  assert.deepEqual(JSON.parse(storage.getItem('arq_quest_objects')), JSON.parse(JSON.stringify(migrated.questObjects)));
});

test('migration is idempotent after the current schema marker is written', () => {
  const storage = makeStorage({
    arq_schema_version: '0.5.1',
    arq_evidence: JSON.stringify([{ id: 'e1' }]),
    arq_quest_objects: JSON.stringify([{ name: 'Chair', physical_object_id: 'chair-1' }])
  });
  const first = loadMigration(storage);
  const snapshot = storage.dump();
  const second = loadMigration(storage);
  assert.equal(first.migrated, false);
  assert.equal(second.migrated, false);
  assert.equal(second.warnings.length, 0);
  assert.deepEqual(storage.dump(), snapshot);
});

test('malformed saved JSON is reported and left untouched rather than overwritten during migration', () => {
  const storage = makeStorage({
    arq_schema_version: '0.5.0',
    arq_evidence: '{bad json',
    arq_monsters: JSON.stringify([{ id: 'm1' }])
  });
  const migrated = loadMigration(storage);
  assert.ok(migrated.warnings.includes('arq_evidence'));
  assert.equal(storage.getItem('arq_evidence'), '{bad json');
  assert.notEqual(storage.getItem('arq_schema_version'), '0.5.1');
  assert.deepEqual(JSON.parse(storage.getItem('arq_monsters')), [{ id: 'm1' }]);
});

test('unexpected saved data types are reported and preserved rather than overwritten', () => {
  const originalEvidence = JSON.stringify({ unexpected: true });
  const originalBattles = JSON.stringify(null);
  const storage = makeStorage({
    arq_schema_version: '0.4.8',
    arq_evidence: originalEvidence,
    arq_battles: originalBattles
  });
  const migrated = loadMigration(storage);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.evidence)), []);
  assert.deepEqual(JSON.parse(JSON.stringify(migrated.battles)), []);
  assert.ok(migrated.warnings.includes('arq_evidence'));
  assert.ok(migrated.warnings.includes('arq_battles'));
  assert.equal(storage.getItem('arq_evidence'), originalEvidence);
  assert.equal(storage.getItem('arq_battles'), originalBattles);
  assert.notEqual(storage.getItem('arq_schema_version'), '0.5.1');
});

test('the host saves the active schema version with normal persisted state', () => {
  const script = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script);
  assert.match(script[1], /localStorage\.setItem\('arq_schema_version',ARQ_SCHEMA_VERSION\)/);
  assert.match(script[1], /const storageMigration=ARQStorageMigration\.migrate\(localStorage\)/);
});
