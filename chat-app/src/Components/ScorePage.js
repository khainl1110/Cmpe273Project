import React, { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';
import { themes } from '../themes';
import { Box, Button, Typography, Stack, IconButton } from '@mui/material';
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  withCredentials: true,
  extraHeaders: { 'Access-Control-Allow-Origin': '*' }
});


function ScorePage({ restartGame }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { name, score } = location.state || { name: 'Player', score: 0 };

  const [showThemes, setShowThemes] = useState(false);

  const leaderboardData = [
    { name: 'Olivia', score: 6 },
    { name: 'Noah', score: 5 },
    { name: 'Emma', score: 5 },
    { name: 'Liam', score: 4 },
    { name: 'Ava', score: 4 },
    { name: 'Elijah', score: 3 },
    { name: 'Sophia', score: 3 },
    { name: 'Mason', score: 2 },
    { name: 'Isabella', score: 2 },
    { name: 'Logan', score: 1 },
    { name: 'Lucas', score: 1 },
    { name: 'Mila', score: 1 }
  ];

  const handlePlayAgain = () => {
    restartGame();
    navigate('/');
    socket.emit('reset');

    socket.disconnect();
    setTimeout(() => {
      socket.connect();
    }, 200);
  };

  return (
    <Box
      sx={{
        textAlign: 'center',
        p: 4,
        backgroundColor: themes[theme].background,
        color: themes[theme].text,
        minHeight: '150vh',
        fontFamily: themes[theme].font,
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
    >
      {/* ⚙️ Settings Button */}
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
        <IconButton onClick={() => setShowThemes(!showThemes)}>⚙️</IconButton>
        {showThemes && (
          <Stack direction="row" spacing={1} sx={{
            mt: 1,
            background: themes[theme].background,
            p: 1,
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            {Object.keys(themes).map((key) => (
              <Button key={key} size="small" onClick={() => setTheme(key)}>
                {themes[key].icon}
              </Button>
            ))}
          </Stack>
        )}
      </Box>

      <Typography variant="h3" sx={{ mb: 2, fontFamily: themes[theme].font }}>
        🎉 Game Over 🎉 
      </Typography>

      <Typography
        variant="h5"
        sx={{
          mb: 3,
          fontFamily: themes[theme].font,
          color: themes[theme].text
        }}
      >
        {name ? `${name}, you scored ` : 'You scored '}
        <strong>{score}</strong>!
      </Typography>

      {/* Leaderboard */}
        <Box
          sx={{
            mx: 'auto',
            maxWidth: 360,
            maxHeight: 300,
            overflowY: 'auto',
            textAlign: 'left',
            backgroundColor:
              theme === 'cute' || theme === 'clean'
                ? '#ffffffcc'
                : '#1a1a1a',
            color:
              theme === 'cute' || theme === 'clean'
                ? '#333'
                : themes[theme].text,
            borderRadius: '12px',
            p: 3,
            mb: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >

        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontFamily: themes[theme].font,
            color: themes[theme].text
          }}
        >
          🏆 Top 10 Leaderboard
        </Typography>

        {leaderboardData.map((entry, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              fontFamily: themes[theme].font,
              color: themes[theme].text,
              '&:hover': {
                fontWeight: 'bold',
                fontSize: '1.05rem',
                backgroundColor: '#f5f5f5',
              }
            }}
          >
            <span>{entry.name}</span>
            <span>{entry.score}</span>
          </Box>
        ))}
      </Box>

      {/* Play Again */}
      <Stack direction="row" spacing={2} justifyContent="center">
        <Button
          variant="contained"
          onClick={handlePlayAgain}
          sx={{
            width: '250px',
            height: '48px',
            fontSize: '1rem',
            fontWeight: 600,
            ...(theme === 'gamer'
              ? {
                  border: '2px solid #3CB74E',
                  color: '#3CB74E',
                  backgroundColor: '#000',
                  fontFamily: 'Courier New, monospace',
                  '&:hover': { backgroundColor: '#003300' },
                }
              : {
                  backgroundColor: themes[theme].primary,
                  color: '#fff',
                  borderRadius: '12px',
                  fontFamily: themes[theme].font,
                  '&:hover': {
                    backgroundColor: themes[theme].primaryHover,
                  },
                }),
          }}
        >
          Play Again
        </Button>
      </Stack>
    </Box>
  );
}

export default ScorePage;
