// ====== Supabase Configuration ======
const SUPABASE_URL = 'https://ignadfdvsitdelovinjw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbmFkZmR2c2l0ZGVsb3Zpbmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTQzNjcsImV4cCI6MjA3NDQ3MDM2N30.NUTuM7AQESO2HN53A2LY1tk8UBGENCl-vJtnFfg33fI';
const TEAM1_NAME = 'Team India A';
const TEAM2_NAME = 'Team India B';
// ===================================

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Unique player ID
const playerId = Math.floor(Math.random() * 10000);

// DOM Elements
const playersList = document.getElementById('players');
const startBtn = document.getElementById('start-btn');
const lobbyDiv = document.getElementById('lobby');
const gameDiv = document.getElementById('game');
const logDiv = document.getElementById('log');
const submitBtn = document.getElementById('submit-btn');
const playerInput = document.getElementById('player-input');
const team1ScoreEl = document.getElementById('team1-score');
const team2ScoreEl = document.getElementById('team2-score');

let team1Score = 0;
let team2Score = 0;
let gameStarted = false;

// ====== Supabase Lobby Channel ======
const channel = supabase.channel('lobby');

channel.on('broadcast', { event: 'join' }, payload => {
    // Add player to lobby list
    const li = document.createElement('li');
    li.innerText = 'Player ' + payload.playerId;
    playersList.appendChild(li);
}).subscribe();

// Join lobby
channel.send({ type: 'broadcast', event: 'join', payload: { playerId } });

// Start Game
startBtn.addEventListener('click', () => {
    lobbyDiv.style.display = 'none';
    gameDiv.style.display = 'block';
    gameStarted = true;
    channel.send({ type: 'broadcast', event: 'start', payload: {} });
    logDiv.innerHTML += `<p>Game Started!</p>`;
});

// ====== Game Play ======
submitBtn.addEventListener('click', () => {
    if(!gameStarted) return alert('Game has not started!');
    const playerNumber = parseInt(playerInput.value);
    if(playerNumber < 1 || playerNumber > 6) return alert('Enter 1-6');

    // Send move to all players
    channel.send({
        type: 'broadcast',
        event: 'move',
        payload: { playerId, move: playerNumber }
    });

    playerInput.value = '';
});

// Receive moves
channel.on('broadcast', { event: 'move' }, payload => {
    // Simulate opponent move
    const opponentMove = Math.floor(Math.random() * 6) + 1;

    logDiv.innerHTML += `<p>Player ${payload.playerId} played ${payload.move}, Opponent played ${opponentMove}</p>`;

    if(payload.move !== opponentMove){
        team1Score += payload.move; // Team 1 scores
    } else {
        logDiv.innerHTML += `<p>Player ${payload.playerId} is out!</p>`;
    }

    team1ScoreEl.innerText = `${TEAM1_NAME}: ${team1Score}`;
    team2ScoreEl.innerText = `${TEAM2_NAME}: ${team2Score}`;
});