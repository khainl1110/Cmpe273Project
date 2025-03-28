import { useEffect } from 'react';

export const USE_WEBSOCKET = false; // Keep toggle

export const useWebSocket = (onNewQuestion) => {
  useEffect(() => {
    if (!USE_WEBSOCKET) return; 

    const ws = new WebSocket("ws://localhost:8080/gs-guide-websocket");

    ws.onopen = () => console.log("✅ WebSocket Connected");

    ws.onmessage = (event) => {
      console.log("📩 Raw WebSocket Message:", event.data);
      onNewQuestion(event.data); // Just display whatever comes from backend
    };

    ws.onerror = (error) => console.error("❌ WebSocket Error:", error);
    ws.onclose = () => console.log("❌ WebSocket Disconnected");

    return () => {
      ws.close();
    };
  }, [onNewQuestion]);
};

