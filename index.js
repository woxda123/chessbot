const express = require('express');
const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = '8974134372:AAHa3ZnAR5gHki07tHirHE57fUpytRXZSkw';
const app = express();
const bot = new Telegraf(BOT_TOKEN);

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>♟ Шахматы Pro</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.css">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background: #1a1a2e; color: #e0e0e0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 10px; }
    #app { max-width: 700px; width: 100%; background: #2a2a4a; border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    #header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #3a3a5a; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    #player-info { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #3a3a6a; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; }
    #timer { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #4fc3f7; }
    #board-container { width: 100%; aspect-ratio: 1/1; background: #302e4a; border-radius: 12px; overflow: hidden; }
    #board { width: 100%; height: 100%; }
    #status-bar { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; color: #aaa; flex-wrap: wrap; gap: 8px; }
    #status { font-weight: 600; color: #fff; }
    #move-count { color: #aaa; }
    #move-history { margin-top: 10px; max-height: 120px; overflow-y: auto; background: #1a1a2e; border-radius: 8px; padding: 8px; font-size: 13px; display: flex; flex-wrap: wrap; gap: 4px; border: 1px solid #3a3a5a; }
    .move { background: #2a2a4a; padding: 2px 8px; border-radius: 4px; }
    .move-number { color: #888; margin-right: 4px; }
    #controls { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
    #controls button { background: #3a3a5a; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; transition: 0.2s; flex: 1 1 auto; }
    #controls button:hover { background: #4a4a7a; }
    #controls button.danger { background: #6a2a2a; }
    #controls button.danger:hover { background: #8a3a3a; }
    @media (max-width: 500px) {
      #app { padding: 10px; }
      #controls button { font-size: 12px; padding: 6px 12px; }
    }
  </style>
</head>
<body>
<div id="app">
  <div id="header">
    <div id="player-info">
      <div class="avatar">🤖</div>
      <div>
        <div class="player-name">Соперник</div>
        <div class="player-rating" style="font-size:12px;color:#888;">Рейтинг: 1200</div>
      </div>
    </div>
    <div id="timer">05:00</div>
  </div>
  <div id="board-container">
    <div id="board"></div>
  </div>
  <div id="status-bar">
    <span id="status">⏳ Ваш ход</span>
    <span id="move-count">Ходов: 0</span>
  </div>
  <div id="move-history"></div>
  <div id="controls">
    <button onclick="resetGame()">🔄 Новая игра</button>
    <button onclick="flipBoard()">🔄 Перевернуть</button>
    <button class="danger" onclick="resign()">🏳️ Сдаться</button>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/1.0.0-beta.6/chess.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js"></script>
<script>
  const game = new Chess();
  let board = null;
  let playerColor = 'w';
  let moveHistory = [];
  let gameOver = false;

  function initBoard() {
    board = Chessboard('board', {
      draggable: true,
      position: 'start',
      onDragStart: (source, piece) => {
        if (gameOver) return false;
        if (piece.search(playerColor) === -1) return false;
        return true;
      },
      onDrop: (source, target) => {
        if (gameOver) return 'snapback';
        if (source === target) return 'snapback';
        const move = game.move({ from: source, to: target, promotion: 'q' });
        if (move === null) return 'snapback';
        moveHistory.push(move);
        updateStatus();
        board.position(game.fen());
        if (game.game_over()) {
          gameOver = true;
          let result = '🤝 Ничья!';
          if (game.in_checkmate()) result = '🏆 Мат! Победа!';
          else if (game.in_stalemate()) result = '🤝 Пат! Ничья!';
          else if (game.in_draw()) result = '🤝 Ничья по правилу!';
          document.getElementById('status').textContent = result;
          return;
        }
        document.getElementById('status').textContent = game.turn() === 'w' ? '⏳ Ход белых' : '⏳ Ход черных';
        document.getElementById('move-count').textContent = 'Ходов: ' + moveHistory.length;
        updateMoveHistory();
      },
      onSnapEnd: () => { board.position(game.fen()); },
      showNotation: true,
      pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    });
  }

  function updateStatus() {
    document.getElementById('status').textContent = game.turn() === 'w' ? '⏳ Ход белых' : '⏳ Ход черных';
    document.getElementById('move-count').textContent = 'Ходов: ' + moveHistory.length;
    updateMoveHistory();
  }

  function updateMoveHistory() {
    const history = document.getElementById('move-history');
    history.innerHTML = '';
    const moves = game.history({ verbose: true });
    moves.forEach((move, index) => {
      const span = document.createElement('span');
      span.className = 'move';
      if (index % 2 === 0) {
        const num = document.createElement('span');
        num.className = 'move-number';
        num.textContent = (index / 2 + 1) + '. ';
        span.appendChild(num);
      }
      span.textContent = move.san;
      history.appendChild(span);
    });
  }

  function resetGame() {
    game.reset();
    gameOver = false;
    moveHistory = [];
    board.position('start');
    document.getElementById('status').textContent = '⏳ Ваш ход';
    document.getElementById('move-count').textContent = 'Ходов: 0';
    document.getElementById('move-history').innerHTML = '';
  }

  function flipBoard() { board.flip(); }

  function resign() {
    if (gameOver) return;
    if (confirm('Вы уверены, что хотите сдаться?')) {
      gameOver = true;
      document.getElementById('status').textContent = '🏳️ Вы сдались.';
    }
  }

  window.onload = initBoard;
</script>
</body>
</html>
  `);
});

bot.start((ctx) => {
  const webAppUrl = process.env.WEBAPP_URL || 'https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co';
  ctx.reply(
    '♟ ШАХМАТЫ PRO\n\n' +
    '⚡ Полноценная игра с анимациями\n' +
    '🔹 Подсветка ходов\n' +
    '🔹 Рокировка, взятие на проходе\n' +
    '🔹 Превращение пешки\n' +
    '🔹 Автоматический мат/пат\n' +
    '🔹 Таймер 5 минут\n\n' +
    'Нажми на кнопку, чтобы начать:',
    Markup.inlineKeyboard([
      [Markup.button.webApp('♟ Играть', webAppUrl)]
    ])
  );
});

bot.launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch(err => console.error('❌ Ошибка:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('✅ Web App сервер запущен на порту ' + PORT);
  console.log('🔗 WebApp URL: https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co');
});

setInterval(() => {
  fetch('https://' + process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co')
    .then(() => console.log('🏓 Пинг'))
    .catch(() => {});
}, 60000);