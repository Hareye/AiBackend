const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const { blackCards, whiteCards } = require('./cards.js');
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

const players = new Map();
const numStartingHand = 2;
var socketIds = new Array();

function chooseBlackCard() {
  let x = Math.floor(Math.random() * blackCards.length);
  return blackCards[x];
}

function chooseWhiteCards(numCards) {
  var arr = new Array();

  for (var i = 0; i < numCards; i++) {
    let x = Math.floor(Math.random() * whiteCards.length);
    arr.push(whiteCards[x]);
  }

  return arr;
}

function checkIfReady() {
  for (var i = 0; i < socketIds.length; i++) {
    if (players.get(socketIds[i]).ready == false) {
      return false;
    }
  }
  return true;
}

function generateCards(numWhiteCards) {
  io.emit("getBlackCard", chooseBlackCard());

  for (var i = 0; i < socketIds.length; i++) {
    console.log("Generating white cards for: " + socketIds[i]);
    io.to(socketIds[i]).emit("getWhiteCards", chooseWhiteCards(numWhiteCards));
  }
}

function checkForWin() {
  var scoreToWin = 10;
  var winners = new Array();
  var endGame = false;

  for (var i = 0; i < socketIds.length; i++) {
    if (players.get(socketIds[i]).score >= scoreToWin) {
      winners.add(socketIds[i]);
      endGame = true;
    }
  }

  if (endGame) {
    io.emit("gameEnd", winners);
  }
}

io.on('connection', (socket) => {
  console.log('A user has connected, socket id: ' + socket.id);
  socketIds.push(socket.id);

  players.set(socket.id, { id: socket.id, ready: false, score: 0 });
  io.emit('playerList', Array.from(players.values()));

  socket.on('disconnect', () => {
    console.log('A user has disconnected');
    players.delete(socket.id);
    if (socketIds.indexOf(socket.id) != -1) {
      socketIds.splice(socketIds.indexOf(socket.id), 1);
    }
    io.emit('playerList', Array.from(players.values()));
  });

  socket.on('ready', () => {
    players.get(socket.id).ready = true;
    if (checkIfReady()) {
      console.log("All players ready");
      generateCards(numStartingHand);
    }
    io.emit('playerList', Array.from(players.values()));
  });

  socket.on('notReady', () => {
    players.get(socket.id).ready = false;
    io.emit('playerList', Array.from(players.values()));
  });

  socket.on('addScore', (scoreToAdd) => {
    players.get(socket.id).score += scoreToAdd;
  })

  socket.on("newRound", () => {
    generateCards(1);
  })
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.use(cors(corsOptions));