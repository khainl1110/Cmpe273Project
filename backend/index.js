const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB (dev only - replace with env var in production)
const MONGO_URI = 'mongodb+srv://parakramdahal:BgCjNVghcuUEbuol@cluster0.ugp4oos.mongodb.net/quizApp?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Leader model
const { Schema, model } = mongoose;
const Leader = model('Leader', new Schema({
  name:     { type: String, required: true },
  score:    { type: Number, required: true },
  playedAt: { type: Date,   default: Date.now }
}));

const app = express();
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true,
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

let score = 0;
let currentTopic = null;
let recentAnswers = [];
let lastTenQuestions = [];

const sampleQuestions = require('./sampleQuestions.json');

// GPT QUESTION GENERATOR
async function generateAIQuestion(topic, avoidList = []) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };

  // const blockedWords = avoidList.join(', ') || 'none'; // NOTE: using the entire list might be too strict for gpt & it might ignore it
  const blockedWords = avoidList.slice(-10).join(', ') || 'none'; // block most recent 10 questions
  const body = {
    model: "gpt-4o-mini",
    messages:  [
        {
          role: "system",
          content: `
              You are a trivia question generator for a web game. Follow these instructions exactly:

              1. Create one trivia question strictly about: "${topic}".
              2. Do not include any content, phrases, or themes related to blocked content: "${blockedWords}". This includes alternate spellings or reworded forms.
              3. Output only a valid JSON object in this format:
                 { "question": string, "options": string[5], "correctIndex": number }
              4. Do not include explanations, formatting, markdown, or extra text of any kind.

              The question must:
              - Be clear and easy to understand
              - Include 5 realistic answer choices, one correct (randomly placed)
              - Be easy to medium in difficulty
              - Not reuse or paraphrase any blocked content
          `.trim(),
        },
        {
          role: "user",
          content: `Generate a trivia question about: "${topic}"`,
        },
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
    const question = await generateAIQuestion(topic, recentAnswers);
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
    let topic = currentTopic || 'fun and surprising trivia from a wide range of interesting topics';

    // Improve GPT variety for general knowledge
    if (topic.toLowerCase().includes('general knowledge')) {
      topic = 'fun and surprising trivia from a wide range of interesting topics';
    }

    if (typeof msg === 'object') {
      if (typeof msg.topic === 'string' && msg.topic.trim().length >= 3) {
        topic = msg.topic.trim();
        currentTopic = topic;
      }
    } else if (typeof msg === 'number') {
      score += msg;
    }

    let attempt = 0;
    let chatMsg;
    let answerText;

    while (attempt < 4) {
      try {
        chatMsg = await generateAIQuestion(topic, recentAnswers);
        answerText = chatMsg.options?.[chatMsg.correctIndex];

        const normalizedAnswer = answerText?.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const normalizedQuestion = chatMsg.question?.toLowerCase().replace(/[^\w\s]/g, '').trim();

        const isAnswerRepeat = !normalizedAnswer || recentAnswers.includes(normalizedAnswer);
        const isQuestionRepeat = !normalizedQuestion || lastTenQuestions.includes(normalizedQuestion);

        if (!isAnswerRepeat && !isQuestionRepeat) {
          recentAnswers.push(normalizedAnswer);
          lastTenQuestions.push(normalizedQuestion);
          if (recentAnswers.length > 15) recentAnswers.shift(); //
          if (lastTenQuestions.length > 15) lastTenQuestions.shift();
          break;
        }

        console.log(`🔁 Question: "${normalizedQuestion}"`);
        console.log(`🔁 Answer: "${normalizedAnswer}"`);
        console.log('🧠 Blocked Answers:', recentAnswers);
        console.log('🧠 Blocked Questions:', lastTenQuestions);
        console.log('❌ Skipping repeated question/answer');
        attempt++;
      } catch (err) {
        console.warn('⚠️ GPT error:', err.message);
        attempt++;
      }
    }

    if (!chatMsg) {
      console.warn('🚨 Using fallback sample question.');
      const fallback = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
      chatMsg = fallback;
    }

    console.log(`{ topic: '${topic}', score: ${score} }`);
    socket.emit('chat message', chatMsg);
  });
  socket.on('submit score', async ({ name, score: finalScore }) => {
    try {
      await new Leader({ name, score: finalScore }).save();
      // get top 10 and send back
      const top10 = await Leader.find()
        .sort({ score: -1, playedAt: 1 })
        .limit(10)
        .select('name score -_id');
      io.emit('leaderboard', top10);
    } catch (err) {
      console.error('❌ Error saving leaderboard:', err);
      socket.emit('leaderboard error', { message: 'Could not save score' });
    }
  });


  socket.on('reset', () => {
    score = 0;
    recentAnswers = [];
    lastTenQuestions = [];
    console.log('🔁 Game reset');
  });

  socket.on('disconnect', () => {
    score = 0;
    console.log('🔌 Client disconnected');
  });
});
// Leaderboard endpoint
app.get('/api/leaderboard', async (req, res) => {
  try {
    const top10 = await Leader.find()
      .sort({ score: -1, playedAt: 1 })
      .limit(10)
      .select('name score -_id');
    res.json(top10);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));