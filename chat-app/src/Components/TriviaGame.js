import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, TextField, Stack, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';
import { themes } from '../themes';
import GameScreen from './GameScreen';
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  withCredentials: true,
  extraHeaders: {
    'Access-Control-Allow-Origin': '*'
  }
});

function TriviaGame() {
  const navigate = useNavigate();
  const { theme, setTheme } = useContext(ThemeContext);
  const [name, setName] = useState('');
  const [customInput, setCustomInput] = useState('');

  const [hasStarted, setHasStarted] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('❓');
  const [selectedTopic, setSelectedTopic] = useState('generic');

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
    const topicToSend = selectedTopic === 'custom' ? customInput : selectedTopic;
    socket.emit('chat message', { name, topic: topicToSend });
    setHasStarted(true);
  };

  const resetToStart = () => {
    setName('');
    setHasStarted(false);
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

          <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
            <IconButton onClick={() => setShowTopics(!showTopics)} sx={{ fontSize: '1.5rem' }}>
              {selectedEmoji}
            </IconButton>

            {showTopics && (
              <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
                {[
                  { emoji: '🎸', topic: 'music' },
                  { emoji: '🪐', topic: 'space' },
                  { emoji: '🏛', topic: 'history' },
                  { emoji: '🎨', topic: 'art' },
                  { emoji: '🧪', topic: 'science' },
                  { emoji: '🎬', topic: 'film/tv' },
                  { emoji: '⚽', topic: 'sports' },
                  { emoji: '👾', topic: 'pop culture' },
                  { emoji: '🌎', topic: 'geography' },
                  { emoji: '❓', topic: 'random' },
                  { emoji: '✨', topic: 'custom' }
                ].map(({ emoji, topic }, i) => (
                  <IconButton
                    key={i}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setSelectedEmoji(emoji);
                      setShowTopics(false);
                    }}
                    title={topic === 'custom' ? 'Custom' : topic}
                    sx={{
                      fontSize: '1.5rem',
                      color: selectedTopic === topic ? 'yellow' : themes[theme].text,
                      backgroundColor: selectedTopic === topic ? '#444' : 'transparent',
                      borderRadius: '8px',
                    }}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </Stack>
            )}

            {selectedTopic === 'custom' && (
              <TextField
                placeholder="Type a topic (max 15 chars)"
                variant="standard"
                value={customInput}
                inputProps={{ maxLength: 15 }}
                onChange={(e) => setCustomInput(e.target.value.trim())}
                sx={{
                  mt: 1,
                  width: '150px',
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  px: 1,
                  py: 0.5,
                  '& input': {
                    color: themes[theme].text,
                    textAlign: 'center',
                  }
                }}
              />
            )}
          </Box>

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
        <GameScreen
          name={name}
          topic={selectedTopic === 'custom' ? customInput : selectedTopic}
          selectedEmoji={selectedEmoji}
          resetToStart={resetToStart}
        />
      )}
    </Box>
  );
}

export default TriviaGame;

