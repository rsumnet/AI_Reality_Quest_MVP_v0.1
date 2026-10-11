(function(global){
  const beats={rock:'scissors',paper:'rock',scissors:'paper'};
  const labels={rock:'✊ 바위',paper:'✋ 보',scissors:'✌️ 가위'};
  global.ARQGameRegistry.register({
    id:'rps',
    name:'가위바위보',
    description:'상대 몬스터의 선택과 승부합니다.',
    renderControls(container,onAction){
      container.innerHTML='';
      for(const action of ['rock','paper','scissors']){
        const button=document.createElement('button');
        button.type='button';button.className='choice';button.textContent=labels[action];button.dataset.gameAction=action;
        button.addEventListener('click',()=>onAction(action));container.appendChild(button);
      }
    },
    resolveRound(action,{random=Math.random}={}){
      const options=Object.keys(beats),opponentAction=options[Math.floor(random()*options.length)];
      const result=action===opponentAction?'DRAW':beats[action]===opponentAction?'WIN':'LOSE';
      return {result,playerAction:labels[action]||String(action),opponentAction:labels[opponentAction],message:'가위바위보',metadata:{gameId:'rps',playerChoice:action,opponentChoice:opponentAction}};
    }
  });
})(window);
