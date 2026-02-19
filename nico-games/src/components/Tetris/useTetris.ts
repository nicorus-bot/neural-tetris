import { useState, useEffect, useCallback } from 'react';
import type { GridBoard, Piece } from './types';
import { randomTetromino } from './types';

export const STAGE_WIDTH = 12;
export const STAGE_HEIGHT = 20;

export const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () => Array(STAGE_WIDTH).fill(0));

export const useTetris = () => {
  const [stage, setStage] = useState<GridBoard>(createStage());
  const [piece, setPiece] = useState<Piece | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);

  const resetPiece = useCallback(() => {
    const newPiece = randomTetromino();
    setPiece({
      pos: { x: Math.floor(STAGE_WIDTH / 2) - 2, y: 0 },
      shape: newPiece.shape,
      collided: false,
      color: newPiece.color,
    });
  }, []);

  const checkCollision = (p: Piece, s: GridBoard, { x: moveX, y: moveY }: { x: number; y: number }) => {
    for (let y = 0; y < p.shape.length; y += 1) {
      for (let x = 0; x < p.shape[y].length; x += 1) {
        if (p.shape[y][x] !== 0) {
          if (
            !s[y + p.pos.y + moveY] ||
            s[y + p.pos.y + moveY][x + p.pos.x + moveX] === undefined ||
            s[y + p.pos.y + moveY][x + p.pos.x + moveX] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (matrix: (string | number)[][], dir: number) => {
    const rotated = matrix.map((_, index) => matrix.map(col => col[index]));
    if (dir > 0) return rotated.map(row => row.reverse());
    return rotated.reverse();
  };

  const playerRotate = (dir: number) => {
    if (!piece) return;
    const clonedPiece = JSON.parse(JSON.stringify(piece));
    clonedPiece.shape = rotate(clonedPiece.shape, dir);

    const pos = clonedPiece.pos.x;
    let offset = 1;
    while (checkCollision(clonedPiece, stage, { x: 0, y: 0 })) {
      clonedPiece.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPiece.shape[0].length) {
        rotate(clonedPiece.shape, -dir);
        clonedPiece.pos.x = pos;
        return;
      }
    }
    setPiece(clonedPiece);
  };

  const updatePiecePos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPiece(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pos: { x: prev.pos.x + x, y: prev.pos.y + y },
        collided,
      };
    });
  };

  const drop = () => {
    if (!piece) return;
    if (!checkCollision(piece, stage, { x: 0, y: 1 })) {
      updatePiecePos({ x: 0, y: 1, collided: false });
    } else {
      if (piece.pos.y < 1) {
        setGameOver(true);
      }
      setPiece(prev => prev ? { ...prev, collided: true } : null);
    }
  };

  const movePlayer = (dir: number) => {
    if (!piece) return;
    if (!checkCollision(piece, stage, { x: dir, y: 0 })) {
      updatePiecePos({ x: dir, y: 0, collided: false });
    }
  };

  const sweepRows = (newStage: GridBoard) => {
    let rowsCleared = 0;
    const sweptStage = newStage.reduce((acc, row) => {
      if (row.findIndex(cell => cell === 0) === -1) {
        rowsCleared += 1;
        acc.unshift(new Array(newStage[0].length).fill(0));
        return acc;
      }
      acc.push(row);
      return acc;
    }, [] as GridBoard);

    if (rowsCleared > 0) {
      setScore(prev => prev + rowsCleared * 10 * (level + 1));
      setRows(prev => prev + rowsCleared);
      if (rows + rowsCleared >= (level + 1) * 10) {
        setLevel(prev => prev + 1);
      }
    }
    return sweptStage;
  };

  useEffect(() => {
    if (piece?.collided) {
      const newStage = stage.map(row =>
        row.map(cell => (cell === 0 ? 0 : cell))
      );
      piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            // Check bounds before setting
            if (newStage[y + piece.pos.y] && newStage[y + piece.pos.y][x + piece.pos.x] !== undefined) {
                newStage[y + piece.pos.y][x + piece.pos.x] = value as string;
            }
          }
        });
      });
      setStage(sweepRows(newStage));
      
      // Check for immediate game over *after* placing the collided piece
      if (piece.pos.y < 1) {
          setGameOver(true);
      }
      
      resetPiece();
    }
  }, [piece?.collided, sweepRows, resetPiece]); // Added dependencies for linting/correctness

  useEffect(() => {
    // Only reset piece at start if game is not over and no piece exists
    if (!gameOver && !piece) {
      resetPiece();
    }
  }, [resetPiece, gameOver, piece]);

  return {
    stage,
    setStage,
    piece,
    updatePiecePos,
    gameOver,
    setGameOver,
    resetPiece,
    movePlayer,
    drop,
    playerRotate,
    score,
    setScore,
    rows,
    setRows,
    level,
    setLevel,
  };
};
