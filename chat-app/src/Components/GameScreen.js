import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack } from '@mui/material';
import { ThemeContext } from './ThemeContext';
import { themes } from '../themes';
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  withCredentials: true,
  extraHeaders: { 'Access-Control-Allow-Origin': '*' }
});

function GameScreen({ name }) {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);

  const [questionPool, setQuestionPool] = useState([]);
  const [usedIndices, setUsedIndices] = useState([]);
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(10);
  const [timeUp, setTimeUp] = useState(false);
  const [lives, setLives] = useState(3);
  const [skips, setSkips] = useState(3);
  const [hasFetched, setHasFetched] = useState(false);

  // Fetch 3 questions spaced out slightly to prevent duplicates
  useEffect(() => {
    const handle = (msg) => {
      if (msg?.question && !questionPool.some(q => q.question === msg.question)) {
        setQuestionPool(prev => [...prev, msg]);
      }
    };
    socket.on('chat message', handle);

    if (!hasFetched) {
      socket.emit('chat message', name);
      [0, 100, 200].forEach(d => setTimeout(() => socket.emit('chat message', score), d));
      setHasFetched(true);
    }

    return () => socket.off('chat message', handle);
  }, [name, hasFetched, questionPool, score]);

  useEffect(() => {
    if (!question && questionPool.length >= 1) nextQuestion();
  }, [questionPool]);

  useEffect(() => {
    if (!question) return;
    setTimer(10);
    const countdown = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(countdown);
          handleMissed();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [question]);

  const nextQuestion = () => {
    const available = questionPool.map((_, i) => i).filter(i => !usedIndices.includes(i));
    if (available.length === 0) {
      setUsedIndices([]);
      socket.emit('chat message', score);
      return;
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    setUsedIndices(prev => [...prev, idx]);
    setQuestion(questionPool[idx]);
    setTimeUp(false);
    if (available.length < 2) socket.emit('chat message', score);
  };

  const handleAnswer = (idx) => {
    if (timeUp || !question) return;
    const correct = idx === question.correctIndex;
    setScore(s => correct ? s + 1 : s);
    if (!correct) setLives(l => (l <= 1 ? endGame() : l - 1));
    nextQuestion();
  };

  const handleMissed = () => {
    setLives(l => (l <= 1 ? endGame() : l - 1));
    setTimeUp(true);
    nextQuestion();
  };

  const skipQuestion = () => {
    if (skips <= 0) return;
    setSkips(s => s - 1);
    nextQuestion();
  };

  const endGame = () => navigate('/score', { state: { name, score } });

  const restartGame = () => {
    socket.emit('reset');
    setQuestion(null);
    setQuestionPool([]);
    setUsedIndices([]);
    setScore(0);
    setLives(3);
    setSkips(3);
    setTimer(10);
    setTimeUp(false);
    setHasFetched(false);
    socket.disconnect();
    setTimeout(() => {
      socket.connect();
      navigate('/');
    }, 200);
  };

  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        fontFamily: themes[theme].font,
        backgroundColor: themes[theme].background,
        color: themes[theme].text,
        fontSize: '1.1rem',
        minHeight: '100vh',
        transition: 'background-color 0.4s ease'
      }}
    >
      <h2>Hey {name || 'Player'} 👋</h2>
      <p>❤️ Lives: {lives} | ⭐ Score: {score} | ⏱️ Time: {timer}s | ⏩ Skips: {skips}</p>

      {question && (
        <Box
          sx={{
            mt: 4,
            p: 3,
            backgroundColor: (theme === 'cute' || theme === 'clean') ? '#fff' : '#2c2c2c',
            color: (theme === 'cute' || theme === 'clean') ? '#000' : themes[theme].text,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          <h3>{question.question}</h3>
          <Stack direction="column" spacing={2} mt={3}>
            {question.options.map((opt, i) => (
              <Button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={timeUp}
                sx={{
                  backgroundColor: themes[theme].button,
                  color: themes[theme].text,
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontFamily: themes[theme].font,
                  '&:hover': { backgroundColor: themes[theme].buttonHover }
                }}
              >
                {opt}
              </Button>
            ))}
          </Stack>

          <Stack direction="row" spacing={2} mt={4} justifyContent="center">
            <Button
              onClick={skipQuestion}
              disabled={skips === 0}
              sx={{ backgroundColor: '#fdd835', color: '#000', fontWeight: 600, borderRadius: '12px', px: 3, py: 1 }}
            >
              ⏩ Skip
            </Button>
            <Button
              onClick={restartGame}
              sx={{ backgroundColor: '#f06292', color: '#fff', fontWeight: 700, borderRadius: '12px', px: 3, py: 1 }}
            >
              🔁 Restart
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default GameScreen;
