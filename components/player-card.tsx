'use client';

import { Player } from '@/data/mockPlayers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayerCardProps {
  player: Player;
  showAnswer?: boolean;
}

export default function PlayerCard({ player, showAnswer = false }: PlayerCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">{player.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {player.photoUrl && (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-semibold">Position:</span> {player.position}
          </div>
          <div>
            <span className="font-semibold">Team:</span> {player.team}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Years Active:</span> {player.yearsActive}
          </div>
        </div>
        
        {showAnswer && (
          <div className="mt-4 pt-4 border-t">
            <p className="font-semibold text-lg text-green-600">
              Born in: {player.birthCity}, {player.birthState}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {player.cityFact}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}