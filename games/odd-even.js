(function(global){
  global.ARQGameRegistry.register({
    id:'odd-even',
    name:'홀짝',
    description:'상대 몬스터가 굴린 주사위 결과의 홀짝을 예측합니다.',
    renderControls(container,onAction){
      container.innerHTML='';
      for(const action of ['odd','even']){
        const button=document.createElement('button');
        button.type='button';button.className='choice';button.textContent=action==='odd'?'홀수':'짝수';button.dataset.gameAction=action;
        button.addEventListener('click',()=>onAction(action));container.appendChild(button);
      }
    },
    resolveRound(action,{random=Math.random}={}){
      const roll=1+Math.floor(random()*6),actual=roll%2?'odd':'even';
      return {result:action===actual?'WIN':'LOSE',playerAction:action==='odd'?'홀수 예측':'짝수 예측',opponentAction:'주사위 '+roll,message:'홀짝 예측',metadata:{gameId:'odd-even',guess:action,roll,actual}};
    }
  });
})(window);
