import './App.css';
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import TriviaGame from './Components/TriviaGame';
import ScorePage from './Components/ScorePage';
import { ThemeProvider } from './Components/ThemeContext';
import MusicPlayer from './Components/MusicPlayer';
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  withCredentials: true,
  extraHeaders: {
    'Access-Control-Allow-Origin': '*'
  }
});

function AppRouter() {
  const navigate = useNavigate();

  const [hasStarted, setHasStarted] = useState(false);
  const [name, setName] = useState('');

  const resetToStart = () => {
    setHasStarted(false);
    setName('');
  };

  const restartGame = () => {
    resetToStart();
    navigate('/');
    socket.emit('reset');
    socket.disconnect();
    setTimeout(() => socket.connect(), 200);
  };

  return (
      <>
    <Routes>
      <Route
        path="/"
        element={
          <TriviaGame
            hasStarted={hasStarted}
            setHasStarted={setHasStarted}
            name={name}
            setName={setName}
            restartGame={restartGame}
            socket={socket}
          />
        }
      />
      <Route path="/score" element={<ScorePage restartGame={restartGame} />} />
    </Routes>
        <MusicPlayer />
  </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppRouter />
      </Router>
    </ThemeProvider>
  );
}

export default App;
