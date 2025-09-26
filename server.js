// server.js
// Run: npm install ws
// Start: node server.js

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let games = {}; // gameId -> { players: [], moves: [], turnIndex: 0, maxTurns: 4, status: 'waiting' }

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const { action, gameId, playerId, num } = data;

            if(action === 'host'){
                const id = Math.floor(10000 + Math.random()*90000).toString();
                games[id] = { players: [playerId], moves: [], turnIndex: 0, maxTurns: 4, status: 'waiting' };
                ws.gameId = id;
                ws.playerId = playerId;
                ws.send(JSON.stringify({ action:'hosted', gameId:id }));
            }

            if(action === 'join'){
                if(!games[gameId] || games[gameId].players.length>=2){
                    ws.send(JSON.stringify({ action:'error', message:'Invalid or full game'}));
                    return;
                }
                games[gameId].players.push(playerId);
                ws.gameId = gameId;
                ws.playerId = playerId;
                broadcastGame(gameId);
            }

            if(action === 'start'){
                const game = games[gameId];
                if(game && game.players.length===2){
                    game.status = 'started';
                    broadcastGame(gameId);
                }
            }

            if(action === 'move'){
                const game = games[gameId];
                if(!game || game.status!=='started') return;
                if(game.players[game.turnIndex] !== playerId) return; // enforce turn

                game.moves.push({ playerId, num });
                game.turnIndex = (game.turnIndex + 1) % 2;
                if(game.moves.length >= game.maxTurns * 2) game.status = 'finished';
                broadcastGame(gameId);
            }

        } catch(e){ console.log(e); }
    });
});

function broadcastGame(gameId){
    const game = games[gameId];
    if(!game) return;
    wss.clients.forEach(client => {
        if(client.readyState === WebSocket.OPEN && client.gameId === gameId){
            client.send(JSON.stringify({ action:'update', game }));
        }
    });
}

console.log('WebSocket server running on ws://localhost:8080');