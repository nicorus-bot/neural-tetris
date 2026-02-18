// --- Constants: Shapes, Definitions, etc. ---

export const TETROMINOS = {
  'I': {
    shapes: [
      [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
      [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
      [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
      [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
    ],
    color: 'cyan'
  },
  'O': {
    shapes: [
      [[1, 1], [1, 1]],
    ],
    color: 'yellow'
  },
  'T': {
    shapes: [
      [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
      [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
    ],
    color: 'purple'
  },
  'S': {
    shapes: [
      [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
      [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
      [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
    ],
    color: 'green'
  },
  'Z': {
    shapes: [
      [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
      [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
      [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
    ],
    color: 'red'
  },
  'J': {
    shapes: [
      [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
      [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
      [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
    ],
    color: 'blue'
  },
  'L': {
    shapes: [
      [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
      [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
      [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
      [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
    ],
    color: 'orange'
  },
};

const SHAPE_KEYS = Object.keys(TETROMINOS);
const FIELD_WIDTH = 10;
const FIELD_HEIGHT = 20;

export function rotatePiece(piece, direction) {
    if (!piece) return piece;
    const newOrientation = (piece.orientation + direction + 4) % (piece.data.shapes.length || 4);
    return { ...piece, orientation: newOrientation };
}

export function checkCollision(piece, field, delta) {
    if (!piece || !piece.data || !piece.data.shapes || !field) return true;
    const matrix = piece.data.shapes[piece.orientation];
    if (!matrix) return true;

    const newX = piece.position.x + delta.dx;
    const newY = piece.position.y + delta.dy;

    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c]) {
                const fx = newX + c;
                const fy = newY + r;
                if (fx < 0 || fx >= FIELD_WIDTH || fy >= FIELD_HEIGHT) return true;
                if (fy >= 0 && field[fy] && field[fy][fx]) return true;
            }
        }
    }
    return false;
}

export function calculateDropPosition(piece, field) {
    if (!piece || !field) return 0;
    let dropY = 0;
    while (!checkCollision(piece, field, { dx: 0, dy: dropY + 1 })) {
        dropY++;
    }
    return piece.position.y + dropY;
}

function createPiece(shapeKey) {
    const shapeData = TETROMINOS[shapeKey];
    return {
        shape: shapeKey,
        orientation: 0,
        position: { x: 3, y: 0 },
        data: shapeData,
    };
}

export function initializeQueue() {
    const queue = [...SHAPE_KEYS].sort(() => Math.random() - 0.5);
    const first = queue.shift();
    return { current: createPiece(first), queue };
}

export function getNextPiece(queueState) {
    const q = [...(queueState.queue || [])];
    if (q.length < 5) q.push(...[...SHAPE_KEYS].sort(() => Math.random() - 0.5));
    const nextKey = q.shift();
    return { nextPiece: createPiece(nextKey), newQueue: q };
}

export function evaluateBoard(field) {
    if (!field) return 999;
    let holes = 0, height = 0, bumpiness = 0;
    const heights = Array(10).fill(0);
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 20; y++) {
            if (field[y][x]) { heights[x] = 20 - y; break; }
        }
        height += heights[x];
    }
    for (let x = 0; x < 10; x++) {
        let block = false;
        for (let y = 0; y < 20; y++) {
            if (field[y][x]) block = true; else if (block) holes++;
        }
    }
    for (let x = 0; x < 9; x++) bumpiness += Math.abs(heights[x] - heights[x+1]);
    return height * 0.5 + holes * 0.4 + bumpiness * 0.1;
}

export function getBestMove(piece, field) {
    if (!piece || !field) return { x: 3, orientation: 0 };
    let bestScore = Infinity, best = { x: 3, orientation: 0 };
    const rotations = piece.data.shapes.length;
    for (let r = 0; r < rotations; r++) {
        for (let x = -2; x < 10; x++) {
            const p = { ...piece, orientation: r, position: { x, y: 0 } };
            if (checkCollision(p, field, { dx: 0, dy: 0 })) continue;
            const dy = calculateDropPosition(p, field);
            const tempField = field.map(row => [...row]);
            const mat = p.data.shapes[r];
            mat.forEach((row, pr) => row.forEach((v, pc) => {
                const fy = dy + pr, fx = x + pc;
                if (v && fy >= 0 && fy < 20 && fx >= 0 && fx < 10) tempField[fy][fx] = piece.shape;
            }));
            const score = evaluateBoard(tempField);
            if (score < bestScore) { bestScore = score; best = { x, orientation: r }; }
        }
    }
    return best;
}
