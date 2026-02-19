import React, { useEffect, useRef } from 'react';
import { useTetris, STAGE_WIDTH, createStage } from './useTetris';

const Tetris: React.FC = () => {
  const {
    piece,
    gameOver,
    movePlayer,
    drop,
    playerRotate,
    score,
    level,
    resetPiece,
    setStage,
    setGameOver,
    setScore,
    setRows,
    setLevel,
  } = useTetris();

  const gameLoop = useRef<number | null>(null);

  const startGame = () => {
    // Reset everything
    setStage(createStage());
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(0);
    resetPiece();
    // Force the first drop immediately after piece is set, to kick off the loop/collision cycle
    drop(); 
  };

  useEffect(() => {
    if (!gameOver) {
      const dropTime = Math.max(100, 1000 - level * 100);
      gameLoop.current = window.setInterval(() => {
        drop();
      }, dropTime);
    } else if (gameLoop.current) {
      clearInterval(gameLoop.current);
    }
    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current);
    };
  }, [gameOver, drop, level, piece]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!piece || gameOver) return;
    
    if (e.key === 'ArrowLeft') movePlayer(-1);
    else if (e.key === 'ArrowRight') movePlayer(1);
    else if (e.key === 'ArrowDown') drop();
    else if (e.key === 'ArrowUp') playerRotate(1);
  };

  // Render stage with active piece
  const renderStage = () => {
    const renderedStage = createStage(); 
    if (piece) {
      piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0 && renderedStage[y + piece.pos.y]) {
            renderedStage[y + piece.pos.y][x + piece.pos.x] = piece.color;
          }
        });
      });
    }
    return renderedStage;
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-4 font-sans"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
      </div>

      <h1 className="text-6xl font-black mb-8 tracking-tighter bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        TETRIS
      </h1>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="relative p-1 bg-gradient-to-b from-slate-700 to-slate-900 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-slate-900/90 backdrop-blur-xl grid grid-cols-12 gap-px p-1 border border-slate-700/50 rounded-lg">
            {renderStage().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={y * STAGE_WIDTH + x} // Unique key
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-sm transition-all duration-150"
                  style={{
                    backgroundColor: cell === 0 ? 'transparent' : `rgb(${cell})`,
                    boxShadow: cell === 0 ? 'none' : `0 0 15px rgba(${cell}, 0.6)`,
                    border: cell === 0 ? '1px solid rgba(255,255,255,0.03)' : 'none'
                  }}
                />
              ))
            )}
          </div>

          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-500">
              <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                TRY AGAIN
              </button>
            </div>
          )}
          {!gameOver && !piece && ( // ボタン表示条件を修正
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
               <button
               onClick={startGame}
               className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all shadow-lg hover:scale-105 active:scale-95"
             >
               START
             </button>
             </div>
          )}
        </div>

        <div className="flex flex-col gap-6 min-w-[200px]">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Score</p>
            <p className="text-4xl font-mono font-bold text-blue-400">{score.toLocaleString()}</p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-xl">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Level</p>
            <p className="text-4xl font-mono font-bold text-purple-400">{level}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tetris;
