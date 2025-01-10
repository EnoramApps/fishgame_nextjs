import React, { useEffect, useRef, useState } from 'react';

const FishingGame = () => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(300);
  const [hookPosition, setHookPosition] = useState({ x: 300, y: 100 });
  const [fishes, setFishes] = useState([]);

  // Generate fish with weighted distribution
  const generateFishes = () => {
    const fishArray = [];
    
    // Top layer (values 10-30, more common)
    for (let i = 0; i < 8; i++) {
      fishArray.push({
        x: Math.random() * 580 + 10,
        y: 200 + (Math.random() * 50),
        value: Math.floor(Math.random() * 20) + 10,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: Math.random() * 0.3 + 0.2  // Reduced speed
      });
    }
    
    // Middle layer (values 31-60, moderate)
    for (let i = 0; i < 6; i++) {
      fishArray.push({
        x: Math.random() * 580 + 10,
        y: 300 + (Math.random() * 50),
        value: Math.floor(Math.random() * 30) + 31,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: Math.random() * 0.25 + 0.15  // Reduced speed
      });
    }
    
    // Bottom layer (values 61-100, rare)
    for (let i = 0; i < 4; i++) {
      fishArray.push({
        x: Math.random() * 580 + 10,
        y: 450 + (Math.random() * 50),
        value: Math.floor(Math.random() * 40) + 61,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: Math.random() * 0.2 + 0.1  // Reduced speed
      });
    }
    
    return fishArray;
  };

  // Initialize game state
  useEffect(() => {
    setFishes(generateFishes());

    // Set up keyboard controls
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) return;
      
      const moveDistance = 8; // Movement speed
      
      switch(e.key) {
        case 'ArrowLeft':
          if (playerPosition > 20) {
            setPlayerPosition(prev => Math.max(20, prev - moveDistance));
            setHookPosition(prev => ({ ...prev, x: Math.max(20, prev.x - moveDistance) }));
          }
          break;
        case 'ArrowRight':
          if (playerPosition < 580) {
            setPlayerPosition(prev => Math.min(580, prev + moveDistance));
            setHookPosition(prev => ({ ...prev, x: Math.min(580, prev.x + moveDistance) }));
          }
          break;
        case 'ArrowUp':
          if (hookPosition.y > 100) {
            setHookPosition(prev => ({ ...prev, y: prev.y - moveDistance }));
          }
          break;
        case 'ArrowDown':
          if (hookPosition.y < 550) {
            setHookPosition(prev => ({ ...prev, y: prev.y + moveDistance }));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPosition, gameStarted, gameOver, hookPosition]);

  // Game loop
  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw water surface
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, 150);
      
      // Draw water
      ctx.fillStyle = '#1E90FF';
      ctx.fillRect(0, 150, canvas.width, canvas.height);

      // Draw fisher
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(playerPosition - 10, 50, 20, 30);

      // Draw fishing line
      ctx.beginPath();
      ctx.moveTo(playerPosition, 80);
      ctx.lineTo(hookPosition.x, hookPosition.y);
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // Draw hook
      ctx.beginPath();
      ctx.arc(hookPosition.x, hookPosition.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Update and draw fishes
      const updatedFishes = fishes.map(fish => {
        // Move fish
        let newX = fish.x + (fish.direction * fish.speed);
        if (newX < 10 || newX > 590) {
          fish.direction *= -1;
          newX = fish.x + (fish.direction * fish.speed);
        }

        // Check collision with hook
        const dx = newX - hookPosition.x;
        const dy = fish.y - hookPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15) {
          setGameOver(true);
          setScore(prev => prev + fish.value);
        }

        // Draw fish
        ctx.beginPath();
        ctx.arc(newX, fish.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${fish.value * 2}, 70%, 50%)`;
        ctx.fill();
        
        // Draw fish value
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(fish.value, newX - 10, fish.y + 4);

        return { ...fish, x: newX };
      });

      setFishes(updatedFishes);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, hookPosition, playerPosition, fishes, gameStarted]);

  const handleStart = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setHookPosition({ x: playerPosition, y: 100 });
    setFishes(generateFishes());
  };

  const handleRestart = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setHookPosition({ x: playerPosition, y: 100 });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-4 text-xl font-bold">Score: {score}</div>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className="border border-gray-300"
      />
      {!gameStarted && !gameOver && (
        <button
          onClick={handleStart}
          className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Start Game
        </button>
      )}
      {gameOver && (
        <div className="mt-4">
          <div className="text-xl font-bold mb-2">Game Over! Final Score: {score}</div>
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Play Again
          </button>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        Use Arrow keys to control the fishing line:
        <br />
        ← → Move left/right
        <br />
        ↑ ↓ Move line up/down
      </div>
    </div>
  );
};

export default FishingGame;
