'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { mockPlayers, Player } from '@/data/mockPlayers';
import { calculateDistance, calculateScore } from '@/lib/gameUtils';
import PlayerCard from '@/components/player-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Dynamically import map to avoid SSR issues with Leaflet
const GameMap = dynamic(() => import('@/components/game-map'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-200 animate-pulse" />
});

type GameState = 'guessing' | 'result' | 'completed';

export default function GamePage() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState>('guessing');
  const [guessLocation, setGuessLocation] = useState<[number, number] | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // Pick random player on mount to avoid hydration mismatch
  useEffect(() => {
    if (!currentPlayer) {
      setCurrentPlayer(mockPlayers[Math.floor(Math.random() * mockPlayers.length)]);
    }
  }, [currentPlayer]);

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
  };

  const handleNextPlayer = () => {
    // Get random player different from current
    let newPlayer = currentPlayer;
    while (newPlayer.id === currentPlayer.id && mockPlayers.length > 1) {
      newPlayer = mockPlayers[Math.floor(Math.random() * mockPlayers.length)];
    }
    
    setCurrentPlayer(newPlayer);
    setGameState('guessing');
    setGuessLocation(null);
    setDistance(0);
    setScore(0);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-background border-b p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Athlete Guesser</h1>
          <div className="text-sm text-muted-foreground">
            NFL Edition
          </div>
        </div>
      </header>

      {/* Main game area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r p-4 overflow-y-auto flex flex-col gap-4">
          <PlayerCard player={currentPlayer} showAnswer={gameState === 'result'} />
          
          {gameState === 'guessing' && (
            <Card>
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
            <Card className="bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-3xl font-bold">{distance.toLocaleString()} km</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-4xl font-bold text-primary">{score.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">out of 5,000</p>
                </div>
                <Button onClick={handleNextPlayer} className="w-full">
                  Next Player
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="flex-1">
          <GameMap
            onGuess={handleGuess}
            guessLocation={guessLocation}
            actualLocation={gameState === 'result' ? [currentPlayer.latitude, currentPlayer.longitude] : null}
            showResult={gameState === 'result'}
          />
        </div>
      </div>
    </div>
  );
}