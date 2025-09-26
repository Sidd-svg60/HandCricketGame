// ---------- Supabase Setup ----------
const SUPABASE_URL = 'https://ignadfdvsitdelovinjw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbmFkZmR2c2l0ZGVsb3Zpbmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTQzNjcsImV4cCI6MjA3NDQ3MDM2N30.NUTuM7AQESO2HN53A2LY1tk8UBGENCl-vJtnFfg33fI';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- DOM ----------
const hostBtn = document.getElementById('host-btn');
const joinBtn = document.getElementById('join-btn');
const generatedIdEl = document.getElementById('generated-id');
const joinIdInput = document.getElementById('join-id');
const lobbyDiv = document.getElementById('lobby');
const playersList = document.getElementById('players');
const startBtn = document.getElementById('start-btn');
const gameDiv = document.getElementById('game');
const scoreEl = document.getElementById('score');
const playerInput = document.getElementById('player-input');
const submitBtn = document.getElementById('submit-btn');
const logDiv = document.getElementById('log');
const turnInfo = document.getElementById('turn-info');

// ---------- Variables ----------
let playerId = Math.floor(Math.random() * 100000); 
let gameId = null;
let channel = null;
let players = [];
let score = [0,0];
let turnIndex = 0;
let maxTurns = 4;
let currentTurn = 1;

// ---------- HOST ----------
hostBtn.addEventListener('click', () => {
    gameId = Math.floor(10000 + Math.random() * 90000).toString();
    generatedIdEl.innerText = `Game ID: ${gameId}`;
    setupChannel();
    addPlayerToLobby();
});

// ---------- JOIN ----------
joinBtn.addEventListener('click', () => {
    const enteredId = joinIdInput.value.trim();
    if(!enteredId) return alert("Enter Game ID");
    gameId = enteredId;
    setupChannel();
    addPlayerToLobby();
});

// ---------- CHANNEL ----------
function setupChannel() {
    channel = supabase.channel('game-' + gameId);

    channel.on('broadcast', {event:'join'}, payload => {
        if(!players.includes(payload.playerId)) players.push(payload.playerId);
        updateLobbyUI();
    });

    channel.on('broadcast', {event:'start'}, () => {
        lobbyDiv.style.display = 'none';
        gameDiv.style.display = 'block';
        turnIndex = 0;
        currentTurn = 1;
        updateTurnUI();
        logDiv.innerHTML += `<p>Game Started! Player ${players[turnIndex]} starts.</p>`;
    });

    channel.on('broadcast', {event:'move'}, payload => {
        processMove(payload);
    });

    channel.subscribe();
}

// ---------- ADD TO LOBBY ----------
function addPlayerToLobby() {
    channel.send({type:'broadcast', event:'join', payload:{playerId}});
}

// ---------- UPDATE LOBBY ----------
function updateLobbyUI() {
    playersList.innerHTML = '';
    players.forEach((p,i) => {
        const li = document.createElement('li');
        li.innerText = `Player ${i+1}: ${p}`;
        playersList.appendChild(li);
    });
}

// ---------- START GAME ----------
startBtn.addEventListener('click', () => {
    if(players.length < 2) return alert('Wait for another player!');
    channel.send({type:'broadcast', event:'start', payload:{}});
});

// ---------- SUBMIT MOVE ----------
submitBtn.addEventListener('click', () => {
    if(players[turnIndex] !== playerId) return alert("Wait for your turn!");
    const num = parseInt(playerInput.value);
    if(num < 1 || num > 6) return alert('Enter 1-6');
    channel.send({type:'broadcast', event:'move', payload:{playerId,num,turn:currentTurn}});
    playerInput.value='';
});

// ---------- PROCESS MOVE ----------
function processMove(payload) {
    const playerIndex = players.indexOf(payload.playerId);
    score[playerIndex] += payload.num;
    scoreEl.innerText = `Score: ${score[0]} - ${score[1]}`;
    logDiv.innerHTML += `<p>Player ${payload.playerId} played ${payload.num}</p>`;

    if(currentTurn >= maxTurns) {
        logDiv.innerHTML += `<p>Game Over! Final Score: ${score[0]} - ${score[1]}</p>`;
        playerInput.disabled = true;
        submitBtn.disabled = true;
        return;
    }

    // Switch turn
    turnIndex = (turnIndex === 0) ? 1 : 0;
    currentTurn++;
    updateTurnUI();
}

// ---------- TURN UI ----------
function updateTurnUI() {
    if(players[turnIndex] === playerId) {
        playerInput.disabled = false;
        submitBtn.disabled = false;
        turnInfo.innerText = "Your turn!";
    } else {
        playerInput.disabled = true;
        submitBtn.disabled = true;
        turnInfo.innerText = "Opponent's