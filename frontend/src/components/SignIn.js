import React, { useState } from 'react';

const SignIn = ({ onSignIn }) => {
  const [usernameInput, setUsernameInput] = useState('');

  const handleSubmit = () => {
    if (usernameInput.trim() !== '') {
      onSignIn(usernameInput);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="question-card">
      <h2>Enter a Username 🎮</h2>
      <input
        value={usernameInput}
        onChange={(e) => setUsernameInput(e.target.value)}
        onKeyPress={handleKeyPress}  // Listen for Enter key
        placeholder="Enter username..."
        className="username-input"
      />
      <br />
      <button onClick={handleSubmit}>Start Game</button>
    </div>
  );
};

export default SignIn;
