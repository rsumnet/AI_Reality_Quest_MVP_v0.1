(function(global){
  const RESULTS=new Set(['WIN','LOSE','DRAW']);
  function failure(message,error){return {ok:false,message,error:error||null};}
  function renderControls(module,container,onAction,context){
    if(!module||typeof module.renderControls!=='function')return failure('게임 모듈 화면을 표시할 수 없습니다.');
    try{
      module.renderControls(container,onAction,context||{});
      return {ok:true};
    }catch(error){
      if(container)container.innerHTML='';
      return failure('게임 모듈 화면을 표시하지 못했습니다.',error);
    }
  }
  function validateOutcome(value){
    if(!value||typeof value!=='object'||Array.isArray(value)||!RESULTS.has(value.result)){
      return failure('게임 모듈이 유효한 WIN/LOSE/DRAW 결과를 반환하지 않았습니다.');
    }
    let metadata=null;
    if(value.metadata!==undefined&&value.metadata!==null){
      if(typeof value.metadata!=='object'||Array.isArray(value.metadata))return failure('게임 모듈 결과의 metadata 형식이 올바르지 않습니다.');
      try{metadata=JSON.parse(JSON.stringify(value.metadata));}
      catch(error){return failure('게임 모듈 결과의 metadata를 저장할 수 없습니다.',error);}
    }
    return {ok:true,outcome:{
      result:value.result,
      playerAction:value.playerAction===undefined?undefined:String(value.playerAction),
      opponentAction:value.opponentAction===undefined?undefined:String(value.opponentAction),
      message:value.message===undefined?undefined:String(value.message),
      metadata
    }};
  }
  function resolveRound(module,action,context){
    if(!module||typeof module.resolveRound!=='function')return failure('이 게임은 공통 결과 함수를 제공하지 않습니다. 비동기 모듈은 onAction으로 결과를 제출해야 합니다.');
    try{
      const outcome=module.resolveRound(action,context||{});
      if(outcome&&typeof outcome.then==='function')return failure('비동기 결과는 Promise 대신 공통 onAction 결과 계약으로 제출해야 합니다.');
      return validateOutcome(outcome);
    }catch(error){
      return failure('게임 모듈 실행 중 오류가 발생했습니다.',error);
    }
  }
  global.ARQGameRuntime=Object.freeze({renderControls,validateOutcome,resolveRound});
})(window);
