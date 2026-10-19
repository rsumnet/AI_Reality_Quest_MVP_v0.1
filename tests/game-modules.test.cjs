const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadModules() {
  const sandbox = { Math, document: { createElement: () => ({
    addEventListener(name, handler) { this.handler = handler; },
    setAttribute() {}, className: '', dataset: {}, type: '', textContent: ''
  }) } };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync('games/game-registry.js', 'utf8'), sandbox, { filename: 'games/game-registry.js' });
  for (const path of ['games/rps.js', 'games/odd-even.js', 'games/dice.js', 'games/yut.js', 'games/sudoku.js']) {
    vm.runInNewContext(fs.readFileSync(path, 'utf8'), sandbox, { filename: path });
  }
  return sandbox;
}

test('registry exposes independently registered RPS and odd-even modules', () => {
  const sandbox = loadModules();
  assert.equal(sandbox.ARQGameRegistry.list().length, 5);
  assert.equal(sandbox.ARQGameRegistry.list()[0].id, 'rps');
  assert.equal(sandbox.ARQGameRegistry.list()[1].id, 'odd-even');
  assert.equal(sandbox.ARQGameRegistry.list()[2].id, 'dice');
  assert.equal(sandbox.ARQGameRegistry.list()[3].id, 'yut');
  assert.equal(sandbox.ARQGameRegistry.list()[4].id, 'sudoku');
  assert.equal(sandbox.ARQGameRegistry.get('rps').name, '가위바위보');
  assert.equal(sandbox.ARQGameRegistry.get('odd-even').name, '홀짝');
  assert.equal(sandbox.ARQGameRegistry.get('yut').name, '윷놀이');
  assert.equal(sandbox.ARQGameRegistry.get('sudoku').name, '스도쿠 4×4');
});

test('RPS module returns normalized WIN/LOSE/DRAW outcomes', () => {
  const game = loadModules().ARQGameRegistry.get('rps');
  assert.equal(game.resolveRound('rock', { random: () => 0 }).result, 'DRAW');
  assert.equal(game.resolveRound('rock', { random: () => 0.99 }).result, 'WIN');
  assert.equal(game.resolveRound('scissors', { random: () => 0 }).result, 'LOSE');
});

test('odd-even module returns a normalized outcome and records its game-specific metadata', () => {
  const game = loadModules().ARQGameRegistry.get('odd-even');
  const win = game.resolveRound('even', { random: () => 0.5 }); // die roll 4
  assert.equal(win.result, 'WIN');
  assert.equal(win.opponentAction, '주사위 4');
  assert.equal(win.metadata.gameId, 'odd-even');
  const lose = game.resolveRound('odd', { random: () => 0.5 });
  assert.equal(lose.result, 'LOSE');
});

test('game module UI reports user actions through the shared callback', () => {
  const sandbox = loadModules();
  const game = sandbox.ARQGameRegistry.get('odd-even');
  const buttons = [];
  const container = { innerHTML: '', appendChild(button) { buttons.push(button); } };
  let selected = null;
  game.renderControls(container, action => { selected = action; });
  assert.equal(buttons.length, 2);
  buttons[0].handler();
  assert.equal(selected, 'odd');
});

test('a student-created asynchronous game can submit a normalized result directly to the shared Quest lifecycle', () => {
  const sandbox = loadModules();
  const custom = {
    id: 'student-sudoku',
    name: '학생 스도쿠',
    renderControls(container, onAction) {
      container.innerHTML = 'Puzzle UI owned by student module';
      this.solve = () => onAction({ result: 'WIN', playerAction: '퍼즐 해결', opponentAction: '스도쿠 과제', message: '정답입니다.', metadata: { gameId: this.id } });
    }
  };
  sandbox.ARQGameRegistry.register(custom);
  const hostActions = [];
  custom.renderControls({ innerHTML: '' }, outcome => hostActions.push(outcome));
  custom.solve();
  assert.equal(hostActions[0].result, 'WIN');
  assert.equal(hostActions[0].metadata.gameId, 'student-sudoku');
});

test('dice module resolves win, loss, and draw through the same normalized contract', () => {
  const game = loadModules().ARQGameRegistry.get('dice');
  const values = sequence => { let i = 0; return () => sequence[i++]; };
  assert.equal(game.resolveRound('roll', { random: values([0.99, 0]) }).result, 'WIN');
  assert.equal(game.resolveRound('roll', { random: values([0, 0.99]) }).result, 'LOSE');
  const draw = game.resolveRound('roll', { random: values([0.5, 0.5]) });
  assert.equal(draw.result, 'DRAW');
  assert.equal(draw.metadata.gameId, 'dice');
});


test('yut module resolves win, loss, and draw through the normalized contract', () => {
  const game = loadModules().ARQGameRegistry.get('yut');
  const seq = values => { let i = 0; return () => values[i++]; };
  const win = game.resolveRound('throw', { random: seq([0.4, 0.4, 0.4, 0.4, 0.6, 0.6, 0.6, 0.4]) });
  assert.equal(win.result, 'WIN');
  assert.equal(win.metadata.playerResult, '윷');
  assert.equal(win.metadata.opponentResult, '도');
  const lose = game.resolveRound('throw', { random: seq([0.6, 0.6, 0.6, 0.4, 0.4, 0.4, 0.4, 0.6]) });
  assert.equal(lose.result, 'LOSE');
  const draw = game.resolveRound('throw', { random: seq([0.4, 0.4, 0.6, 0.6, 0.6, 0.4, 0.6, 0.4]) });
  assert.equal(draw.result, 'DRAW');
  assert.equal(draw.metadata.gameId, 'yut');
});

test('sudoku module resolves correct and incorrect guesses through the normalized contract', () => {
  const sandbox = loadModules();
  const game = sandbox.ARQGameRegistry.get('sudoku');
  const buttons = [];
  const container = { innerHTML: '', appendChild(button) { buttons.push(button); } };
  game.renderControls(container, () => {});
  assert.equal(buttons.length, 5, '퍼즐 표시 + 숫자 버튼 4개');
  const puzzle = game.getCurrentPuzzle();
  const win = game.resolveRound(String(puzzle.answer));
  assert.equal(win.result, 'WIN');
  assert.equal(win.metadata.guess, String(puzzle.answer));
  const lose = game.resolveRound(String(((puzzle.answer % 4) + 1)));
  assert.equal(lose.result, 'LOSE', '오답은 LOSE');
  assert.equal(win.metadata.gameId, 'sudoku');
});
