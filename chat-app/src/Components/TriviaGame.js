import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, TextField, Stack, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';
import { themes } from '../themes';
import GameScreen from './GameScreen';

function TriviaGame() {
  const navigate = useNavigate();
  const { theme, setTheme } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showThemes, setShowThemes] = useState(false);

  // ✅ Theme-based cursor logic HERE
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'gamer') {
      root.style.setProperty('--cursor-color', '#3CB74E');
      root.style.setProperty('--cursor-char', '"_"');
    } else if (theme === 'cute') {
      root.style.setProperty('--cursor-color', '#f48fb1');
      root.style.setProperty('--cursor-char', '"❀"');
    } else {
      root.style.setProperty('--cursor-color', themes[theme]?.text || '#333');
      root.style.setProperty('--cursor-char', '"|"');
    }
  }, [theme]);

  const startGame = () => {
    setHasStarted(true); 
  };

  const resetToStart = () => {
    setName('');          // ← reset the name to empty
    setHasStarted(false); // ← go back to welcome screen
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
        transition: 'background-color 0.4s ease',
      }}
    >
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <IconButton onClick={() => setShowThemes(!showThemes)}>⚙️</IconButton>
        {showThemes && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {Object.keys(themes).map((key) => (
              <Button key={key} size="small" onClick={() => setTheme(key)}>
                {themes[key].icon}
              </Button>
            ))}
          </Stack>
        )}
      </div>

      {!hasStarted ? (
        <>
          <h2>
            👋 Welcome to Speed Trivia
            <span className="blinking-cursor"></span>
          </h2>

          <TextField
  placeholder="Enter your name"
  variant="standard"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') startGame();
  }}
  InputProps={{
    disableUnderline: true,
    sx: {
      backgroundColor: theme === 'gamer' ? '#000' : '#fff',
      color: theme === 'night' ? '#000' : themes[theme].text,
      border: theme === 'gamer' ? '1px solid #3CB74E' : undefined,
      borderRadius: theme === 'gamer' ? '4px' : '10px',
      fontFamily: theme === 'gamer' ? 'Courier New, monospace' : 'inherit',
      fontSize: '16px',
      px: 1.5,
      py: 0.8,
      '& input::placeholder': {
        color: theme === 'night' ? '#000' : themes[theme].text,
        opacity: 0.5
      }
    }
  }}
  sx={{ mt: 2, width: '250px' }}
/>

          <br /><br />
          <Button
            variant="outlined"
            onClick={startGame}
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
            START
          </Button>
        </>
      ) : (
        <GameScreen name={name} resetToStart={resetToStart} />
      )}
    </Box>
  );
}

export default TriviaGame;
