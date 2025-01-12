import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const MobileFishingGame = () => {
  const canvasRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(300);
  const [hookPosition, setHookPosition] = useState({ x: 300, y: 100 });
  const [fishes, setFishes] = useState([]);
  const [touchActive, setTouchActive] = useState({ up: false, down: false, left: false, right: false });

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
        speed: Math.random() * 0.3 + 0.2
      });
    }
    
    // Middle layer (values 31-60, moderate)
    for (let i = 0; i < 6; i++) {
      fishArray.push({
        x: Math.random() * 580 + 10,
        y: 300 + (Math.random() * 50),
        value: Math.floor(Math.random() * 30) + 31,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: Math.random() * 0.25 + 0.15
      });
    }
    
    // Bottom layer (values 61-100, rare)
    for (let i = 0; i < 4; i++) {
      fishArray.push({
        x: Math.random() * 580 + 10,
        y: 450 + (Math.random() * 50),
        value: Math.floor(Math.random() * 40) + 61,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: Math.random() * 0.2 + 0.1
      });
    }
    
    return fishArray;
  };

  // Movement handler for continuous motion while button is pressed
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const moveDistance = 5;
    const moveInterval = setInterval(() => {
      if (touchActive.left && playerPosition > 20) {
        setPlayerPosition(prev => Math.max(20, prev - moveDistance));
        setHookPosition(prev => ({ ...prev, x: Math.max(20, prev.x - moveDistance) }));
      }
      if (touchActive.right && playerPosition < 580) {
        setPlayerPosition(prev => Math.min(580, prev + moveDistance));
        setHookPosition(prev => ({ ...prev, x: Math.min(580, prev.x + moveDistance) }));
      }
      if (touchActive.up && hookPosition.y > 100) {
        setHookPosition(prev => ({ ...prev, y: prev.y - moveDistance }));
      }
      if (touchActive.down && hookPosition.y < 550) {
        setHookPosition(prev => ({ ...prev, y: prev.y + moveDistance }));
      }
    }, 16);

    return () => clearInterval(moveInterval);
  }, [touchActive, gameStarted, gameOver, playerPosition, hookPosition.y]);

  // Game loop
  useEffect(() => {
    if (gameOver || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
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
        let newX = fish.x + (fish.direction * fish.speed);
        if (newX < 10 || newX > 590) {
          fish.direction *= -1;
          newX = fish.x + (fish.direction * fish.speed);
        }

        const dx = newX - hookPosition.x;
        const dy = fish.y - hookPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 15) {
          setGameOver(true);
          setScore(prev => prev + fish.value);
        }

        ctx.beginPath();
        ctx.arc(newX, fish.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${fish.value * 2}, 70%, 50%)`;
        ctx.fill();
        
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

  const handleTouchStart = (direction) => {
    setTouchActive(prev => ({ ...prev, [direction]: true }));
  };

  const handleTouchEnd = (direction) => {
    setTouchActive(prev => ({ ...prev, [direction]: false }));
  };

  // Control button component
  const ControlButton = ({ direction, icon: Icon }) => (
    <button
      className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center active:bg-white/60 touch-none"
      onTouchStart={(e) => {
        e.preventDefault();
        handleTouchStart(direction);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleTouchEnd(direction);
      }}
      onMouseDown={() => handleTouchStart(direction)}
      onMouseUp={() => handleTouchEnd(direction)}
      onMouseLeave={() => handleTouchEnd(direction)}
    >
      <Icon className="w-8 h-8 text-gray-700" />
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="mb-4 text-xl font-bold">Score: {score}</div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="border border-gray-300"
        />
        
        {gameStarted && !gameOver && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="grid grid-cols-3 gap-2">
              <div />
              <ControlButton direction="up" icon={ArrowUp} />
              <div />
              <ControlButton direction="left" icon={ArrowLeft} />
              <ControlButton direction="down" icon={ArrowDown} />
              <ControlButton direction="right" icon={ArrowRight} />
            </div>
          </div>
        )}
      </div>

      {!gameStarted && !gameOver && (
        <button
          onClick={handleStart}
          className="mt-4 px-6 py-2 bg-green-500 text-white rounded-full text-lg font-semibold hover:bg-green-600 active:bg-green-700"
        >
          Start Game
        </button>
      )}
      
      {gameOver && (
        <div className="mt-4 text-center">
          <div className="text-xl font-bold mb-2">Game Over! Final Score: {score}</div>
          <button
            onClick={handleRestart}
            className="px-6 py-2 bg-blue-500 text-white rounded-full text-lg font-semibold hover:bg-blue-600 active:bg-blue-700"
          >
            Play Again
          </button>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600 text-center">
        Use the control buttons to move the fishing line
      </div>
    </div>
  );
};

export default MobileFishingGame;
