const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();

// Configure CORS for Express
app.use(cors({
  origin: 'http://localhost:3001', // Replace with your client's URL
  methods: ['GET', 'POST'],
  credentials: true
}));

const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001', // Replace with your client's URL
    methods: ['GET', 'POST'],
    credentials: true
  }
});

step = 0;
chatMsg = "";

// Game state and questions
const questions = [
  {
    id: 1,
    text: "What is the capital of France?",
    answers: ["London", "Paris", "Berlin", "Madrid"],
    correct: 1
  },
  {
    id: 2,
    text: "Which planet is known as the Red Planet?",
    answers: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 2
  }
];



io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('chat message', (msg) => {
    console.log(questions[step].correct + " " + msg)
    if(questions[step].correct == (msg-1)) {
      chatMsg = 'Correct message';
    } else chatMsg = 'Uncorrect message';
    

   
    step += 1;
    if(step == 2)
      step = 0;
    io.emit('chat message', chatMsg);
  });

  // socket.on('chat message1', (msg) => {
  //   io.emit('chat message1', msg);
  // });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
