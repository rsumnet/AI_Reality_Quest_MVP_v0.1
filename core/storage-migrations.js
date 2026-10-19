(function(global){
  // 구버전(0.1~0.4.x) localStorage 데이터를 현재 ARQ 스키마로 정규화한다.
  // 이미 정상인 데이터는 변경하지 않아 반복 실행해도 결과가 안정적이도록 한다.
  function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
  function newId(){
    try{
      if(global.crypto&&global.crypto.randomUUID)return global.crypto.randomUUID();
      if(global.crypto&&global.crypto.getRandomValues)return 'mig-'+Array.from(global.crypto.getRandomValues(new Uint32Array(2))).map(n=>n.toString(36)).join('');
    }catch(error){}
    return 'mig-'+Date.now().toString(36)+Math.random().toString(36).slice(2);
  }
  function normalizeQuestObjects(raw){
    if(!Array.isArray(raw))return null;
    let changed=false;
    const value=raw.map(item=>{
      if(typeof item==='string'){changed=true;return {name:item,physical_object_id:null};}
      if(isPlainObject(item))return item;
      changed=true;return null;
    }).filter(Boolean);
    return {value,changed};
  }
  function normalizeCollection(raw,{ensureId=false,ensureSchema=false,schemaVersion=''}={}){
    if(!Array.isArray(raw))return null;
    let changed=false;
    const value=raw.map(item=>{
      if(!isPlainObject(item)){changed=true;return null;}
      const next={...item};
      if(ensureId&&!next.id){next.id=newId();changed=true;}
      if(ensureSchema&&next.schemaVersion!==schemaVersion){next.schemaVersion=schemaVersion;changed=true;}
      return next;
    }).filter(Boolean);
    return {value,changed};
  }
  function migrate(store,schemaVersion){
    const version=schemaVersion||'0.5.1';
    const report={questObjects:0,evidence:0,monsters:0,battles:0,personalContexts:0,attempts:0,battlePending:false,gps:false,changed:false};
    function readEntry(key){
      let raw;
      try{raw=store.getItem(key);}catch(error){return {value:null,present:false,valid:false};}
      if(raw===null)return {value:null,present:false,valid:true};
      try{return {value:JSON.parse(raw),present:true,valid:true};}
      catch(error){return {value:null,present:true,valid:false};}
    }
    function read(key){return readEntry(key).value;}
    function write(key,value){store.setItem(key,JSON.stringify(value));report.changed=true;}

    // 1. Quest objects: convert legacy string entries while retaining their names.
    const questEntry=readEntry('arq_quest_objects');
    const questRaw=questEntry.value;
    if(questRaw!==null){
      const quest=normalizeQuestObjects(questRaw);
      if(!quest){write('arq_quest_objects',[]);report.questObjects=0;}
      else{if(quest.changed)write('arq_quest_objects',quest.value);report.questObjects=quest.value.length;}
    }else if(questEntry.present){write('arq_quest_objects',[]);}
    
    // 2. Evidence: guarantee a stable ID and current schema version for every record.
    const evidenceEntry=readEntry('arq_evidence');
    const evidenceRaw=evidenceEntry.value;
    if(evidenceRaw!==null){
      const evidence=normalizeCollection(evidenceRaw,{ensureId:true,ensureSchema:true,schemaVersion:version});
      if(!evidence){write('arq_evidence',[]);report.evidence=0;}
      else{if(evidence.changed)write('arq_evidence',evidence.value);report.evidence=evidence.value.length;}
    }else if(evidenceEntry.present){write('arq_evidence',[]);}

    // 3. Normalize the other persisted collections; keep existing fields and IDs.
    for(const [key,label] of [['arq_monsters','monsters'],['arq_battles','battles'],['arq_attempts','attempts'],['arq_personal_contexts','personalContexts']]){
      const entry=readEntry(key), raw=entry.value;
      if(raw===null){if(entry.present)write(key,[]);continue;}
      const collection=normalizeCollection(raw,{ensureSchema:key==='arq_personal_contexts',schemaVersion:version});
      if(!collection){write(key,[]);report[label]=0;continue;}
      if(collection.changed)write(key,collection.value);
      report[label]=collection.value.length;
    }

    // 4. Normalize invalid or non-object pending battle data; retain legacy actorType values.
    const pendingEntry=readEntry('arq_battle_pending');
    const pending=pendingEntry.value;
    if(pendingEntry.present&&(!pendingEntry.valid||(pending!==null&&!isPlainObject(pending)))){
      store.setItem('arq_battle_pending','null');report.battlePending=true;report.changed=true;
    }

    // 5. GPS must be an object or null. Invalid JSON is reset so the app can initialize safely.
    const gpsEntry=readEntry('arq_gps');
    const gps=gpsEntry.value;
    if(gpsEntry.present&&(!gpsEntry.valid||(gps!==null&&!isPlainObject(gps)))){
      store.setItem('arq_gps','null');report.gps=true;report.changed=true;
    }
    return report;
  }
  global.ARQStorageMigrations={migrate};
})(window);
