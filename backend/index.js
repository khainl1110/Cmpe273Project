const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST'],
  credentials: true,
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

let score = 0;
let username = '';
let currentTopic = null;
let lastTenAnswers = [];

const sampleQuestions = require('./sampleQuestions.json'); // assume you have this file

// GPT QUESTION GENERATOR
async function generateAIQuestion(topic) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };

  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Generate a unique trivia question with 5 answer options in this JSON format: {question: string, options: string[], correctIndex: number}",
      },
      {
        role: "user",
        content: `Create a unique question about the topic: ${topic}`,
      }
    ],
    response_format: { type: "json_object" },
  };

  const response = await axios.post(OPENAI_API_URL, body, { headers });
  return JSON.parse(response.data.choices[0].message.content);
}

// API testing route (optional)
app.get('/api/generate', async (req, res) => {
  let topic = req.query.topic?.trim();
  if (!topic || topic.length < 3) topic = 'general';

  try {
    const question = await generateAIQuestion(topic);
    res.json(question);
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'API call failed', details: err.response?.data || err.message });
  }
});

// SOCKET.IO
io.on('connection', (socket) => {
  console.log('🟢 New client connected');

  socket.on('chat message', async (msg) => {
    let topic = currentTopic || 'general';

    if (typeof msg === 'object') {
      userName = msg.name || '';
      if (typeof msg.topic === 'string' && msg.topic.trim().length >= 3) {
        topic = msg.topic.trim();
        currentTopic = topic; // 🔒 persist once selected
      }
    } else if (typeof msg === 'string') {
      userName = msg;
    } else if (typeof msg === 'number') {
      score += msg;
    } else if (typeof msg === 'string') {
      username = msg;
    } else if (typeof msg === 'number') {
      score += msg;
    }

    const apiUrl = `http://localhost:3001/api/generate?topic=${encodeURIComponent(topic)}`;
    let attempt = 0;
    let chatMsg;
    let answerText;

    while (attempt < 2) {
      try {
        const res = await axios.get(apiUrl);
        chatMsg = res.data;
        answerText = chatMsg.options?.[chatMsg.correctIndex];

        const normalized = answerText?.toLowerCase().replace(/[^\w\s]/g, '').trim();

        if (!normalized || lastTenAnswers.includes(normalized)) {
          console.log(`⛔ Skipping duplicate or bad question: ${answerText}`);
          attempt++;
          continue;
        }

        lastTenAnswers.push(normalized);
        if (lastTenAnswers.length > 10) lastTenAnswers.shift();

        break; // exit loop on success
      } catch (err) {
        console.warn('⚠️ GPT error, falling back...', err.message);
        attempt++;
      }
    }

    if (!chatMsg) {
      const fallback = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
      chatMsg = fallback;
    }

    console.log(`{ topic: '${topic}', score: ${score} }`);
    socket.emit('chat message', chatMsg);
  });

  socket.on('reset', () => {
    score = 0;
    username = '';
    lastTenAnswers = [];
    console.log('🔁 Game reset');
  });

  socket.on('disconnect', () => {
    score = 0;
    username = '';
    console.log('🔌 Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

