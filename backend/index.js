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
let lastTenQuestions = [];

const sampleQuestions = require('./sampleQuestions.json'); // assume you have this file

// GPT QUESTION GENERATOR
async function generateAIQuestion(topic, avoidList = []) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };

  const blockedWords = avoidList.join(', ') || 'none';
  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Generate a unique trivia question with 5 answer options in this JSON format: {question: string, options: string[], correctIndex: number}",
      },
      {
        role: "user",
        content: `1. Create a trivia question specifically about: "${topic}" 2. The questions CANNOT be about these topics: "${blockedWords}"`,
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
  if (!topic || topic.length < 3) topic = 'general knowledge';

  try {
    const question = await generateAIQuestion(topic, lastTenAnswers);
    res.json(question);
  } catch (err) {
    console.error('API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'API call failed', details: err.response?.data || err.message });
  }
});

const path = require('path');
const fs = require('fs');
app.use('/music', express.static(path.join(__dirname, '..', 'chat-app', 'public', 'music')));
app.get('/api/music-list', (req, res) => {
  const musicDir = path.join(__dirname, '..', 'chat-app', 'public', 'music');
  fs.readdir(musicDir, (err, files) => {
    if (err) {
      console.error('Failed to read music directory:', err);
      return res.status(500).json([]);
    }
    const mp3s = files.filter(f => f.endsWith('.mp3')).map(f => `/music/${f}`);
    res.json(mp3s);
  });
});

// SOCKET.IO

io.on('connection', (socket) => {
  console.log('🟢 New client connected');

  socket.on('chat message', async (msg) => {
    let topic = currentTopic || 'general knowledge';

    if (typeof msg === 'object') {
      username = msg.name || '';
      if (typeof msg.topic === 'string' && msg.topic.trim().length >= 3) {
        topic = msg.topic.trim();
        currentTopic = topic;
      }
    } else if (typeof msg === 'string') {
      username = msg;
    } else if (typeof msg === 'number') {
      score += msg;
    }

    let attempt = 0;
    let chatMsg;
    let answerText;

    while (attempt < 4) {
      try {
        chatMsg = await generateAIQuestion(topic, lastTenAnswers);
        answerText = chatMsg.options?.[chatMsg.correctIndex];

        const normalizedAnswer = answerText  
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '') // remove everything except letters + numbers
          .trim();

        const normalizedQuestion = chatMsg.question?.toLowerCase().replace(/[^\w\s]/g, '').trim();

        const isAnswerRepeat = !normalizedAnswer || lastTenAnswers.includes(normalizedAnswer);
        const isQuestionRepeat = !normalizedQuestion || lastTenQuestions.includes(normalizedQuestion);

        if (isAnswerRepeat || isQuestionRepeat) {
          console.log(`❌ Skipping repeated content`);
          console.log(`🔁 Answer: "${normalizedAnswer}"`);
          console.log(`🔁 Question: "${normalizedQuestion}"`);
          console.log(`🧠 Blocked Answers: [${lastTenAnswers.join(', ')}]`);
          console.log(`🧠 Blocked Questions: [${lastTenQuestions.join(', ')}]`);
          attempt++;
          continue;
        }

        lastTenAnswers.push(normalizedAnswer);
        lastTenQuestions.push(normalizedQuestion);
        if (lastTenAnswers.length > 15) lastTenAnswers.shift(); // saving 15 answers for now, not 10
        if (lastTenQuestions.length > 15) lastTenQuestions.shift();

        break;
      } catch (err) {
        console.warn('⚠️ GPT error, falling back...', err.message);
        attempt++;
      }
    }

    if (!chatMsg) {
      console.warn('🚨 All GPT attempts failed or repeated. Using fallback.');
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
    lastTenQuestions = [];
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

