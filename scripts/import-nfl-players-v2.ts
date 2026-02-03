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
  teamLabel?: string;
  stateLabel?: string;
}

// Much stricter SPARQL query - only NFL players with complete data
const WIKIDATA_QUERY = `
SELECT DISTINCT ?player ?playerLabel ?birthPlace ?birthPlaceLabel ?coord ?image ?position ?positionLabel ?team ?teamLabel ?state ?stateLabel WHERE {
  # Must have played for an NFL team (this filters out college-only players)
  ?player wdt:P54 ?team.
  ?team wdt:P118 wd:Q1215884.  # team league: National Football League
  
  # Must be a human (not a team or organization)
  ?player wdt:P31 wd:Q5.
  
  # Must have occupation as American football player
  ?player wdt:P106 wd:Q19204627.
  
  # Must have birthplace with coordinates
  ?player wdt:P19 ?birthPlace.
  ?birthPlace wdt:P625 ?coord.
  
  # Try to get state (US players only)
  OPTIONAL {
    ?birthPlace wdt:P131+ ?state.
    ?state wdt:P31 wd:Q35657.  # instance of: U.S. state
  }
  
  # Optional: image
  OPTIONAL { ?player wdt:P18 ?image. }
  
  # Optional: position
  OPTIONAL { ?player wdt:P413 ?position. }
  
  # Filter: birthplace must be in USA
  ?birthPlace wdt:P17 wd:Q30.
  
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 300
`;

// City facts database - we'll expand this with real facts
const CITY_FACTS: { [key: string]: string } = {
  'San Francisco': 'San Francisco is famous for the Golden Gate Bridge, cable cars, and its hilly terrain. It\'s a major tech hub and cultural center.',
  'Los Angeles': 'Los Angeles is the entertainment capital of the world, home to Hollywood and the second-largest city in the United States.',
  'New York City': 'New York City is the most populous city in the US, known for its skyline, Broadway, and being a global financial center.',
  'Chicago': 'Chicago is famous for its architecture, deep-dish pizza, and being the birthplace of the skyscraper. It sits on the shore of Lake Michigan.',
  'Dallas': 'Dallas is a major city in Texas known for its modern skyline, arts district, and as a hub for business and culture in the Southwest.',
  'Miami': 'Miami is known for its beautiful beaches, Art Deco architecture, vibrant nightlife, and large Cuban-American community.',
  'Houston': 'Houston is the largest city in Texas and home to NASA\'s Johnson Space Center. It\'s known for its energy industry and diverse culture.',
  'Philadelphia': 'Philadelphia is the birthplace of American independence, home to the Liberty Bell and Independence Hall where the Constitution was signed.',
  'Atlanta': 'Atlanta is the capital of Georgia and a major transportation hub. It played a crucial role in the Civil Rights Movement.',
  'Phoenix': 'Phoenix is the capital of Arizona and one of the fastest-growing cities in the US, known for its desert climate and golf courses.',
  'Boston': 'Boston is one of America\'s oldest cities, known for its role in the American Revolution and prestigious universities like Harvard and MIT.',
  'Detroit': 'Detroit is known as the "Motor City" for its automobile industry heritage. It\'s also the birthplace of Motown music.',
  'New Orleans': 'New Orleans is the birthplace of jazz music, famous for its vibrant culture, Creole cuisine, and annual Mardi Gras celebration.',
  'Pittsburgh': 'Pittsburgh is known as the "City of Bridges" with 446 bridges. It has a rich steel industry history and sits at the confluence of three rivers.',
  'Cleveland': 'Cleveland sits on the shores of Lake Erie and is known for the Rock and Roll Hall of Fame. It\'s a major manufacturing and healthcare hub.',
  'San Diego': 'San Diego is known for its mild year-round climate, beautiful beaches, and strong military presence. It borders Mexico and has a vibrant craft beer scene.',
  'Austin': 'Austin is the capital of Texas, known as the "Live Music Capital of the World" and a major tech hub with a vibrant arts scene.',
  'Seattle': 'Seattle is known for its coffee culture, tech industry (home to Microsoft and Amazon), and the iconic Space Needle.',
};

