import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Stack } from '@mui/material';
import { ThemeContext } from './ThemeContext';
import MusicPlayer from './MusicPlayer';
import { themes } from '../themes';
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  withCredentials: true,
  extraHeaders: { 'Access-Control-Allow-Origin': '*' }
});


function GameScreen({ name, topic, selectedEmoji, resetToStart, restartGame }) {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [questionPool, setQuestionPool] = useState([]);
  const [usedIndices, setUsedIndices] = useState([]);
  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(10);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [skips, setSkips] = useState(3);
  const [timeUp, setTimeUp] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const handle = (msg) => {
      if (msg?.question && !questionPool.some(q => q.question === msg.question)) {
        setQuestionPool(prev => [...prev, msg]);
      }
    };
    socket.on('chat message', handle);

    if (!hasFetched) {
      socket.emit('chat message', { name, topic });
      setHasFetched(true);
    }

    return () => socket.off('chat message', handle);
  }, [name, topic, hasFetched, questionPool, score]);

  useEffect(() => {
    if (!question && questionPool.length >= 1) nextQuestion();
  }, [questionPool]);

  useEffect(() => {
    if (!question) return;
    let timerCleared = false;
    let handled = false;

    setTimer(10);

    const countdown = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          if (!handled) {
            handled = true;
            clearInterval(countdown);
            setTimeout(() => {
              if (!timerCleared) {
                handleMissed();
              }
            }, 50);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdown);
      timerCleared = true;
    };
  }, [question]);

  const nextQuestion = () => {
    const available = questionPool.map((_, i) => i).filter(i => !usedIndices.includes(i));

    if (available.length === 0) {
      setUsedIndices([]);
      socket.emit('chat message', { topic, score });
      return;
    }

    const idx = available[Math.floor(Math.random() * available.length)];
    setUsedIndices(prev => [...prev, idx]);
    setQuestion(questionPool[idx]);
    setTimeUp(false);

    if (available.length < 2) {
      socket.emit('chat message', score);
    }
  };

  const handleAnswer = (idx) => {
    if (timeUp || !question) return;
    const correct = idx === question.correctIndex;
    setSelectedIndex(idx);
    setShowResult(true);

    setTimeout(() => {
      setScore(s => correct ? s + 1 : s);
      if (!correct) setLives(l => (l <= 1 ? endGame() : l - 1));
      setSelectedIndex(null);
      setShowResult(false);
      nextQuestion();
    }, 1000);
  };

  const handleMissed = () => {
    setLives(l => l <= 1 ? endGame() : l - 1);
    setTimeUp(true);
    nextQuestion();
  };

  const skipQuestion = () => {
    if (skips <= 0) return;
    setSkips(s => s - 1);
    nextQuestion();
  };

  const endGame = () => navigate('/score', { state: { name, score } });

  return (
    <Box sx={{ p: 4, textAlign: 'center', fontFamily: themes[theme].font, backgroundColor: themes[theme].background, color: themes[theme].text, fontSize: '1.1rem', minHeight: '100vh', transition: 'background-color 0.4s ease' }}>
      <Box sx={{ position: 'absolute', top: 10, left: 10, fontSize: '1.5rem' }}>{selectedEmoji}</Box>

      <h2>Hey {name || 'Player'} 👋</h2>
      <p>❤️ Lives: {lives} | ⭐ Score: {score} | ⏱️ Time: {timer}s | ⏩ Skips: {skips}</p>

      {question && (
        <Box sx={{ mt: 4, p: 3, backgroundColor: (theme === 'cute' || theme === 'clean') ? '#fff' : '#2c2c2c', color: (theme === 'cute' || theme === 'clean') ? '#000' : themes[theme].text, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: 600, mx: 'auto' }}>
          <h3>{question.question}</h3>
          <Stack direction="column" spacing={2} mt={3}>
            {question.options.map((opt, i) => (
              <Button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={timeUp || showResult}
                sx={{
                  backgroundColor: showResult
                    ? i === question.correctIndex
                      ? '#66bb6a'
                      : i === selectedIndex
                      ? '#ef5350'
                      : themes[theme].button
                    : themes[theme].button,
                  color: themes[theme].text,
                  fontWeight: 600,
                  borderRadius: '10px',
                  px: 3,
                  py: 1.5,
                  fontSize: '1rem',
                  fontFamily: themes[theme].font,
                  '&:hover': {
                    backgroundColor: showResult ? undefined : themes[theme].buttonHover,
                  }
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
