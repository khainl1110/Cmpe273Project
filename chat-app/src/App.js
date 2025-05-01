
import './App.css';
import Chat from './Components/Chat';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TriviaGame from './Components/TriviaGame';
import ScorePage from './Components/ScorePage';
import { ThemeProvider } from './Components/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TriviaGame />} />
          <Route path="/score" element={<ScorePage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
