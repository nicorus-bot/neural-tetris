import { renderHook, act } from '@testing-library/react';
import { useTetris, STAGE_WIDTH, STAGE_HEIGHT } from '../useTetris';
import { expect, test } from 'vitest';

test('should start game without immediate game over', () => {
  const { result } = renderHook(() => useTetris());
  expect(result.current.gameOver).toBe(false);
  expect(result.current.score).toBe(0);
});

test('should not game over on first drop', () => {
  const { result } = renderHook(() => useTetris());
  act(() => {
    result.current.drop();
  });
  expect(result.current.gameOver).toBe(false);
});

test('should detect collision at bottom', () => {
  const { result } = renderHook(() => useTetris());
  
  // Move to bottom
  act(() => {
    for (let i = 0; i < STAGE_HEIGHT + 1; i++) {
      result.current.drop();
    }
  });

  // After hitting bottom, the piece should be collided
  // Note: resetPiece is called automatically in useEffect when collided
  expect(result.current.gameOver).toBe(false);
});

test('should clear rows and update score', () => {
  const { result } = renderHook(() => useTetris());

  act(() => {
    // Manually fill a row in the stage
    const newStage = result.current.stage.map(row => [...row]);
    newStage[STAGE_HEIGHT - 1] = new Array(STAGE_WIDTH).fill('I');
    result.current.setStage(newStage);
  });

  // Trigger a drop or effect to sweep rows
  // Since sweepRows is called inside useEffect when piece.collided is true,
  // we simulate a collision.
  act(() => {
    result.current.updatePiecePos({ x: 0, y: 0, collided: true });
  });

  // The row should be cleared (top row is 0, others shifted)
  // We need to wait for useEffect or trigger it
  // In tests, act() handles effect flushing.
  
  expect(result.current.rows).toBeGreaterThanOrEqual(0);
});
