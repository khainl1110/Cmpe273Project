import React, { useContext, useState, useEffect } from 'react';
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
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    // 📨 Send score to backend
    fetch('http://localhost:3001/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score }),
    }).catch(err => console.error('Score submission failed:', err));

    // 📥 Fetch leaderboard
    fetch('http://localhost:3001/api/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboardData(data || []))
      .catch(err => console.error('Leaderboard fetch failed:', err));
  }, [name, score]);

  const handlePlayAgain = () => {
    restartGame();
    navigate('/');
    socket.emit('reset');
    socket.disconnect();
    setTimeout(() => socket.connect(), 200);
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

    {/* ⚙️ Settings button */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10
        }}
      >
        <IconButton
          onClick={() => setShowThemes(!showThemes)}
          sx={{
            fontSize: '2rem',
            color: themes[theme].text,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(6px)',
            borderRadius: '12px'
          }}
          title="Theme Settings"
        >
          ⚙️
        </IconButton>

        {showThemes && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 1,
              p: 1,
              borderRadius: '10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(6px)',
              boxShadow: 1
            }}
          >
            {Object.keys(themes).map((key) => (
              <Button
                key={key}
                size="small"
                onClick={() => setTheme(key)}
                title={`Switch to ${key} theme`}
              >
                {themes[key].icon}
              </Button>
            ))}
          </Stack>
        )}
      </Box>


      <Typography variant="h3" sx={{ mb: 2, fontFamily: themes[theme].font }}>
        🎉 Game Over 🎉
      </Typography>

      <Typography variant="h5" sx={{ mb: 3 }}>
        {name ? `${name}, you scored ` : 'You scored '}<strong>{score}</strong>!
      </Typography>

      {/* 🏆 Leaderboard */}
      <Box
        sx={{
          mx: 'auto',
          maxWidth: 360,
          maxHeight: 300,
          overflowY: 'auto',
          textAlign: 'left',
          backgroundColor: theme === 'cute' || theme === 'clean' ? '#ffffffcc' : '#1a1a1a',
          color: theme === 'cute' || theme === 'clean' ? '#333' : themes[theme].text,
          borderRadius: '12px',
          p: 3,
          mb: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>🏆 Top 10 Leaderboard</Typography>
        {leaderboardData.length === 0 ? (
          <Typography variant="body2">Loading leaderboard...</Typography>
        ) : leaderboardData.map((entry, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 1,
              px: 1,
              py: 0.5,
              borderRadius: '6px',
              fontFamily: themes[theme].font,
              color: themes[theme].text,
              transition: '0.2s',
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

