import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    initializeQueue, getNextPiece, checkCollision, rotatePiece,
    calculateDropPosition, TETROMINOS, getBestMove
} from './lib/tetrisCore';

const FIELD_WIDTH = 10;
const FIELD_HEIGHT = 20;
const INITIAL_DROP_INTERVAL = 800;
const createEmptyField = () => Array(FIELD_HEIGHT).fill(0).map(() => Array(FIELD_WIDTH).fill(0));

const Cell = React.memo(({ type, size = 20, ghost = false, isGrid = false, isClearing = false }) => {
    const colorMap = { 0: 'transparent', I: '#00f0f0', O: '#f0f000', T: '#a000f0', S: '#00f000', Z: '#f00000', J: '#0000f0', L: '#f0a000', G: '#444' };
    const color = colorMap[type] || '#333';
    const style = { 
        width: `${size}px`, height: `${size}px`, boxSizing: 'border-box', position: 'relative',
        transition: 'background-color 0.1s ease'
    };
    if (isGrid) style.border = '0.5px solid rgba(255, 255, 255, 0.05)';
    else if (ghost) { style.border = `1.5px solid ${color}`; style.opacity = 0.2; style.borderRadius = '2px'; }
    else if (type !== 0) {
        style.backgroundColor = isClearing ? '#fff' : color;
        style.border = '1px solid rgba(0, 0, 0, 0.1)';
        style.borderRadius = '3px';
        style.boxShadow = isClearing ? '0 0 15px #fff' : `inset 1px 1px 2px rgba(255, 255, 255, 0.3), 0 0 8px ${color}88`;
    }
    return <div style={style} className={isClearing ? 'cell-clearing' : ''} />;
});

