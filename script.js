// ---------- Supabase setup ----------
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

// ---------- Game Variables ----------
let gameId = null;
let playerId = Math.floor(Math.random() * 10000); // unique for this session
let players = [];
let score = {host:0, guest:0};
let channel = null;
let isHost = false;

// ---------- HOST GAME ----------
hostBtn.addEventListener('click', async () => {
    isHost = true;
    gameId = Math.floor(10000 + Math.random() * 90000).toString();
    generatedIdEl.innerText = `Game ID: ${gameId}`;
    
    // Save Game ID in Supabase table
    await supabase.from('games').upsert({game_id: gameId, host_id: playerId, players: [playerId]});

    setupChannel();
    addPlayerToLobby();
});

// ---------- JOIN GAME ----------
joinBtn.addEventListener('click', async () => {
    const enteredId = joinIdInput.value.trim();
    if(!enteredId) return alert('Enter Game ID');

    // Check if game exists
    const {data, error} = await supabase.from('games').select('*').eq('game_id', enteredId).single();
    if(error || !data) return alert('Game ID not found');

    gameId = enteredId;
    setupChannel();
    addPlayerToLobby();
});

// ---------- SETUP CHANNEL ----------
function setupChannel() {
    channel = supabase.channel('game-' + gameId);

    // Listen for lobby join
    channel.on('broadcast', {event:'join'}, payload => {
        if(!players.includes(payload.playerId)) players.push(payload.playerId);
        updateLobbyUI();
    });

    // Listen for game start
    channel.on('broadcast', {event:'start'}, payload => {
        lobbyDiv.style.display = 'none';
        gameDiv.style.display = 'block';
        logDiv.innerHTML += '<p>Game Started!</p>';
    });

    // Listen for moves
    channel.on('broadcast', {event:'move'}, payload => {
        updateGame(payload);
    });

    channel.subscribe();
}

// ---------- ADD PLAYER TO LOBBY ----------
function addPlayerToLobby() {
    channel.send({type:'broadcast', event:'join', payload:{playerId}});
}

// ---------- UPDATE LOBBY UI ----------
function updateLobbyUI() {
    playersList.innerHTML = '';
    players.forEach(p => {
        const li = document.createElement('li');
        li.innerText = `Player ${p}`;
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
    const num = parseInt(playerInput.value);
    if(num<1 || num>6) return alert('Enter 1-6');
    channel.send({type:'broadcast', event:'move', payload:{playerId, num}});
    playerInput.value='';
});

// ---------- UPDATE GAME ----------
function updateGame(payload) {
    // Determine if host or guest
    const isPayloadHost = (payload.playerId === players[0]);
    const opponentMove = Math.floor(Math.random()*6)+1; // For testing (can replace with actual opponent move if both players input)

    logDiv.innerHTML += `<p>Player ${payload.playerId} played ${payload.num}, Opponent played ${opponentMove}</p>`;

    if(payload.num !== opponentMove){
        if(isPayloadHost) score.host += payload.num;
        else score.guest += payload.num;
    } else {
        logDiv.innerHTML += `<p>Player ${payload.playerId} is out!</p>`;
    }

    scoreEl.innerText = `Score: ${score.host} - ${score.guest}`;
}