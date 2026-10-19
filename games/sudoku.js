(function(global){
  // 스도쿠 4x4: 1~4 숫자로 구성된 퍼즐의 빈 칸에 들어갈 숫자를 고르면 승리합니다.
  // MVP에서는 검증된 퍼즐 2개를 순환하고, 빈 칸은 하나만 둡니다.
  const PUZZLES=[
    {grid:'3 1 2 ·\n4 2 1 3\n1 3 4 2\n2 4 3 1',row:0,col:3,answer:4},
    {grid:'2 1 4 3\n3 · 2 1\n4 3 1 2\n1 2 3 4',row:1,col:1,answer:4}
  ];
  let current=PUZZLES[0];
  global.ARQGameRegistry.register({
    id:'sudoku',
    name:'스도쿠 4×4',
    description:'4×4 스도쿠의 빈 칸(·)에 들어갈 숫자(1~4)를 고르면 승리합니다.',
    metadata:{apiVersion:1,version:'1.0.0',difficulty:'쉬움',tags:['퍼즐','논리']},
    renderControls(container,onAction){
      current=PUZZLES[Math.floor(Math.random()*PUZZLES.length)];
      container.innerHTML='';
      const grid=document.createElement('div');
      grid.className='note';if(grid.style){grid.style.marginBottom='8px';grid.style.whiteSpace='pre';}grid.textContent=current.grid;
      container.appendChild(grid);
      for(const n of [1,2,3,4]){
        const button=document.createElement('button');
        button.type='button';button.className='choice';button.textContent=String(n);button.dataset.gameAction=String(n);
        button.addEventListener('click',()=>onAction(String(n)));container.appendChild(button);
      }
    },
    getCurrentPuzzle(){return current;},
    resolveRound(action){
      const guess=action===null||action===undefined?null:String(action);
      const ok=guess!==null&&guess===String(current.answer);
      const result=ok?'WIN':'LOSE';
      return {result,playerAction:guess===null?'선택 없음':'빈 칸에 '+guess,opponentAction:'정답 '+current.answer,message:'스도쿠 4×4',metadata:{gameId:'sudoku',guess,answer:current.answer,puzzle:current.grid}};
    }
  });
})(window);