import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WikidataPlayer {
  playerLabel: string;
  birthPlaceLabel: string;
  coord: string;
  image?: string;
  positionLabel?: string;
  stateLabel?: string;
}

// SPARQL query to get NFL players from Wikidata
const WIKIDATA_QUERY = `
SELECT DISTINCT ?player ?playerLabel ?birthPlace ?birthPlaceLabel ?coord ?image ?position ?positionLabel ?state ?stateLabel WHERE {
  ?player wdt:P106 wd:Q19204627.  # occupation: American football player
  ?player wdt:P19 ?birthPlace.     # place of birth
  ?birthPlace wdt:P625 ?coord.     # coordinates
  
  OPTIONAL { ?player wdt:P18 ?image. }  # image
  OPTIONAL { ?player wdt:P413 ?position. }  # position played
  OPTIONAL { 
    ?birthPlace wdt:P131 ?state.   # located in state
    ?state wdt:P31 wd:Q35657.      # state of the USA
  }
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 200
`;

async function fetchWikidataPlayers(): Promise<WikidataPlayer[]> {
  const url = 'https://query.wikidata.org/sparql';
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'AthleteGuesser/1.0'
  };

  try {
    const response = await fetch(`${url}?query=${encodeURIComponent(WIKIDATA_QUERY)}`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Wikidata query failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.bindings.map((binding: any) => ({
      playerLabel: binding.playerLabel?.value,
      birthPlaceLabel: binding.birthPlaceLabel?.value,
      coord: binding.coord?.value,
      image: binding.image?.value,
      positionLabel: binding.positionLabel?.value,
      stateLabel: binding.stateLabel?.value
    }));
  } catch (error) {
    console.error('Error fetching from Wikidata:', error);
    throw error;
  }
}

function parseCoordinates(wktString: string): { lat: number; lng: number } | null {
  // Parse format: "Point(-122.3255 37.5630)"
  const match = wktString.match(/Point\(([-.0-9]+)\s+([-.0-9]+)\)/);
  if (!match) return null;
  
  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2])
  };
}

async function getCityFact(cityName: string, state?: string): Promise<string> {
  // For now, generate a simple fact. Later we can enhance this with Wikipedia API
  const location = state ? `${cityName}, ${state}` : cityName;
  return `${location} is the birthplace of this NFL player.`;
}

function mapPosition(wikidataPosition?: string): string {
  if (!wikidataPosition) return 'Player';
  
  // Map common Wikidata position labels to NFL abbreviations
  const positionMap: { [key: string]: string } = {
    'quarterback': 'QB',
    'running back': 'RB',
    'wide receiver': 'WR',
    'tight end': 'TE',
    'offensive lineman': 'OL',
    'defensive lineman': 'DL',
    'linebacker': 'LB',
    'cornerback': 'CB',
    'safety': 'S',
    'kicker': 'K',
    'punter': 'P'
  };
  
  const lower = wikidataPosition.toLowerCase();
  for (const [key, value] of Object.entries(positionMap)) {
    if (lower.includes(key)) return value;
  }
  
  return wikidataPosition;
}

async function importPlayers() {
  console.log('Fetching NFL players from Wikidata...');
  
  const wikidataPlayers = await fetchWikidataPlayers();
  console.log(`Found ${wikidataPlayers.length} players from Wikidata`);

  const playersToInsert = [];

  for (const player of wikidataPlayers) {
    const coords = parseCoordinates(player.coord);
    if (!coords) {
      console.log(`Skipping ${player.playerLabel} - invalid coordinates`);
      continue;
    }

    const cityFact = await getCityFact(player.birthPlaceLabel, player.stateLabel);

    playersToInsert.push({
      name: player.playerLabel,
      sport: 'nfl',
      birth_city: player.birthPlaceLabel,
      birth_state: player.stateLabel || null,
      birth_country: 'USA',
      latitude: coords.lat,
      longitude: coords.lng,
      photo_url: player.image || null,
      position: mapPosition(player.positionLabel),
      team: null, // Wikidata doesn't have current team easily
      years_active: null,
      is_active: false,
      difficulty_level: 'medium',
      city_fact: cityFact
    });
  }

  console.log(`Prepared ${playersToInsert.length} players for import`);

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < playersToInsert.length; i += batchSize) {
    const batch = playersToInsert.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('players')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} players)`);
    }
  }

  console.log('Import complete!');
}

// Run the import
importPlayers().catch(console.error);
