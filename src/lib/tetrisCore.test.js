import { 
  TETROMINOS, 
  rotatePiece, 
  checkCollision, 
  calculateDropPosition, 
  initializeQueue, 
  getNextPiece, 
  checkHighScore,
  evaluateBoard,
  getBestMove
} from './tetrisCore';

describe('Tetris Core Logic', () => {
  const FIELD_WIDTH = 10;
  const FIELD_HEIGHT = 20;
  const createEmptyField = () => Array(FIELD_HEIGHT).fill(0).map(() => Array(FIELD_WIDTH).fill(0));

  describe('Piece Management', () => {
    test('initializeQueue should return a starting piece and a queue', () => {
      const { current, queue } = initializeQueue();
      expect(current).toHaveProperty('shape');
      expect(current).toHaveProperty('data');
      expect(queue.length).toBeGreaterThan(0);
    });

    test('getNextPiece should provide a new piece and update the queue', () => {
      const initial = initializeQueue();
      const { nextPiece, newQueue } = getNextPiece({ queue: initial.queue });
      expect(nextPiece).toHaveProperty('shape');
      expect(newQueue.length).toBeGreaterThanOrEqual(initial.queue.length - 1);
    });

    test('TETROMINOS should contain all standard shapes', () => {
      const keys = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      keys.forEach(key => {
        expect(TETROMINOS).toHaveProperty(key);
        expect(TETROMINOS[key]).toHaveProperty('shapes');
        expect(TETROMINOS[key]).toHaveProperty('color');
      });
    });
  });

  describe('Movement and Collision', () => {
    test('rotatePiece should cycle through orientations', () => {
      const piece = { shape: 'T', orientation: 0, data: TETROMINOS['T'], position: { x: 3, y: 0 } };
      const rotated = rotatePiece(piece, 1);
      expect(rotated.orientation).toBe(1);
      const rotatedBack = rotatePiece(rotated, -1);
      expect(rotatedBack.orientation).toBe(0);
    });

    test('checkCollision should detect walls', () => {
      const field = createEmptyField();
      const piece = { shape: 'I', orientation: 0, data: TETROMINOS['I'], position: { x: 0, y: 0 } };
      // Move left out of bounds
      expect(checkCollision(piece, field, { dx: -1, dy: 0 })).toBe(true);
      // Move right (I piece at x=0 with dx=7 is ok, dx=8 depends on shape width)
      // I piece shape at orientation 0 is [[0,0,0,0],[1,1,1,1],...] which is 4 wide.
      // At x=7, dx=0: blocks at x=7,8,9,10 -> collision (width 10)
      piece.position.x = 7;
      expect(checkCollision(piece, field, { dx: 0, dy: 0 })).toBe(true);
    });

    test('checkCollision should detect floor', () => {
      const field = createEmptyField();
      const piece = { shape: 'O', orientation: 0, data: TETROMINOS['O'], position: { x: 3, y: 18 } };
      // O piece is 2x2. At y=18, blocks are at y=18,19. Next dy=1 makes it 19,20 -> collision.
      expect(checkCollision(piece, field, { dx: 0, dy: 1 })).toBe(true);
    });

    test('checkCollision should detect other blocks', () => {
      const field = createEmptyField();
      field[5][5] = 'G';
      const piece = { shape: 'O', orientation: 0, data: TETROMINOS['O'], position: { x: 4, y: 4 } };
      // O piece (2x2) at (4,4) covers (4,4), (5,4), (4,5), (5,5).
      // (5,5) is occupied, so it should collide immediately.
      expect(checkCollision(piece, field, { dx: 0, dy: 0 })).toBe(true);
    });

    test('calculateDropPosition should return the lowest possible Y', () => {
      const field = createEmptyField();
      const piece = { shape: 'O', orientation: 0, data: TETROMINOS['O'], position: { x: 3, y: 0 } };
      const dropY = calculateDropPosition(piece, field);
      // Floor is at y=19. O piece is 2x2. Lowest top-left Y is 18.
      expect(dropY).toBe(18);
    });
  });

  describe('AI and Scoring', () => {
    test('checkHighScore should return the higher value', () => {
      expect(checkHighScore(1000, 500)).toBe(1000);
      expect(checkHighScore(500, 1000)).toBe(1000);
    });

    test('evaluateBoard should return a score (lower is better usually)', () => {
      const field = createEmptyField();
      const emptyScore = evaluateBoard(field);
      field[19][0] = 'I';
      const filledScore = evaluateBoard(field);
      expect(filledScore).not.toBe(emptyScore);
    });

    test('getBestMove should return a valid position and orientation', () => {
      const field = createEmptyField();
      const piece = { shape: 'I', orientation: 0, data: TETROMINOS['I'], position: { x: 3, y: 0 } };
      const move = getBestMove(piece, field);
      expect(move).toHaveProperty('x');
      expect(move).toHaveProperty('orientation');
      expect(move.x).toBeGreaterThanOrEqual(-2);
      expect(move.x).toBeLessThan(10);
    });
  });
});
