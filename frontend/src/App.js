import React, { useState } from 'react';
import './App.css';
import SignIn from './components/SignIn';
import TriviaGame from './components/TriviaPage';

function App() {
  const [username, setUsername] = useState('');

  const handleReplay = () => {
    setUsername(''); // Reset username to go back to Sign-In page
  };

  return (
    <div className="App">
      {!username ? (
        <SignIn onSignIn={setUsername} />
      ) : (
        <TriviaGame username={username} onReplay={handleReplay} />
      )}
    </div>
  );
}

export default App;
