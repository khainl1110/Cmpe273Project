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

io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('chat message1', (msg) => {
    io.emit('chat message1', msg);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
