// ==== Firebase Setup ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4BAOLryVquqH_tqYPHUi4RypwOvWqrLo",
  authDomain: "iiiiiiii-1b65f.firebaseapp.com",
  databaseURL: "https://iiiiiiii-1b65f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iiiiiiii-1b65f",
  storageBucket: "iiiiiiii-1b65f.firebasestorage.app",
  messagingSenderId: "351966581285",
  appId: "1:351966581285:web:a9c36086e659fd6048a5cc",
  measurementId: "G-LC4HKZZDG2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==== Game Variables ====
let playerName = "";
let playerId = "";
let roomId = "";

// ==== UI Helpers ====
function show(id) { document.getElementById(id).classList.remove("hidden"); }
function hide(id) { document.getElementById(id).classList.add("hidden"); }

function computeSR(runs, balls) {
  return balls > 0 ? ((runs / balls) * 100).toFixed(2) : "0.00";
}

// ==== Room Management ====
async function createRoom() {
  playerName = document.getElementById("playerName").value;
  if (!playerName) return alert("Enter name");
  playerId = "player1";
  roomId = Math.floor(1000 + Math.random() * 9000).toString();

  const gameRef = ref(db, "games/" + roomId);
  await set(gameRef, {
    roomId,
    inning: 1,
    batting: "player1",
    bowling: "player2",
    player1: { name: playerName, runs: 0, balls: 0, wickets: 0 },
    player2: { name: "Waiting...", runs: 0, balls: 0, wickets: 0 }
  });

  startGame();
}

async function joinRoom() {
  playerName = document.getElementById("playerName").value;
  if (!playerName) return alert("Enter name");
  roomId = document.getElementById("joinCode").value;
  if (!roomId) return alert("Enter room code");
  playerId = "player2";

  const gameRef = ref(db, "games/" + roomId + "/player2");
  await set(gameRef, { name: playerName, runs: 0, balls: 0, wickets: 0 });

  startGame();
}

// ==== Start Game ====
function startGame() {
  hide("setup");
  show("game");
  document.getElementById("roomInfo").innerText = "Room Code: " + roomId;

  const gameRef = ref(db, "games/" + roomId);
  onValue(gameRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    // Update scoreboard
    document.getElementById("p1Name").innerText = data.player1.name;
    document.getElementById("p1Runs").innerText = data.player1.runs;
    document.getElementById("p1Balls").innerText = data.player1.balls;
    document.getElementById("p1Wkts").innerText = data.player1.wickets;
    document.getElementById("p1SR").innerText = computeSR(data.player1.runs, data.player1.balls);

    document.getElementById("p2Name").innerText = data.player2.name;
    document.getElementById("p2Runs").innerText = data.player2.runs;
    document.getElementById("p2Balls").innerText = data.player2.balls;
    document.getElementById("p2Wkts").innerText = data.player2.wickets;
    document.getElementById("p2SR").innerText = computeSR(data.player2.runs, data.player2.balls);

    // Announcement
    document.getElementById("announcement").innerText =
      `${data[data.batting].name} is Batting | ${data[data.bowling].name} is Bowling`;
  });
}

// ==== Play Move ====
async function playMove(num) {
  if (!roomId) return;
  const gameRef = ref(db, "games/" + roomId);
  const snap = await get(gameRef);
  if (!snap.exists()) return;
  const data = snap.val();

  let batter = data.batting;
  let bowler = data.bowling;

  // Store move
  if (!data.currentMove) data.currentMove = {};
  data.currentMove[playerId] = num;

  // Wait until both players play
  if (data.currentMove.player1 && data.currentMove.player2) {
    const batNum = data.currentMove[batter];
    const bowlNum = data.currentMove[bowler];
    let out = false;

    if (batNum === bowlNum) {
      // OUT
      data[batter].wickets += 1;
      out = true;

      // Switch innings if 1st inning ends
      if (data.inning === 1) {
        data.inning = 2;
        data.batting = bowler;
        data.bowling = batter;
      } else {
        // Game Over
        document.getElementById("announcement").innerText = "Game Over!";
      }
    } else {
      // Runs
      data[batter].runs += batNum;
    }

    data[batter].balls += 1;

    // Clear current move
    data.currentMove = {};

    await update(gameRef, data);

    // Animate ball
    animateBall(batNum, bowlNum, out);
  } else {
    await update(gameRef, { currentMove: data.currentMove });
  }
}

// ==== Animations ====
function animateBall(batNum, bowlNum, out) {
  const ball = document.createElement("div");
  ball.className = "ball";
  document.body.appendChild(ball);
  ball.style.setProperty("--sx", "0px");
  ball.style.setProperty("--sy", "0px");
  ball.style.setProperty("--tx", "300px");
  ball.style.setProperty("--ty", "200px");
  ball.style.animation = "fly 900ms ease-in-out";
  ball.addEventListener("animationend", () => {
    ball.remove();
    if (out) alert("OUT!");
    else alert("Runs: " + batNum);
  });
}

// Expose functions
window.createRoom = createRoom;
window.joinRoom = joinRoom;
window.playMove = playMove;