async function fetchWikidataPlayers(): Promise<WikidataPlayer[]> {
  const url = 'https://query.wikidata.org/sparql';
  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'AthleteGuesser/1.0'
  };

  try {
    console.log('Querying Wikidata...');
    const response = await fetch(`${url}?query=${encodeURIComponent(WIKIDATA_QUERY)}`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Wikidata query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Raw results from Wikidata: ${data.results.bindings.length}`);
    
    return data.results.bindings.map((binding: any) => ({
      playerLabel: binding.playerLabel?.value,
      birthPlaceLabel: binding.birthPlaceLabel?.value,
      coord: binding.coord?.value,
      image: binding.image?.value,
      positionLabel: binding.positionLabel?.value,
      teamLabel: binding.teamLabel?.value,
      stateLabel: binding.stateLabel?.value
    }));
  } catch (error) {
    console.error('Error fetching from Wikidata:', error);
    throw error;
  }
}

function parseCoordinates(wktString: string): { lat: number; lng: number } | null {
  const match = wktString.match(/Point\(([-.0-9]+)\s+([-.0-9]+)\)/);
  if (!match) return null;
  
  return {
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2])
  };
}

function getCityFact(cityName: string, state?: string): string {
  // Check if we have a custom fact for this city
  if (CITY_FACTS[cityName]) {
    return CITY_FACTS[cityName];
  }
  
  // Generic but better than before
  const location = state ? `${cityName}, ${state}` : cityName;
  return `${location} is a city in the United States known for producing talented NFL players.`;
}

function mapPosition(wikidataPosition?: string): string {
  if (!wikidataPosition) return 'Player';
  
  const positionMap: { [key: string]: string } = {
    'quarterback': 'QB',
    'running back': 'RB',
    'fullback': 'FB',
    'wide receiver': 'WR',
    'tight end': 'TE',
    'offensive tackle': 'OT',
    'offensive guard': 'OG',
    'center': 'C',
    'offensive lineman': 'OL',
    'defensive tackle': 'DT',
    'defensive end': 'DE',
    'defensive lineman': 'DL',
    'linebacker': 'LB',
    'cornerback': 'CB',
    'safety': 'S',
    'defensive back': 'DB',
    'kicker': 'K',
    'punter': 'P',
    'kick returner': 'KR',
    'return specialist': 'RS'
  };
  
  const lower = wikidataPosition.toLowerCase();
  for (const [key, value] of Object.entries(positionMap)) {
    if (lower.includes(key)) return value;
  }
  
  return wikidataPosition;
}

function isValidNFLPosition(position: string): boolean {
  const validPositions = ['QB', 'RB', 'FB', 'WR', 'TE', 'OT', 'OG', 'C', 'OL', 'DT', 'DE', 'DL', 'LB', 'CB', 'S', 'DB', 'K', 'P', 'KR', 'RS'];
  return validPositions.includes(position) || position === 'Player';
}

async function importPlayers() {
  console.log('Starting NFL player import (v2 - stricter query)...');
  
  const wikidataPlayers = await fetchWikidataPlayers();
  console.log(`Found ${wikidataPlayers.length} players from Wikidata`);

  const playersToInsert = [];
  const skippedPlayers: string[] = [];

  for (const player of wikidataPlayers) {
    // Validate coordinates
    const coords = parseCoordinates(player.coord);
    if (!coords) {
      skippedPlayers.push(`${player.playerLabel} - invalid coordinates`);
      continue;
    }

    // Must have a state (US-born requirement)
    if (!player.stateLabel) {
      skippedPlayers.push(`${player.playerLabel} - no state (likely non-US birthplace)`);
      continue;
    }

    // Map and validate position
    const position = mapPosition(player.positionLabel);
    if (!isValidNFLPosition(position)) {
      skippedPlayers.push(`${player.playerLabel} - invalid position: ${position}`);
      continue;
    }

    const cityFact = getCityFact(player.birthPlaceLabel, player.stateLabel);

    playersToInsert.push({
      name: player.playerLabel,
      sport: 'nfl',
      birth_city: player.birthPlaceLabel,
      birth_state: player.stateLabel,
      birth_country: 'USA',
      latitude: coords.lat,
      longitude: coords.lng,
      photo_url: player.image || null,
      position: position,
      team: player.teamLabel || null,
      years_active: null,
      is_active: false,
      difficulty_level: 'medium',
      city_fact: cityFact
    });
  }

  console.log(`\nValidation complete:`);
  console.log(`  ✓ ${playersToInsert.length} players ready to import`);
  console.log(`  ✗ ${skippedPlayers.length} players skipped`);
  
  if (skippedPlayers.length > 0) {
    console.log(`\nSkipped players (first 10):`);
    skippedPlayers.slice(0, 10).forEach(p => console.log(`  - ${p}`));
  }

  if (playersToInsert.length === 0) {
    console.log('\n❌ No valid players to import!');
    return;
  }

  // First, clear existing players
  console.log('\nClearing existing players...');
  const { error: deleteError } = await supabase
    .from('players')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (deleteError) {
    console.error('Error clearing players:', deleteError);
  }

  // Insert in batches of 50
  console.log(`\nInserting ${playersToInsert.length} players...`);
  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < playersToInsert.length; i += batchSize) {
    const batch = playersToInsert.slice(i, i + batchSize);
    const { error } = await supabase
      .from('players')
      .insert(batch);

    if (error) {
      console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
    } else {
      successCount += batch.length;
      console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} players`);
    }
  }

  console.log(`\n🎉 Import complete! Successfully imported ${successCount} NFL players.`);
}

importPlayers().catch(console.error);