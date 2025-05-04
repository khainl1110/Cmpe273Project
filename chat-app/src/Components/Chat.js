import React, { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import { Box, Button } from '@mui/material';
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
    transports: ['websocket'],
    withCredentials: true,
    extraHeaders: {
      'Access-Control-Allow-Origin': '*'
    }
  });
  
function Chat() {
  let [fQuestion, setFQuestion] = useState({
    id: 0,
    question: "Please enter your name",
    end: false,
  });
  let [inputValue, setInputValue] = useState('');
  let [score, setScore] = useState(0);


  useEffect(() => {
    socket.on('chat message', async (msg) => {
      console.log(msg)
      setFQuestion(msg)
    });
    return () => {
      socket.off('chat message');
    };
  }, [fQuestion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue) {
      console.log(inputValue)
      socket.emit('chat message', inputValue);
      setInputValue('');
    }
  };

  function AnswerBox({options}) {
    let submitAnswer = (num) => {
        //num == fQuestion.correctIndex? setScore(score +1) : null
        if (num === fQuestion.correctIndex) {
          setScore(score + 1);
          socket.emit('chat message', score + 1); // <-- send the updated score
        } else {
          socket.emit('chat message', score);     // <-- send current score if wrong
        }
        setInputValue('');


        socket.emit('chat message', score);
        setInputValue('');
    }

    return (
      <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      >
        <Stack direction="row" spacing={2}>
          <Button variant="body1" onClick={() => submitAnswer(0)}>{options[0]}</Button>
          <Button variant="body1" onClick={() => submitAnswer(1)}>{options[1]}</Button>
          <Button variant="body1" onClick={() => submitAnswer(2)}>{options[2]}</Button>
          <Button variant="body1" onClick={() => submitAnswer(3)}>{options[3]}</Button>
        </Stack>
      </Box>
    )
  }

  return (
    <div>
      <h3>{fQuestion.end ? "Game over": fQuestion.question}</h3>
        {fQuestion.id > 0 && !fQuestion.end ? <AnswerBox options = {fQuestion.options} /> : <></>}
      {
        fQuestion.id !== 0 ? <></> : 
        <form onSubmit={handleSubmit}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button type="submit" onSubmit={handleSubmit}>Send</button>
      </form>
      }
      {
        fQuestion.id > 1 && !fQuestion.end ? <h3>Score: {score}</h3> : <></>
      }
      <h3> {fQuestion.end ? fQuestion.name + " " + fQuestion.score : <></>}</h3>
      
    </div>
  );
}

export default Chat;