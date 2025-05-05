import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Slider, Stack } from '@mui/material';

function MusicPlayer() {
  const audioRef = useRef(null);
  const [playlist, setPlaylist] = useState([]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Load playlist on mount
  useEffect(() => {
    console.log("🎵 MusicPlayer component rendered");
    fetch('http://localhost:3001/api/music-list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlaylist(data);
        }
      })
      .catch(err => console.error('Failed to load music list:', err));
  }, []);

  // Load track and optionally auto-play
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && playlist.length > 0) {
      audio.src = playlist[trackIndex];
      audio.volume = volume;

      // Only auto-play if user already triggered a play session
      if (isPlaying) {
        audio.play().catch(e => {
          console.warn('Autoplay blocked after src set:', e.message);
        });
      }
    }
  }, [trackIndex, playlist]);

  // Volume slider
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [trackIndex, playlist, isPlaying, volume]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Required for Chrome autoplay policy
    if (typeof window.AudioContext !== 'undefined') {
      const context = new AudioContext();
      if (context.state === 'suspended') {
        context.resume().then(() => {
          console.log('🔓 AudioContext resumed');
          attemptPlay(audio);
        });
      } else {
        attemptPlay(audio);
      }
    } else {
      attemptPlay(audio);
    }
  };

  const attemptPlay = (audio) => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          console.log('✅ Music playing');
        })
        .catch((e) => {
          console.warn('🚫 Playback blocked:', e.message);
        });
    }
  };

  const shuffle = () => {
    if (playlist.length < 2) return;
    let next;
    do {
      next = Math.floor(Math.random() * playlist.length);
    } while (next === trackIndex);
    setTrackIndex(next);
  };

  const onError = () => {
    console.warn('Track failed to load:', playlist[trackIndex]);
    shuffle();
  };

  return (
    <Box sx={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
      backgroundColor: '#ffffffcc',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      p: 1.2,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    }}>
      <audio ref={audioRef} loop onError={onError} />
      <Stack direction="row" alignItems="center" spacing={1}>
        <Button
          onClick={() => {
            toggleMusic();
            setShowControls(!showControls);
          }}
          sx={{
            minWidth: 0,
            px: 1.5,
            fontSize: '1.2rem',
            color: isPlaying ? 'green' : 'red',
          }}
        >
          🎵
        </Button>

        {showControls && (
          <>
            <Button onClick={shuffle} sx={{ minWidth: 0, px: 1.5, fontSize: '1.2rem' }}>
              🔀
            </Button>
            <span>🔊</span>
            <Slider
              value={volume}
              onChange={(e, v) => setVolume(v)}
              step={0.01}
              min={0}
              max={1}
              sx={{ width: 100 }}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}

export default MusicPlayer;
