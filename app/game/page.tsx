'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { mockPlayers, Player } from '@/data/mockPlayers';
import { calculateDistance, calculateScore } from '@/lib/gameUtils';
import PlayerCard from '@/components/player-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

function getScoreFeedback(score: number): { message: string; color: string; emoji: string } {
    if (score >= 4500) return { message: "Perfect!", color: "text-green-500", emoji: "🎯" };
    if (score >= 4000) return { message: "Excellent!", color: "text-green-400", emoji: "🌟" };
    if (score >= 3000) return { message: "Great!", color: "text-blue-500", emoji: "👏" };
    if (score >= 2000) return { message: "Good!", color: "text-blue-400", emoji: "👍" };
    if (score >= 1000) return { message: "Not Bad!", color: "text-yellow-500", emoji: "😊" };
    if (score >= 500) return { message: "Could be better", color: "text-orange-500", emoji: "🤔" };
    return { message: "Keep trying!", color: "text-red-500", emoji: "💪" };
  }

// Dynamically import map to avoid SSR issues with Leaflet
const GameMap = dynamic(() => import('@/components/game-map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
});

type GameState = 'guessing' | 'result' | 'completed';
type GameMode = 'single' | 'quiz';

interface QuizRound {
  player: Player;
  guessLocation: [number, number] | null;
  distance: number;
  score: number;
}

