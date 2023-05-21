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
var votedCards = 0;
var czarIndex = -1;
var turn = 0;
var localWhiteCards;

// Helper methods
function chooseBlackCard() {
  let x = Math.floor(Math.random() * blackCards.length);
  return blackCards[x];
}

function chooseWhiteCards(numCards) {
  var arr = new Array();

  for (var i = 0; i < numCards; i++) {
    let x = Math.floor(Math.random() * localWhiteCards.length);
    arr.push(localWhiteCards[x]);
    localWhiteCards.splice(x, 1);
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

function aiVoteCard() {
  let x = Math.floor(Math.random() * socketIds.length)
  players.get(socketIds[x]).votes += 1;
}

function aiSubmitCard() {
  let x = Math.floor(Math.random() * localWhiteCards.length);
  cards.set("AI", { card: localWhiteCards[x], votes: 0 });
  localWhiteCards.splice(x, 1);
}

function checkForAllSubmitted() {
  if (submittedCards >= socketIds.length -1) {
    submittedCards = 0;
    aiVoteCard();
    aiSubmitCard();
    return true;
  }
  return false;
}

function checkForAllVoted() {
  for (var i = 0; i < cards.values().length; i++) {
    votedCards += cards.get(socketIds[i]).votes;
  }

  if (votedCards >= socketIds.length + 1) {
    votedCards = 0;
    return true;
  }
  return false;
}

function voteCard(sCard) {
  if (cards.get("AI").card == sCard) {
    cards.get("AI").votes += 1;
  } else {
    for (var i = 0; i < socketIds.length; i++) {
      if (cards.get(socketIds[i]).card == sCard) {
        cards.get(socketIds[i]).votes += 1;
        break;
      }
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

function chooseCzar() {
  if (czarIndex == socketIds.length - 1) {
    czarIndex = 0;
  } else {
    czarIndex = czarIndex + 1;
  }
}

function nextTurn(numCards) {
  generateCards(numCards);
  chooseCzar();
  turn++;

  io.emit("czar", socketIds[czarIndex]);
  io.emit("turn", turn);
}

function checkNoPlayers() {
  if (socketIds.length == 0) {
    return true;
  }
  return false;
}

function resetGame() {
  players.clear();
  cards.clear();
  localWhiteCards = [...whiteCards];
  submittedCards = 0;
  votedCards = 0;
  czarIndex = -1;
  turn = 0;
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
    if (cards.has(socket.id)) {
      cards.delete(socket.id);
    }
    if (socketIds.indexOf(socket.id) != -1) {
      socketIds.splice(socketIds.indexOf(socket.id), 1);
    }
    if (checkNoPlayers()) {
      console.log("All players disconnected, resetting game");
      resetGame();
    }
    io.emit('playerList', Array.from(players.values()));
  });

  socket.on('ready', () => {
    players.get(socket.id).ready = true;
    if (checkIfReady()) {
      console.log("All players ready");
      localWhiteCards = [...whiteCards];
      nextTurn(numStartingHand);
    }
    io.emit('playerList', Array.from(players.values()));
  });

  socket.on('notReady', () => {
    players.get(socket.id).ready = false;
    io.emit('playerList', Array.from(players.values()));
  });

  socket.on("submitCard", (sCard) => {
    console.log("Card was submitted: ", sCard);
    cards.set(socket.id, { card: sCard, votes: 0 });
    submittedCards++;

    if (checkForAllSubmitted()) {
      console.log("All players have submitted");
      io.emit("sendSubmittedCards", Array.from(cards.values()));
    }
  });

  socket.on("voteCard", (sCard) => {
    voteCard(sCard);

    if (checkForAllVoted()) {
      console.log("All players have voted");
      calculateScore(socket);
      io.emit("playerList", Array.from(players.values()));
      nextTurn(1);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

app.use(cors(corsOptions));