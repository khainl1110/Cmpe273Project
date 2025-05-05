import React, { useState, useContext, useEffect } from 'react';
import { Box, Button, TextField, Stack, IconButton } from '@mui/material';
import { ThemeContext } from './ThemeContext';
import { themes } from '../themes';
import GameScreen from './GameScreen';
import MusicPlayer from './MusicPlayer';


function TriviaGame({ hasStarted, setHasStarted, name, setName, restartGame, socket }) {
  const [customInput, setCustomInput] = useState('');
  const { theme, setTheme } = useContext(ThemeContext);
  const [showThemes, setShowThemes] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🧠');
  const [selectedTopic, setSelectedTopic] = useState('general knowledge');

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
      {/* Settings button */}
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
        <IconButton
          onClick={() => setShowThemes(!showThemes)}
          sx={{
            fontSize: '2rem',
            color: themes[theme].text,
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(6px)',
            borderRadius: '12px',
          }}
          title="Theme Settings"
        >
          ⚙️
        </IconButton>

        {showThemes && (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
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

      {/* Main trivia game logic */}
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
            <IconButton onClick={() => setShowTopics(!showTopics)} sx={{ fontSize: '2.1rem' , backgroundColor: 'rgba(255, 255, 255, 0.5)', color: themes[theme].text, backdropFilter: 'blur(4px)', borderRadius: '12px'}}>
              {selectedEmoji}
            </IconButton>

              {showTopics && (
                <Box
                  sx={{
                    position: 'absolute',
                    mt: 1,
                    maxHeight: 500,
                    overflowY: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                    backdropFilter: 'blur(6px)',
                    boxShadow: 'none',
                    borderRadius: '12px',
                    px: 1,
                    py: 1,
                  }}
                >
                  <Stack direction="column" spacing={1}>
                    {[
                      { emoji: '🎸', topic: 'music' },
                      { emoji: '🪐', topic: 'space' },
                      { emoji: '🏛', topic: 'history' },
                      { emoji: '🎨', topic: 'art & art history' },
                      { emoji: '🧪', topic: 'science' },
                      { emoji: '🎬', topic: 'film & tv' },
                      { emoji: '📚', topic: 'literature & books' },
                      { emoji: '⚽', topic: 'sports' },
                      { emoji: '👾', topic: 'video games' },
                      { emoji: '🌎', topic: 'geography' },
                      { emoji: '👑', topic: 'celebrities & pop culture' },
                      { emoji: '🧮', topic: 'math' },
                      { emoji: '🐾', topic: 'animals' },
                      { emoji: '🧝‍♂️', topic: 'mythology & fantasy' },
                      { emoji: '🍽', topic: 'food & cuisine' },
                      { emoji: '🧠', topic: 'general knowledge' },
                      { emoji: '✨', topic: 'custom' }
                    ].map(({ emoji, topic }, i) => (
                      <IconButton
                        key={i}
                        onClick={() => {
                          setSelectedTopic(topic);
                          setSelectedEmoji(emoji);
                          setShowTopics(false);
                        }}
                        title={topic}
                        sx={{
                          fontSize: '1.5rem',
                          color: selectedTopic === topic ? 'yellow' : themes[theme].text,
                          backgroundColor: selectedTopic === topic ? 'rgba(255,255,255,0.2)' : 'transparent',
                          borderRadius: '8px',
                        }}
                      >
                        {emoji}
                      </IconButton>
                    ))}
                  </Stack>
                </Box>

            )}

            {selectedTopic === 'custom' && (
              <TextField
                placeholder="Type a topic (25 chars)"
                variant="standard"
                value={customInput}
                inputProps={{ maxLength: 25 }}
                onChange={(e) => setCustomInput(e.target.value)}
                sx={{
                  mt: 1,
                  width: '160px',
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
          restartGame={restartGame}
        />
      )}
      <MusicPlayer />
    </Box>
  );
}

export default TriviaGame;