function GameContent() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') as GameMode) || 'single';
  
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState>('guessing');
  const [guessLocation, setGuessLocation] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  
  // Quiz mode specific state
  const [quizRounds, setQuizRounds] = useState<QuizRound[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [quizPlayers, setQuizPlayers] = useState<Player[]>([]);
  const totalRounds = 5;

// Pick random player(s) on mount
useEffect(() => {
    async function loadPlayers() {
      const supabase = createClient();
      
      if (mode === 'quiz' && quizPlayers.length === 0) {
        // Fetch 5 random NFL players for quiz
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('sport', 'nfl')
          .limit(200); // Get a pool to randomize from
        
        if (error) {
          console.error('Error fetching players:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, totalRounds);
          setQuizPlayers(selected);
          setCurrentPlayer(selected[0]);
        }
      } else if (mode === 'single' && !currentPlayer) {
        // Fetch one random NFL player for single mode
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('sport', 'nfl')
          .limit(100); // Get a pool to randomize from
        
        if (error) {
          console.error('Error fetching players:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const randomPlayer = data[Math.floor(Math.random() * data.length)];
          setCurrentPlayer(randomPlayer);
        }
      }
    }
    
    loadPlayers();
  }, [mode, currentPlayer, quizPlayers]);

  if (!currentPlayer) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  const handleGuess = (lat: number, lng: number) => {
    if (gameState !== 'guessing') return;
    setGuessLocation([lat, lng]);
  };

  const handleSubmitGuess = () => {
    if (!guessLocation) return;

    const dist = calculateDistance(
      guessLocation[0],
      guessLocation[1],
      currentPlayer.latitude,
      currentPlayer.longitude
    );
    const points = calculateScore(dist);

    setDistance(dist);
    setScore(points);
    setGameState('result');

    // Save round data for quiz mode
    if (mode === 'quiz') {
      setQuizRounds([
        ...quizRounds,
        {
          player: currentPlayer,
          guessLocation,
          distance: dist,
          score: points,
        },
      ]);
    }
  };

  const handleNextPlayer = () => {
    if (mode === 'quiz') {
      if (currentRound < totalRounds) {
        // Go to next round
        setCurrentPlayer(quizPlayers[currentRound]);
        setCurrentRound(currentRound + 1);
        setGameState('guessing');
        setGuessLocation(null);
        setDistance(0);
        setScore(0);
      } else {
        // Quiz complete
        setGameState('completed');
      }
    } else {
      // Single mode - fetch new random player from database
      const supabase = createClient();
      
      supabase
        .from('players')
        .select('*')
        .eq('sport', 'nfl')
        .neq('id', currentPlayer.id) // Exclude current player
        .limit(50)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const randomPlayer = data[Math.floor(Math.random() * data.length)];
            setCurrentPlayer(randomPlayer);
            setGameState('guessing');
            setGuessLocation(null);
            setDistance(0);
            setScore(0);
          }
        });
    }
  };

  const handlePlayAgain = () => {
    // Reset quiz
    const shuffled = [...mockPlayers].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, totalRounds);
    setQuizPlayers(selected);
    setCurrentPlayer(selected[0]);
    setQuizRounds([]);
    setCurrentRound(1);
    setGameState('guessing');
    setGuessLocation(null);
    setDistance(0);
    setScore(0);
  };

  const totalQuizScore = quizRounds.reduce((sum, round) => sum + round.score, 0);
  const maxPossibleScore = totalRounds * 5000;

  return (
    <div className="h-screen flex flex-col relative">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-sm border-b p-4 relative z-20">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <h1 className="text-2xl font-bold hover:text-primary cursor-pointer">
                Athlete Guesser
              </h1>
            </Link>
            <div className="text-sm text-muted-foreground">
              {mode === 'quiz' ? `Quiz Mode - Round ${currentRound}/${totalRounds}` : 'Single Player'}
            </div>
          </div>
          {mode === 'quiz' && gameState !== 'completed' && (
            <div className="text-sm font-semibold">
              Total Score: {totalQuizScore.toLocaleString()} / {maxPossibleScore.toLocaleString()}
            </div>
          )}
        </div>
      </header>

      {/* Full screen map */}
      <div className="flex-1 relative">
        <GameMap
          onGuess={handleGuess}
          guessLocation={guessLocation}
          actualLocation={gameState === 'result' ? [currentPlayer.latitude, currentPlayer.longitude] : null}
          showResult={gameState === 'result'}
        />

        {/* Floating sidebar overlay */}
        <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[calc(100vh-8rem)] overflow-y-auto">          <div className="flex flex-col gap-4">
            {gameState !== 'completed' ? (
              <>
                <PlayerCard player={currentPlayer} showAnswer={gameState === 'result'} />
                
                {gameState === 'guessing' && (
  <Card className="bg-background/95 backdrop-blur-sm shadow-2xl">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        Click on the map to guess where this player was born!
                      </p>
                      <Button
                        onClick={handleSubmitGuess}
                        disabled={!guessLocation}
                        className="w-full"
                      >
                        {guessLocation ? 'Submit Guess' : 'Click map to guess'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

{gameState === 'result' && (
  <Card className="bg-background/95 backdrop-blur-sm shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
    <CardContent className="pt-6 space-y-4">
      {/* Score Feedback Message */}
      <div className="text-center animate-in zoom-in duration-700 delay-300">
        <div className={`text-5xl mb-2 ${getScoreFeedback(score).emoji}`}>
          {getScoreFeedback(score).emoji}
        </div>
        <h3 className={`text-3xl font-bold ${getScoreFeedback(score).color} animate-pulse`}>
          {getScoreFeedback(score).message}
        </h3>
      </div>

      <div className="text-center animate-in fade-in duration-500 delay-500">
        <p className="text-sm text-muted-foreground">Distance</p>
        <p className="text-3xl font-bold">{distance.toLocaleString()} km</p>
      </div>
      <div className="text-center animate-in fade-in duration-500 delay-700">
        <p className="text-sm text-muted-foreground">Score</p>
        <p className="text-4xl font-bold text-primary">{score.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">out of 5,000</p>
      </div>
      <Button onClick={handleNextPlayer} className="w-full animate-in fade-in duration-500 delay-1000">
        {mode === 'quiz' && currentRound < totalRounds
          ? `Next Player (${currentRound + 1}/${totalRounds})`
          : mode === 'quiz'
          ? 'See Results'
          : 'Next Player'}
      </Button>
    </CardContent>
  </Card>
)}
              </>
            ) : (
              // Quiz Results
              <Card className="bg-background/95 backdrop-blur-sm shadow-2xl">
                <CardContent className="pt-6 space-y-4">
                  <h2 className="text-2xl font-bold text-center">Quiz Complete!</h2>
                  
                  <div className="text-center py-4 border-y">
                    <p className="text-sm text-muted-foreground">Final Score</p>
                    <p className="text-5xl font-bold text-primary">{totalQuizScore.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">out of {maxPossibleScore.toLocaleString()}</p>
                    <p className="text-sm font-semibold mt-2">
                      {Math.round((totalQuizScore / maxPossibleScore) * 100)}% accuracy
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Round Breakdown:</h3>
                    {quizRounds.map((round, index) => (
                      <div key={index} className="flex justify-between text-sm p-2 bg-muted rounded">
                        <span className="truncate flex-1">{round.player.name}</span>
                        <span className="font-semibold">{round.score.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button onClick={handlePlayAgain} className="w-full">
                      Play Again
                    </Button>
                    <Link href="/" className="w-full">
                      <Button variant="outline" className="w-full">
                        Back to Home
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <GameContent />
    </Suspense>
  );
}