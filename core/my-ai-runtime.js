(function(global){
  const providers=new Map();
  const CONTEXT_SCHEMA='arq-my-ai-context/0.1';
  function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
  function cloneJson(value){return JSON.parse(JSON.stringify(value));}
  function register(provider){
    if(!provider||typeof provider.id!=='string'||!/^[a-z0-9][a-z0-9._-]*$/i.test(provider.id))throw new Error('My AI provider requires a stable id');
    if(typeof provider.name!=='string'||!provider.name.trim())throw new Error(provider.id+': provider name is required');
    if(provider.local!==true)throw new Error(provider.id+': only explicitly local providers may receive personal context');
    if(typeof provider.run!=='function')throw new Error(provider.id+': run(request) is required');
    if(providers.has(provider.id))throw new Error('Duplicate My AI provider id: '+provider.id);
    providers.set(provider.id,Object.freeze({id:provider.id,name:provider.name.trim(),local:true,model:typeof provider.model==='string'?provider.model:'unspecified',isAvailable:typeof provider.isAvailable==='function'?provider.isAvailable:null,run:provider.run}));
  }
  function list(){return [...providers.values()].map(provider=>({id:provider.id,name:provider.name,local:provider.local,model:provider.model}));}
  function buildContextPackage({question='',sqResults=[],personalContexts=[],evidence=[]}={}){
    const safeArray=value=>Array.isArray(value)?value.filter(isPlainObject).map(item=>cloneJson(item)):[];
    const contexts=safeArray(personalContexts).filter(item=>item.status==='CONFIRMED');
    const observations=safeArray(evidence).map(item=>({
      id:item.id??null,
      object:item.user_label||item.object_key||item.ai_label||item.object||null,
      confidence:Number.isFinite(Number(item.confidence))?Number(item.confidence):null,
      time:item.time??null,
      zone:item.zone??null,
      source:item.source??null,
      processing:item.processing??null,
      context_ref:item.context_ref??null,
      physical_object_id:item.physical_object_id??null
    }));
    return {
      schemaVersion:CONTEXT_SCHEMA,
      question:String(question||''),
      sqResults:safeArray(sqResults),
      personalContexts:contexts,
      evidence:observations
    };
  }
  async function run(providerId,contextPackage){
    const provider=providers.get(providerId);
    if(!provider)return {ok:false,message:'등록된 My AI provider가 없습니다.'};
    let request;
    try{
      if(!isPlainObject(contextPackage))return {ok:false,message:'My AI context package 형식이 올바르지 않습니다.'};
      request=cloneJson(contextPackage);
    }catch(error){return {ok:false,message:'My AI context package를 안전하게 복사할 수 없습니다.',error};}
    try{
      if(provider.isAvailable&&!(await provider.isAvailable()))return {ok:false,message:'로컬 My AI 모델을 사용할 수 없습니다.'};
      const result=await provider.run(request);
      return {ok:true,provider:{id:provider.id,name:provider.name,model:provider.model,local:true},result};
    }catch(error){return {ok:false,message:'로컬 My AI provider 실행 중 오류가 발생했습니다.',error};}
  }
  global.ARQMyAIRuntime=Object.freeze({register,list,buildContextPackage,run,contextSchema:CONTEXT_SCHEMA});
})(window);
