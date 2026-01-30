import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Index() {
  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <span className="text-xl">Athlete Guesser</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-col gap-8 max-w-5xl px-3">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold">
            Where Are Athletes From?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Test your knowledge by guessing where NFL players were born. 
            Click on the map and see how close you can get!
          </p>
          <Link href="/game">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Playing
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="flex flex-col gap-2 p-6 border rounded-lg">
            <h3 className="font-semibold text-lg">🗺️ Click to Guess</h3>
            <p className="text-sm text-muted-foreground">
              Click anywhere on the map to place your guess for where the player was born.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-6 border rounded-lg">
            <h3 className="font-semibold text-lg">📏 Distance Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Get up to 5,000 points based on how close your guess is to the actual birthplace.
            </p>
          </div>
          <div className="flex flex-col gap-2 p-6 border rounded-lg">
            <h3 className="font-semibold text-lg">🏈 NFL Players</h3>
            <p className="text-sm text-muted-foreground">
              Learn fun facts about where legendary NFL players came from.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}