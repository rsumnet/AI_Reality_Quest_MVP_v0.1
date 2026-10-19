(function(root){
  'use strict';
  const VERSION = '0.5.1';
  const ARRAY_KEYS = {
    personalContexts: 'arq_personal_contexts',
    evidence: 'arq_evidence',
    monsters: 'arq_monsters',
    battles: 'arq_battles',
    attempts: 'arq_attempts',
    questObjects: 'arq_quest_objects'
  };
  const JSON_KEYS = {
    gps: 'arq_gps',
    battlePending: 'arq_battle_pending'
  };
  function readJSON(storage, key, fallback, warnings) {
    let raw;
    try { raw = storage.getItem(key); } catch (error) {
      warnings.push(key);
      return { value: fallback, valid: false, present: false };
    }
    if (raw === null || raw === '') return { value: fallback, valid: true, present: false };
    try { return { value: JSON.parse(raw), valid: true, present: true }; }
    catch (error) { warnings.push(key); return { value: fallback, valid: false, present: true }; }
  }
  function asArray(value) { return Array.isArray(value) ? value : []; }
  function sameJSON(a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch (_) { return false; }
  }
  function migrate(storage) {
    const warnings = [];
    let previousVersion = null;
    try { previousVersion = storage.getItem('arq_schema_version'); }
    catch (_) { warnings.push('arq_schema_version'); }
    const data = {};
    let changed = previousVersion !== VERSION;
    for (const [field, key] of Object.entries(ARRAY_KEYS)) {
      const read = readJSON(storage, key, [], warnings);
      const hasUnexpectedType = read.valid && read.present && !Array.isArray(read.value);
      if (hasUnexpectedType) warnings.push(key);
      const normalized = asArray(read.value);
      data[field] = normalized;
      if (!sameJSON(read.value, normalized)) changed = true;
      if (read.valid && read.present && !hasUnexpectedType && !sameJSON(read.value, normalized)) {
        try { storage.setItem(key, JSON.stringify(normalized)); } catch (_) { warnings.push(key); }
      }
    }
    const questBefore = data.questObjects;
    const questAfter = questBefore.map(item => typeof item === 'string'
      ? { name: item, physical_object_id: null }
      : item);
    if (!sameJSON(questBefore, questAfter)) changed = true;
    data.questObjects = questAfter;
    if (!sameJSON(questBefore, questAfter)) {
      const read = readJSON(storage, ARRAY_KEYS.questObjects, [], []);
      if (read.valid && read.present) {
        try { storage.setItem(ARRAY_KEYS.questObjects, JSON.stringify(questAfter)); }
        catch (_) { warnings.push(ARRAY_KEYS.questObjects); }
      }
    }
    for (const [field, key] of Object.entries(JSON_KEYS)) {
      const read = readJSON(storage, key, null, warnings);
      const isObjectOrNull = read.value === null || (typeof read.value === 'object' && !Array.isArray(read.value));
      if (read.valid && read.present && !isObjectOrNull) warnings.push(key);
      const value = isObjectOrNull ? read.value : null;
      data[field] = value;
      if (!sameJSON(read.value, value)) changed = true;
      if (read.valid && read.present && isObjectOrNull && !sameJSON(read.value, value)) {
        try { storage.setItem(key, JSON.stringify(value)); } catch (_) { warnings.push(key); }
      }
    }
    try { data.zone = storage.getItem('arq_zone') || null; }
    catch (_) { data.zone = null; warnings.push('arq_zone'); }
    try { data.selectedGameId = storage.getItem('arq_selected_game') || 'rps'; }
    catch (_) { data.selectedGameId = 'rps'; warnings.push('arq_selected_game'); }
    try { data.battleUnlocked = storage.getItem('arq_battle_unlocked') === '1'; }
    catch (_) { data.battleUnlocked = false; warnings.push('arq_battle_unlocked'); }
    if (changed && warnings.length === 0) {
      try { storage.setItem('arq_schema_version', VERSION); }
      catch (_) { warnings.push('arq_schema_version'); }
    }
    data.schemaVersion = VERSION;
    data.previousVersion = previousVersion;
    data.migrated = changed && warnings.length === 0;
    data.warnings = Array.from(new Set(warnings));
    return data;
  }
  root.ARQStorageMigration = { VERSION, migrate };
})(typeof window !== 'undefined' ? window : globalThis);
