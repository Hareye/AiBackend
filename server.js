const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3001;

const themes = [
  "school"
]

import { blackCards, whiteCards } from './cards.js';

function chooseBlackCard() {
  let x = Math.floor(Math.random() * blackCards.length);
  return blackCards[x];
}

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
const players = new Map(); // Map to store connected players

io.on('connection', (socket) => {
  console.log('A user has connected');

  // Add the player to the players Map
  players.set(socket.id, { id: socket.id });

  // Emit the updated player list to all connected clients
  io.emit('playerList', Array.from(players.values()));

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('A user has disconnected');

    // Remove the player from the players Map
    players.delete(socket.id);

    // Emit the updated player list to all connected clients
    io.emit('playerList', Array.from(players.values()));
  });
  // Handle custom events here...
});

app.use(cors(corsOptions));