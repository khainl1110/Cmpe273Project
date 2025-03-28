import React, { useState, useEffect } from 'react';
import Timer from './Timer';
import LeaderBoard from './LeaderBoardPage';
import { USE_WEBSOCKET } from './WebSocketService';
import questionsData from '../data/questions.json'; // Local test questions

const TriviaPage = ({ username, onReplay }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [skips, setSkips] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [backendMessages, setBackendMessages] = useState([]); 
  const [ws, setWs] = useState(null);

  useEffect(() => {
    if (!USE_WEBSOCKET) {
      setCurrentQuestion(questionsData[currentQuestionIndex]); // Load first question from JSON
    }
  }, []);

  // Function to connect and request a message from backend
  const handleConnectAndRequest = () => {
    const socket = new WebSocket("ws://localhost:8080/gs-guide-websocket");

    socket.onopen = () => {
      console.log("✅ WebSocket Connected - Button Click");
      socket.send(JSON.stringify({ name: username || "Guest" })); // Send request to backend
    };

    socket.onmessage = (event) => {
      console.log("📩 Received message:", event.data);
      setBackendMessages((prev) => [...prev, event.data]); // Store messages in UI
    };

    socket.onerror = (error) => console.error("❌ WebSocket Error:", error);

    socket.onclose = () => console.log("❌ WebSocket Disconnected");

    setWs(socket); // Save socket instance
  };

  const handleNextQuestion = () => {
    if (USE_WEBSOCKET) {
      setCurrentQuestion(null); // Reset until next WebSocket message
    } else {
      if (currentQuestionIndex + 1 < questionsData.length) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentQuestion(questionsData[currentQuestionIndex + 1]);
      } else {
        setGameOver(true);
      }
    }
  };

  const handleAnswerClick = (answer) => {
    if (answer === currentQuestion.correct) {
      setScore(score + 1);
    } else {
      setLives(lives - 1);
      if (lives - 1 === 0) {
        setGameOver(true);
        return;
      }
    }
    handleNextQuestion();
  };

  const handleSkip = () => {
    if (skips > 0) {
      setSkips(skips - 1);
      handleNextQuestion();
    }
  };

  if (gameOver) {
    return <LeaderBoard username={username} score={score} onReplay={onReplay} />;
  }

  return (
    <div className="game-container">
      <h1>Hi, {username}! 👋</h1>
      <div className="game-stats">
        <p>❤️ Lives: {lives} | ⭐ Score: {score} | ⏭️ Skips: {skips}</p>
      </div>
      <Timer />
      <div className="question-card">
        {currentQuestion ? (
          <>
            <h2>{currentQuestion.question}</h2>
            <div className="answers-container">
              {currentQuestion.answers.map((answer, index) => (
                <button key={index} onClick={() => handleAnswerClick(answer)}>
                  {answer}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>Waiting for question...</p>
        )}
        <div className="controls">
          <button className="skip-btn" onClick={handleSkip} disabled={skips === 0}>
            ⏭️ Skip ({skips} left)
          </button>
          <button className="flag-btn">🚩 Flag</button>
        </div>
      </div>

      {/* ✅ Button to Connect & Request Message */}
      {USE_WEBSOCKET && (
        <div className="websocket-controls">
          <button className="connect-btn" onClick={handleConnectAndRequest}>
            🔗 Connect & Request Message
          </button>
        </div>
      )}

      {/* ✅ Backend Messages Section */}
      {USE_WEBSOCKET && (
        <div className="backend-messages">
          <h3>📩 Backend Messages:</h3>
          <ul>
            {backendMessages.length > 0 ? (
              backendMessages.map((msg, index) => <li key={index}>{msg}</li>)
            ) : (
              <p>No messages yet...</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TriviaPage;
