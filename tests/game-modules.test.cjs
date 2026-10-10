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
  for (const path of ['games/rps.js', 'games/odd-even.js']) {
    vm.runInNewContext(fs.readFileSync(path, 'utf8'), sandbox, { filename: path });
  }
  return sandbox;
}

test('registry exposes independently registered RPS and odd-even modules', () => {
  const sandbox = loadModules();
  assert.deepEqual(sandbox.ARQGameRegistry.list().map(x => x.id), ['rps', 'odd-even']);
  assert.equal(sandbox.ARQGameRegistry.get('rps').name, '가위바위보');
  assert.equal(sandbox.ARQGameRegistry.get('odd-even').name, '홀짝');
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
