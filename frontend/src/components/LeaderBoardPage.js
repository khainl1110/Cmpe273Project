import React from 'react';

const Leaderboard = ({ username, score, onReplay }) => {
  return (
    <div className="question-card">
      <h2>Game Over, {username}! 🎮</h2>
      <p>Your final score: <strong>{score}</strong> points</p>
      <button className="replay-btn" onClick={onReplay}>🔄 Play Again</button>
      {/* Placeholder for Leaderboard, will integrate later */}
      <p>🏆 Leaderboard stuff</p>
    </div>
  );
};

export default Leaderboard;
