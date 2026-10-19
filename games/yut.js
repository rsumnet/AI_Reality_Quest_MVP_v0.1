(function(global){
  // 윷놀이: 네 개의 윷을 던져 나온 등급(도<개<걸<윷<모)을 서로 비교해 높은 쪽이 승리합니다.
  // 실제 윷놀이의 '윷/모는 한 번 더 던지기' 규칙은 MVP에서는 적용하지 않고, 같은 등급이면 DRAW로 처리합니다.
  const NAMES={0:'모',1:'도',2:'개',3:'걸',4:'윷'};
  const RANK={모:5,윷:4,걸:3,개:2,도:1};
  function throwSticks(random){
    let flat=0;const sticks=[];
    for(let i=0;i<4;i++){
      const up=random()<0.5;
      sticks.push(up?'앞면(업)':'뒷면(다운)');
      if(up)flat++;
    }
    return {sticks,flat,name:NAMES[flat]};
  }
  global.ARQGameRegistry.register({
    id:'yut',
    name:'윷놀이',
    description:'네 개의 윷을 던져 더 높은 등급(도<개<걸<윷<모)을 만든 쪽이 승리합니다. 같은 등급이면 무승부입니다.',
    metadata:{apiVersion:1,version:'1.0.0',difficulty:'쉬움',tags:['전통놀이','확률']},
    renderControls(container,onAction){
      container.innerHTML='';
      const button=document.createElement('button');
      button.type='button';button.className='choice';button.textContent='🪵 윷 던지기';button.dataset.gameAction='throw';
      button.addEventListener('click',()=>onAction('throw'));container.appendChild(button);
    },
    resolveRound(action,{random=Math.random}={}){
      const player=throwSticks(random),opponent=throwSticks(random);
      const pr=RANK[player.name],or=RANK[opponent.name];
      const result=pr===or?'DRAW':pr>or?'WIN':'LOSE';
      return {result,playerAction:'윷 '+player.name,opponentAction:'윷 '+opponent.name,message:'윷놀이 대결',metadata:{gameId:'yut',playerSticks:player.sticks,playerResult:player.name,opponentResult:opponent.name}};
    }
  });
})(window);