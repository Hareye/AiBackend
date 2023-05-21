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
const cards = new Map();
const numStartingHand = 2;
const scoreToWin = 500;
const scoreMultiplier = 50;
var socketIds = new Array();
var submittedCards = 0;

// Helper methods
function chooseBlackCard() {
  let x = Math.floor(Math.random() * blackCards.length);
  return blackCards[x];
}

function chooseWhiteCards(numCards) {
  var arr = new Array();

  for (var i = 0; i < numCards; i++) {
    let x = Math.floor(Math.random() * whiteCards.length);
    arr.push(whiteCards[x]);
    whiteCards.splice(x, 1);
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

function aiChooseCard() {
  let x = Math.floor(Math.random() * socketIds.length)
  players.get(socketIds[x]).votes += 1;
}

function aiSubmitCard() {
  let x = Math.floor(Math.random() * whiteCards.length);
  cards.set("AI", { card: whiteCards[x], votes: 0 });
  whiteCards.splice(x, 1);
}

function checkForAllSubmitted() {
  if (submittedCards >= players.length) {
    submittedCards = 0;
    aiChooseCard();
    aiSubmitCard();
    return true;
  }
  return false;
}

function voteCard(sCard) {
  for (var i = 0; i < socketIds.length; i++) {
    if (players.get(socketIds[i]).card == sCard) {
      players.get(socketIds[i]).votes += 1;
      break;
    }
  }
}

function calculateScore(socket) {
  for (var i = 0; i < socketIds.length; i++) {
    if (players.get(socketIds[i]).votes > 0) {
      players.get(socket.id).score += votes * scoreMultiplier;
    }
  }
}

io.on('connection', (socket) => {
  console.log('A user has connected, socket id: ' + socket.id);
  socketIds.push(socket.id);

  players.set(socket.id, { id: socket.id, ready: false, score: 0 });
  io.emit('playerList', Array.from(players.values()));

  // Socket events
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

  socket.on("newRound", () => {
    generateCards(1);
  });

  socket.on("submitCard", (sCard) => {
    cards.set(socket.id, { card: sCard, votes: 0 });
    submittedCards++;
    checkForAllSubmitted();
  });

  socket.on("voteCard", (sCard) => {
    voteCard(sCard);
  });

  socket.on("calculateScore", () => {
    calculateScore(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.use(cors(corsOptions));