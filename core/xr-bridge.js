(function(global){
  const subscribers=new Map();
  const SCHEMA='arq-xr-event/0.1';
  function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
  function validType(type){return typeof type==='string'&&/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*){1,3}$/.test(type);}
  function subscribe(type,handler){
    if(!validType(type))throw new Error('XR bridge event type is invalid');
    if(typeof handler!=='function')throw new Error('XR bridge subscriber must be a function');
    if(!subscribers.has(type))subscribers.set(type,new Set());
    subscribers.get(type).add(handler);
    return ()=>{const set=subscribers.get(type);if(set){set.delete(handler);if(!set.size)subscribers.delete(type);}};
  }
  function publish(type,payload={}){
    if(!validType(type))throw new Error('XR bridge event type is invalid');
    if(!isPlainObject(payload))throw new Error('XR bridge payload must be an object');
    let safePayload;
    try{safePayload=JSON.parse(JSON.stringify(payload));}
    catch(error){throw new Error('XR bridge payload must be JSON serializable');}
    const event=Object.freeze({schemaVersion:SCHEMA,type,emittedAt:new Date().toISOString(),payload:safePayload});
    for(const handler of [...(subscribers.get(type)||[])]){
      try{handler(event);}catch(error){if(global.console&&typeof global.console.error==='function')global.console.error('ARQ XR bridge subscriber failed',error);}
    }
    return event;
  }
  global.ARQXRBridge=Object.freeze({subscribe,publish,schemaVersion:SCHEMA});
})(window);