const Board = ({ field, currentPiece, ghostY, cellSize, title, score, next, hold, isCPU, effect, clearingLines }) => {
    const rendered = useMemo(() => {
        const newField = field.map(row => [...row]);
        if (currentPiece && currentPiece.data) {
            const { position, orientation, data } = currentPiece;
            const shape = data.shapes[orientation];
            if (ghostY !== undefined) {
                shape.forEach((row, r) => row.forEach((v, c) => {
                    const fy = ghostY + r, fx = position.x + c;
                    if (v && fy < FIELD_HEIGHT && fx < FIELD_WIDTH && fy >= 0) if (newField[fy][fx] === 0) newField[fy][fx] = 'GHOST';
                }));
            }
            shape.forEach((row, r) => row.forEach((v, c) => {
                const fy = position.y + r, fx = position.x + c;
                if (v && fy < FIELD_HEIGHT && fx < FIELD_WIDTH && fy >= 0) newField[fy][fx] = currentPiece.shape;
            }));
        }
        return newField;
    }, [field, currentPiece, ghostY]);

    const accentColor = isCPU ? '#ff4b2b' : '#00f0f0';
    const boardClassName = `board-container ${effect ? `effect-${effect}` : ''}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '0.9em', fontWeight: '900', color: accentColor, letterSpacing: '4px', textShadow: `0 0 10px ${accentColor}aa` }}>{title}</div>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '8px', width: cellSize * 4.5, height: cellSize * 4.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.4em', color: '#888', fontWeight: 'bold', marginBottom: '4px' }}>NEXT</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {next && next.data.shapes[0].map((row, r) => (<div key={r} style={{ display: 'flex' }}>{row.map((c, idx) => <Cell key={idx} type={c ? next.shape : 0} size={cellSize * 0.65} />)}</div>))}
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '8px', width: cellSize * 4.5, height: cellSize * 4.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.4em', color: '#888', fontWeight: 'bold', marginBottom: '4px' }}>HOLD</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {hold && TETROMINOS[hold].shapes[0].map((row, r) => (<div key={r} style={{ display: 'flex' }}>{row.map((c, idx) => <Cell key={idx} type={c ? hold : 0} size={cellSize * 0.65} />)}</div>))}
                        </div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.4em', color: '#aaa', fontWeight: 'bold' }}>SCORE</div>
                        <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#fff' }}>{score}</div>
                    </div>
                </div>

                <div className={boardClassName} style={{ border: '4px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', backgroundColor: '#000', position: 'relative', overflow: 'hidden', boxShadow: effect === 'attack-launch' ? `0 0 40px ${accentColor}` : '0 0 30px rgba(0,0,0,0.5)' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: `repeat(${FIELD_WIDTH}, ${cellSize}px)` }}>
                        {Array(FIELD_HEIGHT * FIELD_WIDTH).fill(0).map((_, i) => <Cell key={i} isGrid size={cellSize} />)}
                    </div>
                    {rendered.map((row, y) => (
                        <div key={y} style={{ display: 'flex', position: 'relative' }}>
                            {row.map((type, x) => (
                                <Cell key={x} type={type === 'GHOST' ? currentPiece.shape : type} size={cellSize} ghost={type === 'GHOST'} isClearing={clearingLines.includes(y)} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

function App() {
    const [cellSize, setCellSize] = useState(20);
    const [isGameOver, setIsGameOver] = useState(true);
    const [winner, setWinner] = useState(null);
    const [p1, setP1] = useState({ field: createEmptyField(), current: null, next: null, queue: [], hold: null, canHold: true, score: 0, effect: null, clearingLines: [] });
    const [cpu, setCpu] = useState({ field: createEmptyField(), current: null, next: null, queue: [], hold: null, canHold: true, score: 0, effect: null, clearingLines: [] });
    const [isMuted, setIsMuted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const p1DropRef = useRef(Date.now());
    const cpuDropRef = useRef(Date.now());
    const cpuThinkRef = useRef(Date.now());
    const isGameOverRef = useRef(true);
    const audioRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio('https://ia800504.us.archive.org/33/items/TetrisThemeMusic/Tetris.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.2;
        return () => { if (audioRef.current) audioRef.current.pause(); };
    }, []);

    useEffect(() => { if (audioRef.current) audioRef.current.muted = isMuted; }, [isMuted]);
    useEffect(() => { isGameOverRef.current = isGameOver; }, [isGameOver]);

    useEffect(() => {
        const handleResize = () => {
            const h = window.innerHeight - 20, w = window.innerWidth - 20;
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            
            // スマホの場合は横に並べるのが難しいため、サイズをさらに調整
            const size = mobile 
                ? Math.min(Math.floor(h / 30), Math.floor(w / 15))
                : Math.min(Math.floor(h / 24), Math.floor(w / 35));
            setCellSize(Math.max(10, size));
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleAction = useCallback((action) => {
        if (isGameOver) return;
        setP1(prev => {
            let { current, field, hold, canHold, next, queue } = prev; if (!current) return prev;
            switch (action) {
                case 'left': if (!checkCollision(current, field, { dx: -1, dy: 0 })) current = { ...current, position: { ...current.position, x: current.position.x - 1 } }; break;
                case 'right': if (!checkCollision(current, field, { dx: 1, dy: 0 })) current = { ...current, position: { ...current.position, x: current.position.x + 1 } }; break;
                case 'down': if (!checkCollision(current, field, { dx: 0, dy: 1 })) { current = { ...current, position: { ...current.position, y: current.position.y + 1 } }; p1DropRef.current = Date.now(); } break;
                case 'rotate': const r = rotatePiece(current, 1); if (!checkCollision(r, field, { dx: 0, dy: 0 })) current = r; break;
                case 'drop': 
                    const fy = calculateDropPosition(current, field);
                    const { newState, clearedCount, gameOver } = processMerge(prev, { ...current, position: { ...current.position, y: fy } }, setCpu);
                    if (gameOver) { setIsGameOver(true); setWinner('CPU CORE'); }
                    if (clearedCount > 1) triggerEffect(setP1, 'attack-launch');
                    if (clearedCount > 0) setTimeout(() => setP1(s => ({ ...s, clearingLines: [] })), 300);
                    p1DropRef.current = Date.now(); return newState;
                case 'hold': if (canHold) {
                    if (hold) { const t = { shape: hold, data: TETROMINOS[hold], orientation: 0, position: { x: 3, y: 0 } }; return { ...prev, current: t, hold: current.shape, canHold: false }; }
                    else { const { nextPiece, newQueue } = getNextPiece({ queue }); return { ...prev, current: next, next: nextPiece, queue: newQueue, hold: current.shape, canHold: false }; }
                } break;
            }
            return { ...prev, current };
        });
    }, [isGameOver, setP1, setCpu]);

    const triggerEffect = (setter, effectType, duration = 500) => {
        setter(prev => ({ ...prev, effect: effectType }));
        setTimeout(() => setter(prev => ({ ...prev, effect: null })), duration);
    };

    const startGame = () => {
        const q1 = initializeQueue(), q2 = initializeQueue();
        const p1N = getNextPiece({ queue: q1.queue }), cpuN = getNextPiece({ queue: q2.queue });
        setP1({ field: createEmptyField(), current: q1.current, next: p1N.nextPiece, queue: p1N.newQueue, hold: null, canHold: true, score: 0, effect: null, clearingLines: [] });
        setCpu({ field: createEmptyField(), current: q2.current, next: cpuN.nextPiece, queue: cpuN.newQueue, hold: null, canHold: true, score: 0, effect: null, clearingLines: [] });
        setWinner(null); setIsGameOver(false);
        p1DropRef.current = cpuDropRef.current = Date.now();
        if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
    };

    const processMerge = (state, piece, opponentSetter) => {
        if (!piece || !piece.data) return { newState: state, gameOver: false };
        const newField = state.field.map(row => [...row]);
        const { position, orientation, data } = piece;
        data.shapes[orientation].forEach((row, r) => row.forEach((v, c) => {
            const fy = position.y + r, fx = position.x + c;
            if (v && fy >= 0 && fy < FIELD_HEIGHT) newField[fy][fx] = piece.shape;
        }));

        let clearingIndices = [];
        newField.forEach((row, y) => { if (row.every(cell => cell !== 0)) clearingIndices.push(y); });

        const finalField = newField.filter((_, y) => !clearingIndices.includes(y));
        while (finalField.length < FIELD_HEIGHT) finalField.unshift(Array(FIELD_WIDTH).fill(0));

        if (clearingIndices.length > 1) {
            triggerEffect(opponentSetter, 'attacked');
            const garbageCount = clearingIndices.length === 4 ? 4 : clearingIndices.length - 1;
            opponentSetter(prev => {
                const nf = prev.field.map(r => [...r]);
                for(let i=0; i<garbageCount; i++) {
                    nf.shift();
                    const gr = Array(FIELD_WIDTH).fill('G');
                    gr[Math.floor(Math.random()*FIELD_WIDTH)] = 0;
                    nf.push(gr);
                }
                return { ...prev, field: nf };
            });
        }

        const { nextPiece, newQueue } = getNextPiece({ queue: state.queue });
        const gameOver = checkCollision(state.next, finalField, { dx: 0, dy: 0 });
        
        return { 
            newState: { 
                ...state, 
                field: finalField, 
                current: gameOver ? null : state.next, 
                next: nextPiece, 
                queue: newQueue, 
                score: state.score + (clearingIndices.length === 4 ? 800 : clearingIndices.length * 100), 
                canHold: true,
                clearingLines: clearingIndices
            }, 
            clearedCount: clearingIndices.length,
            gameOver 
        };
    };

    // P1 Loop
    useEffect(() => {
        if (isGameOver) return;
        const timer = setInterval(() => {
            if (isGameOverRef.current) return;
            const now = Date.now();
            if (now - p1DropRef.current > INITIAL_DROP_INTERVAL) {
                handleAction('down');
            }
        }, 50);
        return () => clearInterval(timer);
    }, [isGameOver, handleAction]);

    // CPU Loop
    useEffect(() => {
        if (isGameOver) return;
        const timer = setInterval(() => {
            if (isGameOverRef.current) return;
            const now = Date.now();
            if (now - cpuThinkRef.current > 350) {
                setCpu(prev => {
                    if (!prev.current) return prev;
                    const best = getBestMove(prev.current, prev.field);
                    let { x } = prev.current.position, { orientation } = prev.current;
                    if (orientation !== best.orientation) { const r = rotatePiece(prev.current, 1); if (!checkCollision(r, prev.field, { dx: 0, dy: 0 })) orientation = r.orientation; }
                    else if (x < best.x) { if (!checkCollision(prev.current, prev.field, { dx: 1, dy: 0 })) x++; }
                    else if (x > best.x) { if (!checkCollision(prev.current, prev.field, { dx: -1, dy: 0 })) x--; }
                    return { ...prev, current: { ...prev.current, position: { ...prev.current.position, x }, orientation } };
                });
                cpuThinkRef.current = now;
            }
            if (now - cpuDropRef.current > INITIAL_DROP_INTERVAL) {
                setCpu(prev => {
                    if (!prev.current) return prev;
                    if (!checkCollision(prev.current, prev.field, { dx: 0, dy: 1 })) return { ...prev, current: { ...prev.current, position: { ...prev.current.position, y: prev.current.position.y + 1 } } };
                    const { newState, clearedCount, gameOver } = processMerge(prev, prev.current, setP1);
                    if (gameOver) { setIsGameOver(true); setWinner('PLAYER 1'); }
                    if (clearedCount > 1) triggerEffect(setCpu, 'attack-launch');
                    if (clearedCount > 0) setTimeout(() => setCpu(s => ({ ...s, clearingLines: [] })), 300);
                    return newState;
                });
                cpuDropRef.current = now;
            }
        }, 50);
        return () => clearInterval(timer);
    }, [isGameOver]);

    // P1 Input Handling
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isGameOver) return;
            switch (e.key) {
                case 'ArrowLeft': handleAction('left'); break;
                case 'ArrowRight': handleAction('right'); break;
                case 'ArrowDown': handleAction('down'); break;
                case 'ArrowUp': case 'x': handleAction('rotate'); break;
                case ' ': handleAction('drop'); break;
                case 'c': handleAction('hold'); break;
            }
            if (['ArrowUp', 'ArrowDown', ' ', 'c'].includes(e.key)) e.preventDefault();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameOver, handleAction]);

    const MobileControls = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', width: '100%', maxWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button onTouchStart={() => handleAction('rotate')} className="ctrl-btn" style={{ width: '60px', height: '60px' }}>🔄</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button onTouchStart={() => handleAction('hold')} className="ctrl-btn">C</button>
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button onTouchStart={() => handleAction('left')} className="ctrl-btn">←</button>
                    <button onTouchStart={() => handleAction('down')} className="ctrl-btn">↓</button>
                    <button onTouchStart={() => handleAction('right')} className="ctrl-btn">→</button>
                </div>
                <button onTouchStart={() => handleAction('drop')} className="ctrl-btn">⤓</button>
            </div>
        </div>
    );

    return (
        <div style={{ height: '100vh', background: 'radial-gradient(circle at center, #1a1c2c 0%, #050505 100%)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif', overflow: 'hidden', touchAction: 'none' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '30px', alignItems: 'center', scale: isMobile ? '0.8' : '1' }}>
                <Board title="PLAYER" field={p1.field} currentPiece={p1.current} ghostY={p1.current ? calculateDropPosition(p1.current, p1.field) : 0} cellSize={cellSize} score={p1.score} next={p1.next} hold={p1.hold} effect={p1.effect} clearingLines={p1.clearingLines} />
                {!isMobile && <div style={{ width: '1px', height: '300px', background: 'rgba(255,255,255,0.1)' }} />}
                <Board title="CPU AI" field={cpu.field} currentPiece={cpu.current} ghostY={cpu.current ? calculateDropPosition(cpu.current, cpu.field) : 0} cellSize={cellSize} score={cpu.score} next={cpu.next} hold={cpu.hold} isCPU effect={cpu.effect} clearingLines={cpu.clearingLines} />
            </div>
            
            {isMobile && <MobileControls />}

            <button onClick={() => setIsMuted(!isMuted)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '10px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px' }}>
                {isMuted ? '🔇' : '🔊'}
            </button>

            {isGameOver && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(12px)' }}>
                    <h1 style={{ color: winner ? (winner === 'PLAYER' || winner === 'PLAYER 1' ? '#00f0f0' : '#ff4b2b') : '#fff', fontSize: isMobile ? '2.5em' : '4em', textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>{winner ? `${winner} WINS` : 'NEURAL TETRIS'}</h1>
                    <button onClick={startGame} style={{ marginTop: '30px', padding: '15px 50px', fontSize: '1.2em', cursor: 'pointer', background: 'white', color: 'black', border: 'none', borderRadius: '40px', fontWeight: '900' }}>START BATTLE</button>
                </div>
            )}

            <style>{`
                .board-container { transition: transform 0.1s, box-shadow 0.3s; }
                .effect-attacked { animation: shake 0.4s focus-flash 0.4s; }
                .ctrl-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    width: 50px;
                    height: 50px;
                    border-radius: 12px;
                    font-size: 1.2em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }
                .ctrl-btn:active {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(0.95);
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-10px) rotate(-1deg); }
                    40% { transform: translateX(10px) rotate(1deg); }
                    60% { transform: translateX(-10px); }
                    80% { transform: translateX(10px); }
                }
                @keyframes focus-flash {
                    0%, 100% { background-color: #000; }
                    50% { background-color: rgba(255, 0, 0, 0.2); }
                }
                .cell-clearing { animation: flash 0.3s infinite; }
                @keyframes flash {
                    from { filter: brightness(1); }
                    to { filter: brightness(3); }
                }
            `}</style>
        </div>
    );
}

export default App;