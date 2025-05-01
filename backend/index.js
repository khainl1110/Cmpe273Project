const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

let lastQuestionIndex = -1;

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

// the secret got remove
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

step = 0;
userName = '';
let chatMsg = {};
let score = 0;
// let questions = [];

// Game state and questions
const questions = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    end: false,
    correctIndex: 1
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    end: false,
    correctIndex: 1
  },
  {
    id: 3,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
    end: false,
    correctIndex: 2
  },
  {
    id: 4,
    question: "Who wrote the play 'Romeo and Juliet'?",
    options: ["William Shakespeare", "Jane Austen", "Mark Twain", "Charles Dickens"],
    end: false,
    correctIndex: 0
  },
  {
    id: 5,
    question: "Which element has the chemical symbol 'O'?",
    options: ["Osmium", "Oxygen", "Gold", "Zinc"],
    end: false,
    correctIndex: 1
  },
  {
    id: 6,
    question: "Which country is home to the kangaroo?",
    options: ["New Zealand", "India", "Australia", "South Africa"],
    end: false,
    correctIndex: 2
  },
  {
    id: 7,
    question: "What is the name of the fairy in Peter Pan?",
    options: ["Silvermist", "Tinker Bell", "Rosetta", "Fawn"],
    end: false,
    correctIndex: 1
  }
];

console.log("Your API key:", OPENAI_API_KEY);

// GPT Question Generator
async function generateQuestion(topic) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    };

    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Generate a quiz question with 5 options in JSON format: {question: string, options: string[], correctIndex: number}"
        },
        {
          role: "user",
          content: `Create a question about ${topic}`
        }
      ],
      response_format: { type: "json_object" }
    };

    const response = await axios.post(OPENAI_API_URL, body, { headers });
    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('GPT API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Single API endpoint
app.get('/api/generate', async (req, res) => {
  const topic = req.query.topic || 'general';
  try {
    const question = await generateQuestion(topic);
    res.json(question);
  } catch (error) {
    res.status(500).json({ 
      error: 'API call failed',
      details: error.response?.data || error.message 
    });
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

socket.on('chat message', (msg) => {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * questions.length);
  } while (newIndex === lastQuestionIndex && questions.length > 1);
  lastQuestionIndex = newIndex;

  if (typeof msg === 'string') {
    userName = msg;
  } else {
    score += parseInt(msg, 10);
  }

  chatMsg = questions[newIndex];
  io.emit('chat message', chatMsg);
});


  socket.on('reset', () => {
    step = 0;
    score = 0;
    console.log('Game state reset');
  });

  socket.on('disconnect', () => {
    step = 0;
    score = 0;
    console.log('Client disconnected');
  });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));