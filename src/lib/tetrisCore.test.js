import { generateNewPiece, rotatePiece, checkCollision, TETROMINOS, checkHighScore } from './tetrisCore'; 

describe('Tetris Core Logic', () => {
  const FIELD_WIDTH = 10;
// ... (rest of the file)
  const FIELD_HEIGHT = 20;

  // Test 1: Piece Generation
  test('should generate a random piece upon initialization', () => {
    const piece = generateNewPiece();
    expect(piece).toHaveProperty('shape');
    expect(piece).toHaveProperty('position');
    expect(piece).toHaveProperty('data'); // Data object must exist
    expect(['I', 'O', 'T', 'S', 'Z', 'J', 'L']).toContain(piece.shape);
  });

  // Test 2: Initial Position Check
  test('should place the initial piece near the top center of the field', () => {
    const piece = generateNewPiece();
    // Initial Y position must be near the top (0 or 1)
    expect(piece.position.y).toBeLessThanOrEqual(1); 
    // Initial X position must ensure the piece fits horizontally
    expect(piece.position.x).toBeGreaterThanOrEqual(0);
    // Test I piece width (4 blocks) and O piece width (2 blocks) approximately.
    expect(piece.position.x).toBeLessThan(FIELD_WIDTH - 2); 
  });

  // Test 3: Rotation
  test('should correctly rotate a piece by 90 degrees', () => {
    // Initialize a T piece with orientation 0
    const tPieceData = TETROMINOS['T'];
    const tPiece = { 
        shape: 'T', 
        orientation: 0, 
        position: { x: 3, y: 5 }, 
        data: tPieceData
    };
    const rotated = rotatePiece(tPiece, 1); // Rotate clockwise (+1)

    expect(rotated.orientation).toBe(1);
    // Check that other properties are preserved
    expect(rotated.position).toEqual(tPiece.position);
    expect(rotated.data).toBe(tPieceData);
  });

  // Test 4: Collision Detection (Placeholder for Wall Check)
  test('should detect collision when attempting an invalid move', () => {
    // This test validates the collision function signature/intent.
    const iPieceData = TETROMINOS['I'];
    const piece = { 
        shape: 'I', 
        orientation: 0, 
        position: { x: 7, y: 5 }, 
        data: iPieceData // Ensure data exists
    }; 
    const field = Array(FIELD_HEIGHT).fill(0).map(() => Array(FIELD_WIDTH).fill(0)); // Empty field

    // Start at x=7, move dx=1. I piece is 4 blocks wide, so right edge goes to 7+4 = 11 (out of bounds 10).
    const isColliding = checkCollision(piece, field, { dx: 1, dy: 0 }); 
    expect(isColliding).toBe(true); 
  });

  // Test 5: High Score Persistence Check Interface
  test('should handle high score update logic correctly', () => {
    // Logic for checking if a new score warrants updating the stored high score
    const currentScore = 5000;
    const storedHighScore = 4500;
    
    const newHighScore = checkHighScore(currentScore, storedHighScore);
    expect(newHighScore).toBe(5000);
  });
});