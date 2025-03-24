'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// 게임 상태 관리를 위한 초기값
const INITIAL_TIME = 15; // 초기 제한 시간
const TIME_PENALTY = 3; // 오답 시 시간 감소
const MIN_COLOR_DIFF = 5; // 최소 색상 차이 (3에서 5로 증가)

// 게임 결과 인터페이스
interface GameResult {
  finalStage: number;
  totalTime: number; // 초 단위
  finalScore: number;
}

// 애니메이션된 원 컴포넌트
const AnimatedCircle = ({ 
  size, 
  duration, 
  x, 
  y, 
  delay, 
  color 
}: { 
  size: number; 
  duration: number; 
  x: number; 
  y: number; 
  delay: number; 
  color: string 
}) => {
  return (
    <motion.div
      className="rounded-full absolute opacity-30"
      style={{
        width: size,
        height: size,
        top: `${y}%`,
        left: `${x}%`,
        backgroundColor: color,
      }}
      initial={{ scale: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
        opacity: [0, 0.5, 0.3],
        y: [0, -30, 0]
      }}
      transition={{
        delay,
        duration,
        repeat: Infinity,
        repeatType: "reverse"
      }}
    />
  );
};

// 배경 웨이브 컴포넌트
const BackgroundWave = () => {
  return (
    <motion.div 
      className="absolute inset-0 overflow-hidden z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
      
      {/* 애니메이션된 웨이브 */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-indigo-100 to-transparent"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent, black)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)'
        }}
        animate={{
          y: [0, -10, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-purple-100 to-transparent"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent, black)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)'
        }}
        animate={{
          y: [0, -15, 0]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* 애니메이션된 원형 요소들 */}
      <AnimatedCircle size={100} duration={15} x={10} y={20} delay={0} color="#818cf8" />
      <AnimatedCircle size={200} duration={20} x={70} y={60} delay={3} color="#c4b5fd" />
      <AnimatedCircle size={150} duration={18} x={30} y={70} delay={5} color="#93c5fd" />
      <AnimatedCircle size={120} duration={25} x={80} y={20} delay={8} color="#ddd6fe" />
      <AnimatedCircle size={180} duration={22} x={20} y={40} delay={12} color="#bfdbfe" />
    </motion.div>
  );
};

// 타일 컴포넌트
const GameTile = ({ 
  color, 
  onClick, 
  index, 
  isCorrect 
}: { 
  color: string; 
  onClick: () => void; 
  index: number; 
  isCorrect: boolean;
}) => {
  return (
    <motion.button
      className="w-full p-0 rounded-lg hover:opacity-90 shadow-md"
      style={{ 
        backgroundColor: color,
        aspectRatio: '1/1',
        boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.3), inset 0 -2px 5px rgba(0,0,0,0.1)'
      }}
      onClick={onClick}
      aria-label={`타일 ${index + 1}`}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 5px 15px rgba(0,0,0,0.1), inset 0 2px 5px rgba(255,255,255,0.3), inset 0 -2px 5px rgba(0,0,0,0.1)'
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8, rotate: -5 + Math.random() * 10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.2, delay: index * 0.01 }}
    />
  );
};

// 스테이지 표시 컴포넌트
const StageDisplay = ({ stage }: { stage: number }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow-md"
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.5, times: [0, 0.5, 1], ease: "easeInOut" }}
    >
      <span className="text-xs font-medium">스테이지</span>
      <span className="text-xl font-bold">{stage}</span>
    </motion.div>
  );
};

// 점수 표시 컴포넌트
const ScoreDisplay = ({ score }: { score: number }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg shadow-md"
      initial={{ scale: 1 }}
      animate={{ scale: score > 0 ? [1, 1.2, 1] : 1 }}
      transition={{ duration: 0.5 }}
      key={score} // 점수가 변경될 때마다 애니메이션 재실행
    >
      <span className="text-xs font-medium">점수</span>
      <span className="text-xl font-bold">{score}</span>
    </motion.div>
  );
};

