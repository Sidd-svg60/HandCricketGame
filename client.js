// client.js
const ws = new WebSocket('ws://localhost:8080'); // If on same network, replace localhost with server IP

let playerId = Math.floor(Math.random()*100000);
let gameId = null;

// DOM elements
const hostBtn = document.getElementById('host-btn');
const joinBtn = document.getElementById('join-btn');
const startBtn = document.getElementById('start-btn');
const joinIdInput = document.getElementById('join-id');
const generatedIdEl = document.getElementById('generated-id');
const playersList = document.getElementById('players');
const gameDiv = document.getElementById('game');
const lobbyDiv = document.getElementById('lobby');
const playerInput = document.getElementById('player-input');
const submitBtn = document.getElementById('submit-btn');
const scoreEl = document.getElementById('score');
const turnInfo = document.getElementById('turn-info');
const logDiv = document.getElementById('log');

// Button listeners
hostBtn.onclick = () => ws.send(JSON.stringify({ action:'host', playerId }));
joinBtn.onclick = () => {
    gameId = joinIdInput.value.trim();
    if(!gameId) return alert('Enter Game ID');
    ws.send(JSON.stringify({ action:'join', gameId, playerId }));
};
startBtn.onclick = () => ws.send(JSON.stringify({ action:'start', gameId, playerId }));
submitBtn.onclick = () => {
    const num = parseInt(playerInput.value);
    if(num<1 || num>6) return alert('Enter 1-6');
    ws.send(JSON.stringify({ action:'move', gameId, playerId, num }));
    playerInput.value='';
};

// WebSocket updates
ws.onmessage = (msg)=>{
    const data = JSON.parse(msg.data);

    if(data.action==='hosted'){
        gameId = data.gameId;
        generatedIdEl.innerText = `Game ID: ${gameId}`;
    }

    if(data.action==='update'){
        const game = data.game;
        // Update lobby
        playersList.innerHTML = '';
        game.players.forEach((p,i)=>{
            const li = document.createElement('li');
            li.innerText = `Player ${i+1}: ${p}`;
            playersList.appendChild(li);
        });

        // Show lobby or game
        if(game.status==='waiting'){ lobbyDiv.style.display='block'; gameDiv.style.display='none'; }
        else { lobbyDiv.style.display='none'; gameDiv.style.display='block'; }

        // Score
        let score=[0,0];
        game.moves.forEach((m)=>{
            const idx = game.players.indexOf(m.playerId);
            score[idx]+=m.num;
        });
        scoreEl.innerText = `Score: ${score[0]} - ${score[1]}`;

        // Turn info
        if(game.status==='started'){
            turnInfo.innerText = (game.players[game.turnIndex]===playerId)? "Your Turn":"Opponent's Turn";
            playerInput.disabled = game.players[game.turnIndex]!==playerId;
            submitBtn.disabled = game.players[game.turnIndex]!==playerId;
        }

        // Log
        logDiv.innerHTML = '';
        game.moves.forEach(m=>{
            logDiv.innerHTML += `<p>Player ${m.playerId} played ${m.num}</p>`;
        });

        // Game finished
        if(game.status==='finished'){
            turnInfo.innerText = "Game Over!";
            playerInput.disabled = true;
            submitBtn.disabled = true;
        }
    }
};