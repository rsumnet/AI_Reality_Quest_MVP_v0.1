(function(global){
  global.ARQGameRegistry.register({
    id:'dice',
    name:'주사위 대결',
    description:'우리팀과 상대팀이 주사위를 굴려 더 높은 숫자를 얻으면 승리합니다.',
    renderControls(container,onAction){
      container.innerHTML='';
      const button=document.createElement('button');
      button.type='button';button.className='choice';button.textContent='🎲 주사위 굴리기';button.dataset.gameAction='roll';
      button.addEventListener('click',()=>onAction('roll'));container.appendChild(button);
    },
    resolveRound(action,{random=Math.random}={}){
      const playerRoll=1+Math.floor(random()*6),opponentRoll=1+Math.floor(random()*6);
      const result=playerRoll===opponentRoll?'DRAW':playerRoll>opponentRoll?'WIN':'LOSE';
      return {result,playerAction:'주사위 '+playerRoll,opponentAction:'주사위 '+opponentRoll,message:'주사위 대결',metadata:{gameId:'dice',playerRoll,opponentRoll}};
    }
  });
})(window);
