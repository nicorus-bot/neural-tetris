
import { initializeQueue, getNextPiece, checkCollision } from './src/lib/tetrisCore.js';

const FIELD_WIDTH = 10;
const FIELD_HEIGHT = 20;
const createEmptyField = () => Array(FIELD_HEIGHT).fill(0).map(() => Array(FIELD_WIDTH).fill(0));

function simulate() {
    const q = initializeQueue();
    let field = createEmptyField();
    let current = q.current;
    let { nextPiece, newQueue } = getNextPiece({ queue: q.queue });
    let next = nextPiece;
    let queue = newQueue;

    console.log("Simulating first piece drop...");
    
    // Simulate piece reaching bottom
    current.position.y = 18; // Near bottom
    
    // Check collision at y=19
    const collision = checkCollision(current, field, { dx: 0, dy: 1 });
    console.log("Collision at bottom?", collision);

    // Merge logic (simplified version of processMerge)
    const newField = field.map(row => [...row]);
    const { position, orientation, data } = current;
    data.shapes[orientation].forEach((row, r) => row.forEach((v, c) => {
        if (v) {
            const fy = position.y + r; const fx = position.x + c;
            if (fy >= 0 && fy < FIELD_HEIGHT) newField[fy][fx] = current.shape;
        }
    }));

    const finalField = newField;
    const spawnCollision = checkCollision(next, finalField, { dx: 0, dy: 0 });
    console.log("Spawn collision for next piece?", spawnCollision);

    if (spawnCollision) {
        console.error("FAIL: Game over triggered on first piece!");
    } else {
        console.log("PASS: Logic seems okay.");
    }
}

simulate();