// 시간 표시 컴포넌트
const TimeDisplay = ({ timeLeft }: { timeLeft: number }) => {
  const isLowTime = timeLeft <= 5;
  
  return (
    <motion.div 
      className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg shadow-md text-white ${
        isLowTime 
        ? 'bg-gradient-to-r from-red-500 to-pink-500' 
        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
      }`}
      animate={isLowTime ? { 
        scale: [1, 1.1, 1],
        boxShadow: [
          '0 4px 6px rgba(0,0,0,0.1)', 
          '0 4px 10px rgba(229,62,62,0.4)', 
          '0 4px 6px rgba(0,0,0,0.1)'
        ] 
      } : {}}
      transition={{ duration: 0.3, repeat: isLowTime ? Infinity : 0 }}
    >
      <span className="text-xs font-medium">남은 시간</span>
      <span className="text-xl font-bold">{timeLeft}</span>
    </motion.div>
  );
};

// 게임 결과 항목 컴포넌트
const ResultItem = ({ 
  label, 
  value, 
  delay, 
  highlight 
}: { 
  label: string; 
  value: string | number; 
  delay: number; 
  highlight?: boolean 
}) => {
  return (
    <motion.div 
      className={`flex justify-between items-center p-4 rounded-lg backdrop-blur-sm ${
        highlight 
          ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-200'
          : 'bg-white/30 border border-gray-200'
      }`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
    >
      <span className="font-medium text-gray-700">{label}</span>
      <span className={`text-xl font-bold ${highlight ? 'text-indigo-600' : 'text-gray-800'}`}>
        {value}
      </span>
    </motion.div>
  );
};

export default function Home() {
  const { toast } = useToast();
  
  // 게임 상태 관리
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [gameActive, setGameActive] = useState(false);
  const [grid, setGrid] = useState<{ tiles: any[], correctIndex: number }>({ tiles: [], correctIndex: -1 });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showCorrectTile, setShowCorrectTile] = useState(false);
  
  // 그리드 크기 계산 함수
  const calculateGridSize = useCallback((stage: number) => {
    // 스테이지 1은 2x2, 이후 3스테이지마다 1씩 증가하도록 수정
    return 2 + Math.floor((stage - 1) / 3);
  }, []);
  
  // 색상 차이 계산 함수
  const calculateColorDifference = useCallback((stage: number) => {
    // 스테이지가 올라갈수록 차이가 줄어드는 속도를 감소
    // 초기값을 증가시키고 (60 -> 75), 스테이지별 감소폭을 줄임 (5 -> 3)
    return Math.max(MIN_COLOR_DIFF, 75 - stage * 3);
  }, []);
  
  // 게임 초기화 함수
  const initializeGame = useCallback(() => {
    setStage(1);
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setGameActive(true);
    setGameResult(null);
    setShowCorrectTile(false);
    setStartTime(Date.now()); // 게임 시작 시간 저장
    generateGrid(1);
  }, []);
  
  // 그리드 생성 함수
  const generateGrid = useCallback((currentStage: number) => {
    const gridSize = calculateGridSize(currentStage);
    const totalTiles = gridSize * gridSize;
    
    // 기본 색상 생성 (RGB 값)
    const baseColor = {
      r: Math.floor(Math.random() * 156) + 50, // 너무 어둡거나 밝지 않게
      g: Math.floor(Math.random() * 156) + 50,
      b: Math.floor(Math.random() * 156) + 50
    };
    
    // 정답 색상 - 약간 다르게
    const colorDiff = calculateColorDifference(currentStage);
    const correctColor = { ...baseColor };
    
    // 랜덤하게 RGB 중 하나를 다르게
    const randomComponent = ['r', 'g', 'b'][Math.floor(Math.random() * 3)] as 'r' | 'g' | 'b';
    correctColor[randomComponent] = Math.min(255, Math.max(0, correctColor[randomComponent] + colorDiff));
    
    // 정답 타일 인덱스 랜덤 선정
    const correctIndex = Math.floor(Math.random() * totalTiles);
    
    // 타일 배열 생성
    const tiles = Array(totalTiles).fill(0).map((_, index) => {
      const isCorrect = index === correctIndex;
      const color = isCorrect ? correctColor : baseColor;
      return {
        id: index,
        color: `rgb(${color.r}, ${color.g}, ${color.b})`,
        isCorrect
      };
    });
    
    setGrid({ tiles, correctIndex });
  }, [calculateGridSize, calculateColorDifference]);
  
  // 타일 클릭 처리
  const handleTileClick = useCallback((index: number) => {
    if (!gameActive) return;
    
    if (index === grid.correctIndex) {
      // 정답 처리
      const newStage = stage + 1;
      const stageBonus = stage * 10;
      const timeBonus = timeLeft * 5;
      const newScore = score + stageBonus + timeBonus;
      
      // 애니메이션을 위해 정답 타일 표시 후 잠시 지연
      setShowCorrectTile(true);
      
      setTimeout(() => {
        setStage(newStage);
        setScore(newScore);
        setTimeLeft(INITIAL_TIME); // 시간 리셋
        setShowCorrectTile(false);
        generateGrid(newStage);
        
        toast({
          description: `정답! +${stageBonus + timeBonus} 점을 획득했습니다.`,
        });
      }, 500);
    } else {
      // 오답 처리
      const newTime = Math.max(0, timeLeft - TIME_PENALTY);
      setTimeLeft(newTime);
      
      toast({
        description: `오답! ${TIME_PENALTY}초 감소되었습니다.`,
        variant: 'destructive'
      });
      
      if (newTime <= 0) {
        // 정답 타일 표시 후 게임 종료
        setShowCorrectTile(true);
        setTimeout(() => {
          endGame();
        }, 1000);
      }
    }
  }, [gameActive, grid.correctIndex, stage, score, timeLeft, toast, generateGrid]);
  
  // 게임 종료 함수
  const endGame = useCallback(() => {
    if (!startTime) return;
    
    setGameActive(false);
    
    // 게임 플레이 시간 계산 (초 단위)
    const endTime = Date.now();
    const playTimeInSeconds = Math.floor((endTime - startTime) / 1000);
    
    // 최종 점수 계산
    const stageBonus = stage * 100;
    const timeBonus = timeLeft * 10;
    const complexityBonus = calculateGridSize(stage) * 50;
    const finalScore = score + stageBonus + complexityBonus;
    
    // 게임 결과 저장
    const result: GameResult = {
      finalStage: stage,
      totalTime: playTimeInSeconds,
      finalScore: finalScore
    };
    
    setGameResult(result);
    
    toast({
      title: '게임 종료!',
      description: `최종 점수: ${finalScore}, 스테이지: ${stage}`,
    });
  }, [score, stage, timeLeft, startTime, calculateGridSize, toast]);
  
  // 타이머 효과
  useEffect(() => {
    if (!gameActive) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowCorrectTile(true);
          setTimeout(() => {
            endGame();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameActive, endGame]);
  
  // 초기 그리드 생성
  useEffect(() => {
    if (gameActive) {
      generateGrid(stage);
    }
  }, [gameActive, stage, generateGrid]);
  
  // 그리드 크기 계산
  const gridSize = calculateGridSize(stage);
  
  // 시간 형식 변환 함수 (초 -> 분:초)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}분 ${remainingSeconds}초`;
  };
  
  // 애니메이션 변수
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
      <BackgroundWave />
      
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full mx-auto backdrop-blur-sm bg-white/80 shadow-xl border border-white/50 overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8 }}
          />
          
          <CardHeader className="relative">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <CardTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                색다른 타일 찾기
              </CardTitle>
            </motion.div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {!gameActive && !gameResult ? (
                // 게임 시작 전 화면
                <motion.div 
                  className="flex flex-col items-center space-y-6"
                  key="start-screen"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="w-24 h-24 grid grid-cols-2 gap-2 mb-2"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <motion.div 
                      className="bg-indigo-400 rounded-lg"
                      animate={{ scale: [1, 0.9, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className="bg-indigo-500 rounded-lg"
                      animate={{ scale: [1, 0.9, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.div 
                      className="bg-indigo-500 rounded-lg"
                      animate={{ scale: [1, 0.9, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    />
                    <motion.div 
                      className="bg-indigo-600 rounded-lg"
                      animate={{ scale: [1, 0.9, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                    />
                  </motion.div>
                  
                  <p className="text-center text-muted-foreground px-6">
                    서로 다른 색상의 타일을 찾아 눌러보세요. 
                    <br />
                    스테이지가 올라갈수록 난이도가 상승합니다!
                  </p>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={initializeGame}
                      className="px-8 py-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md text-lg font-medium"
                    >
                      게임 시작
                    </Button>
                  </motion.div>
                </motion.div>
              ) : gameResult ? (
                // 게임 결과 화면
                <motion.div 
                  className="flex flex-col items-center space-y-5"
                  key="result-screen"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    게임 결과
                  </motion.div>
                  
                  <motion.div 
                    className="text-5xl font-bold mb-2 text-indigo-600"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {gameResult.finalScore}
                  </motion.div>
                  
                  <motion.div 
                    className="text-base text-gray-500 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    총 점수
                  </motion.div>
                  
                  <div className="w-full space-y-3">
                    <ResultItem 
                      label="도달 스테이지" 
                      value={`${gameResult.finalStage} 스테이지`}
                      delay={0.4}
                    />
                    
                    <ResultItem 
                      label="플레이 시간" 
                      value={formatTime(gameResult.totalTime)}
                      delay={0.5}
                    />
                    
                    <ResultItem 
                      label="최종 점수" 
                      value={`${gameResult.finalScore} 점`}
                      delay={0.6}
                      highlight
                    />
                  </div>
                  
                  <div className="pt-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <Button 
                        onClick={initializeGame}
                        className="px-8 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md"
                      >
                        다시 시작하기
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ) : (
                // 게임 진행 화면
                <motion.div
                  key="game-screen"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                >
                  <motion.div className="flex justify-between items-center mb-6" variants={itemVariants}>
                    <StageDisplay stage={stage} />
                    <ScoreDisplay score={score} />
                    <TimeDisplay timeLeft={timeLeft} />
                  </motion.div>
                  
                  <motion.div 
                    className="grid gap-2 relative" 
                    style={{ 
                      gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                      gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                      aspectRatio: '1/1'
                    }}
                    variants={itemVariants}
                  >
                    {grid.tiles.map((tile, index) => (
                      <GameTile
                        key={index}
                        color={tile.color}
                        onClick={() => handleTileClick(index)}
                        index={index}
                        isCorrect={tile.isCorrect}
                      />
                    ))}
                    
                    {/* 정답 표시 효과 */}
                    {showCorrectTile && grid.correctIndex >= 0 && (
                      <motion.div
                        className="absolute inset-0 grid"
                        style={{ 
                          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {Array(gridSize * gridSize).fill(0).map((_, index) => (
                          <div key={index} className="relative">
                            {index === grid.correctIndex && (
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center rounded-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
                              >
                                <motion.div
                                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-8 w-8 text-green-500" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={3} 
                                      d="M5 13l4 4L19 7" 
                                    />
                                  </svg>
                                </motion.div>
                              </motion.div>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          
          <CardFooter className="justify-center">
            {gameActive && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  variant="outline" 
                  onClick={endGame}
                  className="mt-2 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  게임 종료
                </Button>
              </motion.div>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
