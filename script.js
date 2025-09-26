// Supabase setup
const SUPABASE_URL = 'https://ignadfdvsitdelovinjw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbmFkZmR2c2l0ZGVsb3Zpbmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTQzNjcsImV4cCI6MjA3NDQ3MDM2N30.NUTuM7AQESO2HN53A2LY1tk8UBGENCl-vJtnFfg33fI';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM
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

let gameId = null;
let playerId = Math.floor(Math.random() * 10000);
let players = [];
let score = {player1:0, player2:0};
let turn = 0; // 0 = player1, 1 = player2
let moves = [];

// Lobby channel (Supabase)
let channel = null;

// ===== Host Game =====
hostBtn.addEventListener('click', () => {
    gameId = Math.floor(10000 + Math.random() * 90000).toString();
    generatedIdEl.innerText = `Game ID: ${gameId}`;
    setupChannel();
    addPlayerToLobby();
});

// ===== Join Game =====
joinBtn.addEventListener('click', () => {
    const enteredId = joinIdInput.value.trim();
    if(!enteredId) return alert('Enter Game ID');
    gameId = enteredId;
    setupChannel();
    addPlayerToLobby();
});

// ===== Setup Supabase Channel =====
function setupChannel(){
    channel = supabase.channel('game-' + gameId);

    channel.on('broadcast', {event:'join'}, payload => {
        if(!players.includes(payload.playerId)) players.push(payload.playerId);
        updateLobbyUI();
    });

    channel.on('broadcast', {event:'start'}, payload => {
        lobbyDiv.style.display = 'none';
        gameDiv.style.display = 'block';
        logDiv.innerHTML += '<p>Game Started!</p>';
    });

    channel.on('broadcast', {event:'move'}, payload => {
        moves.push(payload);
        updateGame(payload);
    });

    channel.subscribe();
}

// ===== Add player to lobby =====
function addPlayerToLobby(){
    channel.send({type:'broadcast', event:'join', payload:{playerId}});
}

// ===== Update Lobby UI =====
function updateLobbyUI(){
    playersList.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.innerText = `Player ${p}`;
        playersList.appendChild(li);
    });
}

// ===== Start Game Button =====
startBtn.addEventListener('click', () => {
    if(players.length < 2) return alert('Wait for another player!');
    channel.send({type:'broadcast', event:'start', payload:{}});
});

// ===== Submit Move =====
submitBtn.addEventListener('click', () => {
    const num = parseInt(playerInput.value);
    if(num<1 || num>6) return alert('Enter 1-6');
    channel.send({type:'broadcast', event:'move', payload:{playerId, num}});
    playerInput.value='';
});

// ===== Update Game =====
function updateGame(payload){
    let otherPlayer = players.find(p => p!==payload.playerId);
    if(!otherPlayer) return;

    let opponentMove = Math.floor(Math.random()*6)+1; // Random opponent for testing
    logDiv.innerHTML += `<p>Player ${payload.playerId} played ${payload.num}, Opponent played ${opponentMove}</p>`;

    if(payload.num !== opponentMove){
        if(payload.playerId === players[0]) score.player1 += payload.num;
        else score.player2 += payload.num;
    } else {
        logDiv.innerHTML += `<p>Player ${payload.playerId} is out!</p>`;
    }

    scoreEl.innerText = `Score: ${score.player1} - ${score.player2}`;
}