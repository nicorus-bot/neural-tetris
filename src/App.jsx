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
    const colorMap = { 
        0: 'transparent', 
        I: '#33d9ff', // Bright Cyan
        O: '#ffeb3b', // Sunny Yellow
        T: '#e040fb', // Electric Purple
        S: '#00e676', // Spring Green
        Z: '#ff1744', // Candy Red
        J: '#2979ff', // Royal Blue
        L: '#ff9100', // Deep Orange
        G: '#9e9e9e' 
    };
    const color = colorMap[type] || '#333';
    const style = { 
        width: `${size}px`, height: `${size}px`, boxSizing: 'border-box', position: 'relative',
        transition: 'all 0.1s ease',
        borderRadius: size > 15 ? '6px' : '3px'
    };
    if (isGrid) {
        style.border = '0.5px solid rgba(0, 0, 0, 0.05)';
    } else if (ghost) { 
        style.border = `2px dashed ${color}`; 
        style.opacity = 0.4; 
    } else if (type !== 0) {
        style.backgroundColor = isClearing ? '#fff' : color;
        style.border = '2px solid rgba(255, 255, 255, 0.5)';
        style.boxShadow = isClearing 
            ? '0 0 20px #fff' 
            : `0 4px 0 rgba(0, 0, 0, 0.1), inset 2px 2px 4px rgba(255, 255, 255, 0.6)`;
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

    const accentColor = isCPU ? '#ff4081' : '#00d2ff';
    const boardClassName = `board-container ${effect ? `effect-${effect}` : ''}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 10 }}>
            <div style={{ 
                fontSize: '1.2em', 
                fontWeight: '900', 
                color: '#fff', 
                letterSpacing: '6px', 
                textShadow: `2px 2px 0px ${accentColor}`,
                background: accentColor,
                padding: '4px 25px',
                borderRadius: '50px',
                boxShadow: `0 4px 15px ${accentColor}66`
            }}>
                {title}
            </div>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="glass-panel" style={{ width: cellSize * 5, height: cellSize * 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
                        <div style={{ fontSize: '0.6em', color: '#666', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '1px' }}>NEXT</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {next && next.data.shapes[0].map((row, r) => (<div key={r} style={{ display: 'flex' }}>{row.map((c, idx) => <Cell key={idx} type={c ? next.shape : 0} size={cellSize * 0.7} />)}</div>))}
                        </div>
                    </div>
                    <div className="glass-panel" style={{ width: cellSize * 5, height: cellSize * 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
                        <div style={{ fontSize: '0.6em', color: '#666', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '1px' }}>HOLD</div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {hold && TETROMINOS[hold].shapes[0].map((row, r) => (<div key={r} style={{ display: 'flex' }}>{row.map((c, idx) => <Cell key={idx} type={c ? hold : 0} size={cellSize * 0.7} />)}</div>))}
                        </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '10px 0', textAlign: 'center', width: cellSize * 5, background: '#fff' }}>
                        <div style={{ fontSize: '0.6em', color: '#999', fontWeight: 'bold' }}>SCORE</div>
                        <div style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#333' }}>{score}</div>
                    </div>
                </div>

                <div className={boardClassName} style={{ 
                    border: `6px solid #fff`, 
                    borderRadius: '16px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.4)', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    boxShadow: `0 10px 30px rgba(0,0,0,0.1)`,
                    backdropFilter: 'blur(10px)'
                }}>
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
            const mobile = window.innerWidth < 1024; // 横並びを維持するため基準を変更
            setIsMobile(mobile);
            
            // 横並び（Landscape）を前提としたサイズ計算
            // 2つのボード + 中央の隙間を考慮
            const size = Math.min(Math.floor(h / 23), Math.floor(w / 35));
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
        <div style={{ 
            position: 'fixed', 
            bottom: '15px', 
            left: 0, 
            right: 0, 
            padding: '0 15px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-end',
            zIndex: 100,
            pointerEvents: 'none'
        }}>
            {/* 左側：ホールド・ハードドロップ ＆ 移動（十字キー風） */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: 'auto' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onTouchStart={(e) => { e.preventDefault(); handleAction('hold'); }} className="ctrl-btn" style={{ width: '65px', height: '65px', borderRadius: '15px', fontSize: '0.9em', fontWeight: 'bold', background: '#ff4081', color: '#fff' }}>HOLD</button>
                    <button onTouchStart={(e) => { e.preventDefault(); handleAction('drop'); }} className="ctrl-btn" style={{ width: '65px', height: '65px', borderRadius: '15px', background: '#ffeb3b', color: '#333', fontSize: '1.8em' }}>▼</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 75px)', gap: '10px' }}>
                    <button onTouchStart={(e) => { e.preventDefault(); handleAction('left'); }} className="ctrl-btn" style={{ height: '70px', fontSize: '2em' }}>←</button>
                    <button onTouchStart={(e) => { e.preventDefault(); handleAction('down'); }} className="ctrl-btn" style={{ height: '70px', fontSize: '2em' }}>↓</button>
                    <button onTouchStart={(e) => { e.preventDefault(); handleAction('right'); }} className="ctrl-btn" style={{ height: '70px', fontSize: '2em' }}>→</button>
                </div>
            </div>

            {/* 右側：回転 */}
            <div style={{ pointerEvents: 'auto', paddingBottom: '10px' }}>
                <button onTouchStart={(e) => { e.preventDefault(); handleAction('rotate'); }} className="ctrl-btn" style={{ width: '130px', height: '130px', borderRadius: '50%', background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)', border: '4px solid #fff', fontSize: '3em', boxShadow: '0 8px 25px rgba(0,210,255,0.4)', color: '#fff' }}>↻</button>
            </div>
        </div>
    );

    return (
        <div style={{ 
            height: '100vh', 
            background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', 
            color: '#333', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontFamily: '"Orbitron", sans-serif', 
            overflow: 'hidden', 
            touchAction: 'none',
            position: 'relative'
        }}>
            {/* Background Decorations - Bubbles */}
            <div style={{ position: 'absolute', top: '10%', left: '5%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.4)', borderRadius: '50%', zIndex: 1, filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: '150px', height: '150px', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', zIndex: 1, filter: 'blur(2px)' }} />
            <div style={{ position: 'absolute', top: '40%', right: '30%', width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', zIndex: 1 }} />

            {/* Character Illustration (Floating Pop Mascot) */}
            <div style={{
                position: 'absolute',
                right: isMobile ? '10px' : '40px',
                bottom: isMobile ? '160px' : '60px',
                width: isMobile ? '120px' : '280px',
                height: isMobile ? '120px' : '280px',
                zIndex: 2,
                opacity: 0.9,
                pointerEvents: 'none',
                animation: 'float 4s ease-in-out infinite'
            }}>
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="popGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#ff9a9e' }} />
                            <stop offset="100%" style={{ stopColor: '#fad0c4' }} />
                        </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r="80" fill="url(#popGrad)" stroke="#fff" strokeWidth="4" />
                    <circle cx="70" cy="85" r="12" fill="#333" />
                    <circle cx="130" cy="85" r="12" fill="#333" />
                    <circle cx="75" cy="80" r="4" fill="#fff" />
                    <circle cx="135" cy="80" r="4" fill="#fff" />
                    <path d="M70 130 Q100 160 130 130" stroke="#333" strokeWidth="6" fill="none" strokeLinecap="round" />
                    <circle cx="50" cy="110" r="10" fill="#ff4081" opacity="0.3" />
                    <circle cx="150" cy="110" r="10" fill="#ff4081" opacity="0.3" />
                </svg>
            </div>

            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: isMobile ? '10px' : '40px', 
                alignItems: 'center', 
                transform: isMobile ? 'scale(0.95)' : 'none',
                position: 'relative',
                zIndex: 10
            }}>
                <Board title="PLAYER" field={p1.field} currentPiece={p1.current} ghostY={p1.current ? calculateDropPosition(p1.current, p1.field) : 0} cellSize={cellSize} score={p1.score} next={p1.next} hold={p1.hold} effect={p1.effect} clearingLines={p1.clearingLines} />
                <div style={{ width: '2px', height: '350px', background: 'rgba(0,0,0,0.05)' }} />
                <Board title="COM AI" field={cpu.field} currentPiece={cpu.current} ghostY={cpu.current ? calculateDropPosition(cpu.current, cpu.field) : 0} cellSize={cellSize} score={cpu.score} next={cpu.next} hold={cpu.hold} isCPU effect={cpu.effect} clearingLines={cpu.clearingLines} />
            </div>
            
            {isMobile && <MobileControls />}

            <button onClick={() => setIsMuted(!isMuted)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', zIndex: 100, backdropFilter: 'blur(5px)' }}>
                {isMuted ? '🔇' : '🔊'}
            </button>

            {isGameOver && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5, 5, 20, 0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(20px)' }}>
                    <div style={{ position: 'relative' }}>
                        <h1 style={{ 
                            color: '#fff', 
                            fontSize: isMobile ? '3em' : '6em', 
                            fontWeight: '900',
                            letterSpacing: '10px',
                            textAlign: 'center',
                            textShadow: '0 0 40px rgba(0, 242, 255, 0.5)'
                        }}>
                            {winner ? winner : 'NEURAL'}
                            <br />
                            <span style={{ color: '#ff0055' }}>TETRIS</span>
                        </h1>
                        {winner && <div style={{ textAlign: 'center', fontSize: '1.5em', marginTop: '-10px', color: '#00f2ff', fontWeight: 'bold' }}>CONGRATULATIONS</div>}
                    </div>
                    <button onClick={startGame} className="start-btn">START BATTLE</button>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
                
                .glass-panel {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                }

                .start-btn {
                    margin-top: 40px;
                    padding: 18px 60px;
                    font-size: 1.5em;
                    cursor: pointer;
                    background: linear-gradient(45deg, #00f2ff, #ff0055);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    font-weight: 900;
                    letter-spacing: 2px;
                    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 0 30px rgba(0, 242, 255, 0.4);
                }
                .start-btn:hover {
                    transform: scale(1.1) translateY(-5px);
                    box-shadow: 0 0 50px rgba(255, 0, 85, 0.6);
                }

                .ctrl-btn {
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(5px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white;
                    user-select: none;
                    transition: all 0.1s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                }
                .ctrl-btn:active {
                    background: rgba(255, 255, 255, 0.25);
                    transform: scale(0.92);
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }

                .board-container { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .effect-attacked { animation: glitch 0.3s infinite; }
                
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-5px, 5px); filter: hue-rotate(90deg); }
                    40% { transform: translate(-5px, -5px); }
                    60% { transform: translate(5px, 5px); filter: hue-rotate(-90deg); }
                    80% { transform: translate(5px, -5px); }
                    100% { transform: translate(0); }
                }

                .cell-clearing { animation: line-flash 0.4s ease-out forwards; }
                @keyframes line-flash {
                    0% { filter: brightness(1) white; transform: scale(1); }
                    50% { filter: brightness(5); transform: scale(1.1); }
                    100% { filter: brightness(1); transform: scale(0); opacity: 0; }
                }
            `}</style>
        </div>
    );
}


export default App;