let player1Score = 0;
let player2Score = 0;

const submitBtn = document.getElementById('submit-btn');
const playerInput = document.getElementById('player-input');
const logDiv = document.getElementById('log');

submitBtn.addEventListener('click', () => {
    const playerNumber = parseInt(playerInput.value);
    if(playerNumber < 1 || playerNumber > 6) return alert('Enter 1-6');

    const computerNumber = Math.floor(Math.random() * 6) + 1; // simple opponent
    logDiv.innerHTML += `<p>You: ${playerNumber}, Opponent: ${computerNumber}</p>`;

    if(playerNumber !== computerNumber){
        player1Score += playerNumber;
    } else {
        logDiv.innerHTML += `<p>Out!</p>`;
        player1Score = 0; // reset for simplicity
    }

    document.getElementById('player1-score').innerText = `Player 1: ${player1Score}`;
    document.getElementById('player2-score').innerText = `Player 2: ${player2Score}`;

    playerInput.value = '';
});