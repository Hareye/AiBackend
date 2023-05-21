const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://localhost:3000",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3001;

const themes = [
    "school"
]
const blackCards = [
    "During recess, the cafeteria served up a surprise dish: spaghetti topped with ____________.",
    "The school library became an unexpected dance party when the librarian started spinning records on a ____________.",
    "In the middle of a history lecture, the teacher transformed into a ____________, reciting the lesson in rap form.",
    "The school bus ride turned into a wild adventure when a herd of ____________ stampeded across the road.",
    "During art class, the paintbrushes mysteriously transformed into ____________, creating abstract masterpieces.",
    "The school principal announced a new dress code rule: every student must wear ____________ as part of their uniform.",
    "During chemistry class, a student's experiment resulted in a puff of smoke and a chorus of ____________.",
    "The school mascot surprised everyone by unveiling a hidden talent: breakdancing dressed as ____________.",
    "The school assembly turned into a magic show when the guest performer pulled a ____________ out of a hat.",
    "In a bizarre turn of events, the school's marching band replaced their instruments with ____________, creating a unique sound."
]
const whiteCards = [
    "Rubber duck",
    "Disco ball",
    "Dancing giraffe",
    "Flying pig",
    "Spaghetti monster",
    "Bubble wrap",
    "Sock puppet",
    "Inflatable dinosaur",
    "Banana suit",
    "Invisible cloak",
    "Cupcake cannon",
    "Mustache wig",
    "Bubblegum blaster",
    "Pogo stick shoes",
    "Saxophone-playing robot",
    "Dancing broomstick",
    "Rainbow-colored wig",
    "Sneezing unicorn",
    "Glow-in-the-dark sneakers",
    "Singing toaster",
    "Electric kazoo",
    "Giant rubber band ball",
    "Confetti-shooting umbrella",
    "Jumping pogo carrot",
    "Flamingo on roller skates",
    "Tuba-playing octopus",
    "Hula hoop with bells",
    "Funky disco shoes",
    "Squirting flower bouquet",
    "Parrot on a unicycle",
    "Glitter cannon",
    "Acrobatic hamster",
    "Banana phone",
    "Saxophone-playing chicken",
    "Magic wand with sparkles",
    "Silly string shooter",
    "Twirling baton made of spaghetti",
    "Dancing watermelon",
    "Cackling rubber chicken",
    "Bagpipes made of bubble wrap",
    "Juggling rubber chickens",
    "Pencil with springs",
    "Giant inflatable sunglasses",
    "Tap-dancing goldfish",
    "Singing toilet paper roll",
    "Trumpet-playing gorilla",
    "Yo-yo that lights up",
    "Whistling teapot",
    "Dancing rubber boots",
    "Kazoo orchestra"
]

function chooseBlackCard() {
    let x = Math.floor(Math.random() * blackCards.length);
    return blackCards[x];
}

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('getBlackCard', (msg) => {
    io.emit('blackCards', chooseBlackCard());
  });
